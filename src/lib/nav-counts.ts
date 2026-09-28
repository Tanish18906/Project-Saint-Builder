import type { SupabaseClient } from '@supabase/supabase-js'

export interface NavCounts {
  /** Emails with a reply awaiting a decision. null = unknown (load failed). */
  review: number | null
  /** Urgent emails not yet handled. */
  urgent: number | null
}

export const EMPTY_NAV_COUNTS: NavCounts = { review: null, urgent: null }

/**
 * Sidebar counts. Works with the server or browser Supabase client. Counts in
 * SQL via the `email_queue` view (which mirrors getQueueState), so no rows are
 * transferred and the result is not capped by PostgREST's max_rows. Never
 * throws — a failure yields nulls, and the sidebar simply hides the numbers
 * rather than showing a wrong zero.
 */
export async function fetchNavCounts(supabase: SupabaseClient): Promise<NavCounts> {
  try {
    const count = (flag: 'needs_review' | 'is_urgent_open') =>
      supabase.from('email_queue').select('id', { count: 'exact', head: true }).eq(flag, true)
    const [reviewRes, urgentRes] = await Promise.all([count('needs_review'), count('is_urgent_open')])
    if (reviewRes.error || urgentRes.error || reviewRes.count === null || urgentRes.count === null) return EMPTY_NAV_COUNTS
    return { review: reviewRes.count, urgent: urgentRes.count }
  } catch {
    return EMPTY_NAV_COUNTS
  }
}
