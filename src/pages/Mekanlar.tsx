import { ArrowDownLeft, MapPin, Pencil, Phone, Plus, Trash2 } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { useFormAc } from '../components/formlar'
import { BolumBasligi, ParaSatiri, SahneSatiri } from '../components/parcalar'
import { Baslik, Bos, Dugme, Kart, Liste, Ozet, Satir, useBildirim } from '../components/ui'
import { para, tarihGoster } from '../lib/format'
import { mekanOzeti, sahneDurumlari } from '../lib/hesap'
import { sil, type TumVeri } from '../lib/veri'

export default function Mekanlar({ veri }: { veri: TumVeri }) {
  const git = useNavigate()
  const ac = useFormAc()
  const liste = veri.mekanlar
    .map((m) => ({ m, o: mekanOzeti(m.id, veri.sahneler, veri.tahsilatlar) }))
    .sort((a, b) => b.o.alacak - a.o.alacak || (b.o.sonSahne ?? '').localeCompare(a.o.sonSahne ?? ''))
  return (
    <div>
      <Baslik
        baslik="Mekanlar"
        alt="Hangi mekandan ne kadar aldım, ne kadar alacağım var"
        sag={
          <Dugme tur="ana" onClick={() => ac({ tur: 'mekan' })}>
            <Plus size={18} /> Yeni mekan
          </Dugme>
        }
      />
      <Kart>
        {liste.length ? (
          <Liste>
            {liste.map(({ m, o }) => (
              <Satir
                key={m.id}
                onClick={() => git(`/mekanlar/${m.id}`)}
                sol={m.ad}
                alt={`${o.sahneSayisi} sahne · alınan ${para(o.alinan)}${o.sonSahne ? ' · son ' + tarihGoster(o.sonSahne) : ''}`}
                sag={
                  o.alacak > 0 ? (
                    <div>
                      <div className="font-semibold text-emerald-600 dark:text-emerald-400">{para(o.alacak)}</div>
                      <div className="text-xs text-stone-500">alacak</div>
                    </div>
                  ) : (
                    <span className="text-sm text-stone-400">Borcu yok</span>
                  )
                }
              />
            ))}
          </Liste>
        ) : (
          <Bos simge={<MapPin size={40} />} baslik="Henüz mekan yok" aciklama="Sahne eklerken mekanın adını yazmanız yeter; burada kendiliğinden görünür." />
        )}
      </Kart>
    </div>
  )
}

export function MekanDetay({ veri }: { veri: TumVeri }) {
  const { id } = useParams()
  const git = useNavigate()
  const ac = useFormAc()
  const bildir = useBildirim()
  const m = veri.mekanlar.find((x) => x.id === id)
  if (!m)
    return (
      <Kart>
        <Bos baslik="Mekan bulunamadı" eylem={<Dugme onClick={() => git('/mekanlar')}>Mekanlara dön</Dugme>} />
      </Kart>
    )
  const o = mekanOzeti(m.id, veri.sahneler, veri.tahsilatlar)
  const durumlar = sahneDurumlari(veri.sahneler, veri.tahsilatlar)
  const sahneler = veri.sahneler.filter((s) => s.mekanId === m.id)
  const odemeler = veri.tahsilatlar.filter((t) => t.mekanId === m.id)
  return (
    <div className="max-w-3xl">
      <Baslik
        baslik={m.ad}
        alt={
          m.telefon ? (
            <a href={`tel:${m.telefon.replace(/\s/g, '')}`} className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-400">
              <Phone size={14} /> {m.telefon}
            </a>
          ) : (
            m.notlar
          )
        }
      />
      <div className="mb-4 flex flex-wrap gap-2">
        <Dugme tur="ana" onClick={() => ac({ tur: 'tahsilat', mekanId: m.id })}>
          <ArrowDownLeft size={18} /> Ödeme aldım
        </Dugme>
        <Dugme onClick={() => ac({ tur: 'sahne', mekanId: m.id })}>
          <Plus size={17} /> Sahne ekle
        </Dugme>
        <Dugme onClick={() => ac({ tur: 'mekan', kayit: m })}>
          <Pencil size={17} /> Düzenle
        </Dugme>
        <Dugme
          tur="hayalet"
          className="text-red-600"
          onClick={async () => {
            if (sahneler.length || odemeler.length) return alert('Bu mekanın sahneleri ya da ödemeleri var. Önce onları silin.')
            const geri = await sil('mekanlar', m.id)
            bildir('Mekan silindi', geri)
            git('/mekanlar', { replace: true })
          }}
        >
          <Trash2 size={17} /> Sil
        </Dugme>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Ozet etiket="Alacağım" deger={para(o.alacak)} ton={o.alacak > 0 ? 'iyi' : undefined} alt="çıkılan sahnelerden" />
        <Ozet etiket="Alınan" deger={para(o.alinan)} alt={`${odemeler.length} ödeme`} />
        <Ozet etiket="Toplam ücret" deger={para(o.toplamUcret)} alt={`${o.sahneSayisi} sahne`} />
        <Ozet etiket={o.fazla > 0 ? 'Fazla / peşin' : 'Gelecek sahneler'} deger={para(o.fazla > 0 ? o.fazla : o.gelecek)} ton={o.fazla > 0 ? 'uyari' : undefined} />
      </div>
      {m.notlar && m.telefon && <p className="mt-4 text-sm text-stone-500">{m.notlar}</p>}

      <Kart className="mt-4">
        <BolumBasligi baslik="Sahneler" />
        {sahneler.length ? (
          <Liste>
            {sahneler.map((s) => (
              <SahneSatiri key={s.id} s={s} d={durumlar.get(s.id)} veri={veri} onClick={() => git(`/sahneler/${s.id}`)} />
            ))}
          </Liste>
        ) : (
          <Bos baslik="Bu mekanda sahne yok" />
        )}
      </Kart>
      <Kart className="mt-4">
        <BolumBasligi baslik="Alınan ödemeler" />
        {odemeler.length ? (
          <Liste>
            {odemeler.map((t) => (
              <ParaSatiri key={t.id} k={t} tur="alinan" veri={veri} onClick={() => ac({ tur: 'tahsilat', kayit: t })} />
            ))}
          </Liste>
        ) : (
          <Bos baslik="Henüz ödeme yok" />
        )}
      </Kart>
    </div>
  )
}
