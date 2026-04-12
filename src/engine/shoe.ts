export type Card = string

const RANKS = ['A','2','3','4','5','6','7','8','9','10','J','Q','K']
const SUITS = ['♠','♥','♦','♣']

export function createDeck(): Card[] {
  const deck: Card[] = []
  for (const r of RANKS) for (const s of SUITS) deck.push(`${r}${s}`)
  return deck
}

export function createShoe(decks = 6): Card[] {
  const shoe: Card[] = []
  for (let i = 0; i < decks; i++) shoe.push(...createDeck())
  return shuffle(shoe)
}

export function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice()
  const randFloat = () => {
    if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
      const buf = new Uint32Array(1)
      crypto.getRandomValues(buf)
      return buf[0] / 0x100000000
    }
    return Math.random()
  }
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(randFloat() * (i + 1))
    const tmp = a[i]
    a[i] = a[j]
    a[j] = tmp
  }
  return a
}

export function draw<T>(shoe: T[], count = 1): T[] {
  return shoe.splice(0, count)
}
