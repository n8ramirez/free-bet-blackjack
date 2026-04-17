import { useState, useEffect } from 'react'
import { useGameState } from './hooks/useGameState'
import { CardHand } from './components/CardHand'
import { BetPanel } from './components/BetPanel'
import { ActionBar } from './components/ActionBar'
import { RulesModal } from './components/RulesModal'
import { LeaderboardModal } from './components/LeaderboardModal'
import { HighScoreModal } from './components/HighScoreModal'
import { handTotals, isBlackjack } from './engine'
import {
  getLeaderboard, getQualifyingRank, addToLeaderboard,
  type LeaderboardEntry,
} from './hooks/useLeaderboard'

export default function App() {
  const game = useGameState()
  const [showRules, setShowRules] = useState(false)
  const [showLeaderboard, setShowLeaderboard] = useState(false)
  const [showHighScoreEntry, setShowHighScoreEntry] = useState(false)
  const [leaderboardEntries, setLeaderboardEntries] = useState<LeaderboardEntry[]>([])
  const [highlightIndex, setHighlightIndex] = useState<number | undefined>(undefined)
  const [highScoreHandled, setHighScoreHandled] = useState(false)
  const [qualifyingRank, setQualifyingRank] = useState<number | null>(null)

  // When game ends, fetch the leaderboard to check if the score qualifies
  useEffect(() => {
    if (game.isGameOver && !highScoreHandled) {
      setHighScoreHandled(true)
      getLeaderboard().then(entries => {
        setLeaderboardEntries(entries)
        const rank = getQualifyingRank(game.peakBankrollCents, entries)
        if (rank !== null) {
          setQualifyingRank(rank)
          setShowHighScoreEntry(true)
        }
      })
    }
    if (!game.isGameOver) {
      setHighScoreHandled(false)
    }
  }, [game.isGameOver, game.peakBankrollCents, highScoreHandled])

  async function handleHighScoreSubmit(name: string) {
    const { entries, newIndex } = await addToLeaderboard(name, game.peakBankrollCents)
    setLeaderboardEntries(entries)
    setHighlightIndex(newIndex)
    setShowHighScoreEntry(false)
    setShowLeaderboard(true)
  }

  function handleHighScoreSkip() {
    setShowHighScoreEntry(false)
  }

  async function handleOpenLeaderboard() {
    const entries = await getLeaderboard()
    setLeaderboardEntries(entries)
    setHighlightIndex(undefined)
    setShowLeaderboard(true)
  }

  const isBetting    = game.phase === 'betting'
  const isDealing    = game.phase === 'dealing'
  const isPlayerTurn = game.phase === 'player-turn'
  const isDealerTurn = game.phase === 'dealer-turn'
  const isOver       = game.phase === 'round-over'

  // During dealing phase, reveal cards one at a time: player[0] → dealer[0] → player[1] → dealer[1]
  const playerVisibleCount = isDealing
    ? (game.revealCount >= 3 ? 2 : game.revealCount >= 1 ? 1 : 0)
    : undefined
  const dealerVisibleCount = isDealing
    ? (game.revealCount >= 4 ? 2 : game.revealCount >= 2 ? 1 : 0)
    : isDealerTurn
    ? game.dealerRevealCount
    : undefined

  const multiHand = game.engine.playerHands.length > 1

  // Net result across all hands for the round-over summary
  const netCents = game.results.reduce((sum, r) => sum + r.payoutCents, 0)

  // Round-result banner
  const dealerBJ = isOver && isBlackjack(game.engine.dealer.cards)
  const dealer22 = isOver && handTotals(game.engine.dealer.cards).total === 22
  const playerBJ   = isOver && game.results.some(
    r => r.reason === 'blackjack' || r.reason === 'blackjack vs dealer 22'
  )
  const allBust    = isOver && game.results.length > 0 && game.results.every(r => r.reason === 'bust')
  let bannerTitle = ''
  let bannerTitleColor = 'text-stone-300'
  if (isOver) {
    if (dealerBJ && !playerBJ)      { bannerTitle = 'Dealer Blackjack'; bannerTitleColor = 'text-red-400'   }
    else if (playerBJ)               { bannerTitle = 'Player Blackjack'; bannerTitleColor = 'text-amber-400' }
    else if (dealer22)               { bannerTitle = '22 Push';          bannerTitleColor = 'text-stone-300' }
    else if (allBust)                { bannerTitle = 'Player Bust';      bannerTitleColor = 'text-red-400'   }
    else if (netCents > 0)           { bannerTitle = 'Player Wins';      bannerTitleColor = 'text-amber-400' }
    else if (netCents < 0)           { bannerTitle = 'Dealer Wins';      bannerTitleColor = 'text-red-400'   }
    else                             { bannerTitle = 'Push';             bannerTitleColor = 'text-stone-300' }
  }
  const fmtDollars = (cents: number) => {
    const d = Math.abs(cents) / 100
    const s = d % 1 === 0
      ? `$${d.toLocaleString()}`
      : `$${d.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    return cents >= 0 ? s : `-${s}`
  }
  const formatNet = (cents: number) => (cents > 0 ? '+' : '') + fmtDollars(cents)
  const bannerAmount      = isOver && netCents !== 0 ? formatNet(netCents) : ''
  const bannerAmountColor = netCents >= 0 ? 'text-emerald-400' : 'text-red-300'

  // Dealer total visible only when revealed
  const dealerHand = game.engine.dealer
  const dealerTotalVisible = game.dealerRevealed && dealerHand.cards.length > 0
  const { total: dealerTotal } = dealerTotalVisible
    ? handTotals(dealerHand.cards)
    : { total: 0 }

  return (
    <div className="h-[100dvh] bg-felt flex flex-col overflow-hidden">
      {showRules && <RulesModal onClose={() => setShowRules(false)} />}
      {showLeaderboard && (
        <LeaderboardModal
          entries={leaderboardEntries}
          highlightIndex={highlightIndex}
          onClose={() => { setShowLeaderboard(false); setHighlightIndex(undefined) }}
        />
      )}
      {showHighScoreEntry && qualifyingRank !== null && (
        <HighScoreModal
          peakBankrollCents={game.peakBankrollCents}
          rank={qualifyingRank}
          onSubmit={handleHighScoreSubmit}
          onSkip={handleHighScoreSkip}
        />
      )}

      {/* ── Top bar + Marquee ───────────────────────────────────── */}
      <div className="flex-none grid grid-cols-3 items-center px-5 py-3 bg-felt-light border-b border-felt-border">
        {/* Left — Bankroll */}
        <div>
          <div className="text-white text-[9px] uppercase tracking-widest">Bankroll</div>
          <div className="text-white font-bold text-xl font-game">
            ${(game.bankrollCents / 100).toLocaleString()}
          </div>
        </div>

        {/* Center — always perfectly centered */}
        <div className="flex flex-col items-center">
          <div className="text-white text-[9px] uppercase tracking-widest">Free Bet</div>
          <div className="relative flex items-center justify-center">
            <button
              onClick={handleOpenLeaderboard}
              className="absolute right-full mr-2 w-6 h-6 rounded-full border-2 border-amber-400 text-amber-400
                hover:border-amber-300 hover:text-amber-300 transition-colors
                flex items-center justify-center"
            >
              <svg viewBox="0 0 14 11" width="11" height="9" fill="currentColor">
                {/* 2nd place block (left) */}
                <rect x="0" y="4" width="4" height="7" rx="0.5" />
                {/* 1st place block (center) */}
                <rect x="5" y="1" width="4" height="10" rx="0.5" />
                {/* 3rd place block (right) */}
                <rect x="10" y="6" width="4" height="5" rx="0.5" />
              </svg>
            </button>
            <div className="text-amber-400 font-bold text-sm">Blackjack</div>
            <button
              onClick={() => setShowRules(true)}
              className="absolute left-full ml-2 w-6 h-6 rounded-full border-2 border-sky-300 text-sky-300
                hover:border-sky-200 hover:text-sky-200 transition-colors
                flex items-center justify-center text-[12px] font-bold leading-none"
            >
              i
            </button>
          </div>
        </div>

        {/* Right — Bet (always rendered to hold the column width) */}
        <div className="text-right">
          {(isDealing || isPlayerTurn || isDealerTurn || isOver) && game.engine.playerHands.length > 0 && (
            <>
              <div className="text-white text-[9px] uppercase tracking-widest">Bet</div>
              <div className="text-amber-400 font-bold text-xl font-game">
                ${(game.engine.playerHands[0].betCents / 100).toLocaleString()}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Marquee banner (first load + game over only) ────────── */}
      {isBetting && (game.lastBetCents === 0 || game.isGameOver) && (
      <div className="flex-none bg-sky-300 overflow-hidden h-6 flex items-center">
        <span className="marquee-track text-[10px] font-bold text-sky-950 uppercase tracking-wide px-4">
          🏆&nbsp; Road to 1 Million Challenge: $50 Cash Prize for 1st Player to Break $1M Peak Bankroll &nbsp;🏆
        </span>
      </div>
      )}

      {/* ── Dealer area ─────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center py-4 min-h-0">
        {dealerHand.cards.length > 0 ? (
          <CardHand
            hand={dealerHand}
            label="Dealer"
            hideSecond={isPlayerTurn}
            hideTotal={!game.dealerRevealed}
            showPushOn22={game.dealerRevealed && dealerTotal === 22}
            visibleCount={dealerVisibleCount}
          />
        ) : (
          <div className="text-white text-sm uppercase tracking-widest">
            {isBetting ? 'Place your bet' : ''}
          </div>
        )}
      </div>

      {/* ── Divider / Round result banner ───────────────────────── */}
      <div className="flex-none flex flex-col items-center w-full">
        {isOver ? (
          <div className="w-full py-3 bg-black/70 flex flex-col items-center gap-1">
            <div className={`text-2xl font-bold font-game tracking-wide ${bannerTitleColor}`}>
              {bannerTitle}
            </div>
            {bannerAmount && (
              <div className={`text-sm font-semibold ${bannerAmountColor}`}>
                {bannerAmount}
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="text-stone-400 text-[9px] uppercase tracking-widest pb-1">
              Blackjack Pays 3 to 2 &nbsp;( 1 to 1 on Splits )
            </div>
            <div className="border-t border-felt-dark w-full opacity-40" />
            <div className="text-stone-400 text-[9px] uppercase tracking-widest pt-1">
              Dealer Must Hit Soft 17
            </div>
          </>
        )}
      </div>

      {/* ── Player area ─────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center py-4 min-h-0">
        {game.engine.playerHands.length > 0 ? (
          <div className={`flex gap-3 ${multiHand ? 'overflow-x-auto px-4 py-2' : ''}`}>
            {game.engine.playerHands.map((hand, i) => {
              const active  = isPlayerTurn && i === game.activeHandIndex
              const dimmed  = isPlayerTurn && !active
              return (
                <CardHand
                  key={i}
                  hand={hand}
                  label={multiHand ? `Hand ${i + 1}` : 'You'}
                  isActive={active}
                  isDimmed={dimmed}
                  result={isOver ? game.results[i] : undefined}
                  hasFreeBet={!!(hand.freeSplit || hand.freeDouble)}
                  visibleCount={playerVisibleCount}
                />
              )
            })}
          </div>
        ) : null}
      </div>

      {/* ── Bottom panel ────────────────────────────────────────── */}
      <div className="flex-none bg-stone-900 rounded-t-2xl shadow-[0_-6px_24px_rgba(0,0,0,0.6)]">

        {/* Betting phase */}
        {isBetting && !game.isGameOver && (
          <BetPanel
            bankrollCents={game.bankrollCents}
            pendingBetCents={game.pendingBetCents}
            lastBetCents={game.lastBetCents}
            onAddChip={game.addChip}
            onClearBet={game.clearBet}
            onReBet={game.reBet}
            onDeal={game.deal}
          />
        )}

        {/* Game over */}
        {isBetting && game.isGameOver && (
          <div className="flex flex-col items-center gap-3 px-4 pt-6 pb-8">
            <div className="text-stone-300 text-lg font-bold">Out of chips!</div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-stone-400 uppercase tracking-widest text-[10px]">Peak Bankroll</span>
              <span className="text-amber-400 font-bold font-game">
                ${(game.peakBankrollCents / 100).toLocaleString()}
              </span>
            </div>
            <button
              onClick={game.resetGame}
              className="w-full py-4 rounded-xl bg-emerald-600 hover:bg-emerald-500
                text-white font-bold text-lg active:scale-95 transition-all
                shadow-[0_4px_0px_#14532d]"
            >
              New Game — $500
            </button>
          </div>
        )}

        {/* Player-turn phase */}
        {isPlayerTurn && !game.pendingDealerTurn && (
          <ActionBar
            canHit={true}
            canStand={true}
            canDouble={game.canDoubleNow}
            canSplit={game.canSplitNow}
            isFreeDouble={game.isFreeDouble}
            isFreeSplit={game.isFreeSplit}
            onHit={game.hit}
            onStand={game.stand}
            onDouble={game.double}
            onSplit={game.split}
          />
        )}

        {/* Round-over phase */}
        {isOver && (
          <div className="flex flex-col items-center gap-3 px-4 pt-4 pb-6">
            {/* Net result summary */}
            <div className={`text-2xl font-bold font-game
              ${netCents > 0 ? 'text-amber-400' : netCents < 0 ? 'text-red-400' : 'text-stone-300'}`}>
              {netCents !== 0 ? formatNet(netCents) : 'Push'}
            </div>
            {/* Dealer total */}
            {dealerTotalVisible && (
              <div className="text-stone-400 text-sm">
                Dealer: {dealerTotal > 22 ? 'Bust' : dealerTotal}
              </div>
            )}
            <button
              onClick={game.newHand}
              className="w-full py-4 rounded-xl bg-emerald-600 hover:bg-emerald-500
                text-white font-bold text-lg active:scale-95 transition-all
                shadow-[0_4px_0px_#14532d] active:shadow-none active:translate-y-1"
            >
              New Hand
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
