import { describe, test, expect } from 'vitest'
import {
  createGameState,
  playerDouble,
  playerSplit,
  dealerPlay,
  resolveRound,
  canSplit,
  Hand,
} from '../engine'

function makeState(playerCards: string[][], dealerCards: string[], betCents = 10000) {
  const state = createGameState(6)
  state.shoe = []
  state.playerHands = playerCards.map(pc => ({ cards: pc.slice(), betCents }))
  state.dealer = { cards: dealerCards.slice(), betCents: 0 }
  return state
}

// ---------------------------------------------------------------------------
// Free double behaviour
// ---------------------------------------------------------------------------
describe('free double', () => {
  test('free double win pays 2x bet', () => {
    // 5+6=11 → free double; draws 10 → 21 vs dealer 17
    const state = makeState([['5♠', '6♠']], ['8♣', '9♣'])
    state.shoe = ['10♦']
    playerDouble(state, 0)
    expect(state.playerHands[0].cards).toEqual(['5♠', '6♠', '10♦'])
    const res = resolveRound(state)
    expect(res[0].result).toBe('win')
    expect(res[0].payoutCents).toBe(20000)
  })

  test('free double loss charges only original bet', () => {
    // 5+6=11 → free double; draws 2 → 13 vs dealer 17
    const state = makeState([['5♠', '6♠']], ['10♣', '7♣'])
    state.shoe = ['2♦']
    playerDouble(state, 0)
    const res = resolveRound(state)
    expect(res[0].result).toBe('loss')
    expect(res[0].payoutCents).toBe(-10000)
  })

  test('free double push returns 0', () => {
    // J+6=16 doubled (free), dealer 8+8=16 → push
    const state = makeState([['J♠', '6♠']], ['8♣', '8♦'])
    state.playerHands[0].doubled = true
    state.playerHands[0].freeDouble = true
    const res = resolveRound(state)
    expect(res[0].result).toBe('push')
    expect(res[0].payoutCents).toBe(0)
  })

  test('free double with dealer blackjack charges only original bet', () => {
    // 5+6=11 → free double; dealer has blackjack
    const state = makeState([['5♠', '6♠']], ['A♣', 'K♣'])
    state.shoe = ['2♦']
    playerDouble(state, 0)
    const res = resolveRound(state)
    expect(res[0].result).toBe('loss')
    expect(res[0].payoutCents).toBe(-10000)
  })

  test('paid double loss charges 2x bet', () => {
    // J+4=14 → not free double (not 9/10/11); draws 2 → 16 vs dealer 17
    const state = makeState([['J♠', '4♠']], ['10♣', '7♣'])
    state.shoe = ['2♦']
    playerDouble(state, 0)
    expect(state.playerHands[0].freeDouble).toBe(false)
    const res = resolveRound(state)
    expect(res[0].result).toBe('loss')
    expect(res[0].payoutCents).toBe(-20000)
  })
})

// ---------------------------------------------------------------------------
// Dealer 22 push rule
// ---------------------------------------------------------------------------
describe('dealer 22', () => {
  test('dealer 22 pushes non-blackjack hands', () => {
    const state = makeState([['10♠', '7♠']], ['10♣', 'Q♣', '2♣'])
    const res = resolveRound(state)
    expect(res[0].result).toBe('push')
    expect(res[0].payoutCents).toBe(0)
  })

  test('dealer 22 does not push blackjack — pays 3:2', () => {
    const state = makeState([['A♠', 'K♠']], ['10♣', 'Q♣', '2♣'])
    const res = resolveRound(state)
    expect(res[0].result).toBe('win')
    expect(res[0].payoutCents).toBe(15000)
  })
})

// ---------------------------------------------------------------------------
// Blackjack pays 3:2
// ---------------------------------------------------------------------------
describe('blackjack', () => {
  test('blackjack pays 3:2', () => {
    const state = makeState([['A♠', 'K♠']], ['9♣', '7♣'])
    const res = resolveRound(state)
    expect(res[0].result).toBe('win')
    expect(res[0].payoutCents).toBe(15000)
  })

  test('both blackjack is a push', () => {
    const state = makeState([['A♠', 'K♠']], ['A♣', 'K♣'])
    const res = resolveRound(state)
    expect(res[0].result).toBe('push')
  })
})

// ---------------------------------------------------------------------------
// Dealer H17
// ---------------------------------------------------------------------------
describe('dealer H17', () => {
  test('dealer hits soft 17', () => {
    const state = createGameState(6)
    state.dealer = { cards: ['A♣', '6♣'], betCents: 0 }
    // A+6+K = hard 17 (ace can't be upgraded to 11) → dealer stands
    state.shoe = ['K♦']
    dealerPlay(state)
    expect(state.dealer.cards.length).toBe(3)
  })

  test('dealer stands on hard 17', () => {
    const state = createGameState(6)
    state.dealer = { cards: ['10♣', '7♣'], betCents: 0 }
    state.shoe = ['5♦']
    dealerPlay(state)
    expect(state.dealer.cards.length).toBe(2)
  })
})

// ---------------------------------------------------------------------------
// Split aces: A+10-value is 21 not blackjack, pays 1:1
// ---------------------------------------------------------------------------
describe('split aces', () => {
  test('split ace + 10-value pays 1:1, not 3:2', () => {
    const state = createGameState(6)
    state.shoe = []
    state.playerHands = [
      { cards: ['A♠', '9♣'], betCents: 10000, isSplitAce: true, freeSplit: true },
      { cards: ['A♥', 'K♦'], betCents: 10000, isSplitAce: true, freeSplit: true },
    ]
    state.dealer = { cards: ['9♦', '7♦'], betCents: 0 }
    const res = resolveRound(state)
    // A+9=20 wins
    expect(res[0].result).toBe('win')
    expect(res[0].payoutCents).toBe(10000)
    // A+K=21 but not blackjack → wins 1:1 on freeSplit hand
    expect(res[1].result).toBe('win')
    expect(res[1].payoutCents).toBe(10000)
  })
})

// ---------------------------------------------------------------------------
// canSplit rules
// ---------------------------------------------------------------------------
describe('canSplit', () => {
  test('allows 10-value pairs (same rank)', () => {
    const make = (c1: string, c2: string): Hand => ({ cards: [c1, c2], betCents: 10000 })
    expect(canSplit(make('10♠', '10♥'))).toBe(true)
    expect(canSplit(make('J♠', 'J♥'))).toBe(true)
    expect(canSplit(make('Q♠', 'Q♥'))).toBe(true)
    expect(canSplit(make('K♠', 'K♥'))).toBe(true)
  })

  test('allows mixed 10-value combinations (paid split)', () => {
    const make = (c1: string, c2: string): Hand => ({ cards: [c1, c2], betCents: 10000 })
    expect(canSplit(make('J♠', 'Q♥'))).toBe(true)
    expect(canSplit(make('K♠', '10♥'))).toBe(true)
    expect(canSplit(make('J♠', 'K♦'))).toBe(true)
  })

  test('allows non-10-value pairs (free split)', () => {
    const make = (c1: string, c2: string): Hand => ({ cards: [c1, c2], betCents: 10000 })
    expect(canSplit(make('8♠', '8♥'))).toBe(true)
    expect(canSplit(make('A♠', 'A♥'))).toBe(true)
    expect(canSplit(make('7♠', '7♦'))).toBe(true)
  })

  test('blocks mismatched non-10-value cards', () => {
    const make = (c1: string, c2: string): Hand => ({ cards: [c1, c2], betCents: 10000 })
    expect(canSplit(make('8♠', '7♥'))).toBe(false)
    expect(canSplit(make('A♠', '2♥'))).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Free split behaviour
// ---------------------------------------------------------------------------
describe('free split', () => {
  test('non-10-value pair split: new hand is freeSplit', () => {
    const state = makeState([['8♠', '8♥']], ['10♣', '6♣'])
    state.shoe = ['3♦', '4♦']
    playerSplit(state, 0)
    expect(state.playerHands.length).toBe(2)
    expect(state.playerHands[0].freeSplit).toBeFalsy()
    expect(state.playerHands[1].freeSplit).toBe(true)
  })

  test('10-value pair split: new hand is NOT freeSplit (paid split)', () => {
    const state = makeState([['J♠', 'Q♥']], ['6♣', '7♣'])
    state.shoe = ['3♦', '4♦']
    playerSplit(state, 0)
    expect(state.playerHands.length).toBe(2)
    expect(state.playerHands[0].freeSplit).toBeFalsy()
    expect(state.playerHands[1].freeSplit).toBe(false)
  })

  test('10-value paid split loss charges full bet on both hands', () => {
    const state = createGameState(6)
    state.shoe = []
    state.playerHands = [
      { cards: ['J♠', '8♣'], betCents: 10000 },              // original hand, total 18
      { cards: ['Q♥', '7♦'], betCents: 10000, freeSplit: false }, // paid split hand, total 17
    ]
    state.dealer = { cards: ['10♣', '9♣'], betCents: 0 } // dealer 19
    const res = resolveRound(state)
    expect(res[0].payoutCents).toBe(-10000) // original hand loses full bet
    expect(res[1].payoutCents).toBe(-10000) // paid split hand also loses full bet
  })

  test('free split win pays 1:1', () => {
    const state = createGameState(6)
    state.shoe = []
    state.playerHands = [{ cards: ['9♠', '8♠'], betCents: 10000, freeSplit: true }]
    state.dealer = { cards: ['6♣', '7♣'], betCents: 0 } // dealer 13
    const res = resolveRound(state)
    expect(res[0].result).toBe('win')
    expect(res[0].payoutCents).toBe(10000)
  })

  test('free split loss costs nothing', () => {
    const state = createGameState(6)
    state.shoe = []
    state.playerHands = [{ cards: ['8♠', '7♠'], betCents: 10000, freeSplit: true }]
    state.dealer = { cards: ['10♣', '9♣'], betCents: 0 } // dealer 19
    const res = resolveRound(state)
    expect(res[0].result).toBe('loss')
    expect(res[0].payoutCents).toBe(0)
  })

  test('free split push returns 0', () => {
    const state = createGameState(6)
    state.shoe = []
    state.playerHands = [{ cards: ['9♠', '8♠'], betCents: 10000, freeSplit: true }]
    state.dealer = { cards: ['10♣', '7♣'], betCents: 0 } // dealer 17
    const res = resolveRound(state)
    expect(res[0].result).toBe('push')
    expect(res[0].payoutCents).toBe(0)
  })

  test('free split bust costs nothing', () => {
    const state = createGameState(6)
    state.shoe = []
    state.playerHands = [{ cards: ['8♠', '7♠', 'K♦'], betCents: 10000, freeSplit: true }]
    state.dealer = { cards: ['10♣', '9♣'], betCents: 0 }
    const res = resolveRound(state)
    expect(res[0].result).toBe('loss')
    expect(res[0].payoutCents).toBe(0)
  })

  test('free split + free double win pays 2x bet', () => {
    const state = createGameState(6)
    state.shoe = []
    // 5+6=11 free doubled to 21, freeSplit hand, dealer 16
    state.playerHands = [{ cards: ['5♠', '6♠', '10♦'], betCents: 10000, freeSplit: true, doubled: true, freeDouble: true }]
    state.dealer = { cards: ['8♣', '8♦'], betCents: 0 }
    const res = resolveRound(state)
    expect(res[0].result).toBe('win')
    expect(res[0].payoutCents).toBe(20000)
  })

  test('free split + free double loss costs nothing', () => {
    const state = createGameState(6)
    state.shoe = []
    state.playerHands = [{ cards: ['5♠', '6♠', '2♦'], betCents: 10000, freeSplit: true, doubled: true, freeDouble: true }]
    state.dealer = { cards: ['10♣', '9♣'], betCents: 0 } // dealer 19
    const res = resolveRound(state)
    expect(res[0].result).toBe('loss')
    expect(res[0].payoutCents).toBe(0)
  })

  test('free split + paid double win pays 2x bet', () => {
    const state = createGameState(6)
    state.shoe = []
    // 5+5=10 paid doubled to 20, freeSplit hand, dealer 15
    state.playerHands = [{ cards: ['5♠', '5♦', '10♣'], betCents: 10000, freeSplit: true, doubled: true, freeDouble: false }]
    state.dealer = { cards: ['8♣', '7♦'], betCents: 0 }
    const res = resolveRound(state)
    expect(res[0].result).toBe('win')
    expect(res[0].payoutCents).toBe(20000)
  })

  test('free split + paid double loss charges only the additional bet', () => {
    const state = createGameState(6)
    state.shoe = []
    // J+4=14 paid doubled, freeSplit hand, dealer 19
    state.playerHands = [{ cards: ['J♠', '4♦', '2♣'], betCents: 10000, freeSplit: true, doubled: true, freeDouble: false }]
    state.dealer = { cards: ['10♣', '9♣'], betCents: 0 }
    const res = resolveRound(state)
    expect(res[0].result).toBe('loss')
    expect(res[0].payoutCents).toBe(-10000) // only the player's additional paid-double bet
  })

  test('dealer blackjack: original hand loses bet, free split hand loses nothing', () => {
    const state = createGameState(6)
    state.shoe = []
    state.playerHands = [
      { cards: ['8♠', '3♠'], betCents: 10000 },              // original hand
      { cards: ['8♥', '5♥'], betCents: 10000, freeSplit: true }, // free split hand
    ]
    state.dealer = { cards: ['A♣', 'K♣'], betCents: 0 }
    const res = resolveRound(state)
    expect(res[0].payoutCents).toBe(-10000)
    expect(res[1].payoutCents).toBe(0)
  })
})
