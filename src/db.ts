import Dexie, { type EntityTable } from 'dexie'

/* Veriler cihazda (IndexedDB) tutulur ve bulutla eşitlenir. Tarihler 'YYYY-AA-GG' metnidir, tutarlar TL'dir. */

export interface Mekan {
  id: string
  ad: string
  telefon?: string
  notlar?: string
  olusturma: string
}

/* Ekipten biri ya da para gönderilen herhangi biri. */
export interface Kisi {
  id: string
  ad: string
  rol?: string
  telefon?: string
  olusturma: string
}

/* Sahnedeki bir kişinin payı (benim göndermem gereken). */
export interface Pay {
  kisiId: string
  tutar: number
}

export interface Sahne {
  id: string
  tarih: string
  saat?: string
  mekanId: string
  ucret: number
  paylar: Pay[]
  not?: string
  olusturma: string
}

export type OdemeSekli = 'nakit' | 'havale'

export const ODEME_SEKILLERI: Record<OdemeSekli, string> = {
  nakit: 'Nakit',
  havale: 'Havale / EFT',
}

/* Mekandan alınan ödeme. sahneId boşsa en eski ödenmemiş sahneye sayılır. */
export interface Tahsilat {
  id: string
  tarih: string
  mekanId: string
  sahneId?: string
  tutar: number
  sekli?: OdemeSekli
  not?: string
  olusturma: string
}

/* Bir kişiye gönderilen para. sahneId boşsa o kişinin en eski ödenmemiş payına sayılır. */
export interface Gonderim {
  id: string
  tarih: string
  kisiId: string
  sahneId?: string
  tutar: number
  sekli?: OdemeSekli
  not?: string
  olusturma: string
}

/* Silinen kayıt: kalıcı silinmez, buradan geri alınabilir. */
export interface Silinen {
  id: string
  tablo: TabloAdi
  kayitId: string
  kayit: unknown
  silinme: string
}

/* Silinen kaydın izi (bulut eşitleme için). anahtar = tablo|id */
export interface Silme {
  anahtar: string
  tablo: (typeof YEDEK_TABLOLARI)[number]
  id: string
  _kirli?: number
}

export const db = new Dexie('sahne_takip') as Dexie & {
  mekanlar: EntityTable<Mekan, 'id'>
  kisiler: EntityTable<Kisi, 'id'>
  sahneler: EntityTable<Sahne, 'id'>
  tahsilatlar: EntityTable<Tahsilat, 'id'>
  gonderimler: EntityTable<Gonderim, 'id'>
  silinenler: EntityTable<Silinen, 'id'>
  silmeler: EntityTable<Silme, 'anahtar'>
}

/* "_kirli": cihazda değişti, buluta gönderilecek. */
db.version(1).stores({
  mekanlar: 'id, ad, _kirli',
  kisiler: 'id, ad, _kirli',
  sahneler: 'id, tarih, mekanId, _kirli',
  tahsilatlar: 'id, tarih, mekanId, sahneId, _kirli',
  gonderimler: 'id, tarih, kisiId, sahneId, _kirli',
  silinenler: 'id, tablo, kayitId, silinme, _kirli',
  silmeler: 'anahtar, _kirli',
})

export const TABLOLAR = ['mekanlar', 'kisiler', 'sahneler', 'tahsilatlar', 'gonderimler'] as const

export type TabloAdi = (typeof TABLOLAR)[number]

/* Yedeğe ve buluta giren her şey: veriler ve silinenler. */
export const YEDEK_TABLOLARI = [...TABLOLAR, 'silinenler'] as const
