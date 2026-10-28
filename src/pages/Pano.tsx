import { ArrowDownLeft, ArrowUpRight, CalendarClock, Clock, Mic, Plus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useFormAc } from '../components/formlar'
import { BolumBasligi, SahneSatiri } from '../components/parcalar'
import { Baslik, Bos, Dugme, Kart, Liste } from '../components/ui'
import { bugun, para } from '../lib/format'
import { ayAdi, ayOzeti, kisiOzeti, mekanOzeti, sahneDurumlari, toplam } from '../lib/hesap'
import type { TumVeri } from '../lib/veri'

export default function Pano({ veri }: { veri: TumVeri }) {
  const git = useNavigate()
  const ac = useFormAc()
  const b = bugun()
  const ay = b.slice(0, 7)
  const o = ayOzeti(ay, veri.sahneler, veri.tahsilatlar, veri.gonderimler, b)
  const durumlar = sahneDurumlari(veri.sahneler, veri.tahsilatlar, b)
  const alacak = toplam(veri.mekanlar, (m) => mekanOzeti(m.id, veri.sahneler, veri.tahsilatlar, b).alacak)
  const borc = toplam(veri.kisiler, (k) => kisiOzeti(k.id, veri.sahneler, veri.gonderimler, b).borcum)
  const bekleyen = veri.sahneler
    .filter((s) => s.tarih <= b && (durumlar.get(s.id)?.kalan ?? 0) > 0)
    .sort((x, y) => x.tarih.localeCompare(y.tarih))
  const yaklasan = veri.sahneler.filter((s) => s.tarih > b).sort((x, y) => x.tarih.localeCompare(y.tarih))

  if (!veri.sahneler.length && !veri.tahsilatlar.length && !veri.gonderimler.length)
    return (
      <div>
        <Baslik baslik="Pano" />
        <Kart className="p-6 text-center">
          <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-amber-500 text-stone-950 shadow-lg shadow-amber-500/30">
            <Mic size={30} />
          </div>
          <h2 className="mt-4 text-lg font-semibold text-stone-900 dark:text-white">Hoş geldin 🎤</h2>
          <p className="mx-auto mt-1 max-w-sm text-sm text-stone-600 dark:text-stone-400">
            Çıktığın ilk sahneyi ekle: tarih, mekan ve ücret yeter. Ekiple bölüşüyorsan payları da yaz; kime ne kadar göndereceğini uygulama hesaplar.
          </p>
          <Dugme tur="ana" className="mt-5" onClick={() => ac({ tur: 'sahne' })}>
            <Plus size={18} /> İlk sahneyi ekle
          </Dugme>
        </Kart>
      </div>
    )

  return (
    <div>
      <Baslik baslik="Pano" alt={new Intl.DateTimeFormat('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date())} />

      {/* Bu ay ne kadar kazandım */}
      <button
        type="button"
        onClick={() => git('/kazanc')}
        className="relative w-full overflow-hidden rounded-3xl bg-gradient-to-br from-stone-900 to-stone-950 p-5 text-left text-white shadow-lg ring-1 ring-stone-800 active:scale-[.995]"
      >
        <div className="pointer-events-none absolute -top-16 -right-10 size-48 rounded-full bg-amber-500/25 blur-3xl" aria-hidden="true" />
        <div className="text-sm font-medium text-amber-300">{ayAdi(ay, false)} ayında kazancım</div>
        <div className="mt-1 text-[34px] leading-tight font-bold tracking-tight tabular-nums">{para(o.kazanc)}</div>
        <div className="mt-1 text-sm text-stone-400">
          {o.sahneSayisi} sahne
          {o.paylar > 0 && <> · ekibe {para(o.paylar)}</>}
          {o.planliSayisi > 0 && (
            <>
              {' '}
              · <span className="text-amber-300/90">+{para(o.planliKazanc)} planlı</span>
            </>
          )}
        </div>
        <div className="mt-4 flex items-center justify-between rounded-2xl bg-white/5 px-3 py-2.5 text-sm ring-1 ring-white/10">
          <span className="text-stone-300">Bu ay elime geçen</span>
          <b className="tabular-nums">{para(o.elimeGecen)}</b>
        </div>
      </button>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <button type="button" onClick={() => git('/mekanlar')} className="rounded-2xl bg-white p-4 text-left ring-1 ring-stone-200/80 dark:bg-stone-900 dark:ring-stone-800">
          <div className="flex items-center gap-1.5 text-[13px] font-medium text-stone-500">
            <ArrowDownLeft size={15} /> Alacağım
          </div>
          <div className="mt-1 text-xl font-semibold tracking-tight text-emerald-600 tabular-nums dark:text-emerald-400">{para(alacak)}</div>
          <div className="mt-0.5 text-xs text-stone-500">{bekleyen.length} sahneden</div>
        </button>
        <button type="button" onClick={() => git('/ekip')} className="rounded-2xl bg-white p-4 text-left ring-1 ring-stone-200/80 dark:bg-stone-900 dark:ring-stone-800">
          <div className="flex items-center gap-1.5 text-[13px] font-medium text-stone-500">
            <ArrowUpRight size={15} /> Göndereceğim
          </div>
          <div className="mt-1 text-xl font-semibold tracking-tight text-sky-700 tabular-nums dark:text-sky-400">{para(borc)}</div>
          <div className="mt-0.5 text-xs text-stone-500">ekip payları</div>
        </button>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Kart>
          <BolumBasligi
            simge={<Clock size={18} />}
            baslik="Ödemesi bekleyenler"
            sag={
              <Dugme tur="hayalet" kucuk onClick={() => git('/sahneler?d=bekleyen')}>
                Tümü
              </Dugme>
            }
          />
          {bekleyen.length ? (
            <Liste>
              {bekleyen.slice(0, 5).map((s) => (
                <SahneSatiri key={s.id} s={s} d={durumlar.get(s.id)} veri={veri} onClick={() => git(`/sahneler/${s.id}`)} />
              ))}
            </Liste>
          ) : (
            <Bos baslik="Bekleyen ödeme yok" aciklama="Çıktığın bütün sahnelerin ücreti alınmış." />
          )}
        </Kart>

        <Kart>
          <BolumBasligi
            simge={<CalendarClock size={18} />}
            baslik="Yaklaşan sahneler"
            sag={
              <Dugme tur="hayalet" kucuk onClick={() => ac({ tur: 'sahne' })}>
                <Plus size={16} /> Ekle
              </Dugme>
            }
          />
          {yaklasan.length ? (
            <Liste>
              {yaklasan.slice(0, 5).map((s) => (
                <SahneSatiri key={s.id} s={s} d={durumlar.get(s.id)} veri={veri} onClick={() => git(`/sahneler/${s.id}`)} />
              ))}
            </Liste>
          ) : (
            <Bos baslik="Planlanmış sahne yok" aciklama="Anlaştığın sahneleri önceden ekleyebilirsin." />
          )}
        </Kart>
      </div>
    </div>
  )
}
