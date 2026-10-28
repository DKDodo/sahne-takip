/* Uygulamanın internetteki adresi (GitHub Pages). Telefon buradan açar. */
export const YAYIN_ADRESI = 'https://dkdodo.github.io/sahne-takip/'

/* Android telefon mu? */
export function androidMi(): boolean {
  return typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent)
}

/* Ana ekrana yüklenmiş uygulama olarak mı açıldı? */
export function uygulamaOlarakAcik(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia?.('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true
}
