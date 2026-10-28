import { Cloud, Download, FileSpreadsheet, KeyRound, LogOut, Moon, RefreshCw, Smartphone, Sun, Trash2, Upload } from 'lucide-react'
import { useRef, useState, type ReactNode } from 'react'
import { TelefonaGec } from '../components/TelefonaGec'
import { Baslik, Dugme, Etiket, Girdi, Kart, useBildirim } from '../components/ui'
import { cikis, sifreBelirle, useOturum } from '../lib/bulut'
import { bulutHazir } from '../lib/bulutAyar'
import { buluttanYenidenIndir, esitle, useEsitleme, type EsitlemeHali } from '../lib/esitleme'
import { bugun, tarihGoster } from '../lib/format'
import { benimPayim, paylarToplami, sahneDurumlari } from '../lib/hesap'
import { useTema } from '../lib/tema'
import { uygulamaOlarakAcik } from '../lib/yayin'
import { useYuklenebilir, yukle } from '../lib/yukle'
import { adBul, csvIndir, dosyaIndir, hepsiniSil, yedekAl, yedektenYukle, type TumVeri } from '../lib/veri'

const SON_YEDEK = 'sahne-son-yedek'
function sonYedek(): string | null {
  try {
    return localStorage.getItem(SON_YEDEK)
  } catch {
    return null
  }
}

export default function Ayarlar({ veri }: { veri: TumVeri }) {
  const bildir = useBildirim()
  const dosya = useRef<HTMLInputElement>(null)
  const [tema, temaDegistir] = useTema()
  const [bekle, setBekle] = useState(false)
  const [telefon, setTelefon] = useState(false)
  const [, yenile] = useState(0)
  const yuklenebilir = useYuklenebilir()
  const { oturum } = useOturum()
  const bulutAcik = bulutHazir() && !!oturum
  const kayitSayisi = veri.mekanlar.length + veri.kisiler.length + veri.sahneler.length + veri.tahsilatlar.length + veri.gonderimler.length
  const son = sonYedek()

  return (
    <div className="max-w-3xl">
      <Baslik baslik="Ayarlar ve Yedek" alt={`Bu cihazda ${kayitSayisi} kayıt var.`} />
      <div className="grid gap-4">
        <Bolum
          simge={<Download size={20} />}
          baslik="Yedek"
          aciklama={bulutAcik ? 'Kayıtlarınız bulutta da duruyor. Yine de ayda bir yedek indirip e-postanızda saklamak iyi olur.' : 'Bulut açılana kadar kayıtlar yalnız bu cihazda. Haftada bir yedek indirip e-postanıza ya da bilgisayara gönderin.'}
        >
          <p className="mb-3 text-sm text-stone-500">
            Son yedek: {son ? new Date(son).toLocaleString('tr-TR') : <b className="text-red-600 dark:text-red-400">hiç alınmadı</b>}
          </p>
          <div className="flex flex-wrap gap-2">
            <Dugme
              tur="ana"
              onClick={async () => {
                const y = await yedekAl()
                dosyaIndir(`sahne-takip-yedek-${bugun()}.json`, JSON.stringify(y, null, 1), 'application/json')
                try {
                  localStorage.setItem(SON_YEDEK, new Date().toISOString())
                } catch {
                  /* yoksay */
                }
                yenile((x) => x + 1)
                bildir('Yedek indirildi')
              }}
            >
              <Download size={17} /> Yedek indir
            </Dugme>
            <Dugme onClick={() => dosya.current?.click()} disabled={bekle}>
              <Upload size={17} /> Yedekten geri yükle
            </Dugme>
            <Dugme
              onClick={() => {
                const d = sahneDurumlari(veri.sahneler, veri.tahsilatlar)
                csvIndir(
                  `sahne-takip-sahneler-${bugun()}.csv`,
                  ['Tarih', 'Saat', 'Mekan', 'Ücret', 'Ekip payları', 'Bana kalan', 'Alınan', 'Kalan', 'Not'],
                  [...veri.sahneler].reverse().map((s) => [tarihGoster(s.tarih), s.saat ?? '', adBul(veri.mekanlar, s.mekanId), s.ucret, paylarToplami(s), benimPayim(s), d.get(s.id)?.alinan ?? 0, d.get(s.id)?.kalan ?? 0, s.not ?? '']),
                )
              }}
            >
              <FileSpreadsheet size={17} /> Tüm sahneler (Excel)
            </Dugme>
            <input
              ref={dosya}
              type="file"
              accept="application/json,.json"
              hidden
              onChange={async (e) => {
                const f = e.target.files?.[0]
                e.target.value = ''
                if (!f) return
                if (!confirm('Bu cihazdaki tüm kayıtlar silinip yedekteki kayıtlarla değiştirilecek. Devam edilsin mi?')) return
                setBekle(true)
                try {
                  const n = await yedektenYukle(JSON.parse(await f.text()))
                  bildir(`Yedek yüklendi: ${n} kayıt`)
                } catch (err) {
                  alert(err instanceof Error ? err.message : 'Dosya okunamadı.')
                } finally {
                  setBekle(false)
                }
              }}
            />
          </div>
        </Bolum>

        <Bolum simge={tema === 'koyu' ? <Moon size={20} /> : <Sun size={20} />} baslik="Görünüm" aciklama="Sağ üstteki lamba düğmesiyle de değiştirebilirsiniz.">
          <div className="flex gap-2">
            <Dugme tur={tema === 'acik' ? 'ana' : 'ikincil'} onClick={() => temaDegistir('acik')}>
              <Sun size={17} /> Açık tema
            </Dugme>
            <Dugme tur={tema === 'koyu' ? 'ana' : 'ikincil'} onClick={() => temaDegistir('koyu')}>
              <Moon size={17} /> Koyu tema
            </Dugme>
          </div>
        </Bolum>

        <Bolum
          simge={<Smartphone size={20} />}
          baslik="Telefona uygulama olarak yükle"
          aciklama={uygulamaOlarakAcik() ? 'Uygulama olarak açıksınız.' : "Android'de Chrome ile açıp ⋮ menüsünden Uygulamayı yükle'yi seçin. Bilgisayardaysanız karekodu telefonla okutun."}
        >
          <div className="flex flex-wrap gap-2">
            {yuklenebilir && !uygulamaOlarakAcik() && (
              <Dugme tur="ana" onClick={() => void yukle()}>
                <Download size={17} /> Uygulamayı yükle
              </Dugme>
            )}
            <Dugme onClick={() => setTelefon(true)}>
              <Smartphone size={17} /> Telefondan devam et (karekod)
            </Dugme>
          </div>
          <TelefonaGec acik={telefon} kapat={() => setTelefon(false)} />
        </Bolum>

        <BulutBolumu />

        {!bulutAcik && (
          <Bolum simge={<Trash2 size={20} />} baslik="Tüm verileri sil" aciklama="Bu cihazdaki bütün kayıtları siler. Silmeden önce yedek kendiliğinden indirilir.">
            <Dugme
              tur="tehlike"
              disabled={!kayitSayisi}
              onClick={async () => {
                if (!confirm('Bu cihazdaki TÜM kayıtlar silinecek. Emin misiniz?')) return
                const yazilan = prompt('Onaylamak için SİL yazın')
                if (yazilan === null) return
                if (!['sil', 'sıl'].includes(yazilan.trim().toLocaleLowerCase('tr-TR'))) {
                  alert('Silme iptal edildi: onay için SİL yazılmadı. Hiçbir kayıt silinmedi.')
                  return
                }
                const y = await yedekAl()
                dosyaIndir(`sahne-takip-silmeden-once-${bugun()}.json`, JSON.stringify(y), 'application/json')
                await hepsiniSil()
                bildir('Tüm veriler silindi; silmeden önceki yedek indirildi')
              }}
            >
              <Trash2 size={17} /> Tüm verileri sil
            </Dugme>
          </Bolum>
        )}
      </div>
      <p className="mt-8 text-center text-xs text-stone-400">Sahne Takip · sürüm {__SURUM__}</p>
    </div>
  )
}

const HAL_YAZISI: Record<EsitlemeHali, string> = {
  kapali: 'Bağlı değil',
  esitleniyor: 'Eşitleniyor…',
  esit: 'Eşit, her şey bulutta',
  cevrimdisi: 'İnternet yok; değişiklikler cihazda bekliyor, bağlanınca gönderilecek',
  hata: 'Eşitleme hatası',
  yetkisiz: 'Bu hesabın bulut izni yok',
}

function BulutBolumu() {
  const bildir = useBildirim()
  const { oturum } = useOturum()
  const e = useEsitleme()
  const [sifre, setSifre] = useState('')
  const [sifreAcik, setSifreAcik] = useState(false)
  if (!bulutHazir())
    return (
      <Bolum simge={<Cloud size={20} />} baslik="Bulut" aciklama="Telefon ve bilgisayarın aynı kayıtları görmesi ve telefon kaybolsa bile kayıtların kalması için bulut bağlantısı kuruluyor.">
        <p className="text-sm font-medium text-amber-700 dark:text-amber-400">Hazırlanıyor</p>
      </Bolum>
    )
  const iyi = e.hal === 'esit'
  const kotu = e.hal === 'hata' || e.hal === 'yetkisiz'
  return (
    <Bolum simge={<Cloud size={20} />} baslik="Bulut" aciklama="Kayıtlar her cihazda tam kopya olarak durur, internet yokken de çalışır; bağlanınca bulutla eşitlenir. Bulutta hiçbir kayıt kalıcı silinmez.">
      <div className={'mb-4 rounded-xl px-3 py-2.5 text-sm ' + (kotu ? 'bg-red-50 text-red-800 dark:bg-red-950 dark:text-red-200' : iyi ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200' : 'bg-amber-50 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200')}>
        <b>{HAL_YAZISI[e.hal]}</b>
        {e.bekleyen > 0 && <> · {e.bekleyen} değişiklik gönderilmeyi bekliyor</>}
        {e.son && <div className="mt-0.5 text-xs opacity-80">Son eşitleme: {new Date(e.son).toLocaleString('tr-TR')}</div>}
        {e.hata && kotu && <div className="mt-0.5 text-xs break-words opacity-80">{e.hata}</div>}
        {oturum?.user.email && <div className="mt-0.5 text-xs opacity-80">Hesap: {oturum.user.email}</div>}
      </div>
      <div className="flex flex-wrap gap-2">
        <Dugme onClick={() => void esitle()} disabled={e.hal === 'esitleniyor'}>
          <RefreshCw size={17} /> Şimdi eşitle
        </Dugme>
        <Dugme onClick={() => setSifreAcik((x) => !x)}>
          <KeyRound size={17} /> Şifreyi değiştir
        </Dugme>
        <Dugme
          onClick={async () => {
            if (!confirm('Bu cihazdaki kopya silinip buluttan baştan indirilecek. Buluttaki kayıtlara dokunulmaz. Devam edilsin mi?')) return
            try {
              await buluttanYenidenIndir()
              bildir('Buluttan yeniden indirildi')
            } catch (err) {
              alert(err instanceof Error ? err.message : String(err))
            }
          }}
        >
          <Download size={17} /> Buluttan yeniden indir
        </Dugme>
        <Dugme
          tur="hayalet"
          onClick={async () => {
            if (e.bekleyen > 0 && !confirm('Gönderilmemiş değişiklikler var. Çıkış yapsanız da cihazda kalırlar ve yeniden girince gönderilirler. Çıkılsın mı?')) return
            await cikis()
          }}
        >
          <LogOut size={17} /> Çıkış yap
        </Dugme>
      </div>
      {sifreAcik && (
        <form
          className="mt-4 flex flex-wrap items-end gap-2"
          onSubmit={async (ev) => {
            ev.preventDefault()
            try {
              await sifreBelirle(sifre)
              setSifre('')
              setSifreAcik(false)
              bildir('Yeni şifre kaydedildi; bundan sonra bu şifreyle girin')
            } catch (err) {
              alert(err instanceof Error ? err.message : String(err))
            }
          }}
        >
          <Etiket etiket="Yeni şifre (en az 10 karakter)" className="min-w-[240px] flex-1">
            <Girdi type="password" autoComplete="new-password" value={sifre} onChange={(ev) => setSifre(ev.target.value)} />
          </Etiket>
          <Dugme tur="ana" type="submit">
            Kaydet
          </Dugme>
        </form>
      )}
    </Bolum>
  )
}

function Bolum({ simge, baslik, aciklama, children }: { simge: ReactNode; baslik: string; aciklama: string; children: ReactNode }) {
  return (
    <Kart className="p-5">
      <div className="flex gap-4">
        <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300">{simge}</div>
        <div className="min-w-0 flex-1">
          <h2 className="font-semibold text-stone-900 dark:text-white">{baslik}</h2>
          <p className="mt-1 mb-4 text-sm text-stone-500">{aciklama}</p>
          {children}
        </div>
      </div>
    </Kart>
  )
}
