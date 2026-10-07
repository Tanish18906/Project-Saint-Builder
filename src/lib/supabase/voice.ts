import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import { createClient } from './server'

/**
 * Supabase client for server code authenticated by a signed voice token (no Supabase session).
 * Callers MUST verify the voice token first. RLS only admits signed-in staff, so voice reads/writes
 * need the service role. In production a missing key fails closed (throws) instead of silently
 * downgrading to the anon client; local dev still falls back to anon for convenience.
 */
export async function createVoiceClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set; voice portal cannot access data')
    }
    return createClient()
  }
  return createSupabaseClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
