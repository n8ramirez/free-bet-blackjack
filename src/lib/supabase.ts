import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

let _client: SupabaseClient | null = null

export function getSupabase(): SupabaseClient | null {
  if (!url || !key) return null
  if (!_client) _client = createClient(url, key)
  return _client
}
