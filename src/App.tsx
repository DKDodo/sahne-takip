import { useEffect, useRef, useState } from 'react'
import { HashRouter, Route, Routes } from 'react-router-dom'
import { FormSaglayici, useAlanGorunur } from './components/formlar'
import { HataSiniri } from './components/HataSiniri'
import { Kabuk } from './components/Kabuk'
import { BildirimSaglayici, SoruKatmani } from './components/ui'
import { bulut, izinliMi, useOturum } from './lib/bulut'
import { bulutHazir } from './lib/bulutAyar'
import { esitlemeBaslat, esitlemeDurdur, esitlemeIste } from './lib/esitleme'
import { useTumu } from './lib/veri'
import Ayarlar from './pages/Ayarlar'
import Ekip, { KisiDetay } from './pages/Ekip'
import Giris, { Yetkisiz } from './pages/Giris'
import Kazanc from './pages/Kazanc'
import Mekanlar, { MekanDetay } from './pages/Mekanlar'
import Pano from './pages/Pano'
import Para from './pages/Para'
import Sahneler, { SahneDetay } from './pages/Sahneler'
import Silinenler from './pages/Silinenler'

/*
 * Bulut bağlantısı ayarlıysa önce giriş istenir; giriş yapan hesap izinli değilse uygulama açılmaz.
 * Oturum cihazda saklanır: bir kez girdikten sonra internet yokken de açılır.
 */
export default function App() {
  const { hazir, oturum } = useOturum()
  const [izin, setIzin] = useState<boolean | null>(null)
  const kullanici = oturum?.user.id
  useEffect(() => {
    if (!kullanici) {
      setIzin(null)
      esitlemeDurdur()
      return
    }
    let canli = true
    void izinliMi().then((v) => {
      if (!canli) return
      setIzin(v)
      const b = bulut()
      if (v !== false && b) void esitlemeBaslat(b, kullanici)
    })
    return () => {
      canli = false
    }
  }, [kullanici])

  if (bulutHazir()) {
    if (!hazir) return <div className="grid min-h-dvh place-items-center bg-stone-100 text-sm text-stone-500 dark:bg-stone-950">Yükleniyor…</div>
    if (!oturum) return <Giris />
    if (izin === false) return <Yetkisiz eposta={oturum.user.email} />
  }
  return <Uygulama />
}

function Uygulama() {
  const veri = useTumu()
  const ilkVeri = useRef(true)
  useAlanGorunur()
  /* Her veri değişikliğinden sonra bulut eşitlemesi */
  useEffect(() => {
    if (!veri) return
    if (ilkVeri.current) {
      ilkVeri.current = false
      return
    }
    esitlemeIste()
  }, [veri])
  return (
    <HashRouter>
      <BildirimSaglayici>
        <FormSaglayici veri={veri}>
          <Kabuk>
            <HataSiniri>
              {!veri ? (
                <div className="grid min-h-[50vh] place-items-center text-sm text-stone-500">Yükleniyor…</div>
              ) : (
                <Routes>
                  <Route path="/" element={<Pano veri={veri} />} />
                  <Route path="/sahneler" element={<Sahneler veri={veri} />} />
                  <Route path="/sahneler/:id" element={<SahneDetay veri={veri} />} />
                  <Route path="/kazanc" element={<Kazanc veri={veri} />} />
                  <Route path="/para" element={<Para veri={veri} />} />
                  <Route path="/mekanlar" element={<Mekanlar veri={veri} />} />
                  <Route path="/mekanlar/:id" element={<MekanDetay veri={veri} />} />
                  <Route path="/ekip" element={<Ekip veri={veri} />} />
                  <Route path="/ekip/:id" element={<KisiDetay veri={veri} />} />
                  <Route path="/silinenler" element={<Silinenler veri={veri} />} />
                  <Route path="/ayarlar" element={<Ayarlar veri={veri} />} />
                  <Route path="*" element={<Pano veri={veri} />} />
                </Routes>
              )}
            </HataSiniri>
          </Kabuk>
        </FormSaglayici>
        <SoruKatmani />
      </BildirimSaglayici>
    </HashRouter>
  )
}
