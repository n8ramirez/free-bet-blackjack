
import { useRef } from 'react'

const RED_SUITS = new Set(['♥', '♦'])

type CardProps = {
  card?: string      // e.g. 'A♠', '10♦'
  faceDown?: boolean
  dimmed?: boolean   // non-active hand in split
}

export function Card({ card, faceDown = false, dimmed = false }: CardProps) {
  const prevFaceDown = useRef(faceDown)
  const isRevealing  = prevFaceDown.current === true && faceDown === false
  prevFaceDown.current = faceDown

  const base      = 'relative w-[52px] h-[74px] rounded-lg flex-shrink-0 select-none overflow-hidden'
  const opacity   = dimmed ? 'opacity-50' : ''
  const animClass = isRevealing ? 'animate-card-flip' : 'animate-card-in'

  if (faceDown || !card) {
    return (
      <div className={`${base} ${opacity} bg-violet-900 border border-violet-700 shadow-card`}>
        {/* Diamond crosshatch back pattern */}
        <div className="absolute inset-0"
          style={{
            backgroundImage: `repeating-linear-gradient(
              45deg,
              rgba(139,92,246,0.25) 0px, rgba(139,92,246,0.25) 1px,
              transparent 1px, transparent 6px
            ), repeating-linear-gradient(
              -45deg,
              rgba(139,92,246,0.25) 0px, rgba(139,92,246,0.25) 1px,
              transparent 1px, transparent 6px
            )`,
          }}
        />
        <div className="absolute inset-[6px] rounded border border-violet-600/40" />
      </div>
    )
  }

  const suit  = card[card.length - 1]
  const rank  = card.slice(0, card.length - 1)
  const isRed = RED_SUITS.has(suit)
  const color = isRed ? 'text-red-600' : 'text-stone-900'

  return (
    <div className={`${base} ${opacity} bg-stone-50 border border-stone-300 shadow-card ${animClass}`}>
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
}
