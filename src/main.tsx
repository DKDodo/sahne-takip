import '@fontsource/sora/latin-400.css'
import '@fontsource/sora/latin-ext-400.css'
import '@fontsource/sora/latin-500.css'
import '@fontsource/sora/latin-ext-500.css'
import '@fontsource/sora/latin-600.css'
import '@fontsource/sora/latin-ext-600.css'
import '@fontsource/sora/latin-700.css'
import '@fontsource/sora/latin-ext-700.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import App from './App'
import './index.css'
import { kancalariKur } from './lib/esitleme'
import { temaBaslat } from './lib/tema'
import { yuklemeyiDinle } from './lib/yukle'

temaBaslat()

/* Android: "uygulamayı yükle" isteğini yakala (Ayarlar ve Pano'daki Yükle düğmesi için). */
yuklemeyiDinle()

/* Bulut eşitlemesi için her yerel yazmayı işaretleyen kancalar; ilk yazmadan önce kurulmalı. */
kancalariKur()

/* Tarayıcının verileri kendiliğinden silmemesi için kalıcı depolama iste. */
navigator.storage?.persist?.().catch(() => {})

registerSW({ immediate: true })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
