import { ArrowDownLeft, ArrowUpRight } from 'lucide-react'
import type { ReactNode } from 'react'
import type { Gonderim, Sahne, Tahsilat } from '../db'
import { para, tarihGoster } from '../lib/format'
import { benimPayim, type SahneDurumu, type TahsilDurumu } from '../lib/hesap'
import { adBul, type TumVeri } from '../lib/veri'
import { cx, Rozet } from './ui'

const DURUM: Record<TahsilDurumu, [string, 'yesil' | 'sari' | 'kirmizi' | 'mavi']> = {
  odendi: ['Ödendi', 'yesil'],
  kismen: ['Kısmen', 'sari'],
  bekliyor: ['Bekliyor', 'kirmizi'],
  gelecek: ['Gelecek', 'mavi'],
}

export function DurumRozeti({ durum }: { durum: TahsilDurumu }) {
  const [ad, ton] = DURUM[durum]
  return <Rozet ton={ton}>{ad}</Rozet>
}

const GUNLER = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt']
const AYLAR = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara']

/* Takvim yaprağı gibi küçük tarih kutusu */
export function TarihKutusu({ tarih, soluk }: { tarih: string; soluk?: boolean }) {
  const [y, m, g] = tarih.split('-').map(Number)
  const gun = GUNLER[new Date(y, m - 1, g).getDay()]
  return (
    <div className={cx('grid w-12 shrink-0 place-items-center rounded-xl py-1.5 leading-none ring-1', soluk ? 'bg-stone-50 ring-stone-200 dark:bg-stone-800/60 dark:ring-stone-700' : 'bg-amber-50 ring-amber-200 dark:bg-amber-950/50 dark:ring-amber-900')}>
      <span className="text-[10px] font-semibold tracking-wide text-stone-500 uppercase">{AYLAR[m - 1]}</span>
      <span className="text-lg font-bold text-stone-900 tabular-nums dark:text-white">{g}</span>
      <span className="text-[10px] text-stone-500">{gun}</span>
    </div>
  )
}

export function SahneSatiri({ s, d, veri, onClick, sag }: { s: Sahne; d?: SahneDurumu; veri: TumVeri; onClick?: () => void; sag?: ReactNode }) {
  const pay = s.paylar?.length ? `${s.paylar.length} kişiyle · bana ${para(benimPayim(s))}` : 'Tek başıma'
  return (
    <button type="button" onClick={onClick} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-stone-50 dark:hover:bg-stone-800/60">
      <TarihKutusu tarih={s.tarih} soluk={d?.durum === 'odendi'} />
      <div className="min-w-0 flex-1">
        <div className="truncate font-medium text-stone-900 dark:text-stone-100">{adBul(veri.mekanlar, s.mekanId) || 'Mekan silinmiş'}</div>
        <div className="mt-0.5 truncate text-[13px] text-stone-500">
          {s.saat ? `${s.saat} · ` : ''}
          {pay}
        </div>
      </div>
      <div className="shrink-0 text-right">
        {sag ?? (
          <>
            <div className="font-semibold tabular-nums">{para(s.ucret)}</div>
            {d && (
              <div className="mt-0.5">
                {d.durum === 'kismen' ? <span className="text-xs font-medium text-amber-700 tabular-nums dark:text-amber-400">kalan {para(d.kalan)}</span> : <DurumRozeti durum={d.durum} />}
              </div>
            )}
          </>
        )}
      </div>
    </button>
  )
}

/* Alınan ya da gönderilen para satırı */
export function ParaSatiri({ k, tur, veri, onClick }: { k: Tahsilat | Gonderim; tur: 'alinan' | 'gonderilen'; veri: TumVeri; onClick?: () => void }) {
  const alinan = tur === 'alinan'
  const kim = alinan ? adBul(veri.mekanlar, (k as Tahsilat).mekanId) || 'Mekan silinmiş' : adBul(veri.kisiler, (k as Gonderim).kisiId) || 'Kişi silinmiş'
  const sahne = k.sahneId ? veri.sahneler.find((s) => s.id === k.sahneId) : undefined
  const alt = [tarihGoster(k.tarih), sahne && `${tarihGoster(sahne.tarih)} sahnesi`, k.sekli === 'havale' ? 'Havale' : k.sekli === 'nakit' ? 'Nakit' : '', k.not].filter(Boolean).join(' · ')
  return (
    <button type="button" onClick={onClick} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-stone-50 dark:hover:bg-stone-800/60">
      <span className={cx('grid size-10 shrink-0 place-items-center rounded-xl', alinan ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300')}>
        {alinan ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
      </span>
      <div className="min-w-0 flex-1">
        <div className="truncate font-medium text-stone-900 dark:text-stone-100">{kim}</div>
        <div className="mt-0.5 truncate text-[13px] text-stone-500">{alt}</div>
      </div>
      <div className={cx('shrink-0 font-semibold tabular-nums', alinan ? 'text-emerald-600 dark:text-emerald-400' : 'text-sky-700 dark:text-sky-400')}>
        {alinan ? '+' : '−'}
        {para(k.tutar)}
      </div>
    </button>
  )
}

/* Bölüm başlığı + sağda küçük bağlantı */
export function BolumBasligi({ simge, baslik, sag }: { simge?: ReactNode; baslik: string; sag?: ReactNode }) {
  return (
    <div className="flex items-center justify-between px-4 pt-4 pb-2">
      <h2 className="flex items-center gap-2 font-semibold text-stone-900 dark:text-white">
        {simge}
        {baslik}
      </h2>
      {sag}
    </div>
  )
}
