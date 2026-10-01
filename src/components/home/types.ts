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
  received_at: string
  theme: string | null
  urgency: string | null
  routed_roles: string[] | null
  status: string
  accounts?: AccountRecord | null
}

export interface DraftRecord {
  id: string
  email_id: string
  status: string
  draft_type: string
  ai_generated_text: string | null
  edited_text: string | null
  created_at: string | null
  updated_at: string | null
}

export interface AuditRecord {
  id: string
  action: string
  details: unknown
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

export interface CommandCentreMetrics {
  urgentCount: number
  pendingReviewCount: number
  priorityCount: number
  activeInboxesCount: number
  totalEmailsCount: number
  dispatchedTodayCount: number
}

export interface NeedsAttentionItem {
  email: EmailRecord
  pendingDraft?: DraftRecord | null
  isAging: boolean
}

export interface HomeCommandCentreViewProps {
  initialEmails: EmailRecord[]
  accounts: AccountRecord[]
  initialPendingDrafts: DraftRecord[]
  initialRecentAudit: AuditRecord[]
  userEmail?: string | null
}
