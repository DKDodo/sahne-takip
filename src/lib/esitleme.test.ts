import 'fake-indexeddb/auto'
import type { SupabaseClient } from '@supabase/supabase-js'
import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '../db'
import { ayniMi, bekleyenSayisi, esitle, esitlemeBaslat, esitlemeDurdur, kancalariKur, temiz } from './esitleme'
import { geriYukle, kaliciSil, sil, yedekAl, yedektenYukle } from './veri'

/* ---------- bellekte sahte Supabase: kayitlar tablosu, sunucu saati, kalıcı silme yok ---------- */
interface Satir {
  tablo: string
  id: string
  veri: Record<string, unknown>
  silindi: boolean
  guncelleme: string
}
class SahteBulut {
  satirlar = new Map<string, Satir>()
  saat = Date.parse('2026-10-27T10:00:00Z')
  izinli = true
  gecmis: { tablo: string; id: string; eski?: unknown; yeni: unknown }[] = []
  zaman() {
    this.saat += 1000
    return new Date(this.saat).toISOString()
  }
  /* Başka bir cihazın yazması */
  disaridanYaz(tablo: string, id: string, veri: Record<string, unknown>, silindi = false) {
    this.satirlar.set(`${tablo}|${id}`, { tablo, id, veri: JSON.parse(JSON.stringify(veri)), silindi, guncelleme: this.zaman() })
  }
  istemci(): SupabaseClient {
    const bulut = this
    const sorgu = () => {
      let gt = ''
      let sinir = 1000
      const q = {
        select: () => q,
        gt: (_a: string, v: string) => ((gt = v), q),
        order: () => q,
        limit: (n: number) => ((sinir = n), q),
        then: (ok: (r: unknown) => void) => {
          if (!bulut.izinli) return ok({ data: [], error: null })
          const data = [...bulut.satirlar.values()]
            .filter((s) => s.guncelleme > gt)
            .sort((a, b) => a.guncelleme.localeCompare(b.guncelleme))
            .slice(0, sinir)
            .map((s) => JSON.parse(JSON.stringify(s)))
          ok({ data, error: null })
        },
      }
      return q
    }
    return {
      from: () => ({
        ...sorgu(),
        upsert: async (rows: Omit<Satir, 'guncelleme'>[]) => {
          if (!bulut.izinli) return { error: { message: 'new row violates row-level security policy (42501)' } }
          for (const r of rows) {
            const k = `${r.tablo}|${r.id}`
            const eski = bulut.satirlar.get(k)
            if (eski && ayniMi(eski.veri, r.veri) && eski.silindi === r.silindi) {
              eski.guncelleme = bulut.zaman()
              continue
            }
            bulut.gecmis.push({ tablo: r.tablo, id: r.id, eski: eski?.veri, yeni: r.veri })
            bulut.satirlar.set(k, { tablo: r.tablo, id: r.id, veri: JSON.parse(JSON.stringify(r.veri)), silindi: r.silindi, guncelleme: bulut.zaman() })
          }
          return { error: null }
        },
      }),
      channel: () => ({ on: function () { return this }, subscribe: function () { return this } }),
      removeChannel: async () => {},
      rpc: async () => ({ data: bulut.izinli, error: null }),
    } as unknown as SupabaseClient
  }
}

/* Node'da tarayıcı nesnelerinin en küçük taklidi */
const depo = new Map<string, string>()
const g = globalThis as Record<string, unknown>
g.localStorage = {
  getItem: (k: string) => depo.get(k) ?? null,
  setItem: (k: string, v: string) => void depo.set(k, String(v)),
  removeItem: (k: string) => void depo.delete(k),
  clear: () => depo.clear(),
}
g.window = { addEventListener() {}, removeEventListener() {} }
g.document = { addEventListener() {}, removeEventListener() {}, visibilityState: 'visible' }

const o = '2026-10-27T00:00:00Z'
let bulut: SahteBulut

kancalariKur()

beforeEach(async () => {
  esitlemeDurdur()
  localStorage.clear()
  await Promise.all(db.tables.map((t) => t.clear()))
  bulut = new SahteBulut()
})

async function baglan() {
  await esitlemeBaslat(bulut.istemci(), 'kullanici-1')
}

describe('yerel işaretleme', () => {
  it('her yeni ya da değişen kayıt gönderilecek olarak işaretlenir', async () => {
    await db.mekanlar.add({ id: 'c1', ad: 'Firma', olusturma: o })
    expect(await bekleyenSayisi()).toBe(1)
    await db.mekanlar.update('c1', { ad: 'Firma A.Ş.' })
    expect(((await db.mekanlar.get('c1')) as { _kirli?: number })._kirli).toBeGreaterThan(0)
  })
  it('temiz() iç alanları buluta göndermez', () => {
    expect(temiz({ id: 'a', ad: 'x', _kirli: 5, _uzak: 1 })).toEqual({ id: 'a', ad: 'x' })
  })
  it('ayniMi anahtar sırasından bağımsızdır', () => {
    expect(ayniMi({ a: 1, b: { c: [1, 2] } }, { b: { c: [1, 2] }, a: 1 })).toBe(true)
    expect(ayniMi({ a: 1 }, { a: 2 })).toBe(false)
  })
})

describe('bulut eşitleme', () => {
  it('ilk girişte cihazdaki tüm kayıtlar buluta gider', async () => {
    await db.mekanlar.add({ id: 'c1', ad: 'Firma', olusturma: o })
    await db.kisiler.add({ id: 'm1', ad: 'Davulcu', olusturma: o })
    await baglan()
    expect(bulut.satirlar.get('mekanlar|c1')?.veri).toEqual({ id: 'c1', ad: 'Firma', olusturma: o })
    expect(bulut.satirlar.get('kisiler|m1')?.silindi).toBe(false)
    expect(await bekleyenSayisi()).toBe(0)
  })

  it('başka cihazdaki kayıt bu cihaza gelir ve geri gönderilmez (yankı yok)', async () => {
    await baglan()
    bulut.disaridanYaz('mekanlar', 's1', { id: 's1', ad: 'Çamlık', olusturma: o })
    const gecmisOnce = bulut.gecmis.length
    await esitle()
    expect((await db.mekanlar.get('s1'))?.ad).toBe('Çamlık')
    expect(await bekleyenSayisi()).toBe(0)
    await esitle()
    expect(bulut.gecmis.length).toBe(gecmisOnce)
  })

  it('silme buluta "silindi" olarak gider, kalıcı silinmez; geri alınca geri gelir', async () => {
    await db.tahsilatlar.add({ id: 'v1', tarih: '2026-11-01', mekanId: 'c1', tutar: 1000, olusturma: o })
    await baglan()
    await sil('tahsilatlar', 'v1')
    await esitle()
    expect(bulut.satirlar.get('tahsilatlar|v1')?.silindi).toBe(true)
    expect(bulut.gecmis.some((g) => g.id === 'v1' && (g.eski as { tutar?: number })?.tutar === 1000)).toBe(true)
    const silinen = (await db.silinenler.toArray())[0]
    await geriYukle(silinen.id)
    await esitle()
    expect(bulut.satirlar.get('tahsilatlar|v1')?.silindi).toBe(false)
    expect(bulut.satirlar.get('tahsilatlar|v1')?.veri.tutar).toBe(1000)
    expect(bulut.satirlar.get(`silinenler|${silinen.id}`)?.silindi).toBe(true)
  })

  it('gönderilmeden silinip geri alınan kayıt bulutta silinmiş görünmez', async () => {
    await baglan()
    await db.gonderimler.add({ id: 'h1', tarih: '2026-10-27', kisiId: 'k1', tutar: 500, olusturma: o })
    await sil('gonderimler', 'h1')
    const silinen = (await db.silinenler.toArray())[0]
    await geriYukle(silinen.id)
    await esitle()
    expect(bulut.satirlar.get('gonderimler|h1')?.silindi).toBe(false)
    expect(await db.gonderimler.get('h1')).toBeTruthy()
  })

  it('başka cihazda silinen kayıt bu cihazdan da kalkar', async () => {
    await db.kisiler.add({ id: 'i1', ad: 'Usta', olusturma: o })
    await baglan()
    bulut.disaridanYaz('kisiler', 'i1', {}, true)
    await esitle()
    expect(await db.kisiler.get('i1')).toBeUndefined()
  })

  it('bu cihazdaki gönderilmemiş değişiklik buluttan gelenle ezilmez', async () => {
    await db.sahneler.add({ id: 'm1', tarih: '2026-10-20', mekanId: 'c1', ucret: 650, paylar: [], olusturma: o })
    await baglan()
    esitlemeDurdur() // çevrimdışı gibi
    await db.sahneler.update('m1', { ucret: 700 })
    bulut.disaridanYaz('sahneler', 'm1', { id: 'm1', tarih: '2026-10-20', mekanId: 'c1', ucret: 600, paylar: [], olusturma: o })
    await baglan()
    expect((await db.sahneler.get('m1'))?.ucret).toBe(700)
    expect(bulut.satirlar.get('sahneler|m1')?.veri.ucret).toBe(700)
  })

  it('izinsiz hesapta hiçbir şey kaybolmaz; değişiklikler bekler', async () => {
    bulut.izinli = false
    await db.mekanlar.add({ id: 'c1', ad: 'Firma', olusturma: o })
    await baglan()
    expect(await db.mekanlar.get('c1')).toBeTruthy()
    expect(await bekleyenSayisi()).toBe(1)
    expect(bulut.satirlar.size).toBe(0)
  })

  it('kalıcı silme yalnız Silinenler kaydını kaldırır, asıl veri zaten silinmişti', async () => {
    await db.gonderimler.add({ id: 'a1', kisiId: 'i', tarih: '2026-10-27', tutar: 100, olusturma: o })
    await baglan()
    await sil('gonderimler', 'a1')
    const s = (await db.silinenler.toArray())[0]
    await kaliciSil([s.id])
    await esitle()
    expect(await db.silinenler.count()).toBe(0)
    expect(bulut.satirlar.get(`silinenler|${s.id}`)?.silindi).toBe(true)
    // bulutta hâlâ geçmişte duruyor
    expect(bulut.gecmis.some((g) => g.id === s.id)).toBe(true)
  })
})

describe('yedekten geri yükleme', () => {
  it('yedekte olmayan kayıtlar silinir (izleriyle), yedektekiler geri gelir', async () => {
    await db.mekanlar.bulkAdd([
      { id: 'c1', ad: 'A', olusturma: o },
      { id: 'c2', ad: 'B', olusturma: o },
    ])
    const yedek = await yedekAl()
    await db.mekanlar.add({ id: 'c3', ad: 'C', olusturma: o })
    await db.mekanlar.update('c1', { ad: 'A değişti' })
    const n = await yedektenYukle(JSON.parse(JSON.stringify(yedek)))
    expect(n).toBe(2)
    expect((await db.mekanlar.get('c1'))?.ad).toBe('A')
    expect(await db.mekanlar.get('c3')).toBeUndefined()
    expect((await db.silmeler.get('mekanlar|c3'))?._kirli).toBeGreaterThan(0)
  })
  it('bozuk dosya hiçbir şeyi değiştirmez', async () => {
    await db.mekanlar.add({ id: 'c1', ad: 'A', olusturma: o })
    await expect(yedektenYukle({ uygulama: 'sahne_takip', veri: { mekanlar: [{ ad: 'kimliksiz' }] } })).rejects.toThrow()
    await expect(yedektenYukle({ uygulama: 'insaat_yonetim', veri: {} })).rejects.toThrow()
    await expect(yedektenYukle({ baska: true })).rejects.toThrow()
    expect(await db.mekanlar.count()).toBe(1)
  })
})
