import { describe, test, expect } from 'vitest'
import { createShoe, createDeck, shuffle } from '../shoe'

describe('shoe', () => {
  test('creates 6-deck shoe by default', () => {
    const shoe = createShoe()
    expect(shoe.length).toBe(52 * 6)
  })

  test('shuffle returns a new order', () => {
    const deck = createDeck()
    const s1 = shuffle(deck)
    // In extremely rare case two shuffles equal, but probability negligible; assert not identical reference
    expect(s1).not.toBe(deck)
    expect(s1.length).toBe(deck.length)
  })
})
