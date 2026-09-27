import type { SupabaseClient } from '@supabase/supabase-js'
import { draftStatusOf, getQueueState } from '@/lib/domain'

export interface NavCounts {
  /** Emails with a reply awaiting a decision. null = unknown (load failed). */
  review: number | null
  /** Urgent emails not yet handled. */
  urgent: number | null
}

export const EMPTY_NAV_COUNTS: NavCounts = { review: null, urgent: null }

/**
 * Sidebar counts. Works with the server or browser Supabase client. Selects
 * only the columns the rules need. Never throws — a failure yields nulls, and
 * the sidebar simply hides the numbers rather than showing a wrong zero.
 */
export async function fetchNavCounts(supabase: SupabaseClient): Promise<NavCounts> {
  try {
    const { data, error } = await supabase.from('emails').select('id, urgency, status, drafts(status)')
    if (error || !data) return EMPTY_NAV_COUNTS

    let review = 0
    let urgent = 0
    for (const row of data as { status: string; urgency: string | null; drafts: { status: string } | { status: string }[] | null }[]) {
      const state = getQueueState(row, draftStatusOf(row.drafts))
      if (state.needsReview) review++
      if (state.isUrgentOpen) urgent++
    }
    return { review, urgent }
  } catch {
    return EMPTY_NAV_COUNTS
  }
}
