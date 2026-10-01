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
  updated_at: string | null
}

export interface ClassificationAudit {
  theme?: string
  urgency?: string
  routed_roles?: string[]
  confidence?: number
  summary?: string
}

export interface EmailDetailProps {
  email: EmailRecord
  draft: DraftRecord | null
  classificationAudit?: ClassificationAudit | null
}

export function formatRoles(roles: string[] | null | undefined): string {
  if (!roles || roles.length === 0) return 'Unassigned'
  return roles.map((r) => r.replace(/_/g, ' ')).join(', ')
}

export function confidenceToPercent(confidence: number): number {
  return confidence <= 1 ? Math.round(confidence * 100) : Math.round(confidence)
}

/**
 * Scans text for placeholder patterns like [CONFIRM ...], [INSERT ...], [TODO ...]
 */
export function extractPlaceholders(text: string): string[] {
  if (!text) return []
  const matches = text.match(/\[(?:CONFIRM|INSERT|TODO|VERIFY|DATE|TIME|NAME|AMOUNT|PHONE|ADDRESS)[^\]]*\]/gi)
  return matches ? Array.from(new Set(matches)) : []
}
