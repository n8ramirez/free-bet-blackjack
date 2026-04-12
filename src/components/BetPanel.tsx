import { CHIPS, CHIP_LABELS, CHIP_COLORS, MIN_BET } from '../hooks/useGameState'

type BetPanelProps = {
  bankrollCents:   number
  pendingBetCents: number
  lastBetCents:    number
  onAddChip:  (cents: number) => void
  onClearBet: () => void
  onReBet:    () => void
  onDeal:     () => void
}

export function BetPanel({
  bankrollCents, pendingBetCents, lastBetCents,
  onAddChip, onClearBet, onReBet, onDeal,
}: BetPanelProps) {
  const canDeal    = pendingBetCents >= MIN_BET && pendingBetCents <= bankrollCents
  const belowMin   = pendingBetCents > 0 && pendingBetCents < MIN_BET
  const betDollars = pendingBetCents / 100

  return (
    <div className="flex flex-col items-center gap-4 px-4 pt-5 pb-6">

      {/* Bet display */}
      <div className="text-center">
        <div className="text-white text-[10px] uppercase tracking-widest mb-1">Current Bet</div>
        <div className={`text-3xl font-bold font-game transition-colors
          ${pendingBetCents > 0 ? 'text-amber-400' : 'text-stone-600'}`}>
          {pendingBetCents > 0
            ? (betDollars % 1 === 0
              ? `$${betDollars.toLocaleString()}`
              : `$${betDollars.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`)
            : '—'}
        </div>
        {belowMin && (
          <div className="text-red-400 text-xs mt-1">Minimum bet is $5</div>
        )}
      </div>

      {/* Chip grid */}
      <div className="flex gap-3 flex-wrap justify-center">
        {CHIPS.map((cents, i) => {
          const { bg, border } = CHIP_COLORS[i]
          const canAfford = bankrollCents >= pendingBetCents + cents
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
        {pendingBetCents > 0 ? (
          <button
            onClick={onClearBet}
            className="flex-1 py-3 rounded-xl bg-stone-700 hover:bg-stone-600
              text-stone-300 text-sm font-semibold active:scale-95 transition-all"
          >
            Clear
          </button>
        ) : lastBetCents > 0 && lastBetCents <= bankrollCents ? (
          <button
            onClick={onReBet}
            className="flex-1 py-3 rounded-xl bg-stone-700 hover:bg-stone-600
              text-stone-300 text-sm font-semibold active:scale-95 transition-all"
          >
            Rebet ${(lastBetCents / 100).toLocaleString()}
          </button>
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
