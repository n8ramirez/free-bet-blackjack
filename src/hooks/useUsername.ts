import { useState } from 'react'
import { getSupabase } from '../lib/supabase'

const STORAGE_KEY = 'fbbj_username'
const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'

function generateCode(): string {
  const arr = new Uint8Array(4)
  crypto.getRandomValues(arr)
  return Array.from(arr).map(b => CHARS[b % CHARS.length]).join('')
}

/**
 * Registers a base name in Supabase and returns the full Name#XXXX display string.
 * Assigns the next available 4-digit suffix for that base (case-insensitive).
 * Falls back gracefully if Supabase is unavailable.
 */
export async function registerUsername(base: string): Promise<string> {
  const client = getSupabase()
  if (!client) return `${base}#0000`

  // Count existing entries for this base to determine next suffix
  const { count, error: countError } = await client
    .from('usernames')
    .select('id', { count: 'exact', head: true })
    .ilike('base', base)

  if (countError) return `${base}#0000`

  return insertWithSuffix(base, count ?? 0, client)
}

async function insertWithSuffix(base: string, suffix: number, client: ReturnType<typeof getSupabase>): Promise<string> {
  if (!client) return `${base}#0000`
  const display = `${base}#${String(suffix).padStart(4, '0')}`
  const { error } = await client
    .from('usernames')
    .insert({ base, suffix, display })

  // Unique constraint violation means a concurrent registration grabbed this suffix — retry
  if (error?.code === '23505') return insertWithSuffix(base, suffix + 1, client)

  return display
}

export function useUsername() {
  const [username, setUsernameState] = useState<string>(
    () => localStorage.getItem(STORAGE_KEY) ?? ''
  )
  const [showPrompt, setShowPrompt] = useState<boolean>(
    () => !localStorage.getItem(STORAGE_KEY) || new URLSearchParams(window.location.search).has('resetUsername')
  )

  function saveUsername(displayName: string) {
    localStorage.setItem(STORAGE_KEY, displayName)
    setUsernameState(displayName)
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
