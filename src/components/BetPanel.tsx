import { CHIPS, CHIP_LABELS, MIN_BET } from '../hooks/useGameState'
import { SafeButton } from './SafeButton'
import chip5   from '../assets/chips/chip-5.svg'
import chip10  from '../assets/chips/chip-10.svg'
import chip25  from '../assets/chips/chip-25.svg'
import chip50  from '../assets/chips/chip-50.svg'
import chip100 from '../assets/chips/chip-100.svg'
import chip250 from '../assets/chips/chip-250.svg'
import chip500 from '../assets/chips/chip-500.svg'
import chip1k  from '../assets/chips/chip-1k.svg'
import chip5k  from '../assets/chips/chip-5k.svg'

const CHIP_IMAGES = [chip5, chip10, chip25, chip50, chip100, chip250, chip500, chip1k, chip5k]

type BetPanelProps = {
  bankrollCents:           number
  pendingBetCents:         number
  potOfGoldBetCents:       number
  push22BetCents:          number
  hellraiserBetCents:      number
  lastBetCents:            number
  lastPotOfGoldBetCents:   number
  lastPush22BetCents:      number
  lastHellraiserBetCents:  number
  sideBetPanelOpen:        boolean
  onAddChip:               (cents: number) => void
  onClearBet:              () => void
  onReBet:                 () => void
  onReBetWithSideBets:     () => void
  onDeal:                  () => void
  onToggleSideBetPanel:    () => void
}

function fmtDollars(cents: number): string {
  const d = cents / 100
  return d % 1 === 0 ? `$${d.toLocaleString()}` : `$${d.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function BetPanel({
  bankrollCents, pendingBetCents, potOfGoldBetCents, push22BetCents, hellraiserBetCents,
  lastBetCents, lastPotOfGoldBetCents, lastPush22BetCents, lastHellraiserBetCents,
  sideBetPanelOpen, onAddChip, onClearBet, onReBet, onReBetWithSideBets, onDeal, onToggleSideBetPanel,
}: BetPanelProps) {
  const totalSideBets = potOfGoldBetCents + push22BetCents + hellraiserBetCents
  const totalSpent    = pendingBetCents + totalSideBets
  const canDeal       = pendingBetCents >= MIN_BET && totalSpent <= bankrollCents
  const belowMin      = pendingBetCents > 0 && pendingBetCents < MIN_BET
  const hasActiveBet  = sideBetPanelOpen ? totalSideBets > 0 : pendingBetCents > 0
  const hasPendingBet = pendingBetCents > 0 || totalSideBets > 0
  const showRebet     = !hasPendingBet && lastBetCents > 0 && lastBetCents <= bankrollCents

  return (
    <div className="flex flex-col items-center gap-4 px-4 pt-3 pb-6">

      {/* Tabs */}
      <div className="flex w-full border-b border-stone-700">
        <SafeButton
          onClick={sideBetPanelOpen ? onToggleSideBetPanel : undefined}
          className={`flex-1 pb-2 text-[11px] font-bold uppercase tracking-widest transition-colors
            ${!sideBetPanelOpen
              ? 'text-white border-b-2 border-white -mb-px'
              : 'text-stone-500 hover:text-stone-300'}`}
        >
          Main Bet
        </SafeButton>
        <SafeButton
          onClick={onToggleSideBetPanel}
          className={`flex-1 pb-2 text-[11px] font-bold uppercase tracking-widest transition-colors
            ${sideBetPanelOpen
              ? 'text-amber-400 border-b-2 border-amber-400 -mb-px'
              : 'text-stone-500 hover:text-stone-300'}`}
        >
          Side Bets
        </SafeButton>
      </div>

      {/* Bet display row */}
      <div className="w-full flex justify-between items-start">
        <div className="text-center flex-1">
          <div className={`text-3xl font-bold transition-colors
            ${pendingBetCents > 0 ? 'text-amber-400' : 'text-stone-600'}`}>
            {pendingBetCents > 0 ? fmtDollars(pendingBetCents) : '—'}
          </div>
          {belowMin && <div className="text-red-400 text-xs mt-1">Min $5</div>}
        </div>
        <div className="text-center flex-1">
          <div className={`text-3xl font-bold transition-colors
            ${totalSideBets > 0 ? 'text-amber-400' : 'text-stone-600'}`}>
            {totalSideBets > 0 ? fmtDollars(totalSideBets) : '—'}
          </div>
        </div>
      </div>

      {/* Chips */}
      <div className="flex gap-3 flex-wrap justify-center">
        {CHIPS.map((cents, i) => {
          const canAfford = bankrollCents >= totalSpent + cents
          return (
            <SafeButton
              key={cents}
              onClick={() => onAddChip(cents)}
              disabled={!canAfford}
              className={`
                w-16 h-16 p-0 bg-transparent border-none
                [filter:drop-shadow(0_5px_0px_rgba(0,0,0,0.5))]
                active:[filter:drop-shadow(0_1px_0px_rgba(0,0,0,0.5))]
                active:translate-y-[4px]
                transition-transform
                ${canAfford ? '' : 'opacity-30 cursor-not-allowed'}
              `}
            >
              <img src={CHIP_IMAGES[i]} alt={CHIP_LABELS[i]} className="w-full h-full" draggable={false} />
            </SafeButton>
          )
        })}
      </div>

      {/* Action row */}
      <div className="flex gap-2 w-full">
        {hasActiveBet ? (
          <SafeButton
            onClick={onClearBet}
            className="relative overflow-hidden flex-1 py-3 rounded-xl bg-amber-600 hover:bg-amber-500
              text-white text-lg font-bold active:scale-95 transition-all shadow-[0_4px_0px_#92400e] active:shadow-none active:translate-y-1"
          >
            <div className="absolute inset-x-0 top-0 h-3 rounded-t-xl bg-gradient-to-b from-black/25 to-transparent pointer-events-none" />
            <span className="relative">{sideBetPanelOpen ? 'Clear Side Bet' : 'Clear'}</span>
          </SafeButton>
        ) : showRebet ? (
          (() => {
            const lastTotal    = lastBetCents + lastPotOfGoldBetCents + lastPush22BetCents + lastHellraiserBetCents
            const hasSideBets  = lastPotOfGoldBetCents > 0 || lastPush22BetCents > 0 || lastHellraiserBetCents > 0
            const withSideBets = hasSideBets && lastTotal <= bankrollCents
            return (
              <SafeButton
                onClick={withSideBets ? onReBetWithSideBets : onReBet}
                className={`relative overflow-hidden flex-1 py-3 rounded-xl bg-violet-700 hover:bg-violet-600
                  text-lg font-bold active:scale-95 transition-all text-white shadow-[0_4px_0px_#4c1d95] active:shadow-none active:translate-y-1`}
              >
                <div className="absolute inset-x-0 top-0 h-3 rounded-t-xl bg-gradient-to-b from-black/25 to-transparent pointer-events-none" />
                <span className="relative">Rebet</span>
              </SafeButton>
            )
          })()
        ) : null}

        <SafeButton
          onClick={onDeal}
          disabled={!canDeal}
          className={`
            relative overflow-hidden flex-1 py-3 rounded-xl font-bold text-lg transition-all
            ${canDeal
              ? 'bg-emerald-600 hover:bg-emerald-500 text-white active:scale-95 shadow-[0_4px_0px_#14532d] active:shadow-none active:translate-y-1'
              : 'bg-stone-800 text-stone-600 cursor-not-allowed'}
          `}
        >
          {canDeal && <>
            <div className="absolute inset-x-0 top-0 h-3 rounded-t-xl bg-gradient-to-b from-black/25 to-transparent pointer-events-none" />
          </>}
          <span className="relative">Deal</span>
        </SafeButton>
      </div>
    </div>
  )
}
