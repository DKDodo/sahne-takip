import { ArrowDownLeft, ArrowUpRight, FileSpreadsheet, Wallet } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { useFormAc } from '../components/formlar'
import type { Gonderim, Tahsilat } from '../db'
import { ParaSatiri } from '../components/parcalar'
import { Baslik, Bos, Dugme, Kart, Liste, Sekmeler } from '../components/ui'
import { para, tarihGoster } from '../lib/format'
import { ayAdi, toplam } from '../lib/hesap'
import { adBul, csvIndir, type TumVeri } from '../lib/veri'

export default function Para({ veri }: { veri: TumVeri }) {
  const ac = useFormAc()
  const [ara, setAra] = useSearchParams()
  const tur = ara.get('t') === 'gonderilen' ? 'gonderilen' : 'alinan'
  const liste: (Tahsilat | Gonderim)[] = tur === 'alinan' ? veri.tahsilatlar : veri.gonderimler
  const gruplar: { ay: string; kayitlar: (Tahsilat | Gonderim)[] }[] = []
  for (const k of liste) {
    const ay = k.tarih.slice(0, 7)
    const g = gruplar.at(-1)
    if (g?.ay === ay) g.kayitlar.push(k)
    else gruplar.push({ ay, kayitlar: [k] })
  }
  return (
    <div className="max-w-3xl">
      <Baslik
        baslik="Alınan / Gönderilen"
        alt="Mekanlardan gelen ve gönderdiğim bütün paralar"
        sag={
          <>
            <Dugme tur="ana" onClick={() => ac({ tur: tur === 'alinan' ? 'tahsilat' : 'gonderim' })}>
              {tur === 'alinan' ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />} {tur === 'alinan' ? 'Ödeme aldım' : 'Para gönderdim'}
            </Dugme>
            <Dugme
              onClick={() =>
                tur === 'alinan'
                  ? csvIndir('sahne-takip-alinanlar.csv', ['Tarih', 'Mekan', 'Tutar', 'Şekli', 'Not'], veri.tahsilatlar.map((t) => [tarihGoster(t.tarih), adBul(veri.mekanlar, t.mekanId), t.tutar, t.sekli === 'havale' ? 'Havale' : 'Nakit', t.not ?? '']))
                  : csvIndir('sahne-takip-gonderilenler.csv', ['Tarih', 'Kime', 'Tutar', 'Şekli', 'Not'], veri.gonderimler.map((g) => [tarihGoster(g.tarih), adBul(veri.kisiler, g.kisiId), g.tutar, g.sekli === 'havale' ? 'Havale' : 'Nakit', g.not ?? '']))
              }
            >
              <FileSpreadsheet size={17} /> Excel
            </Dugme>
          </>
        }
      />
      <Sekmeler
        secili={tur}
        sec={(t) => setAra(t === 'alinan' ? {} : { t }, { replace: true })}
        secenekler={[
          ['alinan', 'Alınan', veri.tahsilatlar.length],
          ['gonderilen', 'Gönderilen', veri.gonderimler.length],
        ]}
      />
      {!liste.length ? (
        <Kart>
          <Bos simge={<Wallet size={40} />} baslik={tur === 'alinan' ? 'Henüz ödeme alınmadı' : 'Henüz para gönderilmedi'} />
        </Kart>
      ) : (
        <div className="grid gap-4">
          {gruplar.map((g) => (
            <Kart key={g.ay}>
              <div className="flex items-baseline justify-between px-4 pt-3 pb-1">
                <h2 className="font-semibold text-stone-900 dark:text-white">{ayAdi(g.ay)}</h2>
                <span className="text-sm text-stone-500 tabular-nums">{para(toplam(g.kayitlar, (k) => k.tutar))}</span>
              </div>
              <Liste>
                {g.kayitlar.map((k) => (
                  <ParaSatiri key={k.id} k={k} tur={tur} veri={veri} onClick={() => ac(tur === 'alinan' ? { tur: 'tahsilat', kayit: k as Tahsilat } : { tur: 'gonderim', kayit: k as Gonderim })} />
                ))}
              </Liste>
            </Kart>
          ))}
        </div>
      )}
    </div>
  )
}
