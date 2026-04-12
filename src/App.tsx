import { useGameState } from './hooks/useGameState'
import { CardHand } from './components/CardHand'
import { BetPanel } from './components/BetPanel'
import { ActionBar } from './components/ActionBar'
import { handTotals, isBlackjack } from './engine'

export default function App() {
  const game = useGameState()

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
  const formatNet = (cents: number) => {
    const d = Math.abs(cents) / 100
    const s = d % 1 === 0 ? `$${d}` : `$${d.toFixed(2)}`
    return cents > 0 ? `+${s}` : `-${s}`
  }
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

      {/* ── Top bar ─────────────────────────────────────────────── */}
      <div className="flex-none flex justify-between items-center px-5 py-3 bg-felt-light border-b border-felt-border">
        <div>
          <div className="text-white text-[9px] uppercase tracking-widest">Bankroll</div>
          <div className="text-white font-bold text-xl font-game">
            ${(game.bankrollCents / 100).toLocaleString()}
          </div>
        </div>

        <div className="text-center">
          <div className="text-white text-[9px] uppercase tracking-widest">Free Bet</div>
          <div className="text-amber-400 font-bold text-sm">Blackjack</div>
        </div>

        {(isPlayerTurn || isDealerTurn || isOver) && game.engine.playerHands.length > 0 && (
          <div className="text-right">
            <div className="text-white text-[9px] uppercase tracking-widest">Bet</div>
            <div className="text-amber-400 font-bold text-xl font-game">
              ${game.engine.playerHands[0].betCents / 100}
            </div>
          </div>
        )}
        {isBetting && <div className="w-16" />}
      </div>

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
              {netCents > 0
                ? `+$${netCents / 100}`
                : netCents < 0
                ? `-$${Math.abs(netCents) / 100}`
                : 'Push'}
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
