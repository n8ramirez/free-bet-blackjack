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
export const STARTING_BANKROLL = 50_000
export const MIN_BET            = 500
export const CHIPS              = [500, 1_000, 2_500, 5_000, 10_000, 25_000, 50_000, 100_000, 500_000]
export const CHIP_LABELS        = ['$5', '$10', '$25', '$50', '$100', '$250', '$500', '$1K', '$5K']
export const CHIP_COLORS = [
  { bg: 'bg-red-600',    border: 'border-red-400',    shadow: 'shadow-red-900/60'    },
  { bg: 'bg-blue-600',   border: 'border-blue-400',   shadow: 'shadow-blue-900/60'   },
  { bg: 'bg-green-600',  border: 'border-green-400',  shadow: 'shadow-green-900/60'  },
  { bg: 'bg-stone-600',  border: 'border-stone-400',  shadow: 'shadow-stone-900/60'  },
  { bg: 'bg-violet-700', border: 'border-violet-400', shadow: 'shadow-violet-900/60' },
  { bg: 'bg-amber-500',  border: 'border-amber-300',  shadow: 'shadow-amber-900/60'  },
  { bg: 'bg-orange-600', border: 'border-orange-400', shadow: 'shadow-orange-900/60' },
  { bg: 'bg-slate-800',  border: 'border-slate-400',  shadow: 'shadow-slate-900/60'  },
  { bg: 'bg-cyan-700',   border: 'border-cyan-400',   shadow: 'shadow-cyan-900/60'   },
]

// ---------------------------------------------------------------------------
// Pot of Gold side bet
// ---------------------------------------------------------------------------
export const POG_PAYOUTS: Record<number, number> = {
  1: 3, 2: 10, 3: 30, 4: 60, 5: 100, 6: 299, 7: 1000,
}

export type SideBetType = 'pot-of-gold'

export type PotOfGoldResult = {
  pucks:       number
  payoutCents: number
  dealerBJ:    boolean
}

function countPucks(hands: Hand[]): number {
  return hands.reduce((n, h) =>
    n + (h.freeSplit ? 1 : 0) + (h.doubled && h.freeDouble ? 1 : 0), 0)
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const TEN_VALUE = new Set(['10', 'J', 'Q', 'K'])

function playerRisk(hand: Hand): number {
  const base  = hand.freeSplit ? 0 : hand.betCents
  const extra = hand.doubled && !hand.freeDouble ? hand.betCents : 0
  return base + extra
}

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
  phase:                 Phase
  engine:                GameState
  bankrollCents:         number
  peakBankrollCents:     number
  pendingBetCents:       number
  lastBetCents:          number
  activeHandIndex:       number
  results:               HandResult[]
  dealerRevealed:        boolean
  revealCount:           number
  dealerRevealCount:     number
  dealerStartDelay:      number
  pendingDealerTurn:     boolean
  sideBetPanelOpen:      boolean
  selectedSideBet:       SideBetType
  potOfGoldBetCents:     number
  lastPotOfGoldBetCents: number
  potOfGoldResult:       PotOfGoldResult | null
}

function initial(): UIState {
  return {
    phase:                 'betting',
    engine:                createGameState(),
    bankrollCents:         STARTING_BANKROLL,
    peakBankrollCents:     STARTING_BANKROLL,
    pendingBetCents:       0,
    lastBetCents:          0,
    activeHandIndex:       0,
    results:               [],
    dealerRevealed:        false,
    revealCount:           0,
    dealerRevealCount:     0,
    dealerStartDelay:      0,
    pendingDealerTurn:     false,
    sideBetPanelOpen:      false,
    selectedSideBet:       'pot-of-gold',
    potOfGoldBetCents:     0,
    lastPotOfGoldBetCents: 0,
    potOfGoldResult:       null,
  }
}

// ---------------------------------------------------------------------------
// Dealer turn helpers
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

function finishFromDealerTurn(base: UIState): UIState {
  const { engine } = base
  const results = resolveRound(engine)

  let bankroll = base.bankrollCents
  engine.playerHands.forEach((hand, i) => {
    bankroll += playerRisk(hand) + results[i].payoutCents
  })

  // Pot of Gold resolution
  let potOfGoldResult: PotOfGoldResult | null = null
  if (base.potOfGoldBetCents > 0) {
    const dealerBJ    = isBlackjack(engine.dealer.cards)
    const pucks       = countPucks(engine.playerHands)
    const multiplier  = POG_PAYOUTS[pucks]
    const payoutCents = (dealerBJ || !multiplier)
      ? -base.potOfGoldBetCents
      : base.potOfGoldBetCents * multiplier
    bankroll += base.potOfGoldBetCents + payoutCents
    potOfGoldResult = { pucks, payoutCents, dealerBJ }
  }

  return {
    ...base,
    phase:             'round-over',
    bankrollCents:     bankroll,
    peakBankrollCents: Math.max(base.peakBankrollCents, bankroll),
    results,
    dealerRevealed:    true,
    potOfGoldResult,
  }
}

function advanceFrom(base: UIState, engine: GameState, doneIndex: number): UIState {
  let next = doneIndex + 1
  while (next < engine.playerHands.length && handIsDone(engine.playerHands[next])) next++
  if (next >= engine.playerHands.length) return startDealerTurn(base, engine)
  return { ...base, engine, activeHandIndex: next }
}

function afterHit(base: UIState, engine: GameState): UIState {
  const hand = engine.playerHands[base.activeHandIndex]
  if (handIsDone(hand)) return advanceFrom(base, engine, base.activeHandIndex)
  return { ...base, engine }
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------
export function useGameState() {
  const [state, setState] = useState<UIState>(initial)

  const { phase, revealCount, engine, activeHandIndex, dealerRevealCount, dealerStartDelay, pendingDealerTurn } = state

  // -- Dealing animation --
  useEffect(() => {
    if (phase !== 'dealing') return
    if (revealCount >= 4) {
      setState(s => {
        if (s.phase !== 'dealing') return s
        const engine   = cloneEngine(s.engine)
        const playerBJ = isBlackjack(engine.playerHands[0].cards)
        const upcard   = cardRank(engine.dealer.cards[0])
        const dealerBJ = (upcard === 'A' || TEN_VALUE.has(upcard)) && isBlackjack(engine.dealer.cards)
        if (playerBJ || dealerBJ) return startDealerTurn(s, engine, playerBJ && !dealerBJ)
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
  useEffect(() => {
    if (phase !== 'dealer-turn') return
    const totalCards = engine.dealer.cards.length
    const extraDelay = dealerRevealCount === 2 ? dealerStartDelay : 0
    if (dealerRevealCount >= totalCards) {
      const flipMs = dealerRevealCount === 2 ? 313 : 375
      const t = setTimeout(() => {
        setState(s => {
          if (s.phase !== 'dealer-turn') return s
          return finishFromDealerTurn(s)
        })
      }, flipMs + extraDelay)
      return () => clearTimeout(t)
    }
    const delay = dealerRevealCount === 2 ? 313 + 300 : 375 + 300
    const t = setTimeout(() => {
      setState(s => s.phase === 'dealer-turn' ? { ...s, dealerRevealCount: s.dealerRevealCount + 1 } : s)
    }, delay + extraDelay)
    return () => clearTimeout(t)
  }, [phase, dealerRevealCount, dealerStartDelay])

  // -- Pending dealer turn --
  useEffect(() => {
    if (!pendingDealerTurn || phase !== 'player-turn') return
    const t = setTimeout(() => {
      setState(s => {
        if (!s.pendingDealerTurn) return s
        const engine = cloneEngine(s.engine)
        return startDealerTurn({ ...s, pendingDealerTurn: false }, engine)
      })
    }, 450)
    return () => clearTimeout(t)
  }, [pendingDealerTurn, phase])

  // -- Betting --

  const addChip = useCallback((cents: number) => {
    setState(s => {
      if (s.phase !== 'betting') return s
      if (s.sideBetPanelOpen) {
        const next = s.potOfGoldBetCents + cents
        if (s.pendingBetCents + next > s.bankrollCents) return s
        return { ...s, potOfGoldBetCents: next }
      }
      const next = s.pendingBetCents + cents
      if (s.potOfGoldBetCents + next > s.bankrollCents) return s
      return { ...s, pendingBetCents: next }
    })
  }, [])

  const clearBet = useCallback(() => {
    setState(s => {
      if (s.phase !== 'betting') return s
      if (s.sideBetPanelOpen) return { ...s, potOfGoldBetCents: 0 }
      return { ...s, pendingBetCents: 0 }
    })
  }, [])

  const reBet = useCallback(() => {
    setState(s => {
      if (s.phase !== 'betting' || s.lastBetCents === 0) return s
      const bet = Math.min(s.lastBetCents, s.bankrollCents)
      return { ...s, pendingBetCents: bet }
    })
  }, [])

  const reBetWithSideBets = useCallback(() => {
    setState(s => {
      if (s.phase !== 'betting' || s.lastBetCents === 0) return s
      const bet    = Math.min(s.lastBetCents, s.bankrollCents)
      const pogBet = Math.min(s.lastPotOfGoldBetCents, Math.max(0, s.bankrollCents - bet))
      return { ...s, pendingBetCents: bet, potOfGoldBetCents: pogBet }
    })
  }, [])

  const toggleSideBetPanel = useCallback(() => {
    setState(s => ({ ...s, sideBetPanelOpen: !s.sideBetPanelOpen }))
  }, [])

  const deal = useCallback(() => {
    setState(s => {
      if (s.phase !== 'betting') return s
      if (s.pendingBetCents < MIN_BET) return s
      if (s.pendingBetCents + s.potOfGoldBetCents > s.bankrollCents) return s
      const shoe = s.engine.shoe.length < 52 ? createGameState().shoe : [...s.engine.shoe]
      const engine: GameState = { shoe, playerHands: [], dealer: { cards: [], betCents: 0 } }
      dealInitial(engine, s.pendingBetCents)
      return {
        ...s,
        phase:                 'dealing',
        engine,
        bankrollCents:         s.bankrollCents - s.pendingBetCents - s.potOfGoldBetCents,
        pendingBetCents:       0,
        lastBetCents:          s.pendingBetCents,
        lastPotOfGoldBetCents: s.potOfGoldBetCents,
        activeHandIndex:       0,
        results:               [],
        dealerRevealed:        false,
        revealCount:           0,
        sideBetPanelOpen:      false,
        potOfGoldResult:       null,
      }
    })
  }, [])

  // -- Player turn --

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
      let nextIdx = s.activeHandIndex + 1
      while (nextIdx < engine.playerHands.length && handIsDone(engine.playerHands[nextIdx])) nextIdx++
      if (nextIdx >= engine.playerHands.length) return { ...base, pendingDealerTurn: true }
      return { ...base, activeHandIndex: nextIdx }
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
      if (engine.playerHands[s.activeHandIndex].isSplitAce) return advanceFrom(base, engine, s.activeHandIndex)
      return base
    })
  }, [])

  // -- Round over --

  const newHand = useCallback(() => {
    setState(s => {
      if (s.phase !== 'round-over') return s
      return {
        ...initial(),
        engine:                { ...s.engine, playerHands: [], dealer: { cards: [], betCents: 0 } },
        bankrollCents:         s.bankrollCents,
        peakBankrollCents:     s.peakBankrollCents,
        lastBetCents:          s.lastBetCents,
        lastPotOfGoldBetCents: s.lastPotOfGoldBetCents,
        sideBetPanelOpen:      s.sideBetPanelOpen,
      }
    })
  }, [])

  const resetGame = useCallback(() => setState(initial), [])

  // ---------------------------------------------------------------------------
  // Derived values
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

  const currentPuckCount = ['player-turn', 'dealer-turn', 'round-over'].includes(phase)
    ? countPucks(engine.playerHands)
    : 0

  return {
    ...state,
    activeHand,
    canDoubleNow,
    canSplitNow,
    isFreeDouble:    !!(activeHand && canFreeDouble(activeHand)),
    isFreeSplit:     !!(activeHand && canSplit(activeHand) && !isTenValuePair(activeHand) && engine.playerHands.length < 4),
    isGameOver:      state.phase === 'betting' && state.bankrollCents < Math.min(...CHIPS),
    pendingDealerTurn,
    currentPuckCount,
    addChip, clearBet, reBet, reBetWithSideBets, toggleSideBetPanel,
    deal, hit, stand, double, split, newHand, resetGame,
  }
}
