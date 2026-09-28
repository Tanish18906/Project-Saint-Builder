// Client-side domain model for the UI: record shapes as the screens receive them
// (joined rows included), option lists, and small pure rules. Database types live
// in src/types/database.ts; this file mirrors what the queries actually select.

export interface AccountRecord {
  id: string
  email_address: string
  display_name: string | null
}

export interface EmailRecord {
  id: string
  account_id: string
  message_id: string
  thread_id: string | null
  from_address: string
  from_name: string | null
  subject: string | null
  body_text: string | null
  body_html: string | null
  received_at: string
  theme: string | null
  urgency: string | null
  routed_roles: string[] | null
  status: string
  created_at: string | null
  accounts?: {
    id?: string
    email_address: string
    display_name: string | null
  } | null
  drafts?: {
    id: string
    status: string
    draft_type: string
  }[] | null
}

export interface DraftRecord {
  id: string
  email_id: string
  ai_generated_text: string | null
  edited_text: string | null
  draft_type: string
  status: string
  approved_by: string | null
  approved_at: string | null
  sent_at: string | null
  updated_at?: string | null
}

export interface ClassificationDetails {
  theme?: string
  urgency?: string
  routed_roles?: string[]
  confidence?: number
  summary?: string
}

export interface AuditLogRecord {
  id: string
  action: string
  details: any
  created_at: string | null
  email_id: string | null
  draft_id: string | null
  user_id: string | null
  emails?: {
    id: string
    subject: string | null
    from_name: string | null
    from_address: string | null
  } | null
  users?: {
    id: string
    name: string | null
    email: string | null
    role: string | null
  } | null
}

export interface FilterOption {
  value: string
  label: string
}

export const THEME_OPTIONS: FilterOption[] = [
  { value: 'all', label: 'All themes' },
  { value: 'accounts', label: 'Accounts' },
  { value: 'orders', label: 'Orders' },
  { value: 'finance', label: 'Finance' },
  { value: 'suppliers', label: 'Suppliers' },
  { value: 'promotions', label: 'Promotions' },
  { value: 'nph_jobs', label: 'NPH jobs' },
  { value: 'meetings_appointments', label: 'Meetings / appointments' },
  { value: 'invoices', label: 'Invoices' },
  { value: 'certificates', label: 'Certificates' },
]

export const URGENCY_OPTIONS: FilterOption[] = [
  { value: 'all', label: 'All urgencies' },
  { value: 'urgent', label: 'Urgent' },
  { value: 'priority', label: 'Priority' },
  { value: 'normal', label: 'Normal' },
]

export const ROLE_OPTIONS: FilterOption[] = [
  { value: 'all', label: 'All roles' },
  { value: 'director', label: 'Director' },
  { value: 'senior_admin', label: 'Senior admin' },
  { value: 'progressor', label: 'Progressor' },
  { value: 'accountant', label: 'Accountant' },
]

export const AUDIT_ACTION_OPTIONS: FilterOption[] = [
  { value: 'all', label: 'All actions' },
  { value: 'classified', label: 'Classified' },
  { value: 'drafted', label: 'Drafted' },
  { value: 'edited', label: 'Edited' },
  { value: 'approved', label: 'Approved' },
  { value: 'discarded', label: 'Discarded' },
  { value: 'sent', label: 'Sent' },
]

/**
 * Post-approval lockdown, client side. Mirrors the server guard in
 * app/(app)/emails/[id]/actions.ts (EDITABLE_DRAFT_STATUSES) — the server remains the
 * authority; this only decides whether to render editing UI.
 */
export function getDraftLockState(
  draft: Pick<DraftRecord, 'status'> | null | undefined,
  email: Pick<EmailRecord, 'status'>
) {
  const isSent = draft?.status === 'sent' || email.status === 'sent'
  const isApproved = draft?.status === 'approved' || email.status === 'approved'
  return { isSent, isApproved, isLocked: isApproved || isSent }
}

/** Parses the classification audit row's `details`, which may be JSON text or an object. */
export function parseClassificationDetails(raw: unknown): ClassificationDetails | null {
  if (!raw) return null
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw)
    } catch {
      return null
    }
  }
  if (typeof raw === 'object') return raw as ClassificationDetails
  return null
}

/* ------------------------------------------------------------------ Queue views
 * The work-organised views from DESIGN_SYSTEM.md §12. These rules are the single
 * definition used by the sidebar counts now and by the queue screens later.
 * They read existing columns only — no schema change.
 */

export type QueueView = 'review' | 'urgent' | 'all' | 'handled'

type DraftRelation = { status: string } | { status: string }[] | null | undefined

/** PostgREST returns a unique one-to-one join as an object and one-to-many as an array. */
export function draftStatusOf(drafts: DraftRelation): string | null {
  if (!drafts) return null
  if (Array.isArray(drafts)) return drafts[0]?.status ?? null
  return drafts.status ?? null
}

// Mirrored in SQL by the `email_queue` view (supabase/migrations/…_email_queue_view.sql),
// which the queue and sidebar counts filter on. Change both together.
export function getQueueState(email: { status: string; urgency: string | null }, draftStatus: string | null) {
  const emailStatus = (email.status || '').toLowerCase()
  const isHandled =
    emailStatus === 'sent' || emailStatus === 'discarded' || draftStatus === 'approved' || draftStatus === 'sent'
  // A pending AI draft, or a discarded one awaiting a manual reply, needs a decision.
  const needsReview = !isHandled && (draftStatus === 'pending' || draftStatus === 'discarded')
  const isUrgentOpen = !isHandled && (email.urgency || '').toLowerCase() === 'urgent'
  return { isHandled, needsReview, isUrgentOpen }
}

export type ReviewStatusKey =
  | 'draft_ready'
  | 'edited'
  | 'draft_discarded'
  | 'no_draft'
  | 'approved'
  | 'sent'
  | 'closed'

export interface ReviewStatus {
  key: ReviewStatusKey
  label: string
  /** Presentation tone; the label always carries the meaning. */
  tone: 'accent' | 'neutral' | 'subtle' | 'success'
}

/**
 * What a queue row should say about its reply. Built on getQueueState (the
 * canonical classification) plus the draft fields that already exist — no new
 * backend states:
 *   draft_ready      pending draft, text unchanged from the AI draft
 *   edited           pending draft whose text differs from the AI draft (saved edit)
 *   draft_discarded  AI draft discarded; a manual reply is still owed
 *   no_draft         not handled and no draft row yet (drafting not finished)
 *   approved / sent  reply approved (queued for n8n) or sent
 *   closed           email closed without a reply (emails.status = 'discarded')
 */
export function getReviewStatus(
  email: { status: string; urgency: string | null },
  draft: { status: string; edited_text: string | null; ai_generated_text: string | null } | null
): ReviewStatus {
  const state = getQueueState(email, draft?.status ?? null)
  const emailStatus = (email.status || '').toLowerCase()

  if (state.isHandled) {
    if (draft?.status === 'sent' || emailStatus === 'sent') return { key: 'sent', label: 'Sent', tone: 'subtle' }
    if (draft?.status === 'approved') return { key: 'approved', label: 'Approved', tone: 'success' }
    return { key: 'closed', label: 'Closed', tone: 'subtle' }
  }
  if (draft?.status === 'discarded') return { key: 'draft_discarded', label: 'Draft discarded', tone: 'neutral' }
  if (draft?.status === 'pending') {
    const edited =
      draft.edited_text !== null && draft.ai_generated_text !== null && draft.edited_text.trim() !== draft.ai_generated_text.trim()
    return edited
      ? { key: 'edited', label: 'Edited', tone: 'accent' }
      : { key: 'draft_ready', label: draft.ai_generated_text ? 'Draft ready' : 'Reply saved', tone: 'accent' }
  }
  return { key: 'no_draft', label: 'No draft yet', tone: 'subtle' }
}

/** Sort rank for urgency: urgent, priority, then everything else. */
export function urgencyRank(urgency: string | null): number {
  const u = (urgency || '').toLowerCase()
  return u === 'urgent' ? 0 : u === 'priority' ? 1 : 2
}
