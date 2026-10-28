import { describe, expect, it } from 'vitest'
import type { Gonderim, Sahne, Tahsilat } from '../db'
import { ayEkle, ayOzeti, benimPayim, dagit, esitBol, kisiOzeti, mekanOzeti, sahneDurumlari } from './hesap'

const o = '2026-10-01T00:00:00Z'
const B = '2026-10-28' // "bugün"
const sahne = (id: string, tarih: string, ucret: number, mekanId = 'm1', paylar: Sahne['paylar'] = []): Sahne => ({ id, tarih, mekanId, ucret, paylar, olusturma: o + id })
const tahsil = (id: string, tarih: string, tutar: number, sahneId?: string, mekanId = 'm1'): Tahsilat => ({ id, tarih, mekanId, sahneId, tutar, olusturma: o })
const gonder = (id: string, tarih: string, kisiId: string, tutar: number, sahneId?: string): Gonderim => ({ id, tarih, kisiId, sahneId, tutar, olusturma: o })

describe('dağıtım', () => {
  it('bağlı olmayan ödeme en eski borçtan başlar', () => {
    const { odenen, artan } = dagit(
      [
        { id: 'b', tarih: '2026-10-10', sira: '1', tutar: 1000 },
        { id: 'a', tarih: '2026-10-05', sira: '1', tutar: 1000 },
      ],
      [{ tutar: 1500 }],
    )
    expect(odenen.get('a')).toBe(1000)
    expect(odenen.get('b')).toBe(500)
    expect(artan).toBe(0)
  })
  it('bağlı ödeme önce kendi borcuna sayılır, fazlası havuza gider', () => {
    const { odenen, artan } = dagit(
      [
        { id: 'a', tarih: '2026-10-05', sira: '1', tutar: 1000 },
        { id: 'b', tarih: '2026-10-10', sira: '1', tutar: 1000 },
      ],
      [{ tutar: 1200, hedefId: 'b' }],
    )
    expect(odenen.get('b')).toBe(1000)
    expect(odenen.get('a')).toBe(200)
    expect(artan).toBe(0)
  })
  it('borçtan fazla ödeme "artan" olarak kalır; silinmiş sahneye bağlı ödeme havuza düşer', () => {
    const { odenen, artan } = dagit([{ id: 'a', tarih: '2026-10-05', sira: '1', tutar: 1000 }], [{ tutar: 800, hedefId: 'silinmis' }, { tutar: 700 }])
    expect(odenen.get('a')).toBe(1000)
    expect(artan).toBe(500)
  })
  it('kuruşlar doğru toplanır', () => {
    const { odenen } = dagit([{ id: 'a', tarih: '2026-10-05', sira: '1', tutar: 0.3 }], [{ tutar: 0.1 }, { tutar: 0.2 }])
    expect(odenen.get('a')).toBe(0.3)
  })
})

describe('sahne ve mekan', () => {
  const sahneler = [sahne('s1', '2026-10-03', 10000), sahne('s2', '2026-10-17', 10000), sahne('s3', '2026-11-07', 12000), sahne('x1', '2026-10-10', 5000, 'm2')]
  const tahsilatlar = [tahsil('t1', '2026-10-04', 10000, 's1'), tahsil('t2', '2026-10-20', 4000), tahsil('t3', '2026-10-11', 5000, undefined, 'm2')]

  it('sahne durumları: ödendi, kısmen, gelecek', () => {
    const d = sahneDurumlari(sahneler, tahsilatlar, B)
    expect(d.get('s1')).toEqual({ alinan: 10000, kalan: 0, durum: 'odendi' })
    expect(d.get('s2')).toEqual({ alinan: 4000, kalan: 6000, durum: 'kismen' })
    expect(d.get('s3')?.durum).toBe('gelecek')
    expect(d.get('x1')?.durum).toBe('odendi')
  })
  it('bir mekanın ödemesi başka mekanın sahnesine sayılmaz', () => {
    const d = sahneDurumlari([sahne('a', '2026-10-01', 1000, 'm1'), sahne('b', '2026-10-01', 1000, 'm2')], [tahsil('t', '2026-10-02', 1000, undefined, 'm2')], B)
    expect(d.get('a')?.durum).toBe('bekliyor')
    expect(d.get('b')?.durum).toBe('odendi')
  })
  it('mekan özeti: alacak yalnız çıkılmış sahnelerden, gelecek ayrı', () => {
    const m = mekanOzeti('m1', sahneler, tahsilatlar, B)
    expect(m.sahneSayisi).toBe(3)
    expect(m.alinan).toBe(14000)
    expect(m.alacak).toBe(6000)
    expect(m.gelecek).toBe(12000)
    expect(m.fazla).toBe(0)
    expect(m.sonSahne).toBe('2026-10-17')
  })
  it('kapora gelecek sahneye sayılır, alacak artmaz', () => {
    const m = mekanOzeti('m1', [sahne('g', '2026-11-20', 10000)], [tahsil('k', '2026-10-25', 3000, 'g')], B)
    expect(m.alacak).toBe(0)
    expect(m.gelecek).toBe(7000)
  })
})

describe('bölüşme', () => {
  it('eşit böl: ben dahil, kuruş artığı bende', () => {
    expect(esitBol(10000, 3)).toBe(2500)
    expect(esitBol(10000, 2)).toBe(3333.33)
    expect(benimPayim(sahne('s', B, 10000, 'm1', [{ kisiId: 'a', tutar: 3333.33 }, { kisiId: 'b', tutar: 3333.33 }]))).toBe(3333.34)
    expect(esitBol(0, 2)).toBe(0)
  })
  it('kişiye borcum: paylar − gönderilenler; gelecek sahne payı ayrı', () => {
    const sahneler = [
      sahne('s1', '2026-10-03', 10000, 'm1', [{ kisiId: 'k1', tutar: 2500 }]),
      sahne('s2', '2026-10-17', 10000, 'm1', [{ kisiId: 'k1', tutar: 2500 }, { kisiId: 'k2', tutar: 2000 }]),
      sahne('s3', '2026-11-07', 12000, 'm1', [{ kisiId: 'k1', tutar: 3000 }]),
    ]
    const g = [gonder('g1', '2026-10-05', 'k1', 2500, 's1'), gonder('g2', '2026-10-20', 'k1', 1000)]
    const k = kisiOzeti('k1', sahneler, g, B)
    expect(k.sahneSayisi).toBe(3)
    expect(k.toplamPay).toBe(8000)
    expect(k.gonderilen).toBe(3500)
    expect(k.borcum).toBe(1500)
    expect(k.gelecek).toBe(3000)
    expect(kisiOzeti('k2', sahneler, g, B).borcum).toBe(2000)
  })
})

describe('aylık kazanç', () => {
  it('bu ay kazancım = çıkılan sahnelerde benim payım; elime geçen = alınan − gönderilen', () => {
    const sahneler = [
      sahne('s1', '2026-10-03', 10000, 'm1', [{ kisiId: 'k1', tutar: 2500 }]),
      sahne('s2', '2026-10-17', 8000),
      sahne('s3', '2026-10-30', 6000, 'm1', [{ kisiId: 'k1', tutar: 1000 }]),
      sahne('e1', '2026-09-26', 9000),
    ]
    const t = [tahsil('t1', '2026-10-04', 10000), tahsil('t0', '2026-09-27', 9000)]
    const g = [gonder('g1', '2026-10-05', 'k1', 2500)]
    const a = ayOzeti('2026-10', sahneler, t, g, B)
    expect(a.sahneSayisi).toBe(2)
    expect(a.toplamUcret).toBe(18000)
    expect(a.paylar).toBe(2500)
    expect(a.kazanc).toBe(15500)
    expect(a.planliSayisi).toBe(1)
    expect(a.planliKazanc).toBe(5000)
    expect(a.alinan).toBe(10000)
    expect(a.gonderilen).toBe(2500)
    expect(a.elimeGecen).toBe(7500)
  })
  it('ay ekleme yıl geçişinde doğru', () => {
    expect(ayEkle('2026-12', 1)).toBe('2027-01')
    expect(ayEkle('2026-01', -1)).toBe('2025-12')
  })
})
