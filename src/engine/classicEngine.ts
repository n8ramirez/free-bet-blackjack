import { draw } from './shoe'
import type { Hand, GameState } from './engine'
import {
  createGameState, cardRank,
  handTotals, isBlackjack, canSplit,
  dealInitial, playerHit, playerStand, dealerPlay,
} from './engine'

export type { Hand, GameState }
export {
  createGameState, cardRank,
  handTotals, isBlackjack, canSplit,
  dealInitial, playerHit, playerStand, dealerPlay,
}

// Any 2-card hand is eligible to double (not restricted to 9/10/11)
export function canDouble(hand: Hand): boolean {
  return hand.cards.length === 2
}

// Paid double — always costs betCents, no free variant
export function playerDouble(state: GameState, handIndex: number) {
  const hand = state.playerHands[handIndex]
  if (!hand) throw new Error('invalid hand')
  if (hand.cards.length !== 2) throw new Error('double allowed only on two-card hands')
  hand.doubled   = true
  hand.freeDouble = false
  hand.cards.push(draw(state.shoe, 1)[0])
}

// Paid split — always costs betCents, no free variant
export function playerSplit(state: GameState, handIndex: number) {
  const hand = state.playerHands[handIndex]
  if (!canSplit(hand)) throw new Error('cannot split')
  if (hand.isSplitAce) throw new Error('cannot resplit aces')
  if (state.playerHands.length >= 4) throw new Error('max splits reached')

  const cardA = hand.cards[0]
  const cardB = hand.cards[1]
  hand.cards  = [cardA]
  hand.isSplit = true
  const newHand: Hand = { cards: [cardB], betCents: hand.betCents, freeSplit: false, isSplit: true }
  const r = cardRank(cardA)
  if (r === 'A') {
    hand.isSplitAce    = true
    newHand.isSplitAce = true
  }
  state.playerHands.splice(handIndex + 1, 0, newHand)
  hand.cards.push(draw(state.shoe, 1)[0])
  newHand.cards.push(draw(state.shoe, 1)[0])
}

export type HandResult = { result: 'win' | 'loss' | 'push'; payoutCents: number; reason?: string }

// Classic resolution: dealer 22 is a bust (not a push). All bets are paid — no free doubles or splits.
export function resolveRound(state: GameState): HandResult[] {
  const results: HandResult[] = []
  const dealerBlackjack        = isBlackjack(state.dealer.cards)
  const { total: dealerTotal } = handTotals(state.dealer.cards)

  for (const hand of state.playerHands) {
    const playerBlackjack = !hand.isSplitAce && !hand.isSplit && isBlackjack(hand.cards)
    const playerRisk      = hand.betCents + (hand.doubled ? hand.betCents : 0)
    const winAmount       = (hand.doubled ? 2 : 1) * hand.betCents

    if (playerBlackjack) {
      if (dealerBlackjack) {
        results.push({ result: 'push', payoutCents: 0, reason: 'blackjack push' })
      } else {
        results.push({ result: 'win', payoutCents: Math.round(hand.betCents * 1.5), reason: 'blackjack' })
      }
      continue
    }

    if (dealerBlackjack) {
      results.push({ result: 'loss', payoutCents: -playerRisk, reason: 'dealer blackjack' })
      continue
    }

    const { total: playerTotal } = handTotals(hand.cards)

    if (playerTotal > 21) {
      results.push({ result: 'loss', payoutCents: -playerRisk, reason: 'bust' })
      continue
    }

    // Dealer 22 is a bust in Classic — falls through to the dealerTotal > 21 check
    if (dealerTotal > 21) {
      results.push({ result: 'win', payoutCents: winAmount, reason: 'dealer bust' })
      continue
    }

    if (playerTotal > dealerTotal) {
      results.push({ result: 'win', payoutCents: winAmount, reason: 'player higher' })
    } else if (playerTotal < dealerTotal) {
      results.push({ result: 'loss', payoutCents: -playerRisk, reason: 'player lower' })
    } else {
      results.push({ result: 'push', payoutCents: 0, reason: 'push' })
    }
  }

  return results
}
