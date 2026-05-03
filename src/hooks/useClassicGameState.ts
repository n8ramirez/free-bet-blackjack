import { useState, useCallback, useEffect } from 'react'
import { playSound } from '../sounds'
import { getDebugShoePrefix } from '../debug'
import { SessionStats, emptyStats } from './useGameState'
import {
  GameState, Hand, HandResult,
  createGameState, dealInitial,
  playerHit, dealerPlay,
  canSplit, canDouble, playerDouble, playerSplit,
  isBlackjack, handTotals, resolveRound, cardRank,
} from '../engine/classicEngine'

// ---------------------------------------------------------------------------
// Lady Luck side bet
// ---------------------------------------------------------------------------
export type LadyLuckResult = {
  handName: string | null
  payoutCents: number
}

// ---------------------------------------------------------------------------
// Wild 7s side bet
// ---------------------------------------------------------------------------
export type WildSevensResult = {
  handName: string | null
  payoutCents: number
  sevenPlayerIndices: number[]
  dealerUpcardIsSeven: boolean
}

export const WILD_SEVENS_PAYOUTS: [string, number][] = [
  ['Three 7s of Diamonds', 1000],
  ['Three 7s Suited',       500],
  ['Three 7s Unsuited',     250],
  ['Two 7s Suited',         100],
  ['Two 7s Unsuited',        25],
  ['One 7',                   3],
]

function resolveWildSevens(
  c1: string, c2: string, dealerUp: string,
  betCents: number,
): WildSevensResult {
  const cards = [c1, c2, dealerUp]
  const tagged = cards.map((c, i) => ({ isSeven: c.slice(0, -1) === '7', suit: c[c.length - 1], idx: i }))
  const sevens = tagged.filter(c => c.isSeven)
  const count  = sevens.length
  const sevenPlayerIndices = tagged.slice(0, 2).filter(c => c.isSeven).map(c => c.idx)
  const dealerUpcardIsSeven = tagged[2].isSeven

  if (count === 0) return { handName: null, payoutCents: -betCents, sevenPlayerIndices: [], dealerUpcardIsSeven: false }

  const suits       = sevens.map(c => c.suit)
  const allSameSuit = count > 1 && suits.every(s => s === suits[0])
  const allDiamonds = allSameSuit && suits[0] === '♦'

  let handName: string
  let multiplier: number

  if      (count === 3 && allDiamonds)  { handName = 'Three 7s of Diamonds'; multiplier = 1000 }
  else if (count === 3 && allSameSuit)  { handName = 'Three 7s Suited';      multiplier = 500  }
  else if (count === 3)                 { handName = 'Three 7s Unsuited';     multiplier = 250  }
  else if (count === 2 && allSameSuit)  { handName = 'Two 7s Suited';        multiplier = 100  }
  else if (count === 2)                 { handName = 'Two 7s Unsuited';       multiplier = 25   }
  else                                  { handName = 'One 7';                multiplier = 3    }

  return { handName, payoutCents: betCents * multiplier, sevenPlayerIndices, dealerUpcardIsSeven }
}

// ---------------------------------------------------------------------------
// Buster Blackjack side bet
// ---------------------------------------------------------------------------
export type BusterBlackjackResult = {
  handName: string | null
  payoutCents: number
}

export const BUSTER_BLACKJACK_PAYOUTS: [string, number][] = [
  ['8+ Cards + Player Blackjack', 2000],
  ['7 Cards + Player Blackjack',   800],
  ['8+ Cards',                     250],
  ['7 Cards',                       50],
  ['6 Cards',                       18],
  ['5 Cards',                        4],
  ['3–4 Cards',                      2],
]

function resolveBusterBlackjack(
  dealerCards: string[],
  playerBJ: boolean,
  betCents: number,
): BusterBlackjackResult {
  const { total: dealerTotal } = handTotals(dealerCards)
  if (dealerTotal <= 21) return { handName: null, payoutCents: -betCents }

  const cardCount = dealerCards.length
  let handName: string
  let multiplier: number

  if      (cardCount >= 8 && playerBJ)       { handName = '8+ Cards + Player Blackjack'; multiplier = 2000 }
  else if (cardCount === 7 && playerBJ)       { handName = '7 Cards + Player Blackjack';  multiplier = 800  }
  else if (cardCount >= 8)                    { handName = '8+ Cards';                    multiplier = 250  }
  else if (cardCount === 7)                   { handName = '7 Cards';                     multiplier = 50   }
  else if (cardCount === 6)                   { handName = '6 Cards';                     multiplier = 18   }
  else if (cardCount === 5)                   { handName = '5 Cards';                     multiplier = 4    }
  else                                        { handName = `${cardCount} Cards`;          multiplier = 2    }

  return { handName, payoutCents: betCents * multiplier }
}

export const LADY_LUCK_PAYOUTS: [string, number][] = [
  ['Queen of Hearts Pair + Dealer Blackjack', 1000],
  ['Queen of Hearts Pair', 200],
  ['Matched 20',            25],
  ['Suited 20',             10],
  ['Any 20',                 4],
]

function resolveLadyLuck(
  c1: string, c2: string,
  dealerBJ: boolean,
  betCents: number,
): LadyLuckResult {
  const r1 = cardRank(c1), r2 = cardRank(c2)
  const s1 = c1[c1.length - 1], s2 = c2[c2.length - 1]

  const { total } = handTotals([c1, c2])
  if (total !== 20) return { handName: null, payoutCents: -betCents }

  const bothQueens = r1 === 'Q' && r2 === 'Q'
  const bothQH     = bothQueens && s1 === '♥' && s2 === '♥'
  const sameRank   = r1 === r2
  const sameSuit   = s1 === s2

  let handName: string | null
  let multiplier: number

  if (bothQH && dealerBJ)    { handName = 'Queen of Hearts Pair + Dealer Blackjack';     multiplier = 1000 }
  else if (bothQH)           { handName = 'Queen of Hearts Pair'; multiplier = 200  }
  else if (sameRank && sameSuit) { handName = 'Matched 20';       multiplier = 25   }
  else if (sameSuit)         { handName = 'Suited 20';            multiplier = 10   }
  else                       { handName = 'Any 20';               multiplier = 4    }

  return { handName, payoutCents: betCents * multiplier }
}

export const CLASSIC_STARTING_BANKROLL = 50_000
export const CLASSIC_MIN_BET           = 500
export const CHIPS                     = [500, 1_000, 2_500, 5_000, 10_000, 25_000, 50_000, 100_000, 500_000]
export const CHIP_LABELS               = ['$5', '$10', '$25', '$50', '$100', '$250', '$500', '$1K', '$5K']

export type ClassicSideBetType = 'lady-luck' | 'buster-blackjack' | 'wild-7s'

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
  sideBetPanelOpen:        boolean
  selectedSideBet:         ClassicSideBetType
  ladyLuckBetCents:          number
  lastLadyLuckBetCents:      number
  ladyLuckResult:            LadyLuckResult | null
  ladyLuckBannerVisible:     boolean
  busterBlackjackBetCents:      number
  lastBusterBlackjackBetCents:  number
  busterBlackjackResult:        BusterBlackjackResult | null
  wildSevensBetCents:           number
  lastWildSevensBetCents:       number
  wildSevensResult:             WildSevensResult | null
  wildSevensBannerVisible:      boolean
  sessionStats:            SessionStats
  roundStartBankrollCents: number
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
    sideBetPanelOpen:        false,
    selectedSideBet:         'lady-luck',
    ladyLuckBetCents:          0,
    lastLadyLuckBetCents:      0,
    ladyLuckResult:            null,
    ladyLuckBannerVisible:     false,
    busterBlackjackBetCents:      0,
    lastBusterBlackjackBetCents:  0,
    busterBlackjackResult:        null,
    wildSevensBetCents:           0,
    lastWildSevensBetCents:       0,
    wildSevensResult:             null,
    wildSevensBannerVisible:      false,
    sessionStats:            emptyStats(),
    roundStartBankrollCents: 0,
  }
}

function startDealerTurn(base: ClassicUIState, engine: GameState): ClassicUIState {
  const allBust = engine.playerHands.every(h => handTotals(h.cards).total > 21)
  if (!allBust || base.lastBusterBlackjackBetCents > 0) dealerPlay(engine)
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

  // Resolve Buster Blackjack
  let bbResult: BusterBlackjackResult | null = null
  if (base.lastBusterBlackjackBetCents > 0) {
    const playerBJ = results.some(r => r.reason === 'blackjack' || r.reason === 'blackjack push')
    bbResult = resolveBusterBlackjack(engine.dealer.cards, playerBJ, base.lastBusterBlackjackBetCents)
    bankroll += base.lastBusterBlackjackBetCents + bbResult.payoutCents
  }

  const mainNet    = results.reduce((sum, r) => sum + r.payoutCents, 0)
  const netCents   = mainNet + (bbResult?.payoutCents ?? 0)
  const llDealerBJ = base.ladyLuckResult?.handName === 'Queen of Hearts Pair + Dealer Blackjack'
  if (netCents > 0)                       playSound('win')
  else if (netCents < 0 && !llDealerBJ)   playSound('lose')
  else if (netCents === 0)                playSound('push')

  // Accumulate session stats
  const prev      = base.sessionStats
  const roundNet  = bankroll - base.roundStartBankrollCents
  const sideRounds = { ...prev.sideBetRounds }
  if (base.lastLadyLuckBetCents        > 0) sideRounds['Lady Luck']        = (sideRounds['Lady Luck']        || 0) + 1
  if (base.lastBusterBlackjackBetCents > 0) sideRounds['Buster Blackjack'] = (sideRounds['Buster Blackjack'] || 0) + 1
  if (base.lastWildSevensBetCents      > 0) sideRounds['Wild 7s']          = (sideRounds['Wild 7s']          || 0) + 1
  const sessionStats: SessionStats = {
    handsPlayed:      prev.handsPlayed + results.length,
    handsWon:         prev.handsWon    + results.filter(r => r.result === 'win').length,
    handsLost:        prev.handsLost   + results.filter(r => r.result === 'loss').length,
    handsPushed:      prev.handsPushed + results.filter(r => r.result === 'push').length,
    playerBlackjacks: prev.playerBlackjacks + results.filter(r => r.reason === 'blackjack' || r.reason === 'blackjack push' || r.reason === 'blackjack vs dealer 22').length,
    dealerBlackjacks: prev.dealerBlackjacks + (results.some(r => r.reason === 'dealer blackjack' || r.reason === 'blackjack push') ? 1 : 0),
    busts:            prev.busts       + results.filter(r => r.reason === 'bust').length,
    freeSplits:       0,
    freeDoubles:      0,
    biggestWinCents:  roundNet > 0 ? Math.max(prev.biggestWinCents,  roundNet)  : prev.biggestWinCents,
    biggestLossCents: roundNet < 0 ? Math.max(prev.biggestLossCents, -roundNet) : prev.biggestLossCents,
    sideBetRounds:    sideRounds,
  }

  return {
    ...base,
    phase:                 'round-over',
    bankrollCents:         bankroll,
    peakBankrollCents:     Math.max(base.peakBankrollCents, bankroll),
    results,
    dealerRevealed:        true,
    busterBlackjackResult: bbResult,
    sessionStats,
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

        // Resolve Lady Luck on first two player cards
        const llResult = s.lastLadyLuckBetCents > 0
          ? resolveLadyLuck(
              engine.playerHands[0].cards[0],
              engine.playerHands[0].cards[1],
              dealerBJ,
              s.lastLadyLuckBetCents,
            )
          : null
        const llPayout = llResult ? s.lastLadyLuckBetCents + llResult.payoutCents : 0

        // Resolve Wild 7s on first two player cards + dealer upcard
        const w7Result = s.lastWildSevensBetCents > 0
          ? resolveWildSevens(
              engine.playerHands[0].cards[0],
              engine.playerHands[0].cards[1],
              engine.dealer.cards[0],
              s.lastWildSevensBetCents,
            )
          : null
        const w7Payout = w7Result ? s.lastWildSevensBetCents + w7Result.payoutCents : 0

        // On BJ paths, skip side-bet sounds — finishFromDealerTurn plays the main sound.
        // Exception: the QH Pair + Dealer BJ bonus always gets its win sound.
        if (!playerBJ && !dealerBJ) {
          const sideBetNet = (llResult?.payoutCents ?? 0) + (w7Result?.payoutCents ?? 0)
          if (llResult || w7Result) {
            if (sideBetNet > 0)      playSound('side-bet-win')
            else if (sideBetNet < 0) playSound('hellraiser-lose')
            else                     playSound('push')
          }
        } else if (llResult?.handName === 'Queen of Hearts Pair + Dealer Blackjack') {
          playSound('win')
        }

        const sWithSideBets = {
          ...s,
          ladyLuckResult:        llResult,
          ladyLuckBannerVisible: llResult !== null,
          wildSevensResult:      w7Result,
          wildSevensBannerVisible: w7Result !== null,
          bankrollCents:         s.bankrollCents + llPayout + w7Payout,
        }

        if (playerBJ && sWithSideBets.lastBusterBlackjackBetCents === 0) {
          // No Buster BJ bet: flip hole card and resolve immediately without dealer drawing
          return { ...sWithSideBets, engine, phase: 'dealer-turn', dealerRevealed: true, dealerRevealCount: 2 }
        }
        if (playerBJ || dealerBJ) return startDealerTurn(sWithSideBets, engine)
        return { ...sWithSideBets, engine, phase: 'player-turn' }
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
      if (s.pendingBetCents + s.ladyLuckBetCents + s.busterBlackjackBetCents + s.wildSevensBetCents + cents > s.bankrollCents) return s
      if (s.sideBetPanelOpen && s.selectedSideBet === 'lady-luck') {
        playSound('chip-side')
        return { ...s, ladyLuckBetCents: s.ladyLuckBetCents + cents }
      }
      if (s.sideBetPanelOpen && s.selectedSideBet === 'buster-blackjack') {
        playSound('chip-side')
        return { ...s, busterBlackjackBetCents: s.busterBlackjackBetCents + cents }
      }
      if (s.sideBetPanelOpen && s.selectedSideBet === 'wild-7s') {
        playSound('chip-side')
        return { ...s, wildSevensBetCents: s.wildSevensBetCents + cents }
      }
      playSound('chip-main')
      return { ...s, pendingBetCents: s.pendingBetCents + cents }
    })
  }, [])

  const clearBet = useCallback(() => {
    setState(s => {
      if (s.phase !== 'betting') return s
      if (s.sideBetPanelOpen && s.selectedSideBet === 'lady-luck' && s.ladyLuckBetCents > 0) {
        playSound('clear-side')
        return { ...s, ladyLuckBetCents: 0 }
      }
      if (s.sideBetPanelOpen && s.selectedSideBet === 'buster-blackjack' && s.busterBlackjackBetCents > 0) {
        playSound('clear-side')
        return { ...s, busterBlackjackBetCents: 0 }
      }
      if (s.sideBetPanelOpen && s.selectedSideBet === 'wild-7s' && s.wildSevensBetCents > 0) {
        playSound('clear-side')
        return { ...s, wildSevensBetCents: 0 }
      }
      if (s.pendingBetCents > 0) playSound('clear-main')
      return { ...s, pendingBetCents: 0 }
    })
  }, [])

  const reBet = useCallback(() => {
    setState(s => {
      if (s.phase !== 'betting' || s.lastBetCents === 0) return s
      playSound('rebet')
      const mainBet = Math.min(s.lastBetCents, s.bankrollCents)
      const llBet   = Math.min(s.lastLadyLuckBetCents, s.bankrollCents - mainBet)
      const bbBet   = Math.min(s.lastBusterBlackjackBetCents, s.bankrollCents - mainBet - llBet)
      const w7Bet   = Math.min(s.lastWildSevensBetCents, s.bankrollCents - mainBet - llBet - bbBet)
      return { ...s, pendingBetCents: mainBet, ladyLuckBetCents: llBet, busterBlackjackBetCents: bbBet, wildSevensBetCents: w7Bet }
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
      const totalCost = s.pendingBetCents + s.ladyLuckBetCents + s.busterBlackjackBetCents + s.wildSevensBetCents
      if (totalCost > s.bankrollCents) return s
      const shoe = s.engine.shoe.length < 52 ? createGameState().shoe : [...s.engine.shoe]
      const debugPrefix = getDebugShoePrefix()
      debugPrefix.forEach((card, i) => { shoe[i] = card })
      const engine: GameState = { shoe, playerHands: [], dealer: { cards: [], betCents: 0 } }
      dealInitial(engine, s.pendingBetCents)
      return {
        ...s,
        phase:                   'dealing',
        engine,
        bankrollCents:                s.bankrollCents - totalCost,
        pendingBetCents:              0,
        lastBetCents:                 s.pendingBetCents,
        lastLadyLuckBetCents:         s.ladyLuckBetCents,
        ladyLuckBetCents:             0,
        ladyLuckResult:               null,
        lastBusterBlackjackBetCents:  s.busterBlackjackBetCents,
        busterBlackjackBetCents:      0,
        busterBlackjackResult:        null,
        lastWildSevensBetCents:       s.wildSevensBetCents,
        wildSevensBetCents:           0,
        wildSevensResult:             null,
        wildSevensBannerVisible:      false,
        activeHandIndex:              0,
        results:                      [],
        dealerRevealed:               false,
        revealCount:                  0,
        sideBetPanelOpen:             false,
        roundStartBankrollCents:      s.bankrollCents,
      }
    })
  }, [])

  const hit = useCallback(() => {
    playSound('card-flip')
    setState(s => {
      if (s.phase !== 'player-turn') return s
      const engine = cloneEngine(s.engine)
      playerHit(engine, s.activeHandIndex)
      return afterHit({ ...s, ladyLuckBannerVisible: false, wildSevensBannerVisible: false }, engine)
    })
  }, [])

  const stand = useCallback(() => {
    playSound('click')
    setState(s => {
      if (s.phase !== 'player-turn') return s
      const engine = cloneEngine(s.engine)
      return advanceFrom({ ...s, ladyLuckBannerVisible: false, wildSevensBannerVisible: false }, engine, s.activeHandIndex)
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
      const base    = { ...s, engine, bankrollCents: s.bankrollCents - hand.betCents, ladyLuckBannerVisible: false, wildSevensBannerVisible: false }
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
      const base = { ...s, engine, bankrollCents: s.bankrollCents - hand.betCents, ladyLuckBannerVisible: false, wildSevensBannerVisible: false }
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
        engine:                  { ...s.engine, playerHands: [], dealer: { cards: [], betCents: 0 } },
        bankrollCents:           s.bankrollCents,
        peakBankrollCents:       s.peakBankrollCents,
        lastBetCents:                s.lastBetCents,
        lastLadyLuckBetCents:        s.lastLadyLuckBetCents,
        lastBusterBlackjackBetCents: s.lastBusterBlackjackBetCents,
        lastWildSevensBetCents:      s.lastWildSevensBetCents,
        sideBetPanelOpen:            s.sideBetPanelOpen,
        selectedSideBet:             s.selectedSideBet,
        sessionStats:                s.sessionStats,
      }
    })
  }, [])

  const resetGame    = useCallback(() => { clearBankroll(); setState(initial) }, [])

  const restartGame  = useCallback(() => {
    setState(s => ({
      ...initial(),
      bankrollCents:           0,
      peakBankrollCents:       s.peakBankrollCents,
      sessionStats:            emptyStats(),
      roundStartBankrollCents: 0,
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
    // Lady Luck exposed directly
    ladyLuckBetCents:      state.ladyLuckBetCents,
    lastLadyLuckBetCents:  state.lastLadyLuckBetCents,
    ladyLuckResult:        state.ladyLuckResult,
    ladyLuckBannerVisible: state.ladyLuckBannerVisible,
    // Buster Blackjack exposed directly
    busterBlackjackBetCents:      state.busterBlackjackBetCents,
    lastBusterBlackjackBetCents:  state.lastBusterBlackjackBetCents,
    busterBlackjackResult:        state.busterBlackjackResult,
    // Wild 7s exposed directly
    wildSevensBetCents:           state.wildSevensBetCents,
    lastWildSevensBetCents:       state.lastWildSevensBetCents,
    wildSevensResult:             state.wildSevensResult,
    wildSevensBannerVisible:      state.wildSevensBannerVisible,
    // Map total Classic side bets into potOfGold slot so BetPanel budget tracking works
    potOfGoldBetCents:      state.ladyLuckBetCents + state.busterBlackjackBetCents + state.wildSevensBetCents,
    lastPotOfGoldBetCents:  state.lastLadyLuckBetCents + state.lastBusterBlackjackBetCents + state.lastWildSevensBetCents,
    // Stub remaining free-bet side-bet fields
    push22BetCents:         0,
    hellraiserBetCents:     0,
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
