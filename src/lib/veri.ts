import { liveQuery } from 'dexie'
import { useEffect, useState } from 'react'
import { db, TABLOLAR, YEDEK_TABLOLARI, type TabloAdi } from '../db'
import { kaldir, temiz } from './esitleme'
import { karsilastir, simdi, yeniId } from './format'

/* Veritabanı değiştikçe kendiliğinden yenilenen sorgu. */
export function useCanli<T>(sorgu: () => Promise<T>, bagimliliklar: unknown[] = []): T | undefined {
  const [deger, setDeger] = useState<T>()
  useEffect(() => {
    const abonelik = liveQuery(sorgu).subscribe({
      next: (v) => setDeger(v),
      error: (e) => console.error(e),
    })
    return () => abonelik.unsubscribe()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, bagimliliklar)
  return deger
}

export function useTumu() {
  return useCanli(async () => {
    const [mekanlar, kisiler, sahneler, tahsilatlar, gonderimler] = await Promise.all([
      db.mekanlar.toArray(),
      db.kisiler.toArray(),
      db.sahneler.toArray(),
      db.tahsilatlar.toArray(),
      db.gonderimler.toArray(),
    ])
    mekanlar.sort((a, b) => karsilastir(a.ad, b.ad))
    kisiler.sort((a, b) => karsilastir(a.ad, b.ad))
    const yeniden = (a: { tarih: string; olusturma: string }, b: { tarih: string; olusturma: string }) => b.tarih.localeCompare(a.tarih) || b.olusturma.localeCompare(a.olusturma)
    sahneler.sort(yeniden)
    tahsilatlar.sort(yeniden)
    gonderimler.sort(yeniden)
    return { mekanlar, kisiler, sahneler, tahsilatlar, gonderimler }
  })
}

export type TumVeri = NonNullable<ReturnType<typeof useTumu>>

export function adBul<T extends { id: string; ad: string }>(liste: T[], id?: string): string {
  if (!id) return ''
  return liste.find((x) => x.id === id)?.ad ?? ''
}

/*
 * Silme kalıcı değildir: kayıt "Silinenler"e taşınır, oradan geri alınabilir.
 * Dönen fonksiyon bildirimdeki "Geri al" içindir.
 */
export async function sil(tablo: TabloAdi, id: string): Promise<() => Promise<void>> {
  const t = db.table(tablo)
  const silinenId = yeniId()
  await db.transaction('rw', t, db.silinenler, db.silmeler, async () => {
    const kayit = await t.get(id)
    if (!kayit) return
    await db.silinenler.add({ id: silinenId, tablo, kayitId: id, kayit: temiz(kayit), silinme: simdi() })
    await kaldir(tablo, [id])
  })
  return () => geriYukle(silinenId)
}

/* Silinenlerden asıl yerine geri koyar. */
export async function geriYukle(silinenId: string): Promise<void> {
  const s = await db.silinenler.get(silinenId)
  if (!s || !(TABLOLAR as readonly string[]).includes(s.tablo)) return
  const t = db.table(s.tablo)
  await db.transaction('rw', t, db.silinenler, db.silmeler, async () => {
    await t.put(s.kayit as object)
    await kaldir('silinenler', [silinenId])
  })
}

/* Yalnız Silinenler ekranından, onayla: geri dönüşü olmayan silme. */
export async function kaliciSil(silinenIdler: string[]): Promise<void> {
  await db.transaction('rw', db.silinenler, db.silmeler, () => kaldir('silinenler', silinenIdler))
}

export interface Yedek {
  uygulama: 'sahne_takip'
  surum: 1
  tarih: string
  veri: Partial<Record<(typeof YEDEK_TABLOLARI)[number], unknown[]>>
}

export async function yedekAl(): Promise<Yedek> {
  const veri: Yedek['veri'] = {}
  await db.transaction('r', YEDEK_TABLOLARI.map((t) => db.table(t)), async () => {
    for (const t of YEDEK_TABLOLARI) veri[t] = await db.table(t).toArray()
  })
  return { uygulama: 'sahne_takip', surum: 1, tarih: simdi(), veri }
}

/* Yedekteki verilerle bu cihazdakileri değiştirir. Hepsi ya da hiçbiri (tek işlem). */
export async function yedektenYukle(y: unknown): Promise<number> {
  const yedek = y as Partial<Yedek>
  if (!yedek || yedek.uygulama !== 'sahne_takip' || !yedek.veri || typeof yedek.veri !== 'object') throw new Error('Bu dosya bu uygulamanın yedeği değil.')
  for (const t of TABLOLAR) {
    const v = yedek.veri[t]
    if (v !== undefined && !Array.isArray(v)) throw new Error(`Yedek dosyası bozuk (${t}).`)
    if (Array.isArray(v) && v.some((r) => !r || typeof r !== 'object' || typeof (r as { id?: unknown }).id !== 'string')) throw new Error(`Yedek dosyasında kimliksiz kayıt var (${t}).`)
  }
  let sayac = 0
  await db.transaction('rw', [...YEDEK_TABLOLARI.map((t) => db.table(t)), db.silmeler], async () => {
    for (const t of YEDEK_TABLOLARI) {
      const v = yedek.veri?.[t]
      const satirlar = Array.isArray(v) ? (v as { id: string }[]).map((r) => temiz(r)) : []
      const yedektekiler = new Set(satirlar.map((r) => r.id as string))
      // Yedekte olmayan mevcut kayıtlar silinir (izleriyle; bulut açıksa öbür cihazlarda da silinir).
      const fazla = ((await db.table(t).toCollection().primaryKeys()) as string[]).filter((id) => !yedektekiler.has(id))
      await kaldir(t, fazla)
      if (satirlar.length) await db.table(t).bulkPut(satirlar)
      if (t !== 'silinenler') sayac += satirlar.length
    }
  })
  return sayac
}

/* Yalnız bulut bağlı değilken kullanılır (Ayarlar). */
export async function hepsiniSil(): Promise<void> {
  await db.transaction('rw', [...YEDEK_TABLOLARI.map((t) => db.table(t)), db.silmeler], async () => {
    for (const t of YEDEK_TABLOLARI) await kaldir(t, (await db.table(t).toCollection().primaryKeys()) as string[])
  })
}

export function dosyaIndir(ad: string, icerik: string, tur: string): void {
  const blob = new Blob([icerik], { type: tur })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = ad
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}

/* Excel'in Türkçe karakterleri doğru açması için BOM'lu, noktalı virgülle ayrılmış CSV. */
export function csvIndir(ad: string, basliklar: string[], satirlar: (string | number)[][]): void {
  const hucre = (v: string | number) => {
    const s = typeof v === 'number' ? String(v).replace('.', ',') : v
    return /[";\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s
  }
  const metin = [basliklar, ...satirlar].map((r) => r.map(hucre).join(';')).join('\r\n')
  dosyaIndir(ad, '﻿' + metin, 'text/csv;charset=utf-8')
}
