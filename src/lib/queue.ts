// Review queue — URL model and read path.
//
// Pure/isomorphic: the read path runs in the /api/queue route handler; the URL
// helpers run in the browser. Classification always goes
// through getQueueState (lib/domain.ts); this file never re-defines what
// "needs review", "urgent" or "handled" mean. View filtering, counting and
// paging use the `email_queue` SQL view, which mirrors getQueueState, so the
// queue is never truncated by PostgREST's max_rows cap.

import type { SupabaseClient } from '@supabase/supabase-js'
import {
  THEME_OPTIONS,
  URGENCY_OPTIONS,
  ROLE_OPTIONS,
  getQueueState,
  getReviewStatus,
  type AccountRecord,
  type QueueView,
  type ReviewStatus,
} from '@/lib/domain'
import { toPreview } from '@/lib/format'

/* ------------------------------------------------------------------ URL model */

export const QUEUE_VIEWS: QueueView[] = ['review', 'urgent', 'all', 'handled']
export const DEFAULT_VIEW: QueueView = 'review'
export const PAGE_SIZE = 50
const MAX_LIMIT = 500

export interface QueueParams {
  view: QueueView
  /** Free-text search over sender, subject and body. */
  q: string
  /** Receiving inbox by address handle, e.g. "info" for info@… */
  inbox: string | null
  theme: string | null
  role: string | null
  urgency: string | null
  /** Rows to show (grows in PAGE_SIZE steps via "Show more"). */
  limit: number
}

export type QueueFilterKey = 'inbox' | 'theme' | 'role' | 'urgency'
export const FILTER_KEYS: QueueFilterKey[] = ['inbox', 'urgency', 'theme', 'role']

type RawParams = Record<string, string | string[] | undefined> | URLSearchParams

function read(params: RawParams, key: string): string | null {
  const v = params instanceof URLSearchParams ? params.get(key) : params[key]
  const s = Array.isArray(v) ? v[0] : v
  return s && s.trim() ? s.trim() : null
}

const allowed = (options: { value: string }[]) => new Set(options.map((o) => o.value).filter((v) => v !== 'all'))
const THEMES = allowed(THEME_OPTIONS)
const URGENCIES = allowed(URGENCY_OPTIONS)
const ROLES = allowed(ROLE_OPTIONS)

/** Parses and validates URL params; unknown values are dropped, never trusted. */
export function parseQueueParams(params: RawParams): QueueParams {
  const view = read(params, 'view')
  const theme = read(params, 'theme')
  const urgency = read(params, 'urgency')
  const role = read(params, 'role')
  const inbox = read(params, 'inbox')
  const limit = Number(read(params, 'limit'))
  return {
    view: view && (QUEUE_VIEWS as string[]).includes(view) ? (view as QueueView) : DEFAULT_VIEW,
    q: (read(params, 'q') ?? '').slice(0, 120),
    inbox: inbox && /^[a-z0-9._-]{1,64}$/i.test(inbox) ? inbox.toLowerCase() : null,
    theme: theme && THEMES.has(theme) ? theme : null,
    urgency: urgency && URGENCIES.has(urgency) ? urgency : null,
    role: role && ROLES.has(role) ? role : null,
    limit: Number.isFinite(limit) && limit > PAGE_SIZE ? Math.min(Math.ceil(limit / PAGE_SIZE) * PAGE_SIZE, MAX_LIMIT) : PAGE_SIZE,
  }
}

/** Serialises params back to a query string, omitting defaults. */
export function queueSearch(params: Partial<QueueParams> & { view: QueueView }): string {
  const sp = new URLSearchParams()
  if (params.view !== DEFAULT_VIEW) sp.set('view', params.view)
  if (params.q) sp.set('q', params.q)
  for (const key of FILTER_KEYS) {
    const v = params[key]
    if (v) sp.set(key, v)
  }
  if (params.limit && params.limit > PAGE_SIZE) sp.set('limit', String(params.limit))
  const s = sp.toString()
  return s ? `?${s}` : ''
}

export function activeFilterCount(p: QueueParams): number {
  return FILTER_KEYS.filter((k) => p[k]).length
}

/** The queue itself, with its current view, search, filters and paging. */
export function queueHref(params: QueueParams): string {
  return `/${queueSearch(params)}`
}

/**
 * An email opened from the queue. The queue context travels in the URL so the
 * workspace, the sidebar highlight and "next/previous" all agree. `view` is
 * always explicit here: a bare /emails/[id] (e.g. a WhatsApp link) belongs to
 * no view.
 */
export function emailHref(id: string, params: QueueParams): string {
  const rest = queueSearch({ ...params, view: DEFAULT_VIEW })
  return `/emails/${encodeURIComponent(id)}?view=${params.view}${rest ? `&${rest.slice(1)}` : ''}`
}

/* ------------------------------------------------------------------ Read path */

export interface QueueItem {
  id: string
  fromName: string | null
  fromAddress: string
  subject: string | null
  preview: string
  receivedAt: string
  urgency: string | null
  theme: string | null
  routedRoles: string[]
  inboxAddress: string | null
  status: ReviewStatus
  needsReview: boolean
  isHandled: boolean
}

export interface QueueResult {
  items: QueueItem[]
  /** Rows matching view + filters (before paging). */
  total: number
  hasMore: boolean
  accounts: AccountRecord[]
  /** Plain-language failure; items are empty when set. Never shown as "empty". */
  error: string | null
}

interface DetailRow {
  id: string
  from_name: string | null
  from_address: string
  subject: string | null
  body_text: string | null
  received_at: string
  theme: string | null
  urgency: string | null
  routed_roles: string[] | null
  status: string
  accounts: { email_address: string } | null
  drafts:
    | { status: string; edited_text: string | null; ai_generated_text: string | null }
    | { status: string; edited_text: string | null; ai_generated_text: string | null }[]
    | null
}

export const LOAD_ERROR = 'The queue couldn’t be loaded. Check your connection and try again.'

// PostgREST `or()` syntax treats , ( ) as structure and " \ as quoting.
function sanitiseSearch(q: string): string {
  return q.replace(/[,()"\\%*]/g, ' ').replace(/\s+/g, ' ').trim()
}

export async function getQueuePage(supabase: SupabaseClient, params: QueueParams): Promise<QueueResult> {
  // 1. Accounts — for the inbox filter and to resolve the inbox handle.
  const accountsRes = await supabase.from('accounts').select('id, email_address, display_name').order('email_address')
  if (accountsRes.error) {
    console.error('[Queue] accounts:', accountsRes.error.message)
    return { items: [], total: 0, hasMore: false, accounts: [], error: LOAD_ERROR }
  }
  const accounts = (accountsRes.data ?? []) as AccountRecord[]

  // 2. One query: view, filters, ordering and paging all in SQL; `count` is the
  //    full match total, independent of the page size. Details for the visible
  //    page come back in the same response (body trimmed to a preview below).
  let candidates = supabase
    .from('email_queue')
    .select(
      'id, from_name, from_address, subject, body_text, received_at, theme, urgency, routed_roles, status, accounts(email_address), drafts(status, edited_text, ai_generated_text)',
      { count: 'exact' }
    )

  if (params.inbox) {
    const account = accounts.find((a) => a.email_address.split('@')[0].toLowerCase() === params.inbox)
    if (!account) return { items: [], total: 0, hasMore: false, accounts, error: null }
    candidates = candidates.eq('account_id', account.id)
  }
  if (params.theme) candidates = candidates.eq('theme', params.theme)
  if (params.urgency) candidates = candidates.eq('urgency', params.urgency)
  if (params.role) candidates = candidates.contains('routed_roles', [params.role])
  const q = sanitiseSearch(params.q)
  if (q) {
    const like = `"%${q}%"`
    candidates = candidates.or(
      `subject.ilike.${like},from_name.ilike.${like},from_address.ilike.${like},body_text.ilike.${like}`
    )
  }

  // 3. The view's flags are getQueueState computed in SQL.
  if (params.view === 'review') candidates = candidates.eq('needs_review', true)
  else if (params.view === 'urgent') candidates = candidates.eq('is_urgent_open', true)
  else if (params.view === 'handled') candidates = candidates.eq('is_handled', true)

  // Work views: most urgent first, newest within each level. Mail views: newest first.
  // `id` breaks ties so paging is stable.
  if (params.view === 'review' || params.view === 'urgent') candidates = candidates.order('urgency_rank', { ascending: true })
  const candRes = await candidates
    .order('received_at', { ascending: false })
    .order('id', { ascending: true })
    .range(0, params.limit - 1)
  if (candRes.error) {
    console.error('[Queue] candidates:', candRes.error.message)
    return { items: [], total: 0, hasMore: false, accounts, error: LOAD_ERROR }
  }

  const rows = (candRes.data ?? []) as unknown as DetailRow[]
  const total = candRes.count ?? rows.length

  const items: QueueItem[] = []
  for (const row of rows) {
    const draft = Array.isArray(row.drafts) ? (row.drafts[0] ?? null) : row.drafts
    const state = getQueueState(row, draft?.status ?? null)
    items.push({
      id: row.id,
      fromName: row.from_name,
      fromAddress: row.from_address,
      subject: row.subject,
      preview: toPreview(row.body_text),
      receivedAt: row.received_at,
      urgency: row.urgency,
      theme: row.theme,
      routedRoles: row.routed_roles ?? [],
      inboxAddress: row.accounts?.email_address ?? null,
      status: getReviewStatus(row, draft ?? null),
      needsReview: state.needsReview,
      isHandled: state.isHandled,
    })
  }

  return { items, total, hasMore: total > rows.length, accounts, error: null }
}

/** Plain-language count for the header, e.g. "12 waiting". */
export function queueSummary(view: QueueView, total: number, filtered: boolean): string {
  if (filtered) return `${total} matching`
  switch (view) {
    case 'review':
      return total === 0 ? 'Nothing waiting' : `${total} waiting`
    case 'urgent':
      return total === 0 ? 'None open' : `${total} open`
    case 'handled':
      return `${total} handled`
    default:
      return `${total} ${total === 1 ? 'email' : 'emails'}`
  }
}
