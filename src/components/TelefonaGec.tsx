import { Download, EllipsisVertical, ScanLine, SquarePlus } from 'lucide-react'
import { useMemo } from 'react'
import { renderSVG } from 'uqr'
import { bulutHazir } from '../lib/bulutAyar'
import { bugun } from '../lib/format'
import { dosyaIndir, yedekAl } from '../lib/veri'
import { YAYIN_ADRESI } from '../lib/yayin'
import { Dugme, Pencere, useBildirim } from './ui'

/* "Telefondan devam et": Android kamerasıyla okutulan karekod, uygulamayı aynı ekranda açar. */
export function TelefonaGec({ acik, kapat }: { acik: boolean; kapat: () => void }) {
  const bildir = useBildirim()
  const adres = useMemo(() => YAYIN_ADRESI + (location.hash && location.hash !== '#/' ? location.hash : ''), [acik]) // eslint-disable-line react-hooks/exhaustive-deps
  const kare = useMemo(() => renderSVG(adres, { ecc: 'M', border: 2 }), [adres])
  return (
    <Pencere acik={acik} kapat={kapat} baslik="Telefondan devam et">
      <div className="grid gap-5 pb-2 sm:grid-cols-[220px_1fr] sm:items-start">
        <div className="mx-auto w-[220px] rounded-2xl bg-white p-3 shadow-sm ring-1 ring-stone-200">
          {/* Karekod yalnız sabit yayın adresinden ve bu ekranın yolundan üretilir. */}
          <div className="aspect-square [&>svg]:h-full [&>svg]:w-full" role="img" aria-label={`Karekod: ${adres}`} dangerouslySetInnerHTML={{ __html: kare }} />
        </div>
        <ol className="grid gap-3 text-[15px]">
          <Adim no={1} simge={<ScanLine size={18} />}>
            Telefonda <b>Kamera</b>'yı açıp karekoda tutun, çıkan bağlantıya dokunun. Uygulama Chrome'da açılır.
          </Adim>
          <Adim no={2} simge={<EllipsisVertical size={18} />}>
            Sağ üstteki <b>⋮</b> menüsüne dokunun.
          </Adim>
          <Adim no={3} simge={<SquarePlus size={18} />}>
            <b>Uygulamayı yükle</b>'yi (ya da <b>Ana ekrana ekle</b>) seçin. Mikrofon simgesinden tam ekran açılır.
          </Adim>
        </ol>
      </div>
      <p className="mt-4 rounded-xl bg-stone-100 px-3 py-2 text-xs break-all text-stone-600 dark:bg-stone-800 dark:text-stone-300">{adres}</p>

      {!bulutHazir() && (
        <div className="mt-4 rounded-2xl bg-amber-50 p-4 text-sm text-amber-900 ring-1 ring-amber-200 dark:bg-amber-950/50 dark:text-amber-100 dark:ring-amber-900">
          <b>Kayıtlarınız telefona kendiliğinden gelmez.</b> Bulut açılana kadar her cihaz kendi kaydını tutar. Taşımak için yedeği indirip telefona gönderin (WhatsApp ya da kablo), telefonda Ayarlar → Yedekten geri yükle.
          <Dugme
            className="mt-3"
            onClick={async () => {
              const y = await yedekAl()
              dosyaIndir(`sahne-takip-telefona-${bugun()}.json`, JSON.stringify(y), 'application/json')
              bildir('Yedek indirildi; telefona gönderebilirsiniz')
            }}
          >
            <Download size={17} /> Yedeği indir
          </Dugme>
        </div>
      )}
    </Pencere>
  )
}

function Adim({ no, simge, children }: { no: number; simge: React.ReactNode; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-amber-500 text-sm font-semibold text-stone-950">{no}</span>
      <span className="pt-1 text-stone-700 dark:text-stone-200">
        <span className="mr-1 inline-block align-[-3px] text-stone-400">{simge}</span>
        {children}
      </span>
    </li>
  )
}
