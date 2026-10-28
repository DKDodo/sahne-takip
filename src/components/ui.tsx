import { AlertTriangle, Check, ChevronDown, Info, Trash2, X } from 'lucide-react'
import {
  createContext,
  useId,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react'
import { createPortal } from 'react-dom'

export function cx(...s: (string | false | null | undefined)[]): string {
  return s.filter(Boolean).join(' ')
}

type Tur = 'ana' | 'ikincil' | 'hayalet' | 'tehlike'

export function Dugme({
  tur = 'ikincil',
  kucuk,
  className,
  ...p
}: ButtonHTMLAttributes<HTMLButtonElement> & { tur?: Tur; kucuk?: boolean }) {
  return (
    <button
      type="button"
      {...p}
      className={cx(
        'inline-flex items-center justify-center gap-2 rounded-xl font-medium transition active:scale-[.98] disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500',
        kucuk ? 'h-10 px-3 text-sm md:h-9' : 'h-11 px-4 text-[15px]',
        tur === 'ana' && 'bg-amber-500 text-stone-950 hover:bg-amber-400 shadow-sm',
        tur === 'ikincil' &&
          'bg-white text-stone-800 ring-1 ring-stone-200 hover:bg-stone-50 dark:bg-stone-800 dark:text-stone-100 dark:ring-stone-700 dark:hover:bg-stone-700',
        tur === 'hayalet' && 'text-stone-600 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800',
        tur === 'tehlike' && 'bg-red-600 text-white hover:bg-red-500',
        className,
      )}
    />
  )
}

export function Kart({ children, className, ...p }: { children: ReactNode; className?: string } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...p}
      className={cx(
        'rounded-2xl bg-white ring-1 ring-stone-200/80 shadow-[0_1px_2px_rgba(0,0,0,.04)] dark:bg-stone-900 dark:ring-stone-800',
        className,
      )}
    >
      {children}
    </div>
  )
}

export function Baslik({ baslik, alt, sag }: { baslik: string; alt?: ReactNode; sag?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight text-stone-900 dark:text-stone-50 md:text-[28px]">{baslik}</h1>
        {alt && <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">{alt}</p>}
      </div>
      {sag && <div className="flex flex-wrap gap-2">{sag}</div>}
    </div>
  )
}

const alanSinifi =
  'w-full h-11 rounded-xl bg-white px-3 text-[16px] text-stone-900 ring-1 ring-stone-200 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500 dark:bg-stone-950 dark:text-stone-100 dark:ring-stone-700'

export function Etiket({ etiket, children, ipucu, className }: { etiket: string; children: ReactNode; ipucu?: string; className?: string }) {
  return (
    <label className={cx('block min-w-0', className)}>
      <span className="mb-1.5 block text-[13px] font-medium text-stone-600 dark:text-stone-400">{etiket}</span>
      {children}
      {ipucu && <span className="mt-1 block text-xs text-stone-500">{ipucu}</span>}
    </label>
  )
}

export function Girdi({ className, ...p }: React.ComponentProps<'input'>) {
  return <input {...p} className={cx(alanSinifi, className)} />
}

export function SayiGirdi({ className, ...p }: React.ComponentProps<'input'>) {
  return <input inputMode="decimal" autoComplete="off" {...p} className={cx(alanSinifi, 'tabular-nums', className)} />
}

export function Secim({ className, children, ...p }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...p} className={cx(alanSinifi, 'appearance-none bg-[length:16px] bg-[right_12px_center] bg-no-repeat pr-9 secim-ok', className)}>
      {children}
    </select>
  )
}

export function MetinAlani({ className, ...p }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea rows={2} {...p} className={cx(alanSinifi, 'h-auto py-2.5', className)} />
}

export function Bos({ simge, baslik, aciklama, eylem }: { simge?: ReactNode; baslik: string; aciklama?: string; eylem?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
      {simge && <div className="mb-3 text-stone-300 dark:text-stone-600">{simge}</div>}
      <p className="font-medium text-stone-700 dark:text-stone-200">{baslik}</p>
      {aciklama && <p className="mt-1 max-w-sm text-sm text-stone-500">{aciklama}</p>}
      {eylem && <div className="mt-4">{eylem}</div>}
    </div>
  )
}

export function Ozet({
  etiket,
  deger,
  alt,
  ton,
  simge,
}: {
  etiket: string
  deger: string
  alt?: ReactNode
  ton?: 'iyi' | 'kotu' | 'uyari'
  simge?: ReactNode
}) {
  return (
    <Kart className="p-4">
      <div className="flex items-center gap-2 text-[13px] font-medium text-stone-500 dark:text-stone-400">
        {simge}
        {etiket}
      </div>
      <div
        className={cx(
          'mt-1.5 text-[clamp(16px,4.8vw,22px)] leading-tight font-semibold tracking-tight whitespace-nowrap tabular-nums',
          ton === 'iyi' && 'text-emerald-600 dark:text-emerald-400',
          ton === 'kotu' && 'text-red-600 dark:text-red-400',
          ton === 'uyari' && 'text-amber-600 dark:text-amber-400',
          !ton && 'text-stone-900 dark:text-stone-50',
        )}
      >
        {deger}
      </div>
      {alt && <div className="mt-0.5 text-xs text-stone-500">{alt}</div>}
    </Kart>
  )
}

export function Rozet({ children, ton = 'gri' }: { children: ReactNode; ton?: 'gri' | 'yesil' | 'kirmizi' | 'sari' | 'mavi' }) {
  return (
    <span
      className={cx(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap',
        ton === 'gri' && 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300',
        ton === 'yesil' && 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
        ton === 'kirmizi' && 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300',
        ton === 'sari' && 'bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
        ton === 'mavi' && 'bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300',
      )}
    >
      {children}
    </span>
  )
}

/* Açık pencerelerin sırası: Esc yalnız en üsttekini kapatır. */
const acikPencereler: string[] = []

/* Telefonda alttan açılan, bilgisayarda ortada duran pencere. Sayfanın en üstüne çizilir (iç içe açılabilir). */
export function Pencere({
  acik,
  kapat,
  baslik,
  children,
  alt,
  ust = false,
}: {
  acik: boolean
  kapat: () => void
  baslik: string
  children: ReactNode
  alt?: ReactNode
  /* Başlık satırı gösterilmesin (soru pencereleri kendi başlığını çizer) */
  ust?: boolean
}) {
  const kimlik = useId()
  useEffect(() => {
    if (!acik) return
    acikPencereler.push(kimlik)
    const tus = (e: KeyboardEvent) => e.key === 'Escape' && acikPencereler.at(-1) === kimlik && kapat()
    window.addEventListener('keydown', tus)
    const eski = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', tus)
      document.body.style.overflow = eski
      const i = acikPencereler.lastIndexOf(kimlik)
      if (i >= 0) acikPencereler.splice(i, 1)
    }
  }, [acik, kapat, kimlik])
  if (!acik) return null
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center" role="dialog" aria-modal="true" aria-label={baslik}>
      <div className="absolute inset-0 bg-stone-950/45 backdrop-blur-[2px]" onClick={kapat} />
      <div className="relative flex max-h-[92dvh] w-full flex-col rounded-t-3xl bg-stone-50 shadow-2xl ring-1 ring-black/5 dark:bg-stone-900 dark:ring-white/10 md:max-w-lg md:rounded-3xl">
        <div className="mx-auto mt-2 h-1.5 w-10 shrink-0 rounded-full bg-stone-300 md:hidden dark:bg-stone-700" aria-hidden="true" />
        {!ust && (
          <div className="flex items-center justify-between px-5 pt-4 pb-2">
            <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-50">{baslik}</h2>
            <button type="button" onClick={kapat} className="grid size-9 place-items-center rounded-full text-stone-500 hover:bg-stone-200 dark:hover:bg-stone-800" aria-label="Kapat">
              <X size={20} />
            </button>
          </div>
        )}
        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-4">{children}</div>
        {alt && <div className="flex gap-2 border-t border-stone-200 px-5 pt-3 pb-[max(12px,env(safe-area-inset-bottom))] dark:border-stone-800">{alt}</div>}
      </div>
    </div>,
    document.body,
  )
}

/* ---------- Uygulamanın kendi soru pencereleri (telefonun gri onay/uyarı kutuları yerine) ---------- */
type SoruTuru = 'onay' | 'uyari' | 'yazi'
interface SoruSecenekleri {
  baslik: string
  mesaj?: string
  /* Onay düğmesinin yazısı */
  evet?: string
  hayir?: string
  /* Silme gibi geri dönüşü zor işler: kırmızı düğme */
  tehlike?: boolean
  /* yazi: kutunun üstündeki ipucu */
  ipucu?: string
}
interface Soru extends SoruSecenekleri {
  tur: SoruTuru
  coz: (v: boolean | string | null) => void
}
let soruGoster: ((s: Soru) => void) | null = null

export function onayla(o: SoruSecenekleri): Promise<boolean> {
  return new Promise((coz) => (soruGoster ? soruGoster({ ...o, tur: 'onay', coz: (v) => coz(v === true) }) : coz(window.confirm(o.mesaj ?? o.baslik))))
}
export function uyar(o: SoruSecenekleri): Promise<void> {
  return new Promise((coz) => {
    if (soruGoster) soruGoster({ ...o, tur: 'uyari', coz: () => coz() })
    else {
      window.alert(o.mesaj ?? o.baslik)
      coz()
    }
  })
}
export function yaziIste(o: SoruSecenekleri): Promise<string | null> {
  return new Promise((coz) => (soruGoster ? soruGoster({ ...o, tur: 'yazi', coz: (v) => coz(typeof v === 'string' ? v : null) }) : coz(window.prompt(o.mesaj ?? o.baslik))))
}

/* Uygulamada bir kez çizilir; onayla / uyar / yaziIste buradan açılır. */
export function SoruKatmani() {
  const [soru, setSoru] = useState<Soru | null>(null)
  const [yazi, setYazi] = useState('')
  const simdiki = useRef<Soru | null>(null)
  useEffect(() => {
    soruGoster = (s) => {
      const onceki = simdiki.current
      if (onceki) onceki.coz(onceki.tur === 'onay' ? false : null)
      simdiki.current = s
      setSoru(s)
      setYazi('')
    }
    return () => {
      soruGoster = null
    }
  }, [])
  const bitir = useCallback((v: boolean | string | null) => {
    const s = simdiki.current
    simdiki.current = null
    setSoru(null)
    s?.coz(v)
  }, [])
  const vazgec = useCallback(() => bitir(simdiki.current?.tur === 'onay' ? false : null), [bitir])
  if (!soru) return null
  const simge = soru.tehlike ? (
    <span className="grid size-12 place-items-center rounded-2xl bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400">
      <Trash2 size={24} />
    </span>
  ) : (
    <span className="grid size-12 place-items-center rounded-2xl bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400">
      {soru.tur === 'uyari' ? <AlertTriangle size={24} /> : <Info size={24} />}
    </span>
  )
  return (
    <Pencere
      acik
      ust
      kapat={vazgec}
      baslik={soru.baslik}
      alt={
        soru.tur === 'uyari' ? (
          <Dugme tur="ana" className="flex-1" onClick={() => bitir(true)}>
            {soru.evet ?? 'Tamam'}
          </Dugme>
        ) : (
          <>
            <Dugme className="flex-1" onClick={vazgec}>
              {soru.hayir ?? 'Vazgeç'}
            </Dugme>
            <Dugme tur={soru.tehlike ? 'tehlike' : 'ana'} className="flex-1" onClick={() => bitir(soru.tur === 'yazi' ? yazi : true)}>
              {soru.evet ?? 'Tamam'}
            </Dugme>
          </>
        )
      }
    >
      <div className="pt-3 pb-1">
        {simge}
        <h2 className="mt-3 text-lg font-semibold text-stone-900 dark:text-white">{soru.baslik}</h2>
        {soru.mesaj && <p className="mt-1 text-[15px] text-stone-600 dark:text-stone-400">{soru.mesaj}</p>}
        {soru.tur === 'yazi' && (
          <form
            className="mt-4"
            onSubmit={(e) => {
              e.preventDefault()
              bitir(yazi)
            }}
          >
            {soru.ipucu && <span className="mb-1.5 block text-[13px] font-medium text-stone-600 dark:text-stone-400">{soru.ipucu}</span>}
            <Girdi value={yazi} onChange={(e) => setYazi(e.target.value)} autoFocus autoCapitalize="characters" aria-label={soru.ipucu ?? soru.baslik} />
          </form>
        )}
      </div>
    </Pencere>
  )
}

/* ---------- Temaya uygun seçim listesi (telefonun açılır listesi yerine) ---------- */
export interface SecimSecenegi {
  deger: string
  ad: string
  alt?: string
  simge?: ReactNode
}
export function SecimDugmesi({
  deger,
  sec,
  secenekler,
  baslik,
  bos = 'Seçin',
  className,
  'aria-label': etiket,
}: {
  deger: string
  sec: (v: string) => void
  secenekler: SecimSecenegi[]
  baslik: string
  bos?: string
  className?: string
  'aria-label'?: string
}) {
  const [acik, setAcik] = useState(false)
  const kapat = useCallback(() => setAcik(false), [])
  const secili = secenekler.find((x) => x.deger === deger)
  return (
    <>
      <button
        type="button"
        onClick={() => setAcik(true)}
        aria-haspopup="dialog"
        aria-label={etiket ? `${etiket}: ${secili?.ad ?? bos}` : undefined}
        className={cx(alanSinifi, 'flex items-center gap-2 text-left', className)}
      >
        <span className={cx('min-w-0 flex-1 truncate', !secili && 'text-stone-400')}>{secili?.ad ?? bos}</span>
        <ChevronDown size={18} className="shrink-0 text-stone-400" />
      </button>
      <Pencere acik={acik} kapat={kapat} baslik={baslik}>
        <div className="grid gap-1 pb-2" role="listbox" aria-label={baslik}>
          {secenekler.map((x) => {
            const s = x.deger === deger
            return (
              <button
                key={x.deger}
                type="button"
                role="option"
                aria-selected={s}
                onClick={() => {
                  sec(x.deger)
                  setAcik(false)
                }}
                className={cx(
                  'flex min-h-12 w-full items-center gap-3 rounded-2xl px-3 py-2 text-left transition active:scale-[.99]',
                  s ? 'bg-amber-50 text-amber-900 ring-1 ring-amber-200 dark:bg-amber-950/50 dark:text-amber-100 dark:ring-amber-900' : 'text-stone-800 hover:bg-stone-100 dark:text-stone-100 dark:hover:bg-stone-800',
                )}
              >
                {x.simge && (
                  <span className={cx('grid size-9 shrink-0 place-items-center rounded-xl', s ? 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300' : 'bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400')}>{x.simge}</span>
                )}
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{x.ad}</span>
                  {x.alt && <span className="block truncate text-[13px] text-stone-500">{x.alt}</span>}
                </span>
                {s && <Check size={20} className="shrink-0 text-amber-600 dark:text-amber-400" />}
              </button>
            )
          })}
        </div>
      </Pencere>
    </>
  )
}

/* Bildirim ve "Geri al" */
interface Bildirim {
  id: number
  mesaj: string
  geriAl?: () => void | Promise<void>
}
const BildirimBaglami = createContext<(mesaj: string, geriAl?: () => void | Promise<void>) => void>(() => {})

export function BildirimSaglayici({ children }: { children: ReactNode }) {
  const [liste, setListe] = useState<Bildirim[]>([])
  const sayac = useRef(0)
  const goster = useCallback((mesaj: string, geriAl?: () => void | Promise<void>) => {
    const id = ++sayac.current
    setListe((l) => [...l.slice(-2), { id, mesaj, geriAl }])
    setTimeout(() => setListe((l) => l.filter((b) => b.id !== id)), geriAl ? 7000 : 3500)
  }, [])
  return (
    <BildirimBaglami.Provider value={goster}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-[calc(84px+env(safe-area-inset-bottom))] z-[60] flex flex-col items-center gap-2 px-4 md:bottom-6">
        {liste.map((b) => (
          <div key={b.id} role="status" className={cx('flex items-center gap-3 rounded-2xl bg-stone-900 px-4 py-3 text-sm text-white shadow-xl dark:bg-stone-100 dark:text-stone-900', b.geriAl ? 'pointer-events-auto' : 'pointer-events-none')}>
            <span>{b.mesaj}</span>
            {b.geriAl && (
              <button
                type="button"
                className="font-semibold text-amber-400 dark:text-amber-700"
                onClick={async () => {
                  await b.geriAl?.()
                  setListe((l) => l.filter((x) => x.id !== b.id))
                }}
              >
                Geri al
              </button>
            )}
          </div>
        ))}
      </div>
    </BildirimBaglami.Provider>
  )
}

export function useBildirim() {
  return useContext(BildirimBaglami)
}

export function Sekmeler<T extends string>({ secili, sec, secenekler }: { secili: T; sec: (t: T) => void; secenekler: [T, string, number?][] }) {
  return (
    <div className="mb-4 flex gap-1 overflow-x-auto rounded-xl bg-stone-200/60 p-1 dark:bg-stone-800/70" role="tablist">
      {secenekler.map(([k, ad, n]) => (
        <button
          key={k}
          type="button"
          role="tab"
          aria-selected={secili === k}
          onClick={() => sec(k)}
          className={cx(
            'flex h-9 shrink-0 items-center gap-1.5 rounded-lg px-3 text-sm font-medium whitespace-nowrap transition',
            secili === k ? 'bg-white text-stone-900 shadow-sm dark:bg-stone-700 dark:text-white' : 'text-stone-600 hover:text-stone-900 dark:text-stone-400',
          )}
        >
          {ad}
          {n !== undefined && <span className="text-xs text-stone-400 tabular-nums">{n}</span>}
        </button>
      ))}
    </div>
  )
}

export function Satir({ sol, sag, alt, onClick, className }: { sol: ReactNode; sag?: ReactNode; alt?: ReactNode; onClick?: () => void; className?: string }) {
  const Ic = (
    <>
      <div className="min-w-0 flex-1">
        <div className="truncate font-medium text-stone-900 dark:text-stone-100">{sol}</div>
        {alt && <div className="mt-0.5 truncate text-[13px] text-stone-500">{alt}</div>}
      </div>
      {sag && <div className="shrink-0 text-right tabular-nums">{sag}</div>}
    </>
  )
  if (onClick)
    return (
      <button type="button" onClick={onClick} className={cx('flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-stone-50 dark:hover:bg-stone-800/60', className)}>
        {Ic}
      </button>
    )
  return <div className={cx('flex items-center gap-3 px-4 py-3', className)}>{Ic}</div>
}

export function Liste({ children }: { children: ReactNode }) {
  return <div className="divide-y divide-stone-100 dark:divide-stone-800">{children}</div>
}
