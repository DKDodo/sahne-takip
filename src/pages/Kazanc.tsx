import { ChevronLeft, ChevronRight, FileSpreadsheet } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { BolumBasligi, SahneSatiri } from '../components/parcalar'
import { Baslik, Bos, cx, Dugme, Kart, Liste } from '../components/ui'
import { bugun, para, sayi, tarihGoster } from '../lib/format'
import { ayAdi, ayEkle, ayOzeti, benimPayim, paylarToplami, sahneDurumlari } from '../lib/hesap'
import { adBul, csvIndir, type TumVeri } from '../lib/veri'

export default function Kazanc({ veri }: { veri: TumVeri }) {
  const git = useNavigate()
  const [ara, setAra] = useSearchParams()
  const b = bugun()
  const buAy = b.slice(0, 7)
  const ay = /^\d{4}-\d{2}$/.test(ara.get('ay') ?? '') ? ara.get('ay')! : buAy
  const sec = (a: string) => setAra(a === buAy ? {} : { ay: a }, { replace: true })
  const o = ayOzeti(ay, veri.sahneler, veri.tahsilatlar, veri.gonderimler, b)
  const durumlar = sahneDurumlari(veri.sahneler, veri.tahsilatlar, b)
  const sahneler = veri.sahneler.filter((s) => s.tarih.startsWith(ay))

  // Son 12 ay (seçili ay sağda)
  const sonAy = ay > buAy ? ay : buAy
  const aylar = Array.from({ length: 12 }, (_, i) => ayEkle(sonAy, i - 11))
  const ozetler = aylar.map((a) => ayOzeti(a, veri.sahneler, veri.tahsilatlar, veri.gonderimler, b))
  const enCok = Math.max(1, ...ozetler.map((x) => x.kazanc + x.planliKazanc))
  const yil = ay.slice(0, 4)
  const yilKazanc = Array.from({ length: 12 }, (_, i) => ayOzeti(`${yil}-${String(i + 1).padStart(2, '0')}`, veri.sahneler, veri.tahsilatlar, veri.gonderimler, b)).reduce((t, x) => t + x.kazanc, 0)

  return (
    <div className="max-w-3xl">
      <Baslik
        baslik="Kazanç"
        alt={`${yil} yılında şimdiye kadar ${para(yilKazanc)}`}
        sag={
          <Dugme
            kucuk
            onClick={() =>
              csvIndir(
                `sahne-takip-${ay}.csv`,
                ['Tarih', 'Saat', 'Mekan', 'Ücret', 'Ekip payları', 'Bana kalan', 'Alınan', 'Kalan', 'Not'],
                sahneler
                  .slice()
                  .reverse()
                  .map((s) => [tarihGoster(s.tarih), s.saat ?? '', adBul(veri.mekanlar, s.mekanId), s.ucret, paylarToplami(s), benimPayim(s), durumlar.get(s.id)?.alinan ?? 0, durumlar.get(s.id)?.kalan ?? 0, s.not ?? '']),
              )
            }
          >
            <FileSpreadsheet size={16} /> Excel
          </Dugme>
        }
      />

      {/* Ay seçici */}
      <div className="mb-4 flex items-center justify-between rounded-2xl bg-white p-1.5 ring-1 ring-stone-200/80 dark:bg-stone-900 dark:ring-stone-800">
        <button type="button" aria-label="Önceki ay" onClick={() => sec(ayEkle(ay, -1))} className="grid size-11 place-items-center rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800">
          <ChevronLeft size={22} />
        </button>
        <button type="button" onClick={() => sec(buAy)} className="text-center">
          <div className="text-lg font-semibold text-stone-900 dark:text-white">{ayAdi(ay)}</div>
          {ay !== buAy && <div className="text-xs text-amber-700 dark:text-amber-400">Bu aya dön</div>}
        </button>
        <button type="button" aria-label="Sonraki ay" onClick={() => sec(ayEkle(ay, 1))} className="grid size-11 place-items-center rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800">
          <ChevronRight size={22} />
        </button>
      </div>

      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-stone-900 to-stone-950 p-5 text-white shadow-lg ring-1 ring-stone-800">
        <div className="pointer-events-none absolute -top-16 -right-10 size-48 rounded-full bg-amber-500/25 blur-3xl" aria-hidden="true" />
        <div className="text-sm font-medium text-amber-300">Kazancım</div>
        <div className="mt-1 text-[34px] leading-tight font-bold tracking-tight tabular-nums">{para(o.kazanc)}</div>
        <div className="mt-1 text-sm text-stone-400">
          {o.sahneSayisi} sahne{o.planliSayisi > 0 && <span className="text-amber-300/90"> · +{para(o.planliKazanc)} planlı ({o.planliSayisi} sahne)</span>}
        </div>
        <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2.5 rounded-2xl bg-white/5 p-3 text-sm ring-1 ring-white/10">
          <Kalem ad="Sahne ücretleri" deger={para(o.toplamUcret)} />
          <Kalem ad="Ekip payları" deger={o.paylar ? '−' + para(o.paylar) : para(0)} />
          <Kalem ad="Alınan ödemeler" deger={para(o.alinan)} />
          <Kalem ad="Gönderilen" deger={o.gonderilen ? '−' + para(o.gonderilen) : para(0)} />
          <div className="col-span-2 mt-1 flex items-center justify-between border-t border-white/10 pt-2.5">
            <dt className="text-stone-300">Elime geçen</dt>
            <dd className="font-semibold tabular-nums">{para(o.elimeGecen)}</dd>
          </div>
        </dl>
      </div>

      <Kart className="mt-4 p-4">
        <h2 className="mb-3 font-semibold text-stone-900 dark:text-white">Son 12 ay</h2>
        <div className="flex h-40 items-end gap-1.5" role="list" aria-label="Aylık kazanç">
          {ozetler.map((x) => {
            const h = (x.kazanc / enCok) * 100
            const p = (x.planliKazanc / enCok) * 100
            const secili = x.ay === ay
            return (
              <button
                key={x.ay}
                type="button"
                role="listitem"
                onClick={() => sec(x.ay)}
                title={`${ayAdi(x.ay)}: ${para(x.kazanc)}`}
                aria-label={`${ayAdi(x.ay)}: ${para(x.kazanc)}`}
                className="group flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1"
              >
                <div className="flex w-full flex-1 flex-col justify-end">
                  {p > 0 && <div className="w-full rounded-t-md bg-amber-500/25" style={{ height: `${p}%` }} />}
                  <div className={cx('w-full', p > 0 ? '' : 'rounded-t-md', secili ? 'bg-amber-500' : 'bg-stone-300 group-hover:bg-stone-400 dark:bg-stone-700')} style={{ height: `${Math.max(h, x.kazanc > 0 ? 3 : 0)}%` }} />
                </div>
                <span className={cx('text-[10px] tabular-nums', secili ? 'font-bold text-amber-700 dark:text-amber-400' : 'text-stone-500')}>{ayAdi(x.ay, false).slice(0, 3)}</span>
              </button>
            )
          })}
        </div>
        <p className="mt-2 text-xs text-stone-500">Koyu: kazanılan · açık: o ay planlanan. Bir aya dokunun.</p>
      </Kart>

      <Kart className="mt-4">
        <BolumBasligi baslik={`${ayAdi(ay, false)} sahneleri`} sag={<span className="text-sm text-stone-500">{sayi(sahneler.length)}</span>} />
        {sahneler.length ? (
          <Liste>
            {sahneler.map((s) => (
              <SahneSatiri
                key={s.id}
                s={s}
                d={durumlar.get(s.id)}
                veri={veri}
                onClick={() => git(`/sahneler/${s.id}`)}
                sag={
                  <div>
                    <div className="font-semibold tabular-nums">{para(benimPayim(s))}</div>
                    <div className="text-xs text-stone-500">bana</div>
                  </div>
                }
              />
            ))}
          </Liste>
        ) : (
          <Bos baslik="Bu ay sahne yok" />
        )}
      </Kart>
    </div>
  )
}

function Kalem({ ad, deger }: { ad: string; deger: string }) {
  return (
    <div>
      <dt className="text-xs text-stone-400">{ad}</dt>
      <dd className="font-medium tabular-nums">{deger}</dd>
    </div>
  )
}
