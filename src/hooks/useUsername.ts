import { useState } from 'react'

const STORAGE_KEY = 'fbbj_username'
const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'

function generateCode(): string {
  const arr = new Uint8Array(4)
  crypto.getRandomValues(arr)
  return Array.from(arr).map(b => CHARS[b % CHARS.length]).join('')
}

export function useUsername() {
  const [username, setUsernameState] = useState<string>(
    () => localStorage.getItem(STORAGE_KEY) ?? ''
  )
  const [showPrompt, setShowPrompt] = useState<boolean>(
    () => !localStorage.getItem(STORAGE_KEY) || new URLSearchParams(window.location.search).has('resetUsername')
  )

  function saveUsername(name: string) {
    localStorage.setItem(STORAGE_KEY, name)
    setUsernameState(name)
    setShowPrompt(false)
  }

  function skipUsername() {
    const fallback = `Player#${generateCode()}`
    localStorage.setItem(STORAGE_KEY, fallback)
    setUsernameState(fallback)
    setShowPrompt(false)
  }

  return { username, showPrompt, saveUsername, skipUsername }
}
