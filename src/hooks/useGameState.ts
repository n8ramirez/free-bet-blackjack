import { useState, useCallback, useEffect } from 'react'
import { playSound } from '../sounds'
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

// ---------------------------------------------------------------------------
// Pot of Gold side bet
// ---------------------------------------------------------------------------
export const POG_PAYOUTS: Record<number, number> = {
  1: 3, 2: 10, 3: 30, 4: 60, 5: 100, 6: 299, 7: 1000,
}

export const PUSH22_PAYOUT = 11

// ---------------------------------------------------------------------------
// Hellraiser side bet
// ---------------------------------------------------------------------------
export const HELLRAISER_PAYOUTS: [string, number][] = [
  ['Three of a Kind Suited', 270],
  ['Straight Flush',         180],
  ['Three of a Kind',         90],
  ['Flush',                    9],
  ['Straight',                 9],
]

function cardSuit(card: string): string {
  return card[card.length - 1]
}

function rankToStraightValue(rank: string): number {
  if (rank === 'A') return 1
  if (rank === 'J') return 11
  if (rank === 'Q') return 12
  if (rank === 'K') return 13
  return parseInt(rank, 10)
}

function isThreeConsecutive(v1: number, v2: number, v3: number): boolean {
  const low = [v1, v2, v3].sort((a, b) => a - b)
  if (low[1] === low[0] + 1 && low[2] === low[1] + 1) return true
  // Try ace as high (14) — no wrap-around (K-A-2 is excluded naturally)
  const high = [v1, v2, v3].map(v => v === 1 ? 14 : v).sort((a, b) => a - b)
  return high[1] === high[0] + 1 && high[2] === high[1] + 1
}

function resolveHellraiser(c1: string, c2: string, c3: string, betCents: number): HellraiserResult {
  const r1 = cardRank(c1), r2 = cardRank(c2), r3 = cardRank(c3)
  const s1 = cardSuit(c1), s2 = cardSuit(c2), s3 = cardSuit(c3)

  const sameSuit = s1 === s2 && s2 === s3
  const sameRank = r1 === r2 && r2 === r3
  const v1 = rankToStraightValue(r1)
  const v2 = rankToStraightValue(r2)
  const v3 = rankToStraightValue(r3)
  const straight = isThreeConsecutive(v1, v2, v3)

  let handName: string | null = null
  let multiplier = 0

  if (sameRank && sameSuit)     { handName = 'Three of a Kind Suited'; multiplier = 270 }
  else if (straight && sameSuit){ handName = 'Straight Flush';         multiplier = 180 }
  else if (sameRank)            { handName = 'Three of a Kind';        multiplier = 90  }
  else if (sameSuit)            { handName = 'Flush';                  multiplier = 9   }
  else if (straight)            { handName = 'Straight';               multiplier = 9   }

  const payoutCents = handName ? betCents * multiplier : -betCents
  return { handName, payoutCents }
}

export type SideBetType = 'pot-of-gold' | 'push-22' | 'hellraiser'

export type PotOfGoldResult = {
  pucks:       number
  payoutCents: number
  dealerBJ:    boolean
}

export type Push22Result = {
  payoutCents: number
}

export type HellraiserResult = {
  handName:    string | null
  payoutCents: number
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
  phase:                   Phase
  engine:                  GameState
  bankrollCents:           number
  peakBankrollCents:       number
  pendingBetCents:         number
  lastBetCents:            number
  activeHandIndex:         number
  results:                 HandResult[]
  dealerRevealed:          boolean
  revealCount:             number
  dealerRevealCount:       number
  dealerStartDelay:        number
  pendingDealerTurn:       boolean
  sideBetPanelOpen:        boolean
  selectedSideBet:         SideBetType
  potOfGoldBetCents:       number
  lastPotOfGoldBetCents:   number
  potOfGoldResult:         PotOfGoldResult | null
  push22BetCents:          number
  lastPush22BetCents:      number
  push22Result:            Push22Result | null
  hellraiserBetCents:      number
  lastHellraiserBetCents:  number
  hellraiserResult:        HellraiserResult | null
  hellraiserBannerVisible: boolean
}

const BANKROLL_KEY = 'fbbj_bankroll'

function loadBankroll(): { bankrollCents: number; peakBankrollCents: number } {
  try {
    const raw = localStorage.getItem(BANKROLL_KEY)
    if (raw) {
      const { bankrollCents, peakBankrollCents } = JSON.parse(raw)
      if (typeof bankrollCents === 'number' && typeof peakBankrollCents === 'number') {
        return { bankrollCents, peakBankrollCents }
      }
    }
  } catch {}
  return { bankrollCents: STARTING_BANKROLL, peakBankrollCents: STARTING_BANKROLL }
}

function saveBankroll(bankrollCents: number, peakBankrollCents: number) {
  try { localStorage.setItem(BANKROLL_KEY, JSON.stringify({ bankrollCents, peakBankrollCents })) } catch {}
}

function clearBankroll() {
  try { localStorage.removeItem(BANKROLL_KEY) } catch {}
}

function initial(): UIState {
  const { bankrollCents, peakBankrollCents } = loadBankroll()
  return {
    phase:                   'betting',
    engine:                  createGameState(),
    bankrollCents,
    peakBankrollCents,
    pendingBetCents:         0,
    lastBetCents:            0,
    activeHandIndex:         0,
    results:                 [],
    dealerRevealed:          false,
    revealCount:             0,
    dealerRevealCount:       0,
    dealerStartDelay:        0,
    pendingDealerTurn:       false,
    sideBetPanelOpen:        false,
    selectedSideBet:         'pot-of-gold',
    potOfGoldBetCents:       0,
    lastPotOfGoldBetCents:   0,
    potOfGoldResult:         null,
    push22BetCents:          0,
    lastPush22BetCents:      0,
    push22Result:            null,
    hellraiserBetCents:      0,
    lastHellraiserBetCents:  0,
    hellraiserResult:        null,
    hellraiserBannerVisible: false,
  }
}

// ---------------------------------------------------------------------------
// Dealer turn helpers
// ---------------------------------------------------------------------------
function startDealerTurn(base: UIState, engine: GameState, skipDraw = false): UIState {
  const allBust   = engine.playerHands.every(h => handTotals(h.cards).total > 21)
  const hasPush22 = base.push22BetCents > 0
  if ((!allBust && !skipDraw) || hasPush22) dealerPlay(engine)
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

  // Push 22 resolution — dealer ends on exactly 22 → 11:1 payout
  let push22Result: Push22Result | null = null
  if (base.push22BetCents > 0) {
    const dealerTotal = handTotals(engine.dealer.cards).total
    const win = dealerTotal === 22
    const payoutCents = win ? base.push22BetCents * PUSH22_PAYOUT : -base.push22BetCents
    bankroll += base.push22BetCents + payoutCents
    push22Result = { payoutCents }
  }


  return {
    ...base,
    phase:             'round-over',
    bankrollCents:     bankroll,
    peakBankrollCents: Math.max(base.peakBankrollCents, bankroll),
    results,
    dealerRevealed:    true,
    potOfGoldResult,
    push22Result,
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

  useEffect(() => {
    saveBankroll(state.bankrollCents, state.peakBankrollCents)
  }, [state.bankrollCents, state.peakBankrollCents])

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

        // Resolve Hellraiser now — first 2 player cards + dealer upcard are all known
        const hellraiserResult = s.hellraiserBetCents > 0
          ? resolveHellraiser(
              engine.playerHands[0].cards[0],
              engine.playerHands[0].cards[1],
              engine.dealer.cards[0],
              s.hellraiserBetCents,
            )
          : null

        // Apply Hellraiser payout immediately — stake + net win/loss
        const hellraiserPayout = hellraiserResult
          ? s.hellraiserBetCents + hellraiserResult.payoutCents
          : 0
        const newBankroll      = s.bankrollCents + hellraiserPayout
        const sWithHR = {
          ...s,
          hellraiserResult,
          bankrollCents:     newBankroll,
          peakBankrollCents: Math.max(s.peakBankrollCents, newBankroll),
        }

        if (playerBJ || dealerBJ) {
          // BJ path — no player actions, so don't show in-play banner; show at round-over
          return startDealerTurn({ ...sWithHR, hellraiserBannerVisible: hellraiserResult !== null }, engine, playerBJ && !dealerBJ)
        }
        return {
          ...sWithHR,
          phase:                   'player-turn',
          hellraiserBannerVisible: hellraiserResult !== null,
        }
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
      const totalSpent = s.pendingBetCents + s.potOfGoldBetCents + s.push22BetCents + s.hellraiserBetCents
      if (totalSpent + cents > s.bankrollCents) return s
      if (s.sideBetPanelOpen) {
        playSound('chip-side')
        if (s.selectedSideBet === 'push-22')    return { ...s, push22BetCents:    s.push22BetCents    + cents }
        if (s.selectedSideBet === 'hellraiser') return { ...s, hellraiserBetCents: s.hellraiserBetCents + cents }
        return { ...s, potOfGoldBetCents: s.potOfGoldBetCents + cents }
      }
      playSound('chip-main')
      return { ...s, pendingBetCents: s.pendingBetCents + cents }
    })
  }, [])

  const clearBet = useCallback(() => {
    setState(s => {
      if (s.phase !== 'betting') return s
      if (s.sideBetPanelOpen) {
        const hasBet = s.selectedSideBet === 'push-22'    ? s.push22BetCents > 0
                     : s.selectedSideBet === 'hellraiser' ? s.hellraiserBetCents > 0
                     : s.potOfGoldBetCents > 0
        if (hasBet) playSound('clear-side')
        if (s.selectedSideBet === 'push-22')    return { ...s, push22BetCents: 0 }
        if (s.selectedSideBet === 'hellraiser') return { ...s, hellraiserBetCents: 0 }
        return { ...s, potOfGoldBetCents: 0 }
      }
      if (s.pendingBetCents > 0) playSound('clear-main')
      return { ...s, pendingBetCents: 0 }
    })
  }, [])

  const reBet = useCallback(() => {
    setState(s => {
      if (s.phase !== 'betting' || s.lastBetCents === 0) return s
      playSound('rebet')
      const bet = Math.min(s.lastBetCents, s.bankrollCents)
      return { ...s, pendingBetCents: bet }
    })
  }, [])

  const reBetWithSideBets = useCallback(() => {
    setState(s => {
      if (s.phase !== 'betting' || s.lastBetCents === 0) return s
      playSound('rebet')
      const bet       = Math.min(s.lastBetCents, s.bankrollCents)
      let remaining   = Math.max(0, s.bankrollCents - bet)
      const pogBet    = Math.min(s.lastPotOfGoldBetCents, remaining)
      remaining       = Math.max(0, remaining - pogBet)
      const p22Bet    = Math.min(s.lastPush22BetCents, remaining)
      remaining       = Math.max(0, remaining - p22Bet)
      const hellBet   = Math.min(s.lastHellraiserBetCents, remaining)
      return { ...s, pendingBetCents: bet, potOfGoldBetCents: pogBet, push22BetCents: p22Bet, hellraiserBetCents: hellBet }
    })
  }, [])

  const selectSideBet = useCallback((type: SideBetType) => {
    setState(s => ({ ...s, selectedSideBet: type }))
  }, [])

  const toggleSideBetPanel = useCallback(() => {
    setState(s => ({ ...s, sideBetPanelOpen: !s.sideBetPanelOpen }))
  }, [])

  const deal = useCallback(() => {
    setState(s => {
      if (s.phase !== 'betting') return s
      if (s.pendingBetCents < MIN_BET) return s
      const totalCost = s.pendingBetCents + s.potOfGoldBetCents + s.push22BetCents + s.hellraiserBetCents
      if (totalCost > s.bankrollCents) return s
      const shoe = s.engine.shoe.length < 52 ? createGameState().shoe : [...s.engine.shoe]
      const engine: GameState = { shoe, playerHands: [], dealer: { cards: [], betCents: 0 } }
      dealInitial(engine, s.pendingBetCents)
      return {
        ...s,
        phase:                   'dealing',
        engine,
        bankrollCents:           s.bankrollCents - totalCost,
        pendingBetCents:         0,
        lastBetCents:            s.pendingBetCents,
        lastPotOfGoldBetCents:   s.potOfGoldBetCents,
        lastPush22BetCents:      s.push22BetCents,
        lastHellraiserBetCents:  s.hellraiserBetCents,
        activeHandIndex:         0,
        results:                 [],
        dealerRevealed:          false,
        revealCount:             0,
        sideBetPanelOpen:        false,
        potOfGoldResult:         null,
        push22Result:            null,
        hellraiserResult:        null,
        hellraiserBannerVisible: false,
      }
    })
  }, [])

  // -- Player turn --

  const hit = useCallback(() => {
    setState(s => {
      if (s.phase !== 'player-turn') return s
      const engine = cloneEngine(s.engine)
      playerHit(engine, s.activeHandIndex)
      return afterHit({ ...s, hellraiserBannerVisible: false }, engine)
    })
  }, [])

  const stand = useCallback(() => {
    setState(s => {
      if (s.phase !== 'player-turn') return s
      const engine = cloneEngine(s.engine)
      return advanceFrom({ ...s, hellraiserBannerVisible: false }, engine, s.activeHandIndex)
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
      const base = { ...s, engine, bankrollCents: s.bankrollCents - cost, hellraiserBannerVisible: false }
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
      const base = { ...s, engine, bankrollCents: s.bankrollCents - cost, hellraiserBannerVisible: false }
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
        engine:                  { ...s.engine, playerHands: [], dealer: { cards: [], betCents: 0 } },
        bankrollCents:           s.bankrollCents,
        peakBankrollCents:       s.peakBankrollCents,
        lastBetCents:            s.lastBetCents,
        lastPotOfGoldBetCents:   s.lastPotOfGoldBetCents,
        lastPush22BetCents:      s.lastPush22BetCents,
        lastHellraiserBetCents:  s.lastHellraiserBetCents,
        sideBetPanelOpen:        s.sideBetPanelOpen,
        selectedSideBet:         s.selectedSideBet,
      }
    })
  }, [])

  const resetGame = useCallback(() => { clearBankroll(); setState(initial) }, [])

  const restartGame = useCallback(() => {
    setState(s => ({
      phase:                   'betting',
      engine:                  createGameState(),
      bankrollCents:           0,
      peakBankrollCents:       s.peakBankrollCents,
      pendingBetCents:         0,
      lastBetCents:            0,
      activeHandIndex:         0,
      results:                 [],
      dealerRevealed:          false,
      revealCount:             0,
      dealerRevealCount:       0,
      dealerStartDelay:        0,
      pendingDealerTurn:       false,
      sideBetPanelOpen:        false,
      selectedSideBet:         'pot-of-gold' as SideBetType,
      potOfGoldBetCents:       0,
      lastPotOfGoldBetCents:   0,
      potOfGoldResult:         null,
      push22BetCents:          0,
      lastPush22BetCents:      0,
      push22Result:            null,
      hellraiserBetCents:      0,
      lastHellraiserBetCents:  0,
      hellraiserResult:        null,
      hellraiserBannerVisible: false,
    }))
  }, [])

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
    addChip, clearBet, reBet, reBetWithSideBets, selectSideBet, toggleSideBetPanel,
    deal, hit, stand, double, split, newHand, resetGame, restartGame,
  }
}
