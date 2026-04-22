import { useState, useEffect } from 'react'
import { useGameState, STARTING_BANKROLL } from './hooks/useGameState'
import { useCountUp } from './hooks/useCountUp'
import { CardHand } from './components/CardHand'
import { BetPanel } from './components/BetPanel'
import { SideBetPanel, PotOfGoldIcon, Push22Icon, HellraiserIcon } from './components/SideBetPanel'
import { SideBetInfoModal } from './components/SideBetInfoModal'
import { ActionBar } from './components/ActionBar'
import { RulesModal } from './components/RulesModal'
import { LeaderboardModal } from './components/LeaderboardModal'
import { MenuModal } from './components/MenuModal'
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
  const [debugSplit, setDebugSplit] = useState(false)
  const [showSideBetInfo, setShowSideBetInfo] = useState(false)
  const [showMenu, setShowMenu] = useState(false)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.shiftKey && e.key === 'D') setDebugSplit(v => !v)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

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
    setHighlightIndex(undefined)
    setShowLeaderboard(true)
    const entries = await getLeaderboard()
    setLeaderboardEntries(entries)
  }

  const [animatedBankroll, snapBankroll] = useCountUp(game.bankrollCents, 700, 600)

  function handleResetGame() {
    snapBankroll(STARTING_BANKROLL)
    game.resetGame()
  }

  const hellraiserWon = game.hellraiserBannerVisible && (game.hellraiserResult?.payoutCents ?? 0) > 0
  const pogGlowActive = game.lastPotOfGoldBetCents > 0

  const isBetting    = game.phase === 'betting'
  const isDealing    = game.phase === 'dealing'
  const isPlayerTurn = game.phase === 'player-turn'
  const isDealerTurn = game.phase === 'dealer-turn'
  const isOver       = game.phase === 'round-over'

  const push22Won = isOver && (game.push22Result?.payoutCents ?? 0) > 0

  // During dealing phase, reveal cards one at a time: player[0] → dealer[0] → player[1] → dealer[1]
  const playerVisibleCount = isDealing
    ? (game.revealCount >= 3 ? 2 : game.revealCount >= 1 ? 1 : 0)
    : undefined
  const dealerVisibleCount = isDealing
    ? (game.revealCount >= 4 ? 2 : game.revealCount >= 2 ? 1 : 0)
    : isDealerTurn
    ? game.dealerRevealCount
    : undefined

  const multiHand  = game.engine.playerHands.length > 1
  const isQuadrant = debugSplit || game.engine.playerHands.length >= 3

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
    else if (netCents > 0)           { bannerTitle = 'Player Wins';      bannerTitleColor = 'text-emerald-400' }
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

  // Dealer total visible only when revealed
  const dealerHand = game.engine.dealer
  const dealerTotalVisible = game.dealerRevealed && dealerHand.cards.length > 0
  const { total: dealerTotal } = dealerTotalVisible
    ? handTotals(dealerHand.cards)
    : { total: 0 }

  return (
    <div className="h-[100dvh] bg-felt flex flex-col overflow-hidden">
      {showRules && <RulesModal onClose={() => setShowRules(false)} onShowSideBets={() => { setShowRules(false); setShowSideBetInfo(true) }} />}
      {showLeaderboard && (
        <LeaderboardModal
          entries={leaderboardEntries}
          highlightIndex={highlightIndex}
          onClose={() => { setShowLeaderboard(false); setHighlightIndex(undefined) }}
        />
      )}
      {showSideBetInfo && <SideBetInfoModal onClose={() => setShowSideBetInfo(false)} />}
      {showMenu && (
        <MenuModal
          onClose={() => setShowMenu(false)}
          onHowToPlay={() => setShowRules(true)}
          onLeaderboard={handleOpenLeaderboard}
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
      <div className="flex-none grid grid-cols-3 items-center pl-3 pr-5 py-3 bg-stone-900 border-b border-stone-700 shadow-[0_4px_16px_rgba(0,0,0,0.6)] z-10 relative">
        {/* Left — Bankroll */}
        <div>
          <div className="text-stone-500 text-[9px] uppercase tracking-widest">Bankroll</div>
          <div className="text-white font-bold text-base">
            ${Math.round(animatedBankroll / 100).toLocaleString()}
          </div>
        </div>

        {/* Center — always perfectly centered */}
        <div className="flex flex-col items-center">
          <div className="text-white text-[9px] uppercase tracking-widest">Free Bet</div>
          <div className="text-amber-400 font-bold text-sm">Blackjack</div>
        </div>

        {/* Right — Hamburger menu */}
        <div className="flex justify-end">
          <button
            onClick={() => setShowMenu(true)}
            className="flex flex-col justify-center gap-[5px] w-8 h-8 items-center"
          >
            <span className="block w-5 h-0.5 bg-stone-500 rounded-full" />
            <span className="block w-5 h-0.5 bg-stone-500 rounded-full" />
            <span className="block w-5 h-0.5 bg-stone-500 rounded-full" />
          </button>
        </div>
      </div>

      {/* ── Marquee banner (first load + game over only) ────────── */}
      {isBetting && (game.lastBetCents === 0 || game.isGameOver) && (
      <div className="flex-none bg-sky-300 overflow-hidden h-6 flex items-center">
        <span className="marquee-track text-[10px] font-bold text-sky-950 uppercase tracking-wide px-4">
          🏆&nbsp; Thank you for playing Free Bet Blackjack. Check back often for new features and updates! &nbsp;🏆
        </span>
      </div>
      )}

      {/* ── Dealer area ─────────────────────────────────────────── */}
      <div className={`relative flex-1 flex flex-col items-center min-h-0 ${isOver ? 'z-10' : 'z-20'} ${isQuadrant ? 'justify-start pt-[6px]' : 'justify-center py-4'}`}>

        {/* Bet overlay — left side, just below header */}
        {(isDealing || isPlayerTurn || isDealerTurn || isOver) && game.engine.playerHands.length > 0 && (
          <div className="absolute top-2 left-3 z-10 flex flex-col gap-0.5">
            <div className="text-white text-[9px] uppercase tracking-widest">Bet</div>
            <div className="text-amber-400 font-bold text-base">
              ${(game.engine.playerHands[0].betCents / 100).toLocaleString()}
            </div>
            {game.lastPotOfGoldBetCents > 0 && (
              <div className="flex items-center gap-1 mt-0.5">
                <PotOfGoldIcon className="w-4 h-4" />
                <span className="text-amber-400 text-[10px] font-bold">
                  ${(game.lastPotOfGoldBetCents / 100).toLocaleString()}
                </span>
              </div>
            )}
            {game.lastPush22BetCents > 0 && (
              <div className="flex items-center gap-1">
                <Push22Icon className="w-4 h-4" />
                <span className="text-sky-400 text-[10px] font-bold">
                  ${(game.lastPush22BetCents / 100).toLocaleString()}
                </span>
              </div>
            )}
            {game.lastHellraiserBetCents > 0 && (
              <div className="flex items-center gap-1">
                <HellraiserIcon className="w-4 h-4" />
                <span className="text-orange-400 text-[10px] font-bold">
                  ${(game.lastHellraiserBetCents / 100).toLocaleString()}
                </span>
              </div>
            )}
          </div>
        )}

        {dealerHand.cards.length > 0 ? (
          <CardHand
            hand={dealerHand}
            label="Dealer"
            hideSecond={isPlayerTurn}
            hideTotal={!game.dealerRevealed}
            showPushOn22={game.dealerRevealed && dealerTotal === 22}
            visibleCount={dealerVisibleCount}
            hellraiserGlow={hellraiserWon}
            hellraiserGlowFirstOnly={hellraiserWon}
            push22Glow={push22Won}
          />
        ) : (
          <div className="text-white text-sm uppercase tracking-widest">
            {isBetting ? 'Place your bet' : ''}
          </div>
        )}
      </div>

      {/* ── Divider / Round result banner ───────────────────────── */}
      <div className={`relative flex-none flex flex-col items-center w-full ${isOver ? 'z-20' : 'z-10'} ${isQuadrant ? '-mt-[240px] pb-[32px]' : ''}`}>
        {isOver ? (
          <>
            <div className="w-full py-3 bg-black/70 flex flex-col items-center gap-1">
              <div className={`text-2xl font-bold tracking-wide ${bannerTitleColor}`}>
                {bannerTitle}
              </div>
            </div>
            {game.potOfGoldResult && (
              <div className={`w-full py-1.5 flex items-center justify-center gap-2
                ${game.potOfGoldResult.payoutCents > 0 ? 'bg-amber-900/60' : 'bg-black/50'}`}>
                <PotOfGoldIcon className="w-4 h-4 flex-shrink-0" />
                <span className="text-[11px] font-bold uppercase tracking-wide text-amber-300">Pot of Gold</span>
                {game.potOfGoldResult.payoutCents > 0 ? (
                  <span className="text-[11px] font-bold text-emerald-400">Win</span>
                ) : (
                  <span className="text-[11px] font-bold text-red-400">Lose</span>
                )}
              </div>
            )}
            {game.push22Result && (
              <div className={`w-full py-1.5 flex items-center justify-center gap-2
                ${game.push22Result.payoutCents > 0 ? 'bg-sky-900/60' : 'bg-black/50'}`}>
                <Push22Icon className="w-4 h-4 flex-shrink-0" />
                <span className="text-[11px] font-bold uppercase tracking-wide text-sky-300">Push 22</span>
                {game.push22Result.payoutCents > 0 ? (
                  <span className="text-[11px] font-bold text-emerald-400">Win</span>
                ) : (
                  <span className="text-[11px] font-bold text-red-400">Lose</span>
                )}
              </div>
            )}
            {/* Hellraiser strip in round-over — only shown on BJ hands (otherwise shown during player-turn) */}
            {game.hellraiserResult && (dealerBJ || playerBJ) && (
              <div className={`w-full py-1.5 flex items-center justify-center gap-2
                ${game.hellraiserResult.handName ? 'bg-black/50' : 'bg-black/50'}`}>
                <HellraiserIcon className="w-4 h-4 flex-shrink-0" />
                <span className="text-[11px] font-bold uppercase tracking-wide text-orange-300">Hellraiser</span>
                {game.hellraiserResult.handName ? (
                  <span className="text-[11px] font-bold text-emerald-400">
                    {game.hellraiserResult.handName} &nbsp;+{fmtDollars(game.hellraiserResult.payoutCents)}
                  </span>
                ) : (
                  <span className="text-[11px] font-bold text-red-400">Lose</span>
                )}
              </div>
            )}
          </>
        ) : isPlayerTurn && game.hellraiserBannerVisible && game.hellraiserResult ? (
          <div className={`w-full py-2 flex items-center justify-center gap-2
            ${game.hellraiserResult.handName ? 'bg-black/60' : 'bg-black/60'}`}>
            <HellraiserIcon className="w-4 h-4 flex-shrink-0" />
            <span className="text-[11px] font-bold uppercase tracking-wide text-orange-300">Hellraiser</span>
            {game.hellraiserResult.handName ? (
              <span className="text-[11px] font-bold text-emerald-400">
                {game.hellraiserResult.handName} &nbsp;+{fmtDollars(game.hellraiserResult.payoutCents)}
              </span>
            ) : (
              <span className="text-[11px] font-bold text-red-400">Lose</span>
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
      <div className={`relative z-10 flex-1 flex flex-col items-center min-h-0 w-full ${isQuadrant ? 'justify-start pt-0 -mt-[20px]' : 'justify-center py-4'}`}>
        {debugSplit ? (
          <div className="grid grid-cols-2 gap-x-3 gap-y-0 w-full px-4">
            {[
              { cards: ['8♠', 'K♦'],        betCents: 50000, freeSplit: true,  doubled: false, freeDouble: false, isSplit: true },
              { cards: ['8♥', '5♦', '3♣'],  betCents: 50000, freeSplit: true,  doubled: true,  freeDouble: true,  isSplit: true },
              { cards: ['8♣', 'J♠'],         betCents: 50000, freeSplit: false, doubled: false, freeDouble: false, isSplit: true },
              { cards: ['8♦', '7♥', '2♠'],   betCents: 50000, freeSplit: true,  doubled: false, freeDouble: false, isSplit: true },
            ].map((hand, i) => (
              <div key={i} className={`flex items-start justify-center pt-3 ${i >= 2 ? '-mt-[20px]' : ''}`}>
                <CardHand
                  hand={hand}
                  label={`Hand ${i + 1}`}
                  isSplit
                  isActive={i === 0}
                  isDimmed={i !== 0}
                  hasFreeSplit={!!hand.freeSplit}
                  hasFreeDouble={!!(hand.doubled && hand.freeDouble)}
                />
              </div>
            ))}
          </div>
        ) : game.engine.playerHands.length > 0 ? (
          isQuadrant ? (
            <div className="grid grid-cols-2 gap-x-3 gap-y-0 w-full px-4">
              {game.engine.playerHands.map((hand, i) => {
                const active = isPlayerTurn && i === game.activeHandIndex
                const dimmed = isPlayerTurn && !active
                return (
                  <div key={i} className={`flex items-start justify-center pt-3 ${i >= 2 ? '-mt-[20px]' : ''}`}>
                    <CardHand
                      hand={hand}
                      label={`Hand ${i + 1}`}
                      isActive={active}
                      isDimmed={dimmed}
                      isSplit
                      result={isOver ? game.results[i] : undefined}
                      hasFreeSplit={!!hand.freeSplit}
                      hasFreeDouble={!!(hand.doubled && hand.freeDouble)}
                      visibleCount={playerVisibleCount}
                      hellraiserGlow={hellraiserWon}
                      pogGlow={pogGlowActive}
                    />
                  </div>
                )
              })}
            </div>
          ) : multiHand ? (
            <div className="grid grid-cols-2 gap-x-3 gap-y-0 w-full px-4">
              {game.engine.playerHands.map((hand, i) => {
                const active = isPlayerTurn && i === game.activeHandIndex
                const dimmed = isPlayerTurn && !active
                return (
                  <div key={i} className="flex items-start justify-center pt-3">
                    <CardHand
                      hand={hand}
                      label={`Hand ${i + 1}`}
                      isActive={active}
                      isDimmed={dimmed}
                      isSplit
                      result={isOver ? game.results[i] : undefined}
                      hasFreeSplit={!!hand.freeSplit}
                      hasFreeDouble={!!(hand.doubled && hand.freeDouble)}
                      visibleCount={playerVisibleCount}
                      hellraiserGlow={hellraiserWon}
                      pogGlow={pogGlowActive}
                    />
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="flex items-center justify-center w-full h-full">
              <CardHand
                hand={game.engine.playerHands[0]}
                label="You"
                isActive={isPlayerTurn}
                result={isOver ? game.results[0] : undefined}
                hasFreeSplit={!!game.engine.playerHands[0].freeSplit}
                hasFreeDouble={!!(game.engine.playerHands[0].doubled && game.engine.playerHands[0].freeDouble)}
                visibleCount={playerVisibleCount}
                hellraiserGlow={hellraiserWon}
                pogGlow={pogGlowActive}
              />
            </div>
          )
        ) : null}
      </div>

      {/* ── Bottom panel ────────────────────────────────────────── */}
      <div className={`relative flex-none bg-stone-900 rounded-t-2xl shadow-[0_-6px_24px_rgba(0,0,0,0.6)] ${game.sideBetPanelOpen ? 'z-30' : ''}`}>

        {/* Side bet drawer — slides up from behind BetPanel */}
        <SideBetPanel
          isOpen={game.sideBetPanelOpen}
          selectedSideBet={game.selectedSideBet}
          potOfGoldBetCents={game.potOfGoldBetCents}
          push22BetCents={game.push22BetCents}
          hellraiserBetCents={game.hellraiserBetCents}
          onSelectSideBet={game.selectSideBet}
          onShowInfo={() => setShowSideBetInfo(true)}
        />

        {/* Betting phase */}
        {isBetting && !game.isGameOver && (
          <div className="relative z-10 bg-stone-900 rounded-t-2xl">
            <BetPanel
              bankrollCents={game.bankrollCents}
              pendingBetCents={game.pendingBetCents}
              potOfGoldBetCents={game.potOfGoldBetCents}
              push22BetCents={game.push22BetCents}
              hellraiserBetCents={game.hellraiserBetCents}
              lastBetCents={game.lastBetCents}
              lastPotOfGoldBetCents={game.lastPotOfGoldBetCents}
              lastPush22BetCents={game.lastPush22BetCents}
              lastHellraiserBetCents={game.lastHellraiserBetCents}
              sideBetPanelOpen={game.sideBetPanelOpen}
              onAddChip={game.addChip}
              onClearBet={game.clearBet}
              onReBet={game.reBet}
              onReBetWithSideBets={game.reBetWithSideBets}
              onDeal={game.deal}
              onToggleSideBetPanel={game.toggleSideBetPanel}
            />
          </div>
        )}

        {/* Game over */}
        {isBetting && game.isGameOver && (
          <div className="flex flex-col items-center gap-3 px-4 pt-6 pb-8">
            <div className="text-stone-300 text-lg font-bold">Out of chips!</div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-stone-400 uppercase tracking-widest text-[10px]">Peak Bankroll</span>
              <span className="text-amber-400 font-bold">
                ${(game.peakBankrollCents / 100).toLocaleString()}
              </span>
            </div>
            <button
              onClick={handleResetGame}
              className="relative overflow-hidden w-full py-4 rounded-xl bg-emerald-600 hover:bg-emerald-500
                text-white font-bold text-lg active:scale-95 transition-all
                shadow-[0_4px_0px_#14532d]"
            >
              <div className="absolute inset-x-0 top-0 h-3 rounded-t-xl bg-gradient-to-b from-black/25 to-transparent pointer-events-none" />
              <span className="relative">New Game</span>
            </button>
          </div>
        )}

        {/* Player-turn phase */}
        {isPlayerTurn && !game.pendingDealerTurn && (
          <div className="relative z-10">
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
          </div>
        )}

        {/* Round-over phase */}
        {isOver && (
          <div className="flex flex-col items-center gap-3 px-4 pt-4 pb-6">
            {/* Net result summary */}
            <div className={`text-2xl font-bold
              ${netCents > 0 ? 'text-emerald-400' : netCents < 0 ? 'text-red-400' : 'text-stone-300'}`}>
              {netCents !== 0 ? formatNet(netCents) : 'Push'}
            </div>
            {/* POG result line */}
            {game.potOfGoldResult && (
              <div className="flex items-center gap-1.5">
                <PotOfGoldIcon className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="text-stone-400 text-xs uppercase tracking-widest">Pot of Gold</span>
                {game.potOfGoldResult.payoutCents > 0 ? (
                  <span className="text-xs font-bold text-emerald-400">
                    +${(game.potOfGoldResult.payoutCents / 100).toLocaleString()}
                  </span>
                ) : (
                  <span className="text-xs font-bold text-red-400">
                    -${(game.lastPotOfGoldBetCents / 100).toLocaleString()}
                  </span>
                )}
              </div>
            )}
            {/* Push 22 result line */}
            {game.push22Result && (
              <div className="flex items-center gap-1.5">
                <Push22Icon className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="text-stone-400 text-xs uppercase tracking-widest">Push 22</span>
                {game.push22Result.payoutCents > 0 ? (
                  <span className="text-xs font-bold text-emerald-400">
                    +${(game.push22Result.payoutCents / 100).toLocaleString()}
                  </span>
                ) : (
                  <span className="text-xs font-bold text-red-400">
                    -${(game.lastPush22BetCents / 100).toLocaleString()}
                  </span>
                )}
              </div>
            )}
            {/* Hellraiser result line */}
            {game.hellraiserResult && (
              <div className="flex items-center gap-1.5">
                <HellraiserIcon className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="text-stone-400 text-xs uppercase tracking-widest">Hellraiser</span>
                {game.hellraiserResult.payoutCents > 0 ? (
                  <span className="text-xs font-bold text-emerald-400">
                    +${(game.hellraiserResult.payoutCents / 100).toLocaleString()}
                  </span>
                ) : (
                  <span className="text-xs font-bold text-red-400">
                    -${(game.lastHellraiserBetCents / 100).toLocaleString()}
                  </span>
                )}
              </div>
            )}
            {/* Dealer total */}
            {dealerTotalVisible && (
              <div className="text-stone-400 text-sm">
                Dealer: {dealerTotal > 22 ? 'Bust' : dealerTotal}
              </div>
            )}
            <button
              onClick={game.newHand}
              className="relative overflow-hidden w-full py-4 rounded-xl bg-emerald-600 hover:bg-emerald-500
                text-white font-bold text-lg active:scale-95 transition-all
                shadow-[0_4px_0px_#14532d] active:shadow-none active:translate-y-1"
            >
              <div className="absolute inset-x-0 top-0 h-3 rounded-t-xl bg-gradient-to-b from-black/25 to-transparent pointer-events-none" />
              <span className="relative">New Hand</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
