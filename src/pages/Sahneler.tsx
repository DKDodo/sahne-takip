import { ArrowDownLeft, ArrowUpRight, Mic, Pencil, Plus, Trash2 } from 'lucide-react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useFormAc } from '../components/formlar'
import { BolumBasligi, DurumRozeti, ParaSatiri, SahneSatiri } from '../components/parcalar'
import { Baslik, Bos, Dugme, Kart, Liste, onayla, Ozet, Sekmeler, useBildirim } from '../components/ui'
import { bugun, para, tarihUzun } from '../lib/format'
import { ayAdi, benimPayim, kisiPaylari, paylarToplami, sahneDurumlari, toplam, type TahsilDurumu } from '../lib/hesap'
import { adBul, sil, type TumVeri } from '../lib/veri'

type Suzgec = 'hepsi' | 'bekleyen' | 'gelecek' | 'odendi'

export default function Sahneler({ veri }: { veri: TumVeri }) {
  const git = useNavigate()
  const ac = useFormAc()
  const [ara, setAra] = useSearchParams()
  const d = (ara.get('d') as Suzgec) || 'hepsi'
  const durumlar = sahneDurumlari(veri.sahneler, veri.tahsilatlar)
  const uyar = (s: TahsilDurumu, f: Suzgec) => f === 'hepsi' || (f === 'bekleyen' ? s === 'bekliyor' || s === 'kismen' : s === f)
  const liste = veri.sahneler.filter((s) => uyar(durumlar.get(s.id)!.durum, d))
  if (d === 'gelecek' || d === 'bekleyen') liste.reverse() // yakından uzağa / en eski borç önce
  const sayi = (f: Suzgec) => veri.sahneler.filter((s) => uyar(durumlar.get(s.id)!.durum, f)).length

  // Ay ay grupla
  const gruplar: { ay: string; sahneler: typeof liste }[] = []
  for (const s of liste) {
    const ay = s.tarih.slice(0, 7)
    const g = gruplar.at(-1)
    if (g?.ay === ay) g.sahneler.push(s)
    else gruplar.push({ ay, sahneler: [s] })
  }

  return (
    <div>
      <Baslik
        baslik="Sahneler"
        alt={`${veri.sahneler.length} sahne`}
        sag={
          <Dugme tur="ana" onClick={() => ac({ tur: 'sahne' })}>
            <Plus size={18} /> Yeni sahne
          </Dugme>
        }
      />
      <Sekmeler
        secili={d}
        sec={(x) => setAra(x === 'hepsi' ? {} : { d: x }, { replace: true })}
        secenekler={[
          ['hepsi', 'Tümü', sayi('hepsi')],
          ['bekleyen', 'Bekleyen', sayi('bekleyen')],
          ['gelecek', 'Gelecek', sayi('gelecek')],
          ['odendi', 'Ödendi', sayi('odendi')],
        ]}
      />
      {!liste.length ? (
        <Kart>
          <Bos simge={<Mic size={40} />} baslik={d === 'hepsi' ? 'Henüz sahne yok' : 'Bu listede sahne yok'} eylem={d === 'hepsi' ? <Dugme tur="ana" onClick={() => ac({ tur: 'sahne' })}><Plus size={18} /> Yeni sahne</Dugme> : undefined} />
        </Kart>
      ) : (
        <div className="grid gap-4">
          {gruplar.map((g) => (
            <Kart key={g.ay}>
              <div className="flex items-baseline justify-between px-4 pt-3 pb-1">
                <h2 className="font-semibold text-stone-900 dark:text-white">{ayAdi(g.ay)}</h2>
                <span className="text-sm text-stone-500 tabular-nums">{para(toplam(g.sahneler, (s) => s.ucret))}</span>
              </div>
              <Liste>
                {g.sahneler.map((s) => (
                  <SahneSatiri key={s.id} s={s} d={durumlar.get(s.id)} veri={veri} onClick={() => git(`/sahneler/${s.id}`)} />
                ))}
              </Liste>
            </Kart>
          ))}
        </div>
      )}
    </div>
  )
}

export function SahneDetay({ veri }: { veri: TumVeri }) {
  const { id } = useParams()
  const git = useNavigate()
  const ac = useFormAc()
  const bildir = useBildirim()
  const s = veri.sahneler.find((x) => x.id === id)
  if (!s)
    return (
      <Kart>
        <Bos baslik="Sahne bulunamadı" aciklama="Silinmiş olabilir; Silinenler'den geri alabilirsiniz." eylem={<Dugme onClick={() => git('/sahneler')}>Sahnelere dön</Dugme>} />
      </Kart>
    )
  const d = sahneDurumlari(veri.sahneler, veri.tahsilatlar).get(s.id)!
  const bagli = veri.tahsilatlar.filter((t) => t.sahneId === s.id)
  const bagliToplam = toplam(bagli, (t) => t.tutar)
  const digerden = Math.max(0, d.alinan - Math.min(bagliToplam, s.ucret))
  const mekan = adBul(veri.mekanlar, s.mekanId) || 'Mekan silinmiş'

  return (
    <div className="max-w-3xl">
      <Baslik
        baslik={mekan}
        alt={
          <span className="inline-flex flex-wrap items-center gap-2">
            {tarihUzun(s.tarih)}
            {s.saat && ` · ${s.saat}`}
            <DurumRozeti durum={d.durum} />
          </span>
        }
      />
      <div className="mb-4 flex flex-wrap gap-2">
        {d.kalan > 0 && (
          <Dugme tur="ana" onClick={() => ac({ tur: 'tahsilat', sahneId: s.id })}>
            <ArrowDownLeft size={18} /> Ödeme aldım
          </Dugme>
        )}
        <Dugme onClick={() => ac({ tur: 'sahne', kayit: s })}>
          <Pencil size={17} /> Düzenle
        </Dugme>
        <Dugme
          tur="hayalet"
          className="text-red-600"
          onClick={async () => {
            if (!(await onayla({ baslik: 'Sahne silinsin mi?', mesaj: `${mekan} · ${tarihUzun(s.tarih)}. Silinenler'den geri alabilirsiniz.`, evet: 'Sil', tehlike: true }))) return
            const geri = await sil('sahneler', s.id)
            bildir('Sahne silindi', geri)
            git('/sahneler', { replace: true })
          }}
        >
          <Trash2 size={17} /> Sil
        </Dugme>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Ozet etiket="Ücret" deger={para(s.ucret)} />
        <Ozet etiket="Alınan" deger={para(d.alinan)} ton={d.alinan > 0 ? 'iyi' : undefined} />
        <Ozet etiket="Kalan" deger={para(d.kalan)} ton={d.kalan > 0 && s.tarih <= bugun() ? 'uyari' : undefined} />
        <Ozet etiket="Bana kalan" deger={para(benimPayim(s))} alt={s.paylar.length ? `ekibe ${para(paylarToplami(s))}` : 'tek başıma'} />
      </div>

      {s.paylar.length > 0 && (
        <Kart className="mt-4">
          <BolumBasligi baslik="Ekip payları" />
          <Liste>
            {s.paylar.map((p, i) => {
              const k = kisiPaylari(p.kisiId, veri.sahneler, veri.gonderimler)
              const borc = k.liste.find((x) => x.id === s.id)
              const gonderilen = Math.min(p.tutar, k.odenen.get(s.id) ?? 0)
              const kalan = Math.max(0, (borc?.tutar ?? p.tutar) - (k.odenen.get(s.id) ?? 0))
              return (
                <div key={i} className="flex items-center gap-3 px-4 py-3">
                  <button type="button" className="min-w-0 flex-1 text-left" onClick={() => git(`/ekip/${p.kisiId}`)}>
                    <div className="truncate font-medium text-stone-900 dark:text-stone-100">{adBul(veri.kisiler, p.kisiId) || 'Kişi silinmiş'}</div>
                    <div className="text-[13px] text-stone-500 tabular-nums">
                      Pay {para(p.tutar)}
                      {gonderilen > 0 && ` · gönderilen ${para(gonderilen)}`}
                    </div>
                  </button>
                  {kalan > 0.004 ? (
                    <Dugme kucuk onClick={() => ac({ tur: 'gonderim', kisiId: p.kisiId, sahneId: s.id })}>
                      <ArrowUpRight size={15} /> {para(kalan)} gönder
                    </Dugme>
                  ) : (
                    <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Gönderildi</span>
                  )}
                </div>
              )
            })}
          </Liste>
        </Kart>
      )}

      <Kart className="mt-4">
        <BolumBasligi baslik="Bu sahne için alınan ödemeler" />
        {bagli.length ? (
          <Liste>
            {bagli.map((t) => (
              <ParaSatiri key={t.id} k={t} tur="alinan" veri={veri} onClick={() => ac({ tur: 'tahsilat', kayit: t })} />
            ))}
          </Liste>
        ) : (
          !digerden && <Bos baslik="Henüz ödeme yok" />
        )}
        {digerden > 0 && (
          <p className="px-4 pt-1 pb-4 text-sm text-stone-500">
            {para(digerden)} bu mekandan sahne seçilmeden alınan ödemelerden sayıldı.
          </p>
        )}
      </Kart>
      {s.not && <p className="mt-4 rounded-2xl bg-white px-4 py-3 text-sm text-stone-600 ring-1 ring-stone-200 dark:bg-stone-900 dark:text-stone-300 dark:ring-stone-800">{s.not}</p>}
    </div>
  )
}
