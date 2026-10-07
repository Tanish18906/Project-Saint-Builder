import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import { createClient } from './server'

/**
 * Supabase client for server code authenticated by a signed voice token (no Supabase session).
 * Callers MUST verify the voice token first. Uses the service role so RLS can be limited to
 * signed-in staff; falls back to the anon client until SUPABASE_SERVICE_ROLE_KEY is deployed.
 */
export async function createVoiceClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  // ponytail: anon fallback keeps voice working pre-deploy, but then RLS must stay open to anon
  if (!serviceKey) return createClient()
  return createSupabaseClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
