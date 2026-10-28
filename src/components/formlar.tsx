import { CalendarDays, MapPin, Plus, Sparkles, Trash2, User, Users } from 'lucide-react'
import { createContext, useContext, useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { db, ODEME_SEKILLERI, type Gonderim, type Kisi, type Mekan, type OdemeSekli, type Sahne, type Tahsilat } from '../db'
import { bugun, para, sayiMetni, sayiOku, simdi, tarihGoster, yeniId, yuvarla } from '../lib/format'
import { esitBol, kisiPaylari, sahneDurumlari } from '../lib/hesap'
import { adBul, sil as kayitSil, type TumVeri } from '../lib/veri'
import { cx, Dugme, Etiket, Girdi, MetinAlani, Pencere, SayiGirdi, SecimDugmesi, useBildirim, type SecimSecenegi } from './ui'

/* ---------- Formları her ekrandan açmak için ---------- */
export type FormIstegi =
  | { tur: 'sahne'; kayit?: Sahne; mekanId?: string }
  | { tur: 'tahsilat'; kayit?: Tahsilat; mekanId?: string; sahneId?: string }
  | { tur: 'gonderim'; kayit?: Gonderim; kisiId?: string; sahneId?: string }
  | { tur: 'mekan'; kayit?: Mekan }
  | { tur: 'kisi'; kayit?: Kisi }

const FormBaglami = createContext<(i: FormIstegi) => void>(() => {})
export const useFormAc = () => useContext(FormBaglami)

export function FormSaglayici({ veri, children }: { veri: TumVeri | undefined; children: ReactNode }) {
  const [istek, setIstek] = useState<FormIstegi | null>(null)
  const kapat = () => setIstek(null)
  return (
    <FormBaglami.Provider value={setIstek}>
      {children}
      {veri && istek?.tur === 'sahne' && <SahneFormu veri={veri} kapat={kapat} kayit={istek.kayit} mekanId={istek.mekanId} />}
      {veri && istek?.tur === 'tahsilat' && <TahsilatFormu veri={veri} kapat={kapat} kayit={istek.kayit} mekanId={istek.mekanId} sahneId={istek.sahneId} />}
      {veri && istek?.tur === 'gonderim' && <GonderimFormu veri={veri} kapat={kapat} kayit={istek.kayit} kisiId={istek.kisiId} sahneId={istek.sahneId} />}
      {istek?.tur === 'mekan' && <MekanFormu kapat={kapat} kayit={istek.kayit} />}
      {istek?.tur === 'kisi' && <KisiFormu kapat={kapat} kayit={istek.kayit} />}
    </FormBaglami.Provider>
  )
}

function FormPencere({ kapat, baslik, kaydet, children, hata, sil }: { kapat: () => void; baslik: string; kaydet: () => Promise<boolean | void>; children: ReactNode; hata?: string; sil?: () => Promise<void> }) {
  const [bekle, setBekle] = useState(false)
  const gonder = async (e?: FormEvent) => {
    e?.preventDefault()
    if (bekle) return
    setBekle(true)
    try {
      const sonuc = await kaydet()
      if (sonuc !== false) kapat()
    } finally {
      setBekle(false)
    }
  }
  return (
    <Pencere
      acik
      kapat={kapat}
      baslik={baslik}
      alt={
        <>
          {sil && (
            <Dugme
              tur="hayalet"
              aria-label="Sil"
              title="Sil"
              className="px-3 text-red-600"
              onClick={async () => {
                await sil()
                kapat()
              }}
            >
              <Trash2 size={18} />
            </Dugme>
          )}
          <Dugme className="flex-1" onClick={kapat}>
            Vazgeç
          </Dugme>
          <Dugme tur="ana" className="flex-[2]" onClick={() => gonder()} disabled={bekle}>
            Kaydet
          </Dugme>
        </>
      }
    >
      <form onSubmit={gonder} className="grid gap-4 pt-1 pb-2">
        {children}
        {hata && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">{hata}</p>}
        <button type="submit" hidden />
      </form>
    </Pencere>
  )
}

/* İki seçenekli düğme grubu */
export function IkiliSecim<T extends string>({ deger, sec, secenekler }: { deger: T; sec: (t: T) => void; secenekler: [T, string][] }) {
  return (
    <div className="grid grid-cols-2 gap-1 rounded-xl bg-stone-200/60 p-1 dark:bg-stone-800/70">
      {secenekler.map(([k, ad]) => (
        <button
          key={k}
          type="button"
          onClick={() => sec(k)}
          aria-pressed={deger === k}
          className={cx('h-10 rounded-lg text-sm font-medium transition', deger === k ? 'bg-white text-stone-900 shadow-sm dark:bg-stone-700 dark:text-white' : 'text-stone-600 dark:text-stone-400')}
        >
          {ad}
        </button>
      ))}
    </div>
  )
}

const YENI = '__yeni'
const normal = (s: string) => s.trim().replace(/\s+/g, ' ').toLocaleLowerCase('tr-TR')

/* Listede yoksa yazılan adla yeni mekan/kişi açar; aynı adda varsa onu kullanır. */
async function mekanBul(secim: string, yeniAd: string): Promise<string | null> {
  if (secim && secim !== YENI) return secim
  const ad = yeniAd.trim().replace(/\s+/g, ' ')
  if (!ad) return null
  const var_ = (await db.mekanlar.toArray()).find((m) => normal(m.ad) === normal(ad))
  if (var_) return var_.id
  const m: Mekan = { id: yeniId(), ad, olusturma: simdi() }
  await db.mekanlar.add(m)
  return m.id
}
async function kisiBul(secim: string, yeniAd: string): Promise<string | null> {
  if (secim && secim !== YENI) return secim
  const ad = yeniAd.trim().replace(/\s+/g, ' ')
  if (!ad) return null
  const var_ = (await db.kisiler.toArray()).find((k) => normal(k.ad) === normal(ad))
  if (var_) return var_.id
  const k: Kisi = { id: yeniId(), ad, olusturma: simdi() }
  await db.kisiler.add(k)
  return k.id
}

/* Etiketli alan; içinde düğme olduğu için <label> değil (etikete dokunmak listeyi açmasın). */
function Alan({ etiket, ipucu, children }: { etiket: string; ipucu?: string; children: ReactNode }) {
  return (
    <div className="min-w-0" role="group" aria-label={etiket}>
      <span className="mb-1.5 block text-[13px] font-medium text-stone-600 dark:text-stone-400">{etiket}</span>
      {children}
      {ipucu && <span className="mt-1 block text-xs text-stone-500">{ipucu}</span>}
    </div>
  )
}

const mekanSecenekleri = (veri: TumVeri): SecimSecenegi[] => [
  ...veri.mekanlar.map((m) => ({ deger: m.id, ad: m.ad, alt: m.notlar, simge: <MapPin size={18} /> })),
  { deger: YENI, ad: 'Yeni mekan', alt: 'Listede yoksa adını yazın', simge: <Plus size={18} /> },
]
const kisiSecenekleri = (veri: TumVeri): SecimSecenegi[] => [
  ...veri.kisiler.map((k) => ({ deger: k.id, ad: k.ad, alt: k.rol, simge: <User size={18} /> })),
  { deger: YENI, ad: 'Yeni kişi', alt: 'Listede yoksa adını yazın', simge: <Plus size={18} /> },
]

function MekanSecimi({ veri, deger, sec, yeniAd, setYeniAd }: { veri: TumVeri; deger: string; sec: (v: string) => void; yeniAd: string; setYeniAd: (v: string) => void }) {
  const yeni = deger === YENI || !veri.mekanlar.length
  return (
    <Alan etiket="Mekan">
      {veri.mekanlar.length > 0 && <SecimDugmesi deger={deger} sec={sec} secenekler={mekanSecenekleri(veri)} baslik="Mekan seçin" bos="Mekan seçin" aria-label="Mekan" />}
      {yeni && <Girdi className={veri.mekanlar.length ? 'mt-2' : ''} value={yeniAd} onChange={(e) => setYeniAd(e.target.value)} placeholder="Yeni mekanın adı" aria-label="Yeni mekanın adı" autoFocus={veri.mekanlar.length > 0} />}
    </Alan>
  )
}

function KisiSecimi({ veri, deger, sec, yeniAd, setYeniAd, etiket = 'Kişi' }: { veri: TumVeri; deger: string; sec: (v: string) => void; yeniAd: string; setYeniAd: (v: string) => void; etiket?: string }) {
  const yeni = deger === YENI || !veri.kisiler.length
  return (
    <Alan etiket={etiket}>
      {veri.kisiler.length > 0 && <SecimDugmesi deger={deger} sec={sec} secenekler={kisiSecenekleri(veri)} baslik="Kime?" bos="Kişi seçin" aria-label={etiket} />}
      {yeni && <Girdi className={veri.kisiler.length ? 'mt-2' : ''} value={yeniAd} onChange={(e) => setYeniAd(e.target.value)} placeholder="Adı" aria-label="Yeni kişinin adı" />}
    </Alan>
  )
}

/* ---------- Sahne ---------- */
interface PaySatiri {
  anahtar: string
  kisiId: string
  yeniAd: string
  tutar: string
}

function SahneFormu({ veri, kapat, kayit, mekanId }: { veri: TumVeri; kapat: () => void; kayit?: Sahne; mekanId?: string }) {
  const bildir = useBildirim()
  const [tarih, setTarih] = useState(kayit?.tarih ?? bugun())
  const [saat, setSaat] = useState(kayit?.saat ?? '')
  const [mekan, setMekan] = useState(kayit?.mekanId ?? mekanId ?? (veri.mekanlar.length ? '' : YENI))
  const [yeniMekan, setYeniMekan] = useState('')
  const [ucret, setUcret] = useState(sayiMetni(kayit?.ucret))
  const [paylar, setPaylar] = useState<PaySatiri[]>(() => (kayit?.paylar ?? []).map((p) => ({ anahtar: yeniId(), kisiId: p.kisiId, yeniAd: '', tutar: sayiMetni(p.tutar) })))
  const [alindi, setAlindi] = useState<'hayir' | 'evet'>('hayir')
  const [sekli, setSekli] = useState<OdemeSekli>('nakit')
  const [not, setNot] = useState(kayit?.not ?? '')
  const [hata, setHata] = useState('')

  const u = sayiOku(ucret)
  const payToplam = yuvarla(paylar.reduce((t, p) => t + (sayiOku(p.tutar) || 0), 0))
  const banaKalan = yuvarla((Number.isFinite(u) ? u : 0) - payToplam)
  const paySatiri = (i: number, d: Partial<PaySatiri>) => setPaylar((l) => l.map((p, j) => (j === i ? { ...p, ...d } : p)))

  return (
    <FormPencere
      kapat={kapat}
      baslik={kayit ? 'Sahneyi düzenle' : 'Yeni sahne'}
      hata={hata}
      kaydet={async () => {
        setHata('')
        if (!tarih) return setHata('Tarih seçin.'), false
        if (!Number.isFinite(u) || u < 0) return setHata('Ücreti doğru yazın.'), false
        if (!mekan && !yeniMekan.trim()) return setHata('Mekan seçin ya da yeni mekanın adını yazın.'), false
        for (const p of paylar) {
          const t = sayiOku(p.tutar)
          if (!Number.isFinite(t) || t < 0) return setHata('Pay tutarlarını doğru yazın.'), false
          if (t > 0 && (!p.kisiId || p.kisiId === YENI) && !p.yeniAd.trim()) return setHata('Payı olan her satırda kişiyi seçin ya da adını yazın.'), false
        }
        if (payToplam > u) return setHata(`Paylar (${para(payToplam)}) ücretten fazla.`), false
        let sahneId = ''
        await db.transaction('rw', db.mekanlar, db.kisiler, db.sahneler, db.tahsilatlar, async () => {
          const m = (await mekanBul(mekan, yeniMekan))!
          const ps: Sahne['paylar'] = []
          for (const p of paylar) {
            const t = yuvarla(sayiOku(p.tutar) || 0)
            if (t <= 0) continue
            ps.push({ kisiId: (await kisiBul(p.kisiId, p.yeniAd))!, tutar: t })
          }
          const s: Sahne = { id: kayit?.id ?? yeniId(), tarih, saat: saat || undefined, mekanId: m, ucret: yuvarla(u), paylar: ps, not: not.trim() || undefined, olusturma: kayit?.olusturma ?? simdi() }
          await db.sahneler.put(s)
          sahneId = s.id
          if (!kayit && alindi === 'evet' && s.ucret > 0)
            await db.tahsilatlar.add({ id: yeniId(), tarih, mekanId: m, sahneId: s.id, tutar: s.ucret, sekli, olusturma: simdi() })
        })
        bildir(kayit ? 'Sahne güncellendi' : alindi === 'evet' ? 'Sahne ve ödeme kaydedildi' : 'Sahne kaydedildi')
        return sahneId ? undefined : false
      }}
    >
      <div className="grid grid-cols-[1fr_auto] gap-3">
        <Etiket etiket="Tarih">
          <Girdi type="date" value={tarih} onChange={(e) => setTarih(e.target.value)} />
        </Etiket>
        <Etiket etiket="Saat">
          <Girdi type="time" value={saat} onChange={(e) => setSaat(e.target.value)} className="w-28" />
        </Etiket>
      </div>
      <MekanSecimi veri={veri} deger={mekan} sec={setMekan} yeniAd={yeniMekan} setYeniAd={setYeniMekan} />
      <Etiket etiket="Anlaşılan ücret (TL)">
        <SayiGirdi value={ucret} onChange={(e) => setUcret(e.target.value)} placeholder="Örn. 15.000" />
      </Etiket>

      <div className="rounded-2xl bg-white p-3 ring-1 ring-stone-200 dark:bg-stone-950 dark:ring-stone-800">
        <div className="mb-2 flex items-center justify-between gap-2">
          <span className="flex items-center gap-2 text-[13px] font-medium text-stone-600 dark:text-stone-400">
            <Users size={16} /> Ekip payları
          </span>
          {paylar.length > 0 && u > 0 && (
            <button
              type="button"
              className="rounded-lg px-2 py-1 text-[13px] font-semibold text-amber-700 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-950"
              onClick={() => {
                const her = esitBol(u, paylar.length)
                setPaylar((l) => l.map((p) => ({ ...p, tutar: sayiMetni(her) })))
              }}
            >
              Eşit böl (ben dahil)
            </button>
          )}
        </div>
        <div className="grid gap-3">
          {paylar.map((p, i) => (
            <div key={p.anahtar} className="grid grid-cols-[1fr_110px_auto] items-start gap-2">
              <div className="min-w-0">
                {veri.kisiler.length > 0 && <SecimDugmesi deger={p.kisiId} sec={(v) => paySatiri(i, { kisiId: v })} secenekler={kisiSecenekleri(veri)} baslik="Kimin payı?" bos="Kişi seçin" aria-label="Kişi" />}
                {(p.kisiId === YENI || !veri.kisiler.length) && (
                  <Girdi className={veri.kisiler.length ? 'mt-2' : ''} value={p.yeniAd} onChange={(e) => paySatiri(i, { yeniAd: e.target.value })} placeholder="Adı (örn. Davulcu Ali)" aria-label="Yeni kişinin adı" />
                )}
              </div>
              <SayiGirdi value={p.tutar} onChange={(e) => paySatiri(i, { tutar: e.target.value })} placeholder="Pay" aria-label="Pay tutarı" />
              <button type="button" aria-label="Satırı sil" onClick={() => setPaylar((l) => l.filter((_, j) => j !== i))} className="grid size-11 place-items-center rounded-xl text-stone-400 hover:bg-stone-100 hover:text-red-600 dark:hover:bg-stone-800">
                <Trash2 size={18} />
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setPaylar((l) => [...l, { anahtar: yeniId(), kisiId: veri.kisiler.length ? '' : YENI, yeniAd: '', tutar: '' }])}
          className="mt-2 flex h-10 w-full items-center justify-center gap-1.5 rounded-xl text-sm font-medium text-stone-600 ring-1 ring-stone-200 ring-dashed hover:bg-stone-50 dark:text-stone-300 dark:ring-stone-700 dark:hover:bg-stone-800"
        >
          <Plus size={16} /> Pay ekle
        </button>
        {u > 0 && (
          <div className="mt-3 flex items-center justify-between border-t border-stone-100 pt-3 text-sm dark:border-stone-800">
            <span className="text-stone-500">Bana kalan</span>
            <b className={cx('tabular-nums', banaKalan < 0 ? 'text-red-600' : 'text-emerald-700 dark:text-emerald-400')}>{para(banaKalan)}</b>
          </div>
        )}
      </div>

      {!kayit && (
        <div role="group" aria-label="Ücret alındı mı?">
          <span className="mb-1.5 block text-[13px] font-medium text-stone-600 dark:text-stone-400">Ücret alındı mı?</span>
          <IkiliSecim
            deger={alindi}
            sec={setAlindi}
            secenekler={[
              ['hayir', 'Henüz alınmadı'],
              ['evet', 'Tamamı alındı'],
            ]}
          />
        </div>
      )}
      {!kayit && alindi === 'evet' && (
        <IkiliSecim deger={sekli} sec={setSekli} secenekler={Object.entries(ODEME_SEKILLERI) as [OdemeSekli, string][]} />
      )}
      <Etiket etiket="Not">
        <MetinAlani value={not} onChange={(e) => setNot(e.target.value)} placeholder="İsteğe bağlı" />
      </Etiket>
    </FormPencere>
  )
}

/* ---------- Ödeme aldım ---------- */
function TahsilatFormu({ veri, kapat, kayit, mekanId, sahneId }: { veri: TumVeri; kapat: () => void; kayit?: Tahsilat; mekanId?: string; sahneId?: string }) {
  const bildir = useBildirim()
  const ilkSahne = veri.sahneler.find((s) => s.id === (kayit?.sahneId ?? sahneId))
  const [mekan, setMekan] = useState(kayit?.mekanId ?? ilkSahne?.mekanId ?? mekanId ?? (veri.mekanlar.length ? '' : YENI))
  const [yeniMekan, setYeniMekan] = useState('')
  const [sahne, setSahne] = useState(kayit?.sahneId ?? sahneId ?? '')
  const [tarih, setTarih] = useState(kayit?.tarih ?? bugun())
  const durumlar = sahneDurumlari(veri.sahneler, veri.tahsilatlar)
  const [tutar, setTutar] = useState(() => sayiMetni(kayit?.tutar ?? (ilkSahne ? durumlar.get(ilkSahne.id)?.kalan : undefined)))
  const [sekli, setSekli] = useState<OdemeSekli>(kayit?.sekli ?? 'nakit')
  const [not, setNot] = useState(kayit?.not ?? '')
  const [hata, setHata] = useState('')
  const mekanSahneleri = veri.sahneler.filter((s) => s.mekanId === mekan && (s.id === sahne || (durumlar.get(s.id)?.kalan ?? 0) > 0))

  return (
    <FormPencere
      kapat={kapat}
      baslik={kayit ? 'Ödemeyi düzenle' : 'Ödeme aldım'}
      hata={hata}
      sil={kayit && (async () => bildir('Ödeme silindi', await kayitSil('tahsilatlar', kayit.id)))}
      kaydet={async () => {
        setHata('')
        const t = sayiOku(tutar)
        if (!Number.isFinite(t) || t <= 0) return setHata('Tutarı yazın.'), false
        if (!mekan && !yeniMekan.trim()) return setHata('Mekanı seçin.'), false
        if (!tarih) return setHata('Tarih seçin.'), false
        await db.transaction('rw', db.mekanlar, db.tahsilatlar, async () => {
          const m = (await mekanBul(mekan, yeniMekan))!
          const s = sahne && veri.sahneler.find((x) => x.id === sahne && x.mekanId === m) ? sahne : undefined
          await db.tahsilatlar.put({ id: kayit?.id ?? yeniId(), tarih, mekanId: m, sahneId: s, tutar: yuvarla(t), sekli, not: not.trim() || undefined, olusturma: kayit?.olusturma ?? simdi() })
        })
        bildir(kayit ? 'Ödeme güncellendi' : 'Ödeme kaydedildi')
      }}
    >
      <MekanSecimi
        veri={veri}
        deger={mekan}
        sec={(v) => {
          setMekan(v)
          setSahne('')
        }}
        yeniAd={yeniMekan}
        setYeniAd={setYeniMekan}
      />
      {mekan && mekan !== YENI && (
        <Alan etiket="Hangi sahne için?" ipucu={sahne ? undefined : 'Seçmezseniz en eski ödenmemiş sahneye sayılır.'}>
          <SecimDugmesi
            deger={sahne}
            sec={(v) => {
              setSahne(v)
              const k = durumlar.get(v)?.kalan
              if (k && !kayit) setTutar(sayiMetni(k))
            }}
            baslik="Hangi sahne için?"
            aria-label="Hangi sahne için"
            secenekler={[
              { deger: '', ad: 'Otomatik', alt: 'En eski ödenmemiş sahneye sayılır', simge: <Sparkles size={18} /> },
              ...mekanSahneleri.map((s) => ({ deger: s.id, ad: tarihGoster(s.tarih), alt: `kalan ${para(durumlar.get(s.id)?.kalan ?? 0)}`, simge: <CalendarDays size={18} /> })),
            ]}
          />
        </Alan>
      )}
      <div className="grid grid-cols-2 gap-3">
        <Etiket etiket="Tutar (TL)">
          <SayiGirdi value={tutar} onChange={(e) => setTutar(e.target.value)} placeholder="0" />
        </Etiket>
        <Etiket etiket="Tarih">
          <Girdi type="date" value={tarih} onChange={(e) => setTarih(e.target.value)} />
        </Etiket>
      </div>
      <IkiliSecim deger={sekli} sec={setSekli} secenekler={Object.entries(ODEME_SEKILLERI) as [OdemeSekli, string][]} />
      <Etiket etiket="Not">
        <MetinAlani value={not} onChange={(e) => setNot(e.target.value)} placeholder="İsteğe bağlı" />
      </Etiket>
    </FormPencere>
  )
}

/* ---------- Para gönderdim ---------- */
function GonderimFormu({ veri, kapat, kayit, kisiId, sahneId }: { veri: TumVeri; kapat: () => void; kayit?: Gonderim; kisiId?: string; sahneId?: string }) {
  const bildir = useBildirim()
  const [kisi, setKisi] = useState(kayit?.kisiId ?? kisiId ?? (veri.kisiler.length ? '' : YENI))
  const [yeniKisi, setYeniKisi] = useState('')
  const [sahne, setSahne] = useState(kayit?.sahneId ?? sahneId ?? '')
  const [tarih, setTarih] = useState(kayit?.tarih ?? bugun())
  const paylarBilgisi = kisi && kisi !== YENI ? kisiPaylari(kisi, veri.sahneler, veri.gonderimler.filter((g) => g.id !== kayit?.id)) : null
  const kalanPay = (id: string) => {
    const b = paylarBilgisi?.liste.find((x) => x.id === id)
    return b ? yuvarla(b.tutar - (paylarBilgisi!.odenen.get(id) ?? 0)) : 0
  }
  const [tutar, setTutar] = useState(() => sayiMetni(kayit?.tutar ?? (sahneId ? kalanPay(sahneId) : undefined)))
  const [sekli, setSekli] = useState<OdemeSekli>(kayit?.sekli ?? 'havale')
  const [not, setNot] = useState(kayit?.not ?? '')
  const [hata, setHata] = useState('')
  const sahneler = (paylarBilgisi?.liste ?? []).filter((b) => b.id === sahne || kalanPay(b.id) > 0)

  return (
    <FormPencere
      kapat={kapat}
      baslik={kayit ? 'Gönderimi düzenle' : 'Para gönderdim'}
      hata={hata}
      sil={kayit && (async () => bildir('Gönderim silindi', await kayitSil('gonderimler', kayit.id)))}
      kaydet={async () => {
        setHata('')
        const t = sayiOku(tutar)
        if (!Number.isFinite(t) || t <= 0) return setHata('Tutarı yazın.'), false
        if (!kisi && !yeniKisi.trim()) return setHata('Kime gönderdiğinizi seçin.'), false
        if (!tarih) return setHata('Tarih seçin.'), false
        await db.transaction('rw', db.kisiler, db.gonderimler, async () => {
          const k = (await kisiBul(kisi, yeniKisi))!
          await db.gonderimler.put({ id: kayit?.id ?? yeniId(), tarih, kisiId: k, sahneId: sahne || undefined, tutar: yuvarla(t), sekli, not: not.trim() || undefined, olusturma: kayit?.olusturma ?? simdi() })
        })
        bildir(kayit ? 'Gönderim güncellendi' : 'Gönderim kaydedildi')
      }}
    >
      <KisiSecimi
        veri={veri}
        etiket="Kime"
        deger={kisi}
        sec={(v) => {
          setKisi(v)
          setSahne('')
        }}
        yeniAd={yeniKisi}
        setYeniAd={setYeniKisi}
      />
      {sahneler.length > 0 && (
        <Alan etiket="Hangi sahnenin payı?" ipucu={sahne ? undefined : 'Seçmezseniz en eski payına sayılır.'}>
          <SecimDugmesi
            deger={sahne}
            sec={(v) => {
              setSahne(v)
              const k = kalanPay(v)
              if (k > 0 && !kayit) setTutar(sayiMetni(k))
            }}
            baslik="Hangi sahnenin payı?"
            aria-label="Hangi sahnenin payı"
            secenekler={[
              { deger: '', ad: 'Otomatik', alt: 'En eski payına sayılır', simge: <Sparkles size={18} /> },
              ...sahneler.map((b) => ({ deger: b.id, ad: `${tarihGoster(b.tarih)} · ${adBul(veri.mekanlar, b.sahne.mekanId)}`, alt: `kalan ${para(kalanPay(b.id))}`, simge: <CalendarDays size={18} /> })),
            ]}
          />
        </Alan>
      )}
      <div className="grid grid-cols-2 gap-3">
        <Etiket etiket="Tutar (TL)">
          <SayiGirdi value={tutar} onChange={(e) => setTutar(e.target.value)} placeholder="0" />
        </Etiket>
        <Etiket etiket="Tarih">
          <Girdi type="date" value={tarih} onChange={(e) => setTarih(e.target.value)} />
        </Etiket>
      </div>
      <IkiliSecim deger={sekli} sec={setSekli} secenekler={Object.entries(ODEME_SEKILLERI) as [OdemeSekli, string][]} />
      <Etiket etiket="Not">
        <MetinAlani value={not} onChange={(e) => setNot(e.target.value)} placeholder="İsteğe bağlı" />
      </Etiket>
    </FormPencere>
  )
}

/* ---------- Mekan ve kişi ---------- */
function MekanFormu({ kapat, kayit }: { kapat: () => void; kayit?: Mekan }) {
  const bildir = useBildirim()
  const [ad, setAd] = useState(kayit?.ad ?? '')
  const [telefon, setTelefon] = useState(kayit?.telefon ?? '')
  const [notlar, setNotlar] = useState(kayit?.notlar ?? '')
  const [hata, setHata] = useState('')
  return (
    <FormPencere
      kapat={kapat}
      baslik={kayit ? 'Mekanı düzenle' : 'Yeni mekan'}
      hata={hata}
      kaydet={async () => {
        if (!ad.trim()) return setHata('Mekanın adını yazın.'), false
        const ayni = (await db.mekanlar.toArray()).find((m) => m.id !== kayit?.id && normal(m.ad) === normal(ad))
        if (ayni) return setHata('Bu adda bir mekan zaten var.'), false
        await db.mekanlar.put({ id: kayit?.id ?? yeniId(), ad: ad.trim().replace(/\s+/g, ' '), telefon: telefon.trim() || undefined, notlar: notlar.trim() || undefined, olusturma: kayit?.olusturma ?? simdi() })
        bildir(kayit ? 'Mekan güncellendi' : 'Mekan eklendi')
      }}
    >
      <Etiket etiket="Mekanın adı">
        <Girdi value={ad} onChange={(e) => setAd(e.target.value)} placeholder="Örn. Mavi Bar" autoFocus />
      </Etiket>
      <Etiket etiket="Telefon">
        <Girdi value={telefon} onChange={(e) => setTelefon(e.target.value)} inputMode="tel" placeholder="05xx xxx xx xx" />
      </Etiket>
      <Etiket etiket="Not">
        <MetinAlani value={notlar} onChange={(e) => setNotlar(e.target.value)} placeholder="Yetkili, adres…" />
      </Etiket>
    </FormPencere>
  )
}

export const ROLLER = ['Vokal', 'Gitar', 'Bas', 'Davul', 'Klavye', 'Ses', 'Menajer']

function KisiFormu({ kapat, kayit }: { kapat: () => void; kayit?: Kisi }) {
  const bildir = useBildirim()
  const [ad, setAd] = useState(kayit?.ad ?? '')
  const [rol, setRol] = useState(kayit?.rol ?? '')
  const [telefon, setTelefon] = useState(kayit?.telefon ?? '')
  const [hata, setHata] = useState('')
  return (
    <FormPencere
      kapat={kapat}
      baslik={kayit ? 'Kişiyi düzenle' : 'Yeni kişi'}
      hata={hata}
      kaydet={async () => {
        if (!ad.trim()) return setHata('Adını yazın.'), false
        const ayni = (await db.kisiler.toArray()).find((k) => k.id !== kayit?.id && normal(k.ad) === normal(ad))
        if (ayni) return setHata('Bu adda biri zaten var.'), false
        await db.kisiler.put({ id: kayit?.id ?? yeniId(), ad: ad.trim().replace(/\s+/g, ' '), rol: rol.trim() || undefined, telefon: telefon.trim() || undefined, olusturma: kayit?.olusturma ?? simdi() })
        bildir(kayit ? 'Kişi güncellendi' : 'Kişi eklendi')
      }}
    >
      <Etiket etiket="Adı">
        <Girdi value={ad} onChange={(e) => setAd(e.target.value)} placeholder="Örn. Ali" autoFocus />
      </Etiket>
      <Etiket etiket="Görevi">
        <Girdi value={rol} onChange={(e) => setRol(e.target.value)} placeholder="Örn. Davul" list="roller" />
        <datalist id="roller">
          {ROLLER.map((r) => (
            <option key={r} value={r} />
          ))}
        </datalist>
      </Etiket>
      <Etiket etiket="Telefon">
        <Girdi value={telefon} onChange={(e) => setTelefon(e.target.value)} inputMode="tel" placeholder="05xx xxx xx xx" />
      </Etiket>
    </FormPencere>
  )
}

/* Formların ilk açılışta odak / kaydırma düzeni için küçük yardımcı: telefon klavyesi açıkken alanı görünür tut. */
export function useAlanGorunur(): void {
  useEffect(() => {
    const f = (e: FocusEvent) => {
      const t = e.target as HTMLElement
      if (t?.matches?.('input, select, textarea')) setTimeout(() => t.scrollIntoView({ block: 'center', behavior: 'smooth' }), 250)
    }
    document.addEventListener('focusin', f)
    return () => document.removeEventListener('focusin', f)
  }, [])
}
