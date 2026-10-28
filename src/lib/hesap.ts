import type { Gonderim, Sahne, Tahsilat } from '../db'
import { bugun, yuvarla } from './format'

export function toplam<T>(liste: T[], deger: (x: T) => number): number {
  return yuvarla(liste.reduce((t, x) => t + (deger(x) || 0), 0))
}

export const paylarToplami = (s: Sahne): number => toplam(s.paylar ?? [], (p) => p.tutar)

/* Ücretten ekip payları düşünce bana kalan. */
export const benimPayim = (s: Sahne): number => yuvarla(s.ucret - paylarToplami(s))

/*
 * Ödemeleri borçlara dağıtır. Bir borca bağlı ödeme önce ona sayılır (fazlası havuza),
 * bağlı olmayanlar havuzda toplanır ve en eski borçtan başlayarak kapatılır.
 * Döner: her borcun ödenen kısmı ve borçlardan artan para (fazla / peşin ödeme).
 */
export interface Borc {
  id: string
  tarih: string
  sira: string
  tutar: number
}
export function dagit(borclar: Borc[], odemeler: { tutar: number; hedefId?: string }[]): { odenen: Map<string, number>; artan: number } {
  const odenen = new Map<string, number>(borclar.map((b) => [b.id, 0]))
  const tutar = new Map(borclar.map((b) => [b.id, b.tutar]))
  let havuz = 0
  for (const o of odemeler) {
    const t = o.tutar || 0
    if (o.hedefId && odenen.has(o.hedefId)) {
      const kalan = Math.max(0, (tutar.get(o.hedefId) ?? 0) - odenen.get(o.hedefId)!)
      const sayilan = Math.min(kalan, t)
      odenen.set(o.hedefId, yuvarla(odenen.get(o.hedefId)! + sayilan))
      havuz += t - sayilan
    } else havuz += t
  }
  for (const b of [...borclar].sort((a, c) => a.tarih.localeCompare(c.tarih) || a.sira.localeCompare(c.sira))) {
    if (havuz <= 0.004) break
    const kalan = Math.max(0, b.tutar - odenen.get(b.id)!)
    const sayilan = Math.min(kalan, havuz)
    odenen.set(b.id, yuvarla(odenen.get(b.id)! + sayilan))
    havuz -= sayilan
  }
  return { odenen, artan: yuvarla(havuz) }
}

export type TahsilDurumu = 'odendi' | 'kismen' | 'bekliyor' | 'gelecek'

export interface SahneDurumu {
  alinan: number
  kalan: number
  durum: TahsilDurumu
}

/* Her sahnenin ne kadarının alındığı (mekan mekan dağıtılarak). */
export function sahneDurumlari(sahneler: Sahne[], tahsilatlar: Tahsilat[], b: string = bugun()): Map<string, SahneDurumu> {
  const sonuc = new Map<string, SahneDurumu>()
  const mekanlar = new Set(sahneler.map((s) => s.mekanId))
  for (const m of mekanlar) {
    const ms = sahneler.filter((s) => s.mekanId === m)
    const { odenen } = dagit(
      ms.map((s) => ({ id: s.id, tarih: s.tarih, sira: s.olusturma, tutar: s.ucret })),
      tahsilatlar.filter((t) => t.mekanId === m).map((t) => ({ tutar: t.tutar, hedefId: t.sahneId })),
    )
    for (const s of ms) {
      const alinan = odenen.get(s.id) ?? 0
      const kalan = yuvarla(Math.max(0, s.ucret - alinan))
      const durum: TahsilDurumu = kalan <= 0.004 ? 'odendi' : alinan > 0 ? 'kismen' : s.tarih > b ? 'gelecek' : 'bekliyor'
      sonuc.set(s.id, { alinan, kalan, durum })
    }
  }
  return sonuc
}

export interface MekanOzeti {
  sahneSayisi: number
  toplamUcret: number
  alinan: number
  /* Çıkılmış sahnelerden henüz alınmayan */
  alacak: number
  /* Gelecek sahnelerin alınmamış ücreti */
  gelecek: number
  /* Sahnelere sayılamayan fazla ödeme */
  fazla: number
  sonSahne?: string
}

export function mekanOzeti(mekanId: string, sahneler: Sahne[], tahsilatlar: Tahsilat[], b: string = bugun()): MekanOzeti {
  const ms = sahneler.filter((s) => s.mekanId === mekanId)
  const mt = tahsilatlar.filter((t) => t.mekanId === mekanId)
  const { odenen, artan } = dagit(
    ms.map((s) => ({ id: s.id, tarih: s.tarih, sira: s.olusturma, tutar: s.ucret })),
    mt.map((t) => ({ tutar: t.tutar, hedefId: t.sahneId })),
  )
  const kalan = (s: Sahne) => Math.max(0, s.ucret - (odenen.get(s.id) ?? 0))
  return {
    sahneSayisi: ms.length,
    toplamUcret: toplam(ms, (s) => s.ucret),
    alinan: toplam(mt, (t) => t.tutar),
    alacak: toplam(ms.filter((s) => s.tarih <= b), kalan),
    gelecek: toplam(ms.filter((s) => s.tarih > b), kalan),
    fazla: artan,
    sonSahne: ms.filter((s) => s.tarih <= b).map((s) => s.tarih).sort().at(-1),
  }
}

export interface KisiOzeti {
  sahneSayisi: number
  toplamPay: number
  gonderilen: number
  /* Çıkılmış sahnelerden göndermem gereken */
  borcum: number
  /* Gelecek sahnelerdeki payı */
  gelecek: number
  /* Paylardan fazla gönderilen (peşin) */
  fazla: number
}

/* Kişinin paylarını ve ona gönderilenleri dağıtır. Döner: sahne başına ödenen pay. */
export function kisiPaylari(kisiId: string, sahneler: Sahne[], gonderimler: Gonderim[]) {
  const borclar: (Borc & { sahne: Sahne })[] = []
  for (const s of sahneler)
    for (const p of s.paylar ?? []) if (p.kisiId === kisiId && p.tutar > 0) borclar.push({ id: s.id, tarih: s.tarih, sira: s.olusturma, tutar: p.tutar, sahne: s })
  // Aynı sahnede iki pay satırı olursa tek borç gibi topla
  const birlesik = new Map<string, Borc & { sahne: Sahne }>()
  for (const b of borclar) {
    const v = birlesik.get(b.id)
    if (v) v.tutar = yuvarla(v.tutar + b.tutar)
    else birlesik.set(b.id, { ...b })
  }
  const liste = [...birlesik.values()]
  const kg = gonderimler.filter((g) => g.kisiId === kisiId)
  const { odenen, artan } = dagit(liste, kg.map((g) => ({ tutar: g.tutar, hedefId: g.sahneId })))
  return { liste, odenen, artan, gonderimler: kg }
}

export function kisiOzeti(kisiId: string, sahneler: Sahne[], gonderimler: Gonderim[], b: string = bugun()): KisiOzeti {
  const { liste, odenen, artan, gonderimler: kg } = kisiPaylari(kisiId, sahneler, gonderimler)
  const kalan = (x: Borc) => Math.max(0, x.tutar - (odenen.get(x.id) ?? 0))
  return {
    sahneSayisi: liste.length,
    toplamPay: toplam(liste, (x) => x.tutar),
    gonderilen: toplam(kg, (g) => g.tutar),
    borcum: toplam(liste.filter((x) => x.tarih <= b), kalan),
    gelecek: toplam(liste.filter((x) => x.tarih > b), kalan),
    fazla: artan,
  }
}

export interface AyOzeti {
  ay: string
  /* Çıkılmış sahneler (bugüne kadar) */
  sahneSayisi: number
  toplamUcret: number
  paylar: number
  /* Benim payım: ücret − ekip payları */
  kazanc: number
  /* Bu ay içinde, bugünden sonraki sahneler */
  planliSayisi: number
  planliKazanc: number
  alinan: number
  gonderilen: number
  /* Alınan − gönderilen */
  elimeGecen: number
}

/* ay: 'YYYY-AA' */
export function ayOzeti(ay: string, sahneler: Sahne[], tahsilatlar: Tahsilat[], gonderimler: Gonderim[], b: string = bugun()): AyOzeti {
  const buAy = sahneler.filter((s) => s.tarih.startsWith(ay))
  const cikilan = buAy.filter((s) => s.tarih <= b)
  const planli = buAy.filter((s) => s.tarih > b)
  const alinan = toplam(tahsilatlar.filter((t) => t.tarih.startsWith(ay)), (t) => t.tutar)
  const gonderilen = toplam(gonderimler.filter((g) => g.tarih.startsWith(ay)), (g) => g.tutar)
  return {
    ay,
    sahneSayisi: cikilan.length,
    toplamUcret: toplam(cikilan, (s) => s.ucret),
    paylar: toplam(cikilan, paylarToplami),
    kazanc: toplam(cikilan, benimPayim),
    planliSayisi: planli.length,
    planliKazanc: toplam(planli, benimPayim),
    alinan,
    gonderilen,
    elimeGecen: yuvarla(alinan - gonderilen),
  }
}

/* Ücreti ekiple eşit böler (ben dahil). Kuruş artığı bende kalır. */
export function esitBol(ucret: number, kisiSayisi: number): number {
  if (kisiSayisi <= 0 || !(ucret > 0)) return 0
  return Math.floor((ucret * 100) / (kisiSayisi + 1)) / 100
}

export function ayEkle(ay: string, n: number): string {
  const [y, m] = ay.split('-').map(Number)
  const d = new Date(y, m - 1 + n, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

const AYLAR = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık']
export function ayAdi(ay: string, yilla = true): string {
  const [y, m] = ay.split('-').map(Number)
  return yilla ? `${AYLAR[m - 1]} ${y}` : AYLAR[m - 1]
}
