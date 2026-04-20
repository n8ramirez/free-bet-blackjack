import { useCallback, useEffect, useRef, useState } from 'react'

export function useCountUp(target: number, duration = 700, delay = 0): [number, (value: number) => void] {
  const [displayed, setDisplayed] = useState(target)
  const displayedRef = useRef(target)
  const rafRef       = useRef<number | null>(null)
  const timerRef     = useRef<ReturnType<typeof setTimeout> | null>(null)

  const snapTo = useCallback((value: number) => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    if (timerRef.current !== null) clearTimeout(timerRef.current)
    rafRef.current = null
    timerRef.current = null
    displayedRef.current = value
    setDisplayed(value)
  }, [])

  useEffect(() => {
    const from = displayedRef.current
    const to   = target
    if (from === to) return

    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    if (timerRef.current !== null) clearTimeout(timerRef.current)

    const startAnimation = () => {
      const start = performance.now()
      function tick(now: number) {
        const progress = Math.min((now - start) / duration, 1)
        const eased    = 1 - Math.pow(1 - progress, 3)
        const value    = Math.round(from + (to - from) * eased)
        displayedRef.current = value
        setDisplayed(value)
        if (progress < 1) {
          rafRef.current = requestAnimationFrame(tick)
        } else {
          rafRef.current = null
        }
      }
      rafRef.current = requestAnimationFrame(tick)
    }

    const appliedDelay = to > from ? delay : 0
    if (appliedDelay > 0) {
      timerRef.current = setTimeout(startAnimation, appliedDelay)
    } else {
      startAnimation()
    }

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
      if (timerRef.current !== null) clearTimeout(timerRef.current)
    }
  }, [target, duration, delay])

  return [displayed, snapTo]
}
