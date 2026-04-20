import { useEffect, useRef, useState } from 'react'

export function useCountUp(target: number, duration = 700, delay = 0): number {
  const [displayed, setDisplayed] = useState(target)
  const prevRef    = useRef(target)
  const rafRef     = useRef<number | null>(null)
  const timerRef   = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const from = prevRef.current
    const to   = target
    if (from === to) return

    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    if (timerRef.current !== null) clearTimeout(timerRef.current)

    const startAnimation = () => {
      const start = performance.now()
      function tick(now: number) {
        const progress = Math.min((now - start) / duration, 1)
        const eased    = 1 - Math.pow(1 - progress, 3)
        setDisplayed(Math.round(from + (to - from) * eased))
        if (progress < 1) {
          rafRef.current = requestAnimationFrame(tick)
        } else {
          prevRef.current = to
          rafRef.current  = null
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

  return displayed
}
