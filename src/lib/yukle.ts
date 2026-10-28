import { useEffect, useState } from 'react'

/*
 * Android Chrome "uygulamayı yükle" isteği. Tarayıcı uygun gördüğünde bir kez haber verir;
 * olayı saklayıp kullanıcı düğmeye bastığında gösteririz.
 */
interface YuklemeIstegi extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

let istek: YuklemeIstegi | null = null
const dinleyiciler = new Set<() => void>()
const haber = () => dinleyiciler.forEach((f) => f())

export function yuklemeyiDinle(): void {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    istek = e as YuklemeIstegi
    haber()
  })
  window.addEventListener('appinstalled', () => {
    istek = null
    haber()
  })
}

export function useYuklenebilir(): boolean {
  const [var_, setVar] = useState(!!istek)
  useEffect(() => {
    const f = () => setVar(!!istek)
    dinleyiciler.add(f)
    return () => void dinleyiciler.delete(f)
  }, [])
  return var_
}

export async function yukle(): Promise<boolean> {
  if (!istek) return false
  const i = istek
  await i.prompt()
  const { outcome } = await i.userChoice
  istek = null
  haber()
  return outcome === 'accepted'
}
