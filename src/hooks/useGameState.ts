import { useState, useCallback, useEffect } from 'react'
import {
  GameState, Hand, HandResult,
  createGameState, dealInitial,
  playerHit, playerDouble, playerSplit,
  dealerPlay, resolveRound,
  canSplit, canFreeDouble, cardRank,
  isBlackjack, handTotals,
} from '../engine'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
export const STARTING_BANKROLL = 50_000          // $500 in cents
export const MIN_BET            = 1_500           // $15 in cents
export const CHIPS              = [500, 1_000, 2_500, 5_000, 10_000, 25_000, 50_000, 100_000]
export const CHIP_LABELS        = ['$5', '$10', '$25', '$50', '$100', '$250', '$500', '$1K']
export const CHIP_COLORS = [
  { bg: 'bg-red-600',    border: 'border-red-400',    shadow: 'shadow-red-900/60'    },
  { bg: 'bg-blue-600',   border: 'border-blue-400',   shadow: 'shadow-blue-900/60'   },
  { bg: 'bg-green-600',  border: 'border-green-400',  shadow: 'shadow-green-900/60'  },
  { bg: 'bg-stone-600',  border: 'border-stone-400',  shadow: 'shadow-stone-900/60'  },
  { bg: 'bg-violet-700', border: 'border-violet-400', shadow: 'shadow-violet-900/60' },
  { bg: 'bg-amber-500',  border: 'border-amber-300',  shadow: 'shadow-amber-900/60'  },
  { bg: 'bg-orange-600', border: 'border-orange-400', shadow: 'shadow-orange-900/60' },
  { bg: 'bg-slate-800',  border: 'border-slate-400',  shadow: 'shadow-slate-900/60'  },
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const TEN_VALUE = new Set(['10', 'J', 'Q', 'K'])

/** Amount the player has actually put at risk on this hand. */
function playerRisk(hand: Hand): number {
  const base  = hand.freeSplit ? 0 : hand.betCents
  const extra = hand.doubled && !hand.freeDouble ? hand.betCents : 0
  return base + extra
}

/** Whether a split of this hand would be a paid (10-value) split. */
export function isTenValuePair(hand: Hand): boolean {
  if (hand.cards.length < 2) return false
  return TEN_VALUE.has(cardRank(hand.cards[0])) && TEN_VALUE.has(cardRank(hand.cards[1]))
}

function cloneEngine(engine: GameState): GameState {
  return {
    shoe:        [...engine.shoe],
    playerHands: engine.playerHands.map(h => ({ ...h, cards: [...h.cards] })),
    dealer:      { ...engine.dealer, cards: [...engine.dealer.cards] },
  }
}

/** A hand needs no further action when it has reached 21+, or is a split ace. */
function handIsDone(hand: Hand): boolean {
  return hand.isSplitAce === true || handTotals(hand.cards).total >= 21
}

// ---------------------------------------------------------------------------
// Phase type
// ---------------------------------------------------------------------------
export type Phase = 'betting' | 'dealing' | 'player-turn' | 'dealer-turn' | 'round-over'

// ---------------------------------------------------------------------------
// State shape
// ---------------------------------------------------------------------------
export type UIState = {
  phase:           Phase
  engine:          GameState
  bankrollCents:   number   // chips NOT currently at risk
  pendingBetCents: number   // bet being constructed in betting phase
  lastBetCents:    number   // previous round's bet (for rebet)
  activeHandIndex: number
  results:         HandResult[]
  dealerRevealed:    boolean
  revealCount:       number   // 0-4: how many cards have been shown during 'dealing' phase
  dealerRevealCount: number   // how many dealer cards are visible during 'dealer-turn' phase
}

function initial(): UIState {
  return {
    phase:           'betting',
    engine:          createGameState(),
    bankrollCents:   STARTING_BANKROLL,
    pendingBetCents: 0,
    lastBetCents:    0,
    activeHandIndex: 0,
    results:         [],
    dealerRevealed:    false,
    revealCount:       0,
    dealerRevealCount: 0,
  }
}

// ---------------------------------------------------------------------------
// Start dealer turn — pre-draw all cards, then animate them one by one
// ---------------------------------------------------------------------------
function startDealerTurn(base: UIState, engine: GameState, skipDraw = false): UIState {
  const allBust = engine.playerHands.every(h => handTotals(h.cards).total > 21)
  if (!allBust && !skipDraw) dealerPlay(engine)
  return {
    ...base,
    phase:             'dealer-turn',
    engine,
    dealerRevealed:    true,
    dealerRevealCount: 2,
  }
}

// ---------------------------------------------------------------------------
// Finish round after dealer animation completes
// ---------------------------------------------------------------------------
function finishFromDealerTurn(base: UIState): UIState {
  const { engine } = base
  const results = resolveRound(engine)

  // For each hand: add back (playerRisk + payoutCents).
  // playerRisk was already deducted when the bet was placed / doubled / paid-split.
  // payoutCents is net: positive on win, negative on loss, 0 on push.
  let bankroll = base.bankrollCents
  engine.playerHands.forEach((hand, i) => {
    bankroll += playerRisk(hand) + results[i].payoutCents
  })

  return {
    ...base,
    phase:          'round-over',
    bankrollCents:  bankroll,
    results,
    dealerRevealed: true,
  }
}

// ---------------------------------------------------------------------------
// Advance to next actionable hand, or finish the round
// ---------------------------------------------------------------------------
function advanceFrom(base: UIState, engine: GameState, doneIndex: number): UIState {
  let next = doneIndex + 1
  while (next < engine.playerHands.length && handIsDone(engine.playerHands[next])) {
    next++
  }
  if (next >= engine.playerHands.length) {
    return startDealerTurn(base, engine)
  }
  return { ...base, engine, activeHandIndex: next }
}

// After a hit: check if current hand is now done, then advance.
function afterHit(base: UIState, engine: GameState): UIState {
  if (handIsDone(engine.playerHands[base.activeHandIndex])) {
    return advanceFrom(base, engine, base.activeHandIndex)
  }
  return { ...base, engine }
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------
export function useGameState() {
  const [state, setState] = useState<UIState>(initial)

  // Destructured here so both the effect deps and derived-values section can use them
  const { phase, revealCount, engine, activeHandIndex, dealerRevealCount } = state

  // -- Dealing animation timer --
  // Cards are revealed one at a time: player[0] → dealer[0] → player[1] → dealer[1]
  useEffect(() => {
    if (phase !== 'dealing') return

    if (revealCount >= 4) {
      // All cards shown — check for blackjack then hand over to player
      setState(s => {
        if (s.phase !== 'dealing') return s
        const engine = cloneEngine(s.engine)
        const playerBJ = isBlackjack(engine.playerHands[0].cards)
        const upcard   = cardRank(engine.dealer.cards[0])
        const dealerBJ = (upcard === 'A' || TEN_VALUE.has(upcard)) && isBlackjack(engine.dealer.cards)
        if (playerBJ || dealerBJ) {
          return startDealerTurn(s, engine, playerBJ && !dealerBJ)
        }
        return { ...s, phase: 'player-turn' }
      })
      return
    }

    const t = setTimeout(() => {
      setState(s => s.phase === 'dealing' ? { ...s, revealCount: s.revealCount + 1 } : s)
    }, 180)
    return () => clearTimeout(t)
  }, [phase, revealCount])

  // -- Dealer-turn animation --
  // Hole card flips first (0.3125s), then each drawn card flips in with a 300ms gap after the previous.
  useEffect(() => {
    if (phase !== 'dealer-turn') return

    const totalCards = engine.dealer.cards.length

    if (dealerRevealCount >= totalCards) {
      // All cards showing — wait for the last flip then resolve the round
      const flipMs = dealerRevealCount === 2 ? 313 : 375
      const t = setTimeout(() => {
        setState(s => {
          if (s.phase !== 'dealer-turn') return s
          return finishFromDealerTurn(s)
        })
      }, flipMs)
      return () => clearTimeout(t)
    }

    // More cards to reveal — wait for current card's flip + 300ms gap
    const delay = dealerRevealCount === 2 ? 313 + 300 : 375 + 300
    const t = setTimeout(() => {
      setState(s => s.phase === 'dealer-turn' ? { ...s, dealerRevealCount: s.dealerRevealCount + 1 } : s)
    }, delay)
    return () => clearTimeout(t)
  }, [phase, dealerRevealCount])

  // -- Betting phase --

  const addChip = useCallback((cents: number) => {
    setState(s => {
      if (s.phase !== 'betting') return s
      const next = s.pendingBetCents + cents
      if (next > s.bankrollCents) return s
      return { ...s, pendingBetCents: next }
    })
  }, [])

  const clearBet = useCallback(() => {
    setState(s => s.phase === 'betting' ? { ...s, pendingBetCents: 0 } : s)
  }, [])

  const reBet = useCallback(() => {
    setState(s => {
      if (s.phase !== 'betting' || s.lastBetCents === 0) return s
      const bet = Math.min(s.lastBetCents, s.bankrollCents)
      return { ...s, pendingBetCents: bet }
    })
  }, [])

  const deal = useCallback(() => {
    setState(s => {
      if (s.phase !== 'betting') return s
      if (s.pendingBetCents < MIN_BET || s.pendingBetCents > s.bankrollCents) return s

      // Reshuffle if shoe is running low
      const shoe = s.engine.shoe.length < 52 ? createGameState().shoe : [...s.engine.shoe]
      const engine: GameState = { shoe, playerHands: [], dealer: { cards: [], betCents: 0 } }
      dealInitial(engine, s.pendingBetCents)

      return {
        ...s,
        phase:           'dealing',
        engine,
        bankrollCents:   s.bankrollCents - s.pendingBetCents,
        pendingBetCents: 0,
        lastBetCents:    s.pendingBetCents,
        activeHandIndex: 0,
        results:         [],
        dealerRevealed:  false,
        revealCount:     0,
      }
    })
  }, [])

  // -- Player-turn phase --

  const hit = useCallback(() => {
    setState(s => {
      if (s.phase !== 'player-turn') return s
      const engine = cloneEngine(s.engine)
      playerHit(engine, s.activeHandIndex)
      return afterHit(s, engine)
    })
  }, [])

  const stand = useCallback(() => {
    setState(s => {
      if (s.phase !== 'player-turn') return s
      const engine = cloneEngine(s.engine)
      return advanceFrom(s, engine, s.activeHandIndex)
    })
  }, [])

  const double = useCallback(() => {
    setState(s => {
      if (s.phase !== 'player-turn') return s
      const hand = s.engine.playerHands[s.activeHandIndex]
      if (!hand || hand.cards.length !== 2) return s

      const free = canFreeDouble(hand)
      const cost = free ? 0 : hand.betCents
      if (cost > s.bankrollCents) return s

      const engine = cloneEngine(s.engine)
      playerDouble(engine, s.activeHandIndex)

      const base = { ...s, engine, bankrollCents: s.bankrollCents - cost }
      return advanceFrom(base, engine, s.activeHandIndex)
    })
  }, [])

  const split = useCallback(() => {
    setState(s => {
      if (s.phase !== 'player-turn') return s
      const hand = s.engine.playerHands[s.activeHandIndex]
      if (!hand || !canSplit(hand)) return s
      if (s.engine.playerHands.length >= 4) return s

      const paid = isTenValuePair(hand)
      const cost = paid ? hand.betCents : 0
      if (cost > s.bankrollCents) return s

      const engine = cloneEngine(s.engine)
      playerSplit(engine, s.activeHandIndex)

      const base = { ...s, engine, bankrollCents: s.bankrollCents - cost }

      // If active hand is now a split ace, it's already done — advance
      if (engine.playerHands[s.activeHandIndex].isSplitAce) {
        return advanceFrom(base, engine, s.activeHandIndex)
      }
      return base
    })
  }, [])

  // -- Round-over phase --

  const newHand = useCallback(() => {
    setState(s => {
      if (s.phase !== 'round-over') return s
      return {
        ...initial(),
        engine:        { ...s.engine, playerHands: [], dealer: { cards: [], betCents: 0 } },
        bankrollCents: s.bankrollCents,
        lastBetCents:  s.lastBetCents,
      }
    })
  }, [])

  const resetGame = useCallback(() => setState(initial), [])

  // ---------------------------------------------------------------------------
  // Derived values for UI
  // ---------------------------------------------------------------------------
  const activeHand = phase === 'player-turn' ? engine.playerHands[activeHandIndex] ?? null : null

  const canDoubleNow = !!(
    activeHand &&
    activeHand.cards.length === 2 &&
    (canFreeDouble(activeHand) || state.bankrollCents >= activeHand.betCents)
  )

  const canSplitNow = !!(
    activeHand &&
    canSplit(activeHand) &&
    engine.playerHands.length < 4 &&
    (isTenValuePair(activeHand) ? state.bankrollCents >= activeHand.betCents : true)
  )

  return {
    ...state,
    activeHand,
    canDoubleNow,
    canSplitNow,
    isFreeDouble:    !!(activeHand && canFreeDouble(activeHand)),
    isFreeSplit:     !!(activeHand && canSplit(activeHand) && !isTenValuePair(activeHand)),
    isGameOver:      state.phase === 'betting' && state.bankrollCents < Math.min(...CHIPS),
    addChip, clearBet, reBet, deal, hit, stand, double, split, newHand, resetGame,
  }
}
