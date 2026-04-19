import { CHIPS, CHIP_LABELS, CHIP_COLORS, MIN_BET } from '../hooks/useGameState'

type BetPanelProps = {
  bankrollCents:          number
  pendingBetCents:        number
  potOfGoldBetCents:      number
  push22BetCents:         number
  lastBetCents:           number
  lastPotOfGoldBetCents:  number
  lastPush22BetCents:     number
  sideBetPanelOpen:       boolean
  onAddChip:              (cents: number) => void
  onClearBet:             () => void
  onReBet:                () => void
  onReBetWithSideBets:    () => void
  onDeal:                 () => void
  onToggleSideBetPanel:   () => void
  onShowInfo:             () => void
}

function fmtDollars(cents: number): string {
  const d = cents / 100
  return d % 1 === 0 ? `$${d.toLocaleString()}` : `$${d.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function BetPanel({
  bankrollCents, pendingBetCents, potOfGoldBetCents, push22BetCents,
  lastBetCents, lastPotOfGoldBetCents, lastPush22BetCents,
  sideBetPanelOpen, onAddChip, onClearBet, onReBet, onReBetWithSideBets, onDeal, onToggleSideBetPanel, onShowInfo,
}: BetPanelProps) {
  const totalSideBets = potOfGoldBetCents + push22BetCents
  const totalSpent    = pendingBetCents + totalSideBets
  const canDeal       = pendingBetCents >= MIN_BET && totalSpent <= bankrollCents
  const belowMin      = pendingBetCents > 0 && pendingBetCents < MIN_BET

  // Show clear button only if the active tab has a bet
  const hasActiveBet  = sideBetPanelOpen ? totalSideBets > 0 : pendingBetCents > 0
  // Show rebet only when no bets anywhere
  const hasPendingBet = pendingBetCents > 0 || totalSideBets > 0
  const showRebet     = !hasPendingBet && lastBetCents > 0 && lastBetCents <= bankrollCents

  return (
    <div className="flex flex-col items-center gap-4 px-4 pt-3 pb-6">

      {/* Tabs */}
      <div className="flex w-full border-b border-stone-700">
        <button
          onClick={sideBetPanelOpen ? onToggleSideBetPanel : undefined}
          className={`flex-1 pb-2 text-[11px] font-bold uppercase tracking-widest transition-colors
            ${!sideBetPanelOpen
              ? 'text-white border-b-2 border-white -mb-px'
              : 'text-stone-500 hover:text-stone-300'}`}
        >
          Main Bet
        </button>
        <button
          onClick={onToggleSideBetPanel}
          className={`flex-1 pb-2 text-[11px] font-bold uppercase tracking-widest transition-colors
            ${sideBetPanelOpen
              ? 'text-amber-400 border-b-2 border-amber-400 -mb-px'
              : 'text-stone-500 hover:text-stone-300'}`}
        >
          <span className="flex items-center justify-center gap-1.5 w-full">
            <span className={`w-4 h-4 flex-shrink-0 ${sideBetPanelOpen ? 'invisible' : 'hidden'}`} />
            Side Bets
            {sideBetPanelOpen && (
              <span
                role="button"
                onClick={e => { e.stopPropagation(); onShowInfo() }}
                className="w-4 h-4 flex-shrink-0 rounded-full border border-amber-400 text-amber-400
                  hover:border-amber-300 hover:text-amber-300 transition-colors
                  flex items-center justify-center text-[10px] font-bold leading-none"
              >
                ?
              </span>
            )}
          </span>
        </button>
      </div>

      {/* Bet display row */}
      <div className="w-full flex justify-between items-start">
        <div className="text-center flex-1">
          <div className={`text-3xl font-bold font-game transition-colors
            ${pendingBetCents > 0 ? 'text-amber-400' : 'text-stone-600'}`}>
            {pendingBetCents > 0 ? fmtDollars(pendingBetCents) : '—'}
          </div>
          {belowMin && <div className="text-red-400 text-xs mt-1">Min $5</div>}
        </div>
        <div className="text-center flex-1">
          <div className={`text-3xl font-bold font-game transition-colors
            ${totalSideBets > 0 ? 'text-amber-400' : 'text-stone-600'}`}>
            {totalSideBets > 0 ? fmtDollars(totalSideBets) : '—'}
          </div>
        </div>
      </div>

      {/* Chips */}
      <div className="flex gap-3 flex-wrap justify-center">
        {CHIPS.map((cents, i) => {
          const { bg, border } = CHIP_COLORS[i]
          const canAfford = bankrollCents >= totalSpent + cents
          return (
            <button
              key={cents}
              onClick={() => onAddChip(cents)}
              disabled={!canAfford}
              className={`
                w-14 h-14 rounded-full border-[4px] border-dashed font-bold text-xs text-white
                ${bg} ${border}
                shadow-[0_5px_0px_rgba(0,0,0,0.5)]
                active:shadow-[0_1px_0px_rgba(0,0,0,0.5)]
                active:translate-y-[4px]
                transition-transform
                ${canAfford ? '' : 'opacity-30 cursor-not-allowed'}
              `}
            >
              {CHIP_LABELS[i]}
            </button>
          )
        })}
      </div>

      {/* Action row */}
      <div className="flex gap-2 w-full">
        {hasActiveBet ? (
          <button
            onClick={onClearBet}
            className="flex-1 py-3 rounded-xl bg-stone-700 hover:bg-stone-600
              text-stone-300 text-sm font-semibold active:scale-95 transition-all"
          >
            {sideBetPanelOpen ? 'Clear Side Bet' : 'Clear'}
          </button>
        ) : showRebet ? (
          (() => {
            const lastTotal = lastBetCents + lastPotOfGoldBetCents + lastPush22BetCents
            const withSideBets = (lastPotOfGoldBetCents > 0 || lastPush22BetCents > 0) && lastTotal <= bankrollCents
            return (
              <button
                onClick={withSideBets ? onReBetWithSideBets : onReBet}
                className={`flex-1 py-3 rounded-xl bg-stone-700 hover:bg-stone-600
                  text-xs font-semibold active:scale-95 transition-all
                  ${withSideBets ? 'text-amber-400' : 'text-stone-300'}`}
              >
                {withSideBets
                  ? `Rebet + Side Bets ${fmtDollars(lastTotal)}`
                  : `Rebet ${fmtDollars(lastBetCents)}`}
              </button>
            )
          })()
        ) : null}

        <button
          onClick={onDeal}
          disabled={!canDeal}
          className={`
            flex-1 py-3 rounded-xl font-bold text-lg transition-all
            ${canDeal
              ? 'bg-emerald-600 hover:bg-emerald-500 text-white active:scale-95 shadow-[0_4px_0px_#14532d] active:shadow-none active:translate-y-1'
              : 'bg-stone-800 text-stone-600 cursor-not-allowed'}
          `}
        >
          Deal
        </button>
      </div>
    </div>
  )
}
