// Display formatting shared by every screen. Pure functions — no React, no I/O.
// Moved verbatim from InboxView / EmailDetailView / AuditLogView / ThemeBadge so
// output is identical; screens should import from here rather than re-declare.

const THEME_LABELS: Record<string, string> = {
  accounts: 'Accounts',
  orders: 'Orders',
  finance: 'Finance',
  suppliers: 'Suppliers',
  promotions: 'Promotions',
  nph_jobs: 'NPH jobs',
  meetings_appointments: 'Meetings / appointments',
  invoices: 'Invoices',
  certificates: 'Certificates',
}

export function themeLabel(theme: string): string {
  const key = theme.toLowerCase()
  if (THEME_LABELS[key]) return THEME_LABELS[key]
  const words = theme.replace(/_/g, ' ')
  return words.charAt(0).toUpperCase() + words.slice(1)
}

export function formatRole(role: string): string {
  const words = role.replace(/_/g, ' ')
  return words.charAt(0).toUpperCase() + words.slice(1)
}

/** "Director, Senior admin" — or "Unassigned" when routing produced no roles. */
export function formatRoles(roles: string[] | null | undefined): string {
  if (!roles || roles.length === 0) return 'Unassigned'
  return roles.map(formatRole).join(', ')
}

const DRAFT_TYPE_LABELS: Record<string, string> = {
  ai_generated: 'AI draft · unedited',
  ai_edited: 'AI draft · edited',
  manual: 'Manual reply',
}

export function draftTypeLabel(type: string): string {
  return DRAFT_TYPE_LABELS[type] || type.replace(/_/g, ' ')
}

// New classify prompt stores confidence as a 0.0-1.0 float; the deprecated shape
// stored it as an integer 0-100 — historical audit_log rows may still have either.
export function confidenceToPercent(confidence: number): number {
  return confidence <= 1 ? Math.round(confidence * 100) : Math.round(confidence)
}

/** "Just now", "5m ago", "3h ago", "Yesterday", "4d ago", then "12 Sep". */
export function formatRelativeTime(dateString: string | null | undefined): string {
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

/** "27 Sept 2026, 14:05" — the one date+time format for detail views. */
export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** "27 Sept, 14:05:09" — audit precision. */
export function formatPreciseTimestamp(dateString: string | null | undefined): string {
  if (!dateString) return ''
  return new Date(dateString).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

/** Short, recognisable handle for a receiving inbox: "info@". */
export function inboxHandle(address: string): string {
  return `${address.split('@')[0]}@`
}

/** First 8 chars of a UUID, for support references. */
export function shortRef(id: string): string {
  return id.slice(0, 8)
}

// All queue times are shown in UK time, the company's working timezone. A fixed
// zone also keeps the server render and the browser render identical.
const UK_TIME = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', hour: '2-digit', minute: '2-digit' })
const UK_DAY = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', year: 'numeric', month: '2-digit', day: '2-digit' })
const UK_WEEKDAY = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', weekday: 'short' })
const UK_SHORT_DATE = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', day: 'numeric', month: 'short' })
const UK_LONG = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Europe/London',
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

/**
 * Mail-style list time: "09:42" today, "Yesterday", weekday within the last
 * week ("Tue"), then "12 Sept".
 */
export function formatQueueTime(iso: string, now: Date = new Date()): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  const day = (d: Date) => UK_DAY.format(d)
  if (day(date) === day(now)) return UK_TIME.format(date)
  const yesterday = new Date(now.getTime() - 86_400_000)
  if (day(date) === day(yesterday)) return 'Yesterday'
  if (now.getTime() - date.getTime() < 6 * 86_400_000) return UK_WEEKDAY.format(date)
  return UK_SHORT_DATE.format(date)
}

/** Full timestamp for titles/tooltips: "Tue, 22 Sept 2026, 09:42". */
export function formatFullTimestamp(iso: string): string {
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? '' : UK_LONG.format(date)
}

const UK_PRECISE = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Europe/London',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
})

/** Forensic timestamp for activity records, UK time: "22 Sept 2026, 09:42:07". */
export function formatAuditTimestamp(iso: string | null | undefined): string {
  if (!iso) return ''
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? '' : UK_PRECISE.format(date)
}

/** Collapses whitespace and trims a body to a one-line preview. */
export function toPreview(text: string | null | undefined, max = 180): string {
  if (!text) return ''
  const flat = text.replace(/\s+/g, ' ').trim()
  return flat.length > max ? `${flat.slice(0, max).trimEnd()}…` : flat
}
