import { createClient } from '@supabase/supabase-js'
import { STARTING_BANKROLL } from './useGameState'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL as string,
  import.meta.env.VITE_SUPABASE_ANON_KEY as string,
)

export type LeaderboardEntry = {
  id?: number
  name: string
  peak_bankroll_cents: number
  created_at?: string
}

const MAX_ENTRIES = 10

/** Fetch the current top-10 from Supabase, sorted highest first. */
export async function getLeaderboard(): Promise<LeaderboardEntry[]> {
  const { data, error } = await supabase
    .from('leaderboard')
    .select('id, name, peak_bankroll_cents, created_at')
    .order('peak_bankroll_cents', { ascending: false })
    .limit(MAX_ENTRIES)

  if (error) {
    console.error('Failed to fetch leaderboard:', error.message)
    return []
  }
  return data ?? []
}

/**
 * Returns the 1-based rank the given score would achieve, or null if it doesn't qualify.
 * Pass in the current leaderboard snapshot to avoid an extra network call.
 */
export function getQualifyingRank(
  peakBankrollCents: number,
  entries: LeaderboardEntry[],
): number | null {
  if (peakBankrollCents <= STARTING_BANKROLL) return null
  const rank = entries.filter(e => e.peak_bankroll_cents > peakBankrollCents).length + 1
  if (rank > MAX_ENTRIES) return null
  return rank
}

/**
 * Insert a new high score. Returns the updated top-10 list and the index
 * of the newly inserted entry (for highlighting).
 */
export async function addToLeaderboard(
  name: string,
  peakBankrollCents: number,
): Promise<{ entries: LeaderboardEntry[]; newIndex: number }> {
  const { error } = await supabase
    .from('leaderboard')
    .insert({ name: name.trim() || 'Anonymous', peak_bankroll_cents: peakBankrollCents })

  if (error) {
    console.error('Failed to save score:', error.message)
  }

  const entries = await getLeaderboard()
  // Find the highest-ranked entry matching this name + score (most recently inserted wins ties)
  const newIndex = entries.findIndex(
    e => e.name === (name.trim() || 'Anonymous') && e.peak_bankroll_cents === peakBankrollCents,
  )
  return { entries, newIndex: newIndex >= 0 ? newIndex : 0 }
}
