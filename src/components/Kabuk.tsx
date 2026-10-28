import {
  ArrowDownLeft,
  ArrowLeft,
  ArrowLeftRight,
  ArrowUpRight,
  ChartColumn,
  Download,
  LayoutDashboard,
  Lightbulb,
  LightbulbOff,
  MapPin,
  Menu,
  Mic,
  Plus,
  Settings,
  Smartphone,
  Trash2,
  Users,
  X,
} from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { bulutHazir } from '../lib/bulutAyar'
import { useEsitleme } from '../lib/esitleme'
import { useTema } from '../lib/tema'
import { useYuklenebilir, yukle } from '../lib/yukle'
import { uygulamaOlarakAcik } from '../lib/yayin'
import { useFormAc } from './formlar'
import { TelefonaGec } from './TelefonaGec'
import { cx, Pencere } from './ui'

export const MENU = [
  { yol: '/', ad: 'Pano', simge: LayoutDashboard },
  { yol: '/sahneler', ad: 'Sahneler', simge: Mic },
  { yol: '/kazanc', ad: 'Kazanç', simge: ChartColumn },
  { yol: '/para', ad: 'Alınan / Gönderilen', simge: ArrowLeftRight },
  { yol: '/mekanlar', ad: 'Mekanlar', simge: MapPin },
  { yol: '/ekip', ad: 'Ekip', simge: Users },
  { yol: '/silinenler', ad: 'Silinenler', simge: Trash2 },
  { yol: '/ayarlar', ad: 'Ayarlar ve Yedek', simge: Settings },
]

function aktifMi(yol: string, konum: string) {
  return yol === '/' ? konum === '/' : konum === yol || konum.startsWith(yol + '/')
}

export function Kabuk({ children }: { children: ReactNode }) {
  const konum = useLocation().pathname
  const [menuAcik, setMenuAcik] = useState(false)
  const [ekleAcik, setEkleAcik] = useState(false)
  const [telefon, setTelefon] = useState(false)
  useEffect(() => {
    setMenuAcik(false)
    window.scrollTo(0, 0)
  }, [konum])

  return (
    <div className="min-h-dvh bg-stone-100 text-stone-800 dark:bg-stone-950 dark:text-stone-200">
      {/* Bilgisayar: sol menü */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-stone-200 bg-white px-3 py-5 dark:border-stone-800 dark:bg-stone-900 md:flex print:hidden">
        <Logo />
        <nav className="mt-6 flex flex-1 flex-col gap-0.5 overflow-y-auto">
          <button
            type="button"
            onClick={() => setEkleAcik(true)}
            className="mb-3 flex h-11 items-center justify-center gap-2 rounded-xl bg-amber-500 font-semibold text-stone-950 shadow-sm hover:bg-amber-400"
          >
            <Plus size={20} strokeWidth={2.5} /> Ekle
          </button>
          {MENU.map((m) => (
            <NavLink
              key={m.yol}
              to={m.yol}
              end={m.yol === '/'}
              className={({ isActive }) =>
                cx(
                  'flex h-10 items-center gap-3 rounded-xl px-3 text-[14.5px] font-medium transition',
                  isActive
                    ? 'bg-stone-100 text-stone-950 dark:bg-stone-800 dark:text-white'
                    : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900 dark:text-stone-400 dark:hover:bg-stone-800/60',
                )
              }
            >
              <m.simge size={18} />
              {m.ad}
            </NavLink>
          ))}
        </nav>
        <button
          type="button"
          onClick={() => setTelefon(true)}
          className="mb-2 flex h-10 items-center gap-3 rounded-xl px-3 text-[14.5px] font-medium text-stone-600 ring-1 ring-stone-200 hover:bg-stone-50 hover:text-stone-900 dark:text-stone-300 dark:ring-stone-700 dark:hover:bg-stone-800/60"
        >
          <Smartphone size={18} /> Telefondan devam et
        </button>
        <BulutDurumu />
      </aside>

      {/* Telefon: üst çubuk */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-stone-200/70 bg-stone-100/85 px-4 pt-[env(safe-area-inset-top)] backdrop-blur-xl dark:border-stone-800 dark:bg-stone-950/85 md:hidden print:hidden">
        <div className="flex h-[60px] min-w-0 items-center">
          <Logo kucuk />
        </div>
        <div className="flex items-center gap-2">
          <GeriDugmesi kucuk />
          <TemaDugmesi />
        </div>
      </header>

      {/* Bilgisayar: solda geri, sağda tema düğmesi */}
      <div className="sticky top-0 z-20 hidden items-center justify-between bg-stone-100/80 px-8 py-3 backdrop-blur-md md:ml-64 md:flex dark:bg-stone-950/80 print:hidden">
        <GeriDugmesi />
        <TemaDugmesi />
      </div>

      <main className="mx-auto max-w-5xl px-4 pt-5 pb-[calc(110px+env(safe-area-inset-bottom))] md:ml-64 md:px-8 md:pt-0 md:pb-12 print:m-0 print:p-0">
        <YukleIpucu />
        {children}
      </main>

      {/* Telefon: alt sekme çubuğu */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-stone-200 bg-white/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl dark:border-stone-800 dark:bg-stone-900/90 md:hidden print:hidden">
        <div className="grid h-16 grid-cols-5">
          <AltSekme yol="/" ad="Pano" aktif={aktifMi('/', konum)} />
          <AltSekme yol="/sahneler" ad="Sahneler" aktif={aktifMi('/sahneler', konum)} />
          <div className="grid place-items-center">
            <button
              type="button"
              onClick={() => setEkleAcik(true)}
              aria-label="Ekle"
              className="grid size-14 -translate-y-3 place-items-center rounded-2xl bg-amber-500 text-stone-950 shadow-lg shadow-amber-500/30 active:scale-95"
            >
              <Plus size={28} strokeWidth={2.5} />
            </button>
          </div>
          <AltSekme yol="/kazanc" ad="Kazanç" aktif={aktifMi('/kazanc', konum)} />
          <button type="button" onClick={() => setMenuAcik(true)} className="flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium text-stone-500">
            <Menu size={22} />
            Menü
          </button>
        </div>
      </nav>

      {menuAcik && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label="Menü">
          <div className="absolute inset-0 bg-stone-950/40" onClick={() => setMenuAcik(false)} />
          <div className="absolute inset-x-0 bottom-0 rounded-t-3xl bg-white px-4 pt-4 pb-[max(16px,env(safe-area-inset-bottom))] dark:bg-stone-900">
            <div className="mb-3 flex items-center justify-between px-1">
              <span className="text-lg font-semibold">Menü</span>
              <button type="button" onClick={() => setMenuAcik(false)} className="grid size-9 place-items-center rounded-full hover:bg-stone-100 dark:hover:bg-stone-800" aria-label="Kapat">
                <X size={20} />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {MENU.map((m) => (
                <NavLink
                  key={m.yol}
                  to={m.yol}
                  end={m.yol === '/'}
                  className={({ isActive }) =>
                    cx(
                      'flex flex-col items-center gap-1.5 rounded-2xl px-2 py-3 text-center text-[12.5px] font-medium',
                      isActive ? 'bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-300' : 'bg-stone-50 text-stone-700 dark:bg-stone-800 dark:text-stone-200',
                    )
                  }
                >
                  <m.simge size={22} />
                  {m.ad}
                </NavLink>
              ))}
            </div>
          </div>
        </div>
      )}
      <HizliEkle acik={ekleAcik} kapat={() => setEkleAcik(false)} />
      <TelefonaGec acik={telefon} kapat={() => setTelefon(false)} />
    </div>
  )
}

/* Alttaki "+": en sık üç iş */
function HizliEkle({ acik, kapat }: { acik: boolean; kapat: () => void }) {
  const ac = useFormAc()
  const sec = (f: () => void) => {
    kapat()
    f()
  }
  const Secenek = ({ simge, baslik, alt, onClick, ton }: { simge: ReactNode; baslik: string; alt: string; onClick: () => void; ton: string }) => (
    <button type="button" onClick={onClick} className="flex w-full items-center gap-4 rounded-2xl bg-white p-4 text-left ring-1 ring-stone-200 active:scale-[.99] dark:bg-stone-800 dark:ring-stone-700">
      <span className={cx('grid size-12 shrink-0 place-items-center rounded-xl', ton)}>{simge}</span>
      <span className="min-w-0">
        <span className="block font-semibold text-stone-900 dark:text-white">{baslik}</span>
        <span className="block text-sm text-stone-500">{alt}</span>
      </span>
    </button>
  )
  return (
    <Pencere acik={acik} kapat={kapat} baslik="Ne eklemek istersiniz?">
      <div className="grid gap-2.5 pb-3">
        <Secenek simge={<Mic size={24} />} ton="bg-amber-500 text-stone-950" baslik="Yeni sahne" alt="Tarih, mekan, ücret ve ekip payları" onClick={() => sec(() => ac({ tur: 'sahne' }))} />
        <Secenek simge={<ArrowDownLeft size={24} />} ton="bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" baslik="Ödeme aldım" alt="Mekandan gelen para" onClick={() => sec(() => ac({ tur: 'tahsilat' }))} />
        <Secenek simge={<ArrowUpRight size={24} />} ton="bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300" baslik="Para gönderdim" alt="Ekipten birine ya da başkasına" onClick={() => sec(() => ac({ tur: 'gonderim' }))} />
      </div>
    </Pencere>
  )
}

function AltSekme({ yol, ad, aktif }: { yol: string; ad: string; aktif: boolean }) {
  const m = MENU.find((x) => x.yol === yol)!
  return (
    <NavLink to={yol} end={yol === '/'} className={cx('flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium', aktif ? 'text-amber-600 dark:text-amber-400' : 'text-stone-500')}>
      <m.simge size={22} />
      {ad}
    </NavLink>
  )
}

function Logo({ kucuk }: { kucuk?: boolean }) {
  if (kucuk)
    return (
      <div className="flex items-center gap-2.5">
        <MikrofonLogo className="size-9" />
        <div className="text-[17px] font-semibold tracking-tight text-stone-900 dark:text-white">Sahne Takip</div>
      </div>
    )
  return (
    <div className="flex items-center gap-2.5 px-2">
      <MikrofonLogo className="size-10" />
      <div className="leading-tight">
        <div className="font-semibold tracking-tight text-stone-900 dark:text-white">Sahne Takip</div>
        <div className="text-xs text-stone-500">Sahne · Ödeme · Pay</div>
      </div>
    </div>
  )
}

/* Bir önceki ekrana döner; uygulama yeni açıldıysa Pano'ya gider. Pano'da görünmez. */
function GeriDugmesi({ kucuk }: { kucuk?: boolean }) {
  const { pathname, key } = useLocation()
  const git = useNavigate()
  if (pathname === '/') return <span aria-hidden="true" />
  const geri = () => (key === 'default' ? git('/') : git(-1))
  if (kucuk)
    return (
      <button
        type="button"
        onClick={geri}
        aria-label="Geri"
        className="grid size-10 place-items-center rounded-full bg-white text-stone-700 ring-1 ring-stone-200 active:scale-95 dark:bg-stone-800 dark:text-stone-200 dark:ring-stone-700"
      >
        <ArrowLeft size={20} />
      </button>
    )
  return (
    <button
      type="button"
      onClick={geri}
      className="flex h-10 items-center gap-2 rounded-full bg-white pr-4 pl-3 text-sm font-medium text-stone-700 ring-1 ring-stone-200 hover:bg-stone-50 active:scale-[.98] dark:bg-stone-800 dark:text-stone-200 dark:ring-stone-700 dark:hover:bg-stone-700"
    >
      <ArrowLeft size={18} /> Geri
    </button>
  )
}

function TemaDugmesi() {
  const [tema, degistir] = useTema()
  const koyu = tema === 'koyu'
  return (
    <button
      type="button"
      onClick={() => degistir(koyu ? 'acik' : 'koyu')}
      aria-label={koyu ? 'Açık temaya geç' : 'Koyu temaya geç'}
      title={koyu ? 'Açık tema' : 'Koyu tema'}
      className={cx(
        'grid size-10 place-items-center rounded-full ring-1 transition active:scale-95',
        koyu
          ? 'bg-stone-800 text-stone-400 ring-stone-700 hover:text-stone-200'
          : 'bg-amber-50 text-amber-600 shadow-[0_0_18px_rgba(245,158,11,.35)] ring-amber-200 hover:bg-amber-100',
      )}
    >
      {koyu ? <LightbulbOff size={20} /> : <Lightbulb size={20} />}
    </button>
  )
}

export function MikrofonLogo({ className }: { className?: string }) {
  return <img src={`${import.meta.env.BASE_URL}favicon.svg`} alt="" aria-hidden="true" className={cx('shrink-0 rounded-[22%] shadow-sm', className)} draggable={false} />
}

/* Sol menünün altında: verilerin nerede olduğu ve eşitleme durumu. */
function BulutDurumu() {
  const e = useEsitleme()
  const git = useNavigate()
  if (!bulutHazir() || e.hal === 'kapali') return <p className="px-3 text-xs text-stone-400">Veriler bu cihazda saklanır. Yedek: Ayarlar.</p>
  const renk = e.hal === 'esit' ? 'bg-emerald-500' : e.hal === 'esitleniyor' ? 'bg-sky-500 animate-pulse' : e.hal === 'cevrimdisi' ? 'bg-amber-500' : 'bg-red-500'
  const yazi = e.hal === 'esit' ? 'Bulutla eşit' : e.hal === 'esitleniyor' ? 'Eşitleniyor…' : e.hal === 'cevrimdisi' ? 'Çevrimdışı' : 'Eşitleme sorunu'
  return (
    <button type="button" onClick={() => git('/ayarlar')} className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-left text-xs text-stone-500 hover:bg-stone-50 dark:hover:bg-stone-800/60">
      <span className={cx('size-2 shrink-0 rounded-full', renk)} />
      <span>
        {yazi}
        {e.bekleyen > 0 && ` · ${e.bekleyen} bekliyor`}
      </span>
    </button>
  )
}

/* Android Chrome uygulamayı yüklemeyi önerdiğinde: tek dokunuşla ana ekrana ekle. */
function YukleIpucu() {
  const yuklenebilir = useYuklenebilir()
  const [gizli, setGizli] = useState(() => {
    try {
      return localStorage.getItem('sahne-yukle-ipucu') === 'kapali'
    } catch {
      return false
    }
  })
  if (gizli || !yuklenebilir || uygulamaOlarakAcik()) return null
  return (
    <div className="mb-4 flex items-center gap-3 rounded-2xl bg-amber-50 p-3 text-sm text-amber-900 ring-1 ring-amber-200 dark:bg-amber-950/50 dark:text-amber-100 dark:ring-amber-900 print:hidden">
      <MikrofonLogo className="size-10" />
      <div className="min-w-0 flex-1">
        <b>Uygulama olarak yükleyin.</b> Ana ekranda simgesi olur, tam ekran açılır.
      </div>
      <button type="button" onClick={() => void yukle()} className="flex h-10 shrink-0 items-center gap-1.5 rounded-xl bg-amber-500 px-3 font-semibold text-stone-950">
        <Download size={17} /> Yükle
      </button>
      <button
        type="button"
        aria-label="Kapat"
        className="grid size-9 shrink-0 place-items-center rounded-full text-amber-700 hover:bg-amber-100 dark:text-amber-300 dark:hover:bg-amber-900"
        onClick={() => {
          try {
            localStorage.setItem('sahne-yukle-ipucu', 'kapali')
          } catch {
            /* yoksay */
          }
          setGizli(true)
        }}
      >
        <X size={18} />
      </button>
    </div>
  )
}
