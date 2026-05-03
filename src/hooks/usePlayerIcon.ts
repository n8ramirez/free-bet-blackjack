import { useState } from 'react'

const STORAGE_KEY = 'fbbj_player_icon'

export const PLAYER_ICONS = [
  { id: 0, card: null },
  { id: 1, card: 'K♠' },
  { id: 2, card: 'K♦' },
  { id: 3, card: 'Q♣' },
  { id: 4, card: 'Q♥' },
  { id: 5, card: 'A♠' },
  { id: 6, card: 'A♦' },
  { id: 7, card: 'A♣' },
  { id: 8, card: 'A♥' },
] as const

export function usePlayerIcon() {
  const [playerIcon, setIconState] = useState<number>(
    () => Number(localStorage.getItem(STORAGE_KEY) ?? 0)
  )

  function saveIcon(id: number) {
    localStorage.setItem(STORAGE_KEY, String(id))
    setIconState(id)
  }

  return { playerIcon, saveIcon }
}
