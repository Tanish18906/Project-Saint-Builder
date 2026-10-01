export interface AuditLogItem {
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

export interface AuditLogViewProps {
  initialLogs: AuditLogItem[]
}

export const ACTION_FILTERS = [
  { value: 'all', label: 'All Actions' },
  { value: 'classified', label: 'Classified' },
  { value: 'drafted', label: 'Drafted' },
  { value: 'edited', label: 'Edited' },
  { value: 'approved', label: 'Approved' },
  { value: 'sent', label: 'Dispatched / Sent' },
  { value: 'whatsapp', label: 'WhatsApp Alerts' },
  { value: 'discarded', label: 'Discarded' },
] as const

export function formatRelativeTime(dateString: string | null): string {
  if (!dateString) return '—'
  try {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
  } catch {
    return dateString
  }
}

export function formatExactTimestamp(dateString: string | null): string {
  if (!dateString) return '—'
  try {
    const date = new Date(dateString)
    return date.toLocaleString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  } catch {
    return dateString
  }
}
