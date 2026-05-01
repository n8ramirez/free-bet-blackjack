
import { useRef } from 'react'

const RED_SUITS = new Set(['♥', '♦'])

export type CardBackColor = 'purple' | 'red' | 'blue' | 'green' | 'black' | 'gold'

const BACK_PALETTE: Record<CardBackColor, { bg: string; border: string; pattern: string; inner: string }> = {
  purple: { bg: '#4c1d95', border: '#6d28d9', pattern: 'rgba(139,92,246,0.25)', inner: 'rgba(139,92,246,0.4)'  },
  red:    { bg: '#7f1d1d', border: '#b91c1c', pattern: 'rgba(239,68,68,0.25)',   inner: 'rgba(220,38,38,0.4)'   },
  blue:   { bg: '#0d1b3e', border: '#1e3a8a', pattern: 'rgba(29,78,216,0.3)',    inner: 'rgba(29,78,216,0.45)'  },
  green:  { bg: '#14532d', border: '#15803d', pattern: 'rgba(34,197,94,0.25)',   inner: 'rgba(22,163,74,0.4)'   },
  black:  { bg: '#1c1917', border: '#57534e', pattern: 'rgba(245,158,11,0.25)',  inner: 'rgba(245,158,11,0.4)'  },
  gold:   { bg: '#a67c00', border: '#bf9b30', pattern: 'rgba(191,155,48,0.7)',   inner: '#bf9b30'               },
}

type CardProps = {
  card?: string
  faceDown?: boolean
  dimmed?: boolean
  glowing?: boolean
  push22Glow?: boolean
  ladyLuckGlow?: boolean
  wildSevensGlow?: boolean
  cardBackColor?: CardBackColor
}

export function Card({ card, faceDown = false, dimmed = false, glowing = false, push22Glow = false, ladyLuckGlow = false, wildSevensGlow = false, cardBackColor = 'purple' }: CardProps) {
  const prevFaceDown = useRef(faceDown)
  const isRevealing  = prevFaceDown.current === true && faceDown === false
  prevFaceDown.current = faceDown

  const base      = 'relative w-[52px] h-[74px] rounded-lg flex-shrink-0 select-none overflow-hidden'
  const opacity   = dimmed ? 'opacity-50' : ''
  const animClass = isRevealing ? 'animate-card-flip' : 'animate-card-in'

  const colors = BACK_PALETTE[cardBackColor]

  const cardEl = faceDown || !card ? (
    <div
      className={`${base} ${opacity} border shadow-card`}
      style={{ backgroundColor: colors.bg, borderColor: colors.border }}
    >
      <div className="absolute inset-0"
        style={{
          backgroundImage: `repeating-linear-gradient(
            45deg,
            ${colors.pattern} 0px, ${colors.pattern} 1px,
            transparent 1px, transparent 6px
          ), repeating-linear-gradient(
            -45deg,
            ${colors.pattern} 0px, ${colors.pattern} 1px,
            transparent 1px, transparent 6px
          )`,
        }}
      />
      <div className="absolute inset-[6px] rounded" style={{ border: `1px solid ${colors.inner}` }} />
    </div>
  ) : (() => {
    const suit  = card[card.length - 1]
    const rank  = card.slice(0, card.length - 1)
    const isRed = RED_SUITS.has(suit)
    const color = isRed ? 'text-red-600' : 'text-stone-900'
    return (
      <div className={`${base} ${opacity} bg-stone-50 border border-stone-300 shadow-card ${animClass} font-sans`}>
        {/* Top-left rank + suit */}
        <div className={`absolute top-[3px] left-[4px] flex flex-col items-center leading-none ${color}`}>
          <span className="text-[11px] font-bold">{rank}</span>
          <span className="text-[10px]">{suit}</span>
        </div>
        {/* Centre suit */}
        <div className={`absolute inset-0 flex items-center justify-center text-[22px] ${color}`}>
          {suit}
        </div>
        {/* Bottom-right rank + suit (rotated) */}
        <div className={`absolute bottom-[3px] right-[4px] flex flex-col items-center leading-none rotate-180 ${color}`}>
          <span className="text-[11px] font-bold">{rank}</span>
          <span className="text-[10px]">{suit}</span>
        </div>
      </div>
    )
  })()

  if (push22Glow)      return <div className="push22-glow inline-block">{cardEl}</div>
  if (glowing)         return <div className="hellraiser-glow inline-block">{cardEl}</div>
  if (ladyLuckGlow)    return <div className="lady-luck-glow inline-block">{cardEl}</div>
  if (wildSevensGlow)  return <div className="wild-sevens-glow inline-block">{cardEl}</div>

  return cardEl
}
