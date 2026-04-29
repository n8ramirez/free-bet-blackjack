const SUIT_MAP: Record<string, string> = { H: '♥', D: '♦', S: '♠', C: '♣' }
const VALID_RANKS = new Set(['A','2','3','4','5','6','7','8','9','10','J','Q','K'])

function parseCard(notation: string): string | null {
  const s = notation.trim().toUpperCase()
  if (!s) return null
  const suitSym = SUIT_MAP[s.slice(-1)]
  const rank    = s.slice(0, -1)
  if (!suitSym || !VALID_RANKS.has(rank)) {
    console.warn(`[deal] Invalid card "${notation}" — use rank (A 2–9 10 J Q K) + suit (H D S C), e.g. QH 10S AH`)
    return null
  }
  return rank + suitSym
}

/**
 * Dev-only: reads ?deal=P1,D1,P2,D2,hit1,... from the URL and returns
 * cards reordered to match engine shoe draw order (P1,P2,D1,D2,hit1,...).
 * Returns [] in production or when the param is absent.
 */
export function getDebugShoePrefix(): string[] {
  if (!import.meta.env.DEV) return []
  const raw = new URLSearchParams(window.location.search).get('deal')
  if (!raw) return []

  // Parse in visual deal order: P1, D1, P2, D2, hit1, hit2, ...
  const cards = raw.split(',').map(parseCard).filter((c): c is string => c !== null)
  if (cards.length === 0) return []

  // Remap to engine shoe order: swap D1 (index 1) ↔ P2 (index 2)
  if (cards.length >= 3) [cards[1], cards[2]] = [cards[2], cards[1]]

  console.info(
    `[deal] Forcing shoe prefix: ${cards.join(' ')}`,
    '\n  Visual order was: ' + raw,
  )
  return cards
}
