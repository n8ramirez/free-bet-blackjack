import { Card } from './Card'
import { Hand, HandResult, handTotals, isBlackjack } from '../engine'

type CardHandProps = {
  hand:                  Hand
  label?:                string
  hideSecond?:           boolean
  hideTotal?:            boolean
  isActive?:             boolean
  isDimmed?:             boolean
  isSplit?:              boolean
  result?:               HandResult
  hasFreeSplit?:         boolean
  hasFreeDouble?:        boolean
  showPushOn22?:         boolean
  visibleCount?:         number
  hellraiserGlow?:          boolean
  hellraiserGlowFirstOnly?: boolean
  push22Glow?:              boolean
  pogGlow?:                 boolean
}

const Puck = ({ top, left = -16, zIndex = 10, glowing = false }: { top: number; left?: number; zIndex?: number; glowing?: boolean }) => (
  <div
    className={`absolute w-8 h-8 rounded-full bg-amber-400 border-2 border-yellow-200
      shadow-[0_2px_6px_rgba(0,0,0,0.5)] flex items-center justify-center${glowing ? ' pog-glow' : ''}`}
    style={{ top, left, zIndex }}
  >
    <span className="text-[8px] font-black text-amber-950 leading-none tracking-wide">FREE</span>
  </div>
)

export function CardHand({
  hand, label, hideSecond, hideTotal, isActive, isDimmed, isSplit, result,
  hasFreeSplit, hasFreeDouble, showPushOn22, visibleCount,
  hellraiserGlow, hellraiserGlowFirstOnly, push22Glow, pogGlow,
}: CardHandProps) {
  const visibleCards = hand.cards.slice(0, visibleCount ?? hand.cards.length)
  const { total, isSoft } = handTotals(visibleCards)
  const bj       = !hand.isSplitAce && isBlackjack(visibleCards)
  const bust     = total > 21
  const push22   = showPushOn22 && total === 22
  const showAll  = !hideSecond
  const hasAnyFreeBet = hasFreeSplit || hasFreeDouble

  const totalLabel = bj
    ? 'BLACKJACK'
    : push22
    ? `${total}`
    : bust
    ? 'BUST'
    : `${isSoft && total < 21 ? 'S' : ''}${total}`

  const totalBg = push22
    ? 'bg-stone-600 text-stone-200'
    : bust
    ? 'bg-red-800 text-red-200'
    : bj
    ? 'bg-amber-500 text-amber-950'
    : isActive
    ? 'bg-emerald-600 text-white'
    : 'bg-stone-700 text-stone-200'

  const resultBg = result?.result === 'win'
    ? 'bg-black text-emerald-400'
    : result?.result === 'loss'
    ? 'bg-black text-red-400'
    : 'bg-black text-stone-300'

  const formatResult = (r: HandResult) => {
    if (r.result === 'push') return 'PUSH'
    if (r.payoutCents === 0) return r.result === 'loss' ? 'FREE LOSS' : ''
    const dollars = Math.abs(r.payoutCents) / 100
    const fmt = dollars % 1 === 0
      ? `$${dollars.toLocaleString()}`
      : `$${dollars.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    return r.result === 'win' ? `+${fmt}` : `-${fmt}`
  }

  const ringClass = isActive
    ? 'ring-2 ring-transparent ring-offset-2 ring-offset-felt rounded-xl'
    : ''

  const pucks = (
    <>
      {hasFreeSplit && hasFreeDouble && <Puck top={27} left={-16} zIndex={10} glowing={pogGlow} />}
      {hasFreeSplit && hasFreeDouble && <Puck top={37} left={-8} zIndex={11} glowing={pogGlow} />}
      {hasFreeSplit && !hasFreeDouble && <Puck top={32} glowing={pogGlow} />}
      {hasFreeDouble && !hasFreeSplit && <Puck top={32} glowing={pogGlow} />}
    </>
  )

  return (
    <div className={`flex flex-col items-center gap-2 py-2 ${hasAnyFreeBet ? 'pl-6 pr-[18px]' : 'px-2'} ${ringClass}`}>
      {/* Label */}
      {label && (
        <div className="relative z-10 text-stone-400 text-[10px] uppercase tracking-widest">{label}</div>
      )}

      {/* Cards (lammer overlaid on first card) */}
      {isSplit ? (
        <div className="relative" style={{ width: 52 + (visibleCards.length - 1) * 20, height: 74 + (visibleCards.length - 1) * 6 }}>
          {isActive && isSplit && <div className="glow-pulse absolute rounded-full w-12 h-12 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />}
          {visibleCards.map((c, i) => (
            <div key={i} className="absolute" style={{ top: i * 6, left: i * 20 }}>
              <Card
                card={c}
                faceDown={hideSecond && i === 1}
                dimmed={isDimmed}
                glowing={hellraiserGlow && (!hellraiserGlowFirstOnly || i === 0)}
                push22Glow={push22Glow}
              />
            </div>
          ))}
          {pucks}
        </div>
      ) : (
        <div className="relative flex gap-1.5 flex-wrap justify-center">
          {isActive && isSplit && <div className="glow-pulse absolute rounded-full w-12 h-12 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />}
          {pucks}
          {visibleCards.map((c, i) => (
            <Card
              key={i}
              card={c}
              faceDown={hideSecond && i === 1}
              dimmed={isDimmed}
              glowing={hellraiserGlow && (!hellraiserGlowFirstOnly || i === 0)}
                push22Glow={push22Glow}
            />
          ))}
        </div>
      )}

      {/* Total + result badges side by side */}
      <div className="relative z-10 flex items-center gap-1.5">
        {showAll && !hideTotal && visibleCards.length > 0 && (
          <div className={`px-2 py-0.5 rounded text-xs font-bold ${totalBg}`}>
            {totalLabel}
          </div>
        )}
        {push22 && showAll && !hideTotal && (
          <div className="px-3 py-1 rounded-full text-xs font-bold bg-stone-500 text-stone-100">
            PUSH
          </div>
        )}
        {result && (
          <div className={`px-3 py-1 rounded-full text-xs font-bold ${resultBg}`}>
            {formatResult(result)}
          </div>
        )}
      </div>
    </div>
  )
}
