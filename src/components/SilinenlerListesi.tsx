import { RotateCcw, Trash2 } from 'lucide-react'
import { db, type Gonderim, type Kisi, type Mekan, type Sahne, type Silinen, type TabloAdi, type Tahsilat } from '../db'
import { para, tarihGoster } from '../lib/format'
import { adBul, geriYukle, kaliciSil, useCanli, type TumVeri } from '../lib/veri'
import { Bos, Dugme, Kart, Rozet, useBildirim } from './ui'

export const TABLO_ADLARI: Record<TabloAdi, string> = {
  sahneler: 'Sahne',
  tahsilatlar: 'Alınan',
  gonderimler: 'Gönderilen',
  mekanlar: 'Mekan',
  kisiler: 'Kişi',
}

/* Silinen kaydın tek satırlık özeti: ne olduğu anlaşılsın diye. */
function ozet(s: Silinen, veri: TumVeri): { baslik: string; alt: string; tutar?: number } {
  const k = s.kayit as Record<string, unknown>
  switch (s.tablo) {
    case 'sahneler': {
      const x = k as unknown as Sahne
      return { baslik: `Sahne · ${adBul(veri.mekanlar, x.mekanId) || 'mekan yok'}`, alt: tarihGoster(x.tarih), tutar: x.ucret }
    }
    case 'tahsilatlar': {
      const x = k as unknown as Tahsilat
      return { baslik: `Alınan · ${adBul(veri.mekanlar, x.mekanId) || 'mekan yok'}`, alt: tarihGoster(x.tarih), tutar: x.tutar }
    }
    case 'gonderimler': {
      const x = k as unknown as Gonderim
      return { baslik: `Gönderilen · ${adBul(veri.kisiler, x.kisiId) || 'kişi yok'}`, alt: tarihGoster(x.tarih), tutar: x.tutar }
    }
    case 'mekanlar': {
      const x = k as unknown as Mekan
      return { baslik: x.ad, alt: 'Mekan' }
    }
    case 'kisiler': {
      const x = k as unknown as Kisi
      return { baslik: x.ad, alt: x.rol || 'Kişi' }
    }
  }
}

export function SilinenlerListesi({ veri, tablo }: { veri: TumVeri; tablo?: TabloAdi }) {
  const bildir = useBildirim()
  const liste = useCanli(async () => {
    const l = tablo ? await db.silinenler.where('tablo').equals(tablo).toArray() : await db.silinenler.toArray()
    return l.sort((a, b) => b.silinme.localeCompare(a.silinme))
  }, [tablo])

  if (!liste) return null
  if (!liste.length)
    return (
      <Kart>
        <Bos simge={<Trash2 size={40} />} baslik="Silinen kayıt yok" aciklama="Sildiğiniz kayıtlar buraya düşer; istediğiniz zaman geri alabilirsiniz." />
      </Kart>
    )

  return (
    <div>
      <p className="mb-3 text-sm text-stone-500">
        Silinen kayıtlar kalıcı olarak silinmez; burada bekler ve yedeklere de girer. Geri aldığınızda eski yerine döner.
      </p>
      <Kart>
        <div className="divide-y divide-stone-100 dark:divide-stone-800">
          {liste.map((s) => {
            const o = ozet(s, veri)
            return (
              <div key={s.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    {!tablo && <Rozet>{TABLO_ADLARI[s.tablo]}</Rozet>}
                    <span className="truncate font-medium text-stone-900 dark:text-stone-100">{o.baslik}</span>
                  </div>
                  <div className="truncate text-[13px] text-stone-500">
                    {o.alt} · silindi {new Date(s.silinme).toLocaleString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                {o.tutar !== undefined && <div className="font-semibold tabular-nums">{para(o.tutar)}</div>}
                <div className="flex gap-2">
                  <Dugme
                    kucuk
                    tur="ana"
                    onClick={async () => {
                      await geriYukle(s.id)
                      bildir('Geri alındı, eski yerine döndü')
                    }}
                  >
                    <RotateCcw size={15} /> Geri al
                  </Dugme>
                  <Dugme
                    kucuk
                    tur="hayalet"
                    aria-label="Kalıcı sil"
                    title="Kalıcı sil"
                    className="text-red-600"
                    onClick={async () => {
                      if (!confirm('Bu kayıt kalıcı olarak silinecek ve geri alınamayacak. Emin misiniz?')) return
                      await kaliciSil([s.id])
                      bildir('Kalıcı olarak silindi')
                    }}
                  >
                    <Trash2 size={15} />
                  </Dugme>
                </div>
              </div>
            )
          })}
        </div>
      </Kart>
    </div>
  )
}
