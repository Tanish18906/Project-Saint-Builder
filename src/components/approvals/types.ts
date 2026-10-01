export interface ApprovalItem {
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
  accounts?: {
    id?: string
    email_address: string
    display_name: string | null
  } | null
  draft?: {
    id: string
    status: string
    draft_type: string
    ai_generated_text: string | null
    edited_text: string | null
    created_at: string | null
    updated_at: string | null
  } | null
}

export interface ApprovalsAccountItem {
  id: string
  email_address: string
  display_name: string | null
}

export interface ApprovalsViewProps {
  initialItems: ApprovalItem[]
  accounts: ApprovalsAccountItem[]
}

export const APPROVAL_URGENCIES = [
  { value: 'all', label: 'All Urgencies' },
  { value: 'urgent', label: 'Urgent' },
  { value: 'priority', label: 'Priority' },
  { value: 'routine', label: 'Routine' },
  { value: 'read_later', label: 'Read Later' },
] as const

export const APPROVAL_THEMES = [
  { value: 'all', label: 'All Themes' },
  { value: 'accounts', label: 'Accounts' },
  { value: 'orders', label: 'Orders' },
  { value: 'finance', label: 'Finance' },
  { value: 'suppliers', label: 'Suppliers' },
  { value: 'promotions', label: 'Promotions' },
  { value: 'nph_jobs', label: 'NPH Jobs' },
  { value: 'meetings_appointments', label: 'Meetings & Appointments' },
  { value: 'invoices', label: 'Invoices' },
  { value: 'certificates', label: 'Certificates' },
] as const

export function formatRelativeTime(dateString: string): string {
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
