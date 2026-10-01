import {
  Sparkles,
  Mail,
  Edit3,
  CheckCircle2,
  Send,
  Trash2,
  FileClock,
  Radio,
  type LucideIcon,
} from 'lucide-react'
import { type AuditLogItem } from './types'

export interface ActionConfig {
  title: string
  verb: string
  badgeVariant: 'neutral' | 'brand' | 'success' | 'warning' | 'danger' | 'info'
  icon: LucideIcon
  colorClass: string
}

export function getActionConfig(action: string): ActionConfig {
  const norm = (action || '').toLowerCase().trim()

  switch (norm) {
    case 'classified':
      return {
        title: 'Email Classified by AI',
        verb: 'Classified',
        badgeVariant: 'neutral',
        icon: Sparkles,
        colorClass: 'text-[var(--brand)] bg-[var(--surface-subtle)] border-[var(--border-subtle)]',
      }
    case 'drafted':
      return {
        title: 'Response Draft Created',
        verb: 'Drafted',
        badgeVariant: 'brand',
        icon: Mail,
        colorClass: 'text-[var(--brand)] bg-[var(--surface-subtle)] border-[var(--border-subtle)]',
      }
    case 'edited':
      return {
        title: 'Draft Content Edited',
        verb: 'Draft Edited',
        badgeVariant: 'warning',
        icon: Edit3,
        colorClass: 'text-amber-800 bg-amber-50 border-amber-200',
      }
    case 'approved':
      return {
        title: 'Draft Approved for Dispatch',
        verb: 'Approved',
        badgeVariant: 'success',
        icon: CheckCircle2,
        colorClass: 'text-emerald-800 bg-emerald-50 border-emerald-200',
      }
    case 'sent':
      return {
        title: 'Email Dispatched & Delivered',
        verb: 'Dispatched',
        badgeVariant: 'neutral',
        icon: Send,
        colorClass: 'text-[var(--text-primary)] bg-[var(--surface-subtle)] border-[var(--border-strong)]',
      }
    case 'discarded':
      return {
        title: 'Response Draft Discarded',
        verb: 'Discarded',
        badgeVariant: 'danger',
        icon: Trash2,
        colorClass: 'text-stone-700 bg-stone-100 border-stone-200',
      }
    case 'whatsapp_alert_sent':
    case 'whatsapp_notified':
      return {
        title: 'WhatsApp Alert Dispatched',
        verb: 'Alert Sent',
        badgeVariant: 'info',
        icon: Radio,
        colorClass: 'text-emerald-800 bg-emerald-50 border-emerald-200',
      }
    case 'whatsapp_skipped_no_recipient':
      return {
        title: 'WhatsApp Alert Skipped',
        verb: 'Alert Skipped',
        badgeVariant: 'warning',
        icon: Radio,
        colorClass: 'text-amber-800 bg-amber-50 border-amber-200',
      }
    default:
      return {
        title: `Event: ${action.replace(/_/g, ' ')}`,
        verb: action,
        badgeVariant: 'neutral',
        icon: FileClock,
        colorClass: 'text-[var(--text-secondary)] bg-[var(--surface-subtle)] border-[var(--border-subtle)]',
      }
  }
}

export function parseDetails(details: unknown): Record<string, unknown> | null {
  if (!details) return null
  if (typeof details === 'object') return details as Record<string, unknown>
  if (typeof details === 'string') {
    try {
      return JSON.parse(details)
    } catch {
      return { raw: details }
    }
  }
  return null
}

export function getActorInfo(log: AuditLogItem): {
  isSystem: boolean
  label: string
  role: string | null
} {
  if (log.users) {
    return {
      isSystem: false,
      label: log.users.name || log.users.email || 'Staff user',
      role: log.users.role || null,
    }
  }
  return {
    isSystem: true,
    label: 'System Automation',
    role: 'Automated Agent',
  }
}

export function getHumanSummary(log: AuditLogItem): string {
  const parsed = parseDetails(log.details)
  const normAction = (log.action || '').toLowerCase()

  if (normAction === 'classified') {
    const theme = parsed?.theme ? String(parsed.theme).replace(/_/g, ' ') : null
    const urgency = parsed?.urgency ? String(parsed.urgency) : null
    const confidence =
      parsed?.confidence !== undefined
        ? Number(parsed.confidence) <= 1
          ? `${Math.round(Number(parsed.confidence) * 100)}%`
          : `${Math.round(Number(parsed.confidence))}%`
        : null

    if (parsed?.summary) {
      return String(parsed.summary)
    }

    const parts = [theme, urgency ? `urgency: ${urgency}` : null, confidence ? `(${confidence} confidence)` : null]
      .filter(Boolean)
      .join(', ')

    return parts ? `Classified as ${parts}.` : 'Email triaged and classified.'
  }

  if (normAction === 'approved') {
    const draftType = parsed?.draft_type ? String(parsed.draft_type).replace(/_/g, ' ') : 'ai generated'
    const wasDiscarded = parsed?.was_discarded ? ' (rewritten after discard)' : ''
    const via = parsed?.via ? ` via ${parsed.via}` : ''
    return `Draft response (${draftType}${wasDiscarded}) approved for dispatch${via}.`
  }

  if (normAction === 'edited') {
    const chars = parsed?.text_length ? `${parsed.text_length} characters` : 'content'
    const via = parsed?.via ? ` via ${parsed.via}` : ''
    return `Draft response ${chars} updated${via}.`
  }

  if (normAction === 'sent') {
    const to = parsed?.to ? ` to ${parsed.to}` : ''
    const acc = parsed?.account ? ` via ${parsed.account}` : ''
    return `Outbound email dispatched${to}${acc}.`
  }

  if (normAction === 'whatsapp_notified' || normAction === 'whatsapp_alert_sent') {
    const recipient = parsed?.user_name ? String(parsed.user_name) : 'on-duty director'
    const num = parsed?.whatsapp_number ? ` (${parsed.whatsapp_number})` : ''
    return `Urgent WhatsApp alert dispatched to ${recipient}${num}.`
  }

  if (normAction === 'whatsapp_skipped_no_recipient') {
    const role = parsed?.routed_role ? ` for ${String(parsed.routed_role).replace(/_/g, ' ')}` : ''
    const reason = parsed?.reason ? `: ${parsed.reason}` : ''
    return `WhatsApp alert skipped${role}${reason}.`
  }

  if (normAction === 'discarded') {
    const via = parsed?.via ? ` via ${parsed.via}` : ''
    return `Draft reply discarded${via}.`
  }

  if (normAction === 'drafted') {
    return 'AI drafted a proposed response from email context.'
  }

  if (parsed?.summary) return String(parsed.summary)
  return 'Audit event recorded.'
}
