import { useState } from 'react'

const STORAGE_KEY = 'fbbj_title'

export const TITLES = ['Guest', 'Rookie', 'Free Bet Pro'] as const
export type Title = typeof TITLES[number]

export function useTitle() {
  const [title, setTitleState] = useState<Title>(
    () => (localStorage.getItem(STORAGE_KEY) as Title) ?? 'Guest'
  )

  function saveTitle(t: Title) {
    localStorage.setItem(STORAGE_KEY, t)
    setTitleState(t)
  }

  return { title, saveTitle }
}
