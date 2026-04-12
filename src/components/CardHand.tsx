import { Card } from './Card'
import { Hand, HandResult, handTotals, isBlackjack } from '../engine'

type CardHandProps = {
  hand:           Hand
  label?:         string
  hideSecond?:    boolean   // hide dealer hole card during player turn
  hideTotal?:     boolean   // hide the total badge (e.g. dealer before reveal)
  isActive?:      boolean   // highlight this hand
  isDimmed?:      boolean   // non-active hand in a split
  result?:        HandResult
  hasFreeBet?:    boolean    // show free-bet lammer (free split or free double)
  showPushOn22?:  boolean    // treat dealer 22 as push instead of bust
  visibleCount?:  number     // how many cards to show (for deal animation)
}

export function CardHand({
  hand, label, hideSecond, hideTotal, isActive, isDimmed, result, hasFreeBet, showPushOn22, visibleCount,
}: CardHandProps) {
  const visibleCards = hand.cards.slice(0, visibleCount ?? hand.cards.length)
  const { total, isSoft } = handTotals(visibleCards)
  const bj       = !hand.isSplitAce && isBlackjack(visibleCards)
  const bust     = total > 21
  const push22   = showPushOn22 && total === 22
  const showAll  = !hideSecond

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
    ? 'bg-amber-500 text-amber-950'
    : result?.result === 'loss'
    ? 'bg-red-700 text-red-100'
    : 'bg-stone-500 text-stone-100'

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
    ? 'ring-2 ring-sky-300 ring-offset-2 ring-offset-felt rounded-xl'
    : ''

  return (
    <div className={`flex flex-col items-center gap-2 px-2 ${ringClass}`}>
      {/* Label */}
      {label && (
        <div className="text-stone-400 text-[10px] uppercase tracking-widest">{label}</div>
      )}

      {/* Free-bet lammer */}
      {hasFreeBet && (
        <div className="w-8 h-8 rounded-full bg-amber-400 border-2 border-yellow-200
          shadow-[0_2px_6px_rgba(0,0,0,0.5)] flex items-center justify-center">
          <span className="text-[8px] font-black text-amber-950 leading-none tracking-wide">FREE</span>
        </div>
      )}

      {/* Cards */}
      <div className="flex gap-1.5 flex-wrap justify-center">
        {visibleCards.map((c, i) => (
          <Card
            key={i}
            card={c}
            faceDown={hideSecond && i === 1}
            dimmed={isDimmed}
          />
        ))}
      </div>

      {/* Total badge — only when we can see all cards */}
      {showAll && !hideTotal && visibleCards.length > 0 && (
        <div className={`px-2 py-0.5 rounded text-xs font-bold ${totalBg}`}>
          {totalLabel}
        </div>
      )}

      {/* Dealer 22 push badge */}
      {push22 && showAll && !hideTotal && (
        <div className="px-3 py-1 rounded-full text-xs font-bold bg-stone-500 text-stone-100">
          PUSH
        </div>
      )}

      {/* Result badge */}
      {result && (
        <div className={`px-3 py-1 rounded-full text-xs font-bold ${resultBg}`}>
          {formatResult(result)}
        </div>
      )}
    </div>
  )
}
