import { ArrowUpRight, Pencil, Phone, Plus, Trash2, Users } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { useFormAc } from '../components/formlar'
import { BolumBasligi, ParaSatiri, TarihKutusu } from '../components/parcalar'
import { Baslik, Bos, Dugme, Kart, Liste, Ozet, Satir, useBildirim } from '../components/ui'
import { bugun, para } from '../lib/format'
import { kisiOzeti, kisiPaylari } from '../lib/hesap'
import { adBul, sil, type TumVeri } from '../lib/veri'

export default function Ekip({ veri }: { veri: TumVeri }) {
  const git = useNavigate()
  const ac = useFormAc()
  const liste = veri.kisiler.map((k) => ({ k, o: kisiOzeti(k.id, veri.sahneler, veri.gonderimler) })).sort((a, b) => b.o.borcum - a.o.borcum)
  return (
    <div>
      <Baslik
        baslik="Ekip"
        alt="Kime ne kadar gönderdim, kime ne kadar göndereceğim"
        sag={
          <Dugme tur="ana" onClick={() => ac({ tur: 'kisi' })}>
            <Plus size={18} /> Yeni kişi
          </Dugme>
        }
      />
      <Kart>
        {liste.length ? (
          <Liste>
            {liste.map(({ k, o }) => (
              <Satir
                key={k.id}
                onClick={() => git(`/ekip/${k.id}`)}
                sol={k.ad}
                alt={`${k.rol ? k.rol + ' · ' : ''}${o.sahneSayisi} sahne · gönderilen ${para(o.gonderilen)}`}
                sag={
                  o.borcum > 0 ? (
                    <div>
                      <div className="font-semibold text-sky-700 dark:text-sky-400">{para(o.borcum)}</div>
                      <div className="text-xs text-stone-500">göndereceğim</div>
                    </div>
                  ) : (
                    <span className="text-sm text-stone-400">Hesap kapalı</span>
                  )
                }
              />
            ))}
          </Liste>
        ) : (
          <Bos simge={<Users size={40} />} baslik="Henüz kimse yok" aciklama="Sahne eklerken ekip payı yazdığınızda kişiler burada kendiliğinden görünür." />
        )}
      </Kart>
    </div>
  )
}

export function KisiDetay({ veri }: { veri: TumVeri }) {
  const { id } = useParams()
  const git = useNavigate()
  const ac = useFormAc()
  const bildir = useBildirim()
  const k = veri.kisiler.find((x) => x.id === id)
  if (!k)
    return (
      <Kart>
        <Bos baslik="Kişi bulunamadı" eylem={<Dugme onClick={() => git('/ekip')}>Ekibe dön</Dugme>} />
      </Kart>
    )
  const b = bugun()
  const o = kisiOzeti(k.id, veri.sahneler, veri.gonderimler, b)
  const { liste, odenen, gonderimler } = kisiPaylari(k.id, veri.sahneler, veri.gonderimler)
  return (
    <div className="max-w-3xl">
      <Baslik
        baslik={k.ad}
        alt={
          <span className="inline-flex flex-wrap items-center gap-2">
            {k.rol}
            {k.telefon && (
              <a href={`tel:${k.telefon.replace(/\s/g, '')}`} className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-400">
                <Phone size={14} /> {k.telefon}
              </a>
            )}
          </span>
        }
      />
      <div className="mb-4 flex flex-wrap gap-2">
        <Dugme tur="ana" onClick={() => ac({ tur: 'gonderim', kisiId: k.id })}>
          <ArrowUpRight size={18} /> Para gönderdim
        </Dugme>
        <Dugme onClick={() => ac({ tur: 'kisi', kayit: k })}>
          <Pencil size={17} /> Düzenle
        </Dugme>
        <Dugme
          tur="hayalet"
          className="text-red-600"
          onClick={async () => {
            if (liste.length || gonderimler.length) return alert('Bu kişinin payları ya da gönderimleri var. Önce onları silin.')
            const geri = await sil('kisiler', k.id)
            bildir('Kişi silindi', geri)
            git('/ekip', { replace: true })
          }}
        >
          <Trash2 size={17} /> Sil
        </Dugme>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Ozet etiket="Göndereceğim" deger={para(o.borcum)} ton={o.borcum > 0 ? 'uyari' : undefined} alt="çıkılan sahnelerden" />
        <Ozet etiket="Gönderilen" deger={para(o.gonderilen)} alt={`${gonderimler.length} gönderim`} />
        <Ozet etiket="Toplam pay" deger={para(o.toplamPay)} alt={`${o.sahneSayisi} sahne`} />
        <Ozet etiket={o.fazla > 0 ? 'Fazla / peşin' : 'Gelecek sahneler'} deger={para(o.fazla > 0 ? o.fazla : o.gelecek)} ton={o.fazla > 0 ? 'uyari' : undefined} />
      </div>

      <Kart className="mt-4">
        <BolumBasligi baslik="Sahnelerdeki payı" />
        {liste.length ? (
          <Liste>
            {[...liste]
              .sort((x, y) => y.tarih.localeCompare(x.tarih))
              .map((x) => {
                const kalan = Math.max(0, x.tutar - (odenen.get(x.id) ?? 0))
                return (
                  <button key={x.id} type="button" onClick={() => git(`/sahneler/${x.id}`)} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-stone-50 dark:hover:bg-stone-800/60">
                    <TarihKutusu tarih={x.tarih} soluk={kalan <= 0.004} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium text-stone-900 dark:text-stone-100">{adBul(veri.mekanlar, x.sahne.mekanId) || 'Mekan silinmiş'}</div>
                      <div className="text-[13px] text-stone-500 tabular-nums">Pay {para(x.tutar)}</div>
                    </div>
                    <div className="shrink-0 text-right text-sm">
                      {kalan <= 0.004 ? (
                        <span className="font-medium text-emerald-600 dark:text-emerald-400">Gönderildi</span>
                      ) : x.tarih > b ? (
                        <span className="text-stone-500">Gelecek</span>
                      ) : (
                        <span className="font-semibold text-sky-700 tabular-nums dark:text-sky-400">kalan {para(kalan)}</span>
                      )}
                    </div>
                  </button>
                )
              })}
          </Liste>
        ) : (
          <Bos baslik="Henüz payı yok" />
        )}
      </Kart>
      <Kart className="mt-4">
        <BolumBasligi baslik="Gönderilenler" />
        {gonderimler.length ? (
          <Liste>
            {gonderimler.map((g) => (
              <ParaSatiri key={g.id} k={g} tur="gonderilen" veri={veri} onClick={() => ac({ tur: 'gonderim', kayit: g })} />
            ))}
          </Liste>
        ) : (
          <Bos baslik="Henüz gönderim yok" />
        )}
      </Kart>
    </div>
  )
}
