import { useState, useCallback, useEffect } from 'react'
import { playSound } from '../sounds'
import {
  GameState, Hand, HandResult,
  createGameState, dealInitial,
  playerHit, dealerPlay,
  canSplit, canDouble, playerDouble, playerSplit,
  isBlackjack, handTotals, resolveRound,
} from '../engine/classicEngine'

export const CLASSIC_STARTING_BANKROLL = 50_000
export const CLASSIC_MIN_BET           = 500
export const CHIPS                     = [500, 1_000, 2_500, 5_000, 10_000, 25_000, 50_000, 100_000, 500_000]
export const CHIP_LABELS               = ['$5', '$10', '$25', '$50', '$100', '$250', '$500', '$1K', '$5K']

// Placeholder type — side bets not yet implemented
export type ClassicSideBetType = 'lucky-ladies' | 'buster-blackjack' | 'insurance'

function handIsDone(hand: Hand): boolean {
  return hand.isSplitAce === true || handTotals(hand.cards).total >= 21
}

function cloneEngine(engine: GameState): GameState {
  return {
    shoe:        [...engine.shoe],
    playerHands: engine.playerHands.map(h => ({ ...h, cards: [...h.cards] })),
    dealer:      { ...engine.dealer, cards: [...engine.dealer.cards] },
  }
}

function playerRisk(hand: Hand): number {
  return hand.betCents + (hand.doubled ? hand.betCents : 0)
}

export type Phase = 'betting' | 'dealing' | 'player-turn' | 'dealer-turn' | 'round-over'

export type ClassicUIState = {
  phase:              Phase
  engine:             GameState
  bankrollCents:      number
  peakBankrollCents:  number
  pendingBetCents:    number
  lastBetCents:       number
  activeHandIndex:    number
  results:            HandResult[]
  dealerRevealed:     boolean
  revealCount:        number
  dealerRevealCount:  number
  dealerStartDelay:   number
  pendingDealerTurn:  boolean
  sideBetPanelOpen:   boolean
  selectedSideBet:    ClassicSideBetType
}

const BANKROLL_KEY = 'fbbj_classic_bankroll'

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
  return { bankrollCents: CLASSIC_STARTING_BANKROLL, peakBankrollCents: CLASSIC_STARTING_BANKROLL }
}

function saveBankroll(bankrollCents: number, peakBankrollCents: number) {
  try { localStorage.setItem(BANKROLL_KEY, JSON.stringify({ bankrollCents, peakBankrollCents })) } catch {}
}

function clearBankroll() {
  try { localStorage.removeItem(BANKROLL_KEY) } catch {}
}

function initial(): ClassicUIState {
  const { bankrollCents, peakBankrollCents } = loadBankroll()
  return {
    phase:             'betting',
    engine:            createGameState(),
    bankrollCents,
    peakBankrollCents,
    pendingBetCents:   0,
    lastBetCents:      0,
    activeHandIndex:   0,
    results:           [],
    dealerRevealed:    false,
    revealCount:       0,
    dealerRevealCount: 0,
    dealerStartDelay:  0,
    pendingDealerTurn: false,
    sideBetPanelOpen:  false,
    selectedSideBet:   'lucky-ladies',
  }
}

function startDealerTurn(base: ClassicUIState, engine: GameState): ClassicUIState {
  const allBust = engine.playerHands.every(h => handTotals(h.cards).total > 21)
  if (!allBust) dealerPlay(engine)
  return {
    ...base,
    phase:             'dealer-turn',
    engine,
    dealerRevealed:    true,
    dealerRevealCount: 2,
  }
}

function finishFromDealerTurn(base: ClassicUIState): ClassicUIState {
  const { engine } = base
  const results    = resolveRound(engine)

  let bankroll = base.bankrollCents
  engine.playerHands.forEach((hand, i) => {
    bankroll += playerRisk(hand) + results[i].payoutCents
  })

  const netCents = results.reduce((sum, r) => sum + r.payoutCents, 0)
  if (netCents > 0)      playSound('win')
  else if (netCents < 0) playSound('lose')
  else                   playSound('push')

  return {
    ...base,
    phase:             'round-over',
    bankrollCents:     bankroll,
    peakBankrollCents: Math.max(base.peakBankrollCents, bankroll),
    results,
    dealerRevealed:    true,
  }
}

function advanceFrom(base: ClassicUIState, engine: GameState, doneIndex: number): ClassicUIState {
  let next = doneIndex + 1
  while (next < engine.playerHands.length && handIsDone(engine.playerHands[next])) next++
  if (next >= engine.playerHands.length) return startDealerTurn(base, engine)
  return { ...base, engine, activeHandIndex: next }
}

function afterHit(base: ClassicUIState, engine: GameState): ClassicUIState {
  const hand = engine.playerHands[base.activeHandIndex]
  if (handIsDone(hand)) return advanceFrom(base, engine, base.activeHandIndex)
  return { ...base, engine }
}

export function useClassicGameState() {
  const [state, setState] = useState<ClassicUIState>(initial)

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
        const upcard   = engine.dealer.cards[0].slice(0, -1)
        const TEN      = new Set(['10', 'J', 'Q', 'K'])
        const dealerBJ = (upcard === 'A' || TEN.has(upcard)) && isBlackjack(engine.dealer.cards)

        if (playerBJ || dealerBJ) return startDealerTurn(s, engine)
        return { ...s, engine, phase: 'player-turn' }
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
      if (s.pendingBetCents + cents > s.bankrollCents) return s
      // Classic side bets not yet implemented — chips always go to main bet
      playSound('chip-main')
      return { ...s, pendingBetCents: s.pendingBetCents + cents }
    })
  }, [])

  const clearBet = useCallback(() => {
    setState(s => {
      if (s.phase !== 'betting') return s
      if (s.pendingBetCents > 0) playSound('clear-main')
      return { ...s, pendingBetCents: 0 }
    })
  }, [])

  const reBet = useCallback(() => {
    setState(s => {
      if (s.phase !== 'betting' || s.lastBetCents === 0) return s
      playSound('rebet')
      return { ...s, pendingBetCents: Math.min(s.lastBetCents, s.bankrollCents) }
    })
  }, [])

  const reBetWithSideBets = reBet

  const selectSideBet = useCallback((type: ClassicSideBetType) => {
    setState(s => ({ ...s, selectedSideBet: type }))
  }, [])

  const toggleSideBetPanel = useCallback(() => {
    playSound('click')
    setState(s => ({ ...s, sideBetPanelOpen: !s.sideBetPanelOpen }))
  }, [])

  const deal = useCallback(() => {
    playSound('click')
    setState(s => {
      if (s.phase !== 'betting') return s
      if (s.pendingBetCents < CLASSIC_MIN_BET) return s
      if (s.pendingBetCents > s.bankrollCents) return s
      const shoe = s.engine.shoe.length < 52 ? createGameState().shoe : [...s.engine.shoe]
      const engine: GameState = { shoe, playerHands: [], dealer: { cards: [], betCents: 0 } }
      dealInitial(engine, s.pendingBetCents)
      return {
        ...s,
        phase:            'dealing',
        engine,
        bankrollCents:    s.bankrollCents - s.pendingBetCents,
        pendingBetCents:  0,
        lastBetCents:     s.pendingBetCents,
        activeHandIndex:  0,
        results:          [],
        dealerRevealed:   false,
        revealCount:      0,
        sideBetPanelOpen: false,
      }
    })
  }, [])

  const hit = useCallback(() => {
    playSound('card-flip')
    setState(s => {
      if (s.phase !== 'player-turn') return s
      const engine = cloneEngine(s.engine)
      playerHit(engine, s.activeHandIndex)
      return afterHit(s, engine)
    })
  }, [])

  const stand = useCallback(() => {
    playSound('click')
    setState(s => {
      if (s.phase !== 'player-turn') return s
      const engine = cloneEngine(s.engine)
      return advanceFrom(s, engine, s.activeHandIndex)
    })
  }, [])

  const double = useCallback(() => {
    playSound('card-flip')
    setState(s => {
      if (s.phase !== 'player-turn') return s
      const hand = s.engine.playerHands[s.activeHandIndex]
      if (!hand || hand.cards.length !== 2) return s
      if (s.bankrollCents < hand.betCents) return s
      const engine = cloneEngine(s.engine)
      playerDouble(engine, s.activeHandIndex)
      const base    = { ...s, engine, bankrollCents: s.bankrollCents - hand.betCents }
      let nextIdx   = s.activeHandIndex + 1
      while (nextIdx < engine.playerHands.length && handIsDone(engine.playerHands[nextIdx])) nextIdx++
      if (nextIdx >= engine.playerHands.length) return { ...base, pendingDealerTurn: true }
      return { ...base, activeHandIndex: nextIdx }
    })
  }, [])

  const split = useCallback(() => {
    playSound('split')
    setState(s => {
      if (s.phase !== 'player-turn') return s
      const hand = s.engine.playerHands[s.activeHandIndex]
      if (!hand || !canSplit(hand)) return s
      if (s.engine.playerHands.length >= 4) return s
      if (s.bankrollCents < hand.betCents) return s
      const engine = cloneEngine(s.engine)
      playerSplit(engine, s.activeHandIndex)
      const base = { ...s, engine, bankrollCents: s.bankrollCents - hand.betCents }
      if (engine.playerHands[s.activeHandIndex].isSplitAce) return advanceFrom(base, engine, s.activeHandIndex)
      return base
    })
  }, [])

  const newHand = useCallback(() => {
    playSound('click')
    setState(s => {
      if (s.phase !== 'round-over') return s
      return {
        ...initial(),
        engine:           { ...s.engine, playerHands: [], dealer: { cards: [], betCents: 0 } },
        bankrollCents:    s.bankrollCents,
        peakBankrollCents: s.peakBankrollCents,
        lastBetCents:     s.lastBetCents,
        sideBetPanelOpen: s.sideBetPanelOpen,
        selectedSideBet:  s.selectedSideBet,
      }
    })
  }, [])

  const resetGame    = useCallback(() => { clearBankroll(); setState(initial) }, [])

  const restartGame  = useCallback(() => {
    setState(s => ({
      ...initial(),
      bankrollCents:     0,
      peakBankrollCents: s.peakBankrollCents,
    }))
  }, [])

  // -- Derived values --
  const activeHand    = phase === 'player-turn' ? engine.playerHands[activeHandIndex] ?? null : null
  const canDoubleNow  = !!(activeHand && canDouble(activeHand) && state.bankrollCents >= activeHand.betCents)
  const canSplitNow   = !!(activeHand && canSplit(activeHand) && engine.playerHands.length < 4 && state.bankrollCents >= activeHand.betCents)

  return {
    ...state,
    activeHand,
    canDoubleNow,
    canSplitNow,
    isFreeDouble:           false,
    isFreeSplit:            false,
    isGameOver:             state.phase === 'betting' && state.bankrollCents < CLASSIC_MIN_BET,
    pendingDealerTurn,
    currentPuckCount:       0,
    // Stub side-bet fields to keep App.tsx interface uniform
    potOfGoldBetCents:      0,
    push22BetCents:         0,
    hellraiserBetCents:     0,
    lastPotOfGoldBetCents:  0,
    lastPush22BetCents:     0,
    lastHellraiserBetCents: 0,
    potOfGoldResult:        null,
    push22Result:           null,
    hellraiserResult:       null,
    hellraiserBannerVisible: false,
    addChip, clearBet, reBet, reBetWithSideBets, selectSideBet, toggleSideBetPanel,
    deal, hit, stand, double, split, newHand, resetGame, restartGame,
  }
}
