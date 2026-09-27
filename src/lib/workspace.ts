// Review workspace — read path and pure presentation rules.
//
// Reads only. Every write still goes through the three server actions in
// app/(app)/emails/[id]/actions.ts. Nothing here re-defines draft state: lock
// state is getDraftLockState, reply state is getReviewStatus (lib/domain.ts).

import type { SupabaseClient } from '@supabase/supabase-js'
import {
  getReviewStatus,
  parseClassificationDetails,
  type DraftRecord,
  type EmailRecord,
  type ReviewStatus,
} from '@/lib/domain'
import { confidenceToPercent, draftTypeLabel, formatRole, formatRoles, themeLabel } from '@/lib/format'

/* ------------------------------------------------------------------ Types */

export type ConfidenceLevel = 'High' | 'Medium' | 'Low'

export interface Triage {
  summary: string | null
  theme: string | null
  urgency: string | null
  routedRoles: string[]
  confidence: ConfidenceLevel | null
}

export interface WorkspaceEvent {
  id: string
  action: string
  createdAt: string | null
  label: string
  detail: string | null
  /** Who did it, when a person did. Null for automatic steps. */
  actor: string | null
}

export interface ThreadMessage {
  id: string
  fromName: string | null
  fromAddress: string
  subject: string | null
  receivedAt: string
  status: ReviewStatus
  current: boolean
}

export type WorkspaceData =
  | {
      status: 'ok'
      email: EmailRecord
      draft: DraftRecord | null
      triage: Triage
      /** Null when the activity query failed (shown as such, never as "no activity"). */
      events: WorkspaceEvent[] | null
      /** Received messages in the same conversation, oldest first; empty when there are none. */
      thread: ThreadMessage[]
    }
  | { status: 'not_found' }
  | { status: 'error' }

/* ------------------------------------------------------------------ Rules */

/**
 * Classifier confidence in words. Stored as 0–1 (current) or 0–100 (older rows).
 *   High ≥ 85% · Medium 60–84% · Low < 60%
 */
export function confidenceLevel(confidence: unknown): ConfidenceLevel | null {
  if (typeof confidence !== 'number' || Number.isNaN(confidence)) return null
  const pct = confidenceToPercent(confidence)
  return pct >= 85 ? 'High' : pct >= 60 ? 'Medium' : 'Low'
}

/** The subject n8n sends the reply with (mirrors "Send Email" in the Foreman Agent workflow). */
export function replySubject(subject: string | null): string {
  const original = subject || ''
  return original.toLowerCase().startsWith('re:') ? original : `Re: ${original}`
}

/** JSON details may arrive as an object, a JSON string, or a JSON string of a JSON string. */
function parseDetails(raw: unknown): Record<string, unknown> {
  let value = raw
  for (let i = 0; i < 2 && typeof value === 'string'; i++) {
    try {
      value = JSON.parse(value)
    } catch {
      return {}
    }
  }
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {}
}

const str = (v: unknown): string | null => (typeof v === 'string' && v.trim() ? v.trim() : null)
const capitalise = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

/** Plain-language description of one audit_log row. Unknown actions are shown, never dropped. */
export function describeEvent(action: string, rawDetails: unknown): { label: string; detail: string | null } {
  const d = parseDetails(rawDetails)
  const via = str(d.via) === 'voice' ? 'By voice' : null
  const join = (...parts: (string | null)[]) => parts.filter(Boolean).join(' · ') || null

  switch (action) {
    case 'classified': {
      const roles = Array.isArray(d.routed_roles) ? (d.routed_roles as string[]) : str(d.routed_role) ? [d.routed_role as string] : []
      const theme = str(d.theme) ?? str(d.category)
      return {
        label: 'Classified',
        detail: join(
          theme ? themeLabel(theme) : null,
          str(d.urgency) ? capitalise(d.urgency as string) : null,
          roles.length ? `Routed to ${formatRoles(roles)}` : null
        ),
      }
    }
    case 'drafted':
      return { label: 'Reply drafted', detail: null }
    case 'whatsapp_notified':
      return {
        label: 'WhatsApp alert sent',
        detail: join(str(d.user_name), str(d.role) ? formatRole(d.role as string) : null),
      }
    case 'whatsapp_skipped_no_recipient':
      return {
        label: 'WhatsApp alert not sent',
        detail: str(d.role)
          ? `No one with a WhatsApp number is set up as ${formatRole(d.role as string)}`
          : 'The email had no routed role',
      }
    case 'edited': {
      const length = typeof d.text_length === 'number' ? `${d.text_length.toLocaleString('en-GB')} characters` : null
      return { label: 'Draft edited', detail: join(length, via) }
    }
    case 'approved':
      return {
        label: 'Reply approved',
        detail: join(
          str(d.draft_type) ? draftTypeLabel(d.draft_type as string) : null,
          d.was_discarded === true ? 'Written after discarding the AI draft' : null,
          via
        ),
      }
    case 'discarded':
      return { label: 'Draft discarded', detail: via }
    case 'sent':
      return {
        label: 'Reply sent',
        detail: join(str(d.to) ? `To ${d.to}` : null, str(d.account) ? `From ${d.account}` : null),
      }
    default:
      return { label: capitalise(action.replace(/_/g, ' ')), detail: null }
  }
}

/* ------------------------------------------------------------------ Read path */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const EMAIL_SELECT =
  'id, account_id, message_id, thread_id, from_address, from_name, subject, body_text, body_html, received_at, theme, urgency, routed_roles, status, created_at, accounts(id, email_address, display_name)'

// Automatic steps whose user_id names someone other than the actor
// (whatsapp_notified stores the person who was alerted).
const USER_IS_NOT_ACTOR = new Set(['whatsapp_notified'])

interface AuditRow {
  id: string
  action: string
  details: unknown
  created_at: string | null
  user_id: string | null
  users: { name: string | null; email: string | null } | null
}

interface ThreadRow {
  id: string
  from_name: string | null
  from_address: string
  subject: string | null
  received_at: string
  status: string
  urgency: string | null
  drafts:
    | { status: string; edited_text: string | null; ai_generated_text: string | null }
    | { status: string; edited_text: string | null; ai_generated_text: string | null }[]
    | null
}

export async function getWorkspaceData(supabase: SupabaseClient, id: string): Promise<WorkspaceData> {
  if (!UUID.test(id)) return { status: 'not_found' }

  const fetchEmail = () => supabase.from('emails').select(EMAIL_SELECT).eq('id', id).maybeSingle()

  const [emailFirst, draftRes, eventsRes] = await Promise.all([
    fetchEmail(),
    supabase.from('drafts').select('*').eq('email_id', id).maybeSingle(),
    supabase
      .from('audit_log')
      .select('id, action, details, created_at, user_id, users(name, email)')
      .eq('email_id', id)
      .order('created_at', { ascending: true })
      .limit(200),
  ])

  // One retry for a transient failure (kept from the previous detail page).
  let emailRes = emailFirst
  if (emailRes.error) {
    await new Promise((r) => setTimeout(r, 200))
    emailRes = await fetchEmail()
  }
  if (emailRes.error) {
    console.error('[Workspace] email:', emailRes.error.message)
    return { status: 'error' }
  }
  if (!emailRes.data) return { status: 'not_found' }

  // A failed draft read must not look like "no draft": writing a reply then
  // would create a second draft. Treat it as a load failure.
  if (draftRes.error) {
    console.error('[Workspace] draft:', draftRes.error.message)
    return { status: 'error' }
  }

  const email = emailRes.data as unknown as EmailRecord
  const draft = (draftRes.data ?? null) as DraftRecord | null

  let events: WorkspaceEvent[] | null = null
  let classification: Record<string, unknown> = {}
  if (eventsRes.error) {
    console.error('[Workspace] activity:', eventsRes.error.message)
  } else {
    const rows = (eventsRes.data ?? []) as unknown as AuditRow[]
    events = rows.map((row) => {
      const { label, detail } = describeEvent(row.action, row.details)
      const person = USER_IS_NOT_ACTOR.has(row.action) ? null : row.users?.name || row.users?.email || (row.user_id ? 'A team member' : null)
      return { id: row.id, action: row.action, createdAt: row.created_at, label, detail, actor: person }
    })
    const lastClassified = [...rows].reverse().find((r) => r.action === 'classified')
    if (lastClassified) classification = (parseClassificationDetails(parseDetails(lastClassified.details)) ?? {}) as Record<string, unknown>
  }

  const legacyRole = str(classification.routed_role)
  const triage: Triage = {
    summary: str(classification.summary),
    theme: email.theme ?? str(classification.theme),
    urgency: email.urgency ?? str(classification.urgency),
    routedRoles:
      email.routed_roles && email.routed_roles.length > 0
        ? email.routed_roles
        : Array.isArray(classification.routed_roles)
          ? (classification.routed_roles as string[])
          : legacyRole
            ? [legacyRole]
            : [],
    confidence: confidenceLevel(classification.confidence),
  }

  // Other received messages in the same conversation. Replies we send are not
  // stored as emails, so this is the inbound side only — never invented.
  let thread: ThreadMessage[] = []
  if (email.thread_id) {
    const threadRes = await supabase
      .from('emails')
      .select('id, from_name, from_address, subject, received_at, status, urgency, drafts(status, edited_text, ai_generated_text)')
      .eq('thread_id', email.thread_id)
      .eq('account_id', email.account_id)
      .order('received_at', { ascending: true })
      .limit(25)
    if (threadRes.error) {
      console.error('[Workspace] thread:', threadRes.error.message)
    } else {
      const rows = (threadRes.data ?? []) as unknown as ThreadRow[]
      if (rows.length > 1) {
        thread = rows.map((row) => {
          const d = Array.isArray(row.drafts) ? (row.drafts[0] ?? null) : row.drafts
          return {
            id: row.id,
            fromName: row.from_name,
            fromAddress: row.from_address,
            subject: row.subject,
            receivedAt: row.received_at,
            status: getReviewStatus(row, d),
            current: row.id === email.id,
          }
        })
      }
    }
  }

  return { status: 'ok', email, draft, triage, events, thread }
}
