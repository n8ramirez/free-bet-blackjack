import { Card, createShoe, draw } from './shoe'

export type Hand = {
  cards: Card[]
  betCents: number
  doubled?: boolean
  freeDouble?: boolean
  isSplitAce?: boolean
  freeSplit?: boolean
}

export type GameState = {
  shoe: Card[]
  playerHands: Hand[]
  dealer: Hand
}

export function createGameState(decks = 6): GameState {
  const shoe = createShoe(decks)
  return { shoe, playerHands: [], dealer: { cards: [], betCents: 0 } }
}

export function cardRank(card: Card) {
  // card like 'A♠' or '10♦' or 'K♣'
  return card.slice(0, card.length - 1)
}

export function cardValueForCounting(rank: string): number {
  if (rank === 'A') return 1
  if (rank === 'J' || rank === 'Q' || rank === 'K' || rank === '10') return 10
  return parseInt(rank, 10)
}

export function handTotals(cards: Card[]) {
  // returns best total <=21 and whether soft
  let total = 0
  let aces = 0
  for (const c of cards) {
    const r = cardRank(c)
    if (r === 'A') aces++
    total += cardValueForCounting(r)
  }
  // upgrade aces from 1 to 11 where possible
  let best = total
  let isSoft = false
  for (let i = 0; i < aces; i++) {
    const alt = total + 10 // counting one ace as 11 instead of 1
    if (alt <= 21) {
      best = alt
      isSoft = true
      // if multiple aces, only first upgrade matters for softness
    }
  }
  return { total: best, isSoft }
}

export function isBlackjack(cards: Card[]) {
  if (cards.length !== 2) return false
  const { total } = handTotals(cards)
  return total === 21
}

export function canFreeDouble(hand: Hand) {
  if (hand.cards.length !== 2) return false
  const { total } = handTotals(hand.cards)
  return total === 9 || total === 10 || total === 11
}

const TEN_VALUE_RANKS = new Set(['10', 'J', 'Q', 'K'])

export function canSplit(hand: Hand) {
  if (hand.cards.length !== 2) return false
  const r0 = cardRank(hand.cards[0])
  const r1 = cardRank(hand.cards[1])
  // Any two 10-value cards can be split (paid, not free)
  if (TEN_VALUE_RANKS.has(r0) && TEN_VALUE_RANKS.has(r1)) return true
  return r0 === r1
}

export function dealInitial(state: GameState, betCents = 10000) {
  const playerCards = draw(state.shoe, 2)
  const dealerCards = draw(state.shoe, 2)
  state.playerHands = [{ cards: playerCards, betCents }]
  state.dealer = { cards: dealerCards, betCents: 0 }
  return state
}

export function playerDouble(state: GameState, handIndex: number) {
  const hand = state.playerHands[handIndex]
  if (!hand) throw new Error('invalid hand')
  if (hand.cards.length !== 2) throw new Error('double allowed only on two-card hands')
  hand.doubled = true
  hand.freeDouble = canFreeDouble(hand)
  hand.cards.push(draw(state.shoe, 1)[0])
}

export function playerHit(state: GameState, handIndex: number) {
  const card = draw(state.shoe, 1)[0]
  state.playerHands[handIndex].cards.push(card)
}

export function playerStand(_state: GameState, _handIndex: number) {
  // noop — flow driven by caller
}

export function playerSplit(state: GameState, handIndex: number) {
  const hand = state.playerHands[handIndex]
  if (!canSplit(hand)) throw new Error('cannot split')
  if (hand.isSplitAce) throw new Error('cannot resplit aces')
  // limit to 4 hands
  if (state.playerHands.length >= 4) throw new Error('max splits reached')

  const cardA = hand.cards[0]
  const cardB = hand.cards[1]
  // replace original hand with first card, deal one to each new hand
  hand.cards = [cardA]
  const isTenValueSplit = TEN_VALUE_RANKS.has(cardRank(cardA))
  const newHand: Hand = { cards: [cardB], betCents: hand.betCents, freeSplit: !isTenValueSplit }
  // if splitting aces, mark isSplitAce true
  const r = cardRank(cardA)
  if (r === 'A') {
    hand.isSplitAce = true
    newHand.isSplitAce = true
  }
  state.playerHands.splice(handIndex + 1, 0, newHand)
  // deal one card to each of the two hands
  const c1 = draw(state.shoe, 1)[0]
  const c2 = draw(state.shoe, 1)[0]
  hand.cards.push(c1)
  newHand.cards.push(c2)
}

export function dealerPlay(state: GameState) {
  // dealer hits on soft 17 (H17)
  while (true) {
    const { total, isSoft } = handTotals(state.dealer.cards)
    if (total < 17) {
      state.dealer.cards.push(draw(state.shoe, 1)[0])
      continue
    }
    if (total === 17 && isSoft) {
      // H17 -> hit soft 17
      state.dealer.cards.push(draw(state.shoe, 1)[0])
      continue
    }
    break
  }
}

export type HandResult = { result: 'win' | 'loss' | 'push'; payoutCents: number; reason?: string }

export function resolveRound(state: GameState): HandResult[] {
  const results: HandResult[] = []
  const dealerBlackjack = isBlackjack(state.dealer.cards)
  const { total: dealerTotal } = handTotals(state.dealer.cards)
  const dealer22 = dealerTotal === 22

  for (const hand of state.playerHands) {
    // Split-ace hands receiving a 10-value card are 21, not blackjack
    const playerBlackjack = !hand.isSplitAce && isBlackjack(hand.cards)

    // Player's actual money at risk on this hand
    const baseRisk = hand.freeSplit ? 0 : hand.betCents
    const doubleRisk = (hand.doubled && !hand.freeDouble) ? hand.betCents : 0
    const playerRisk = baseRisk + doubleRisk

    // Total action paid out on a win
    const winAmount = (hand.doubled ? 2 : 1) * hand.betCents

    if (playerBlackjack) {
      results.push({ result: 'win', payoutCents: Math.round(hand.betCents * 1.5), reason: 'blackjack' })
      continue
    }

    if (dealerBlackjack) {
      results.push({ result: 'loss', payoutCents: playerRisk ? -playerRisk : 0, reason: 'dealer blackjack' })
      continue
    }

    if (dealer22) {
      if (playerBlackjack) {
        results.push({ result: 'win', payoutCents: Math.round(hand.betCents * 1.5), reason: 'blackjack vs dealer 22' })
      } else {
        results.push({ result: 'push', payoutCents: 0, reason: 'dealer 22 push' })
      }
      continue
    }

    const { total: playerTotal } = handTotals(hand.cards)

    if (playerTotal > 21) {
      results.push({ result: 'loss', payoutCents: playerRisk ? -playerRisk : 0, reason: 'bust' })
      continue
    }

    if (dealerTotal > 21) {
      results.push({ result: 'win', payoutCents: winAmount, reason: 'dealer bust' })
      continue
    }

    if (playerTotal > dealerTotal) {
      results.push({ result: 'win', payoutCents: winAmount, reason: 'player higher' })
    } else if (playerTotal < dealerTotal) {
      results.push({ result: 'loss', payoutCents: playerRisk ? -playerRisk : 0, reason: 'player lower' })
    } else {
      results.push({ result: 'push', payoutCents: 0, reason: 'push' })
    }
  }

  return results
}
