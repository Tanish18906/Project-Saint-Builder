import * as React from 'react'
import Link from 'next/link'
import { Clock, User } from 'lucide-react'
import { StatusBadge } from '@/components/StatusBadge'
import { UrgencyBadge } from '@/components/UrgencyBadge'
import { ThemeBadge } from '@/components/ThemeBadge'
import { formatRelativeTime } from './types'
import type { EmailItem } from './types'

interface InboxListItemProps {
  email: EmailItem
}

export function InboxListItem({ email }: InboxListItemProps) {
  const urgency = (email.urgency || '').toLowerCase().trim()
  const isUrgent = urgency === 'urgent'
  const isPriority = urgency === 'priority'

  let hazardClasses = 'border-l-4 border-l-transparent bg-[var(--surface)] hover:bg-[var(--surface-subtle)]/60'
  if (isUrgent) {
    hazardClasses = 'border-l-4 border-l-[var(--urgency-urgent)] bg-[var(--urgency-urgent-bg)]/20 hover:bg-[var(--urgency-urgent-bg)]/35'
  } else if (isPriority) {
    hazardClasses = 'border-l-4 border-l-[var(--urgency-priority)] bg-[var(--urgency-priority-bg)]/20 hover:bg-[var(--urgency-priority-bg)]/35'
  }

  const formattedDateTooltip = React.useMemo(() => {
    try {
      return new Date(email.received_at).toLocaleString('en-GB', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    } catch {
      return email.received_at
    }
  }, [email.received_at])

  const relativeTime = React.useMemo(
    () => formatRelativeTime(email.received_at),
    [email.received_at]
  )

  const rolesText = React.useMemo(() => {
    if (!email.routed_roles || email.routed_roles.length === 0) return null
    return email.routed_roles.map((r) => r.replace(/_/g, ' ')).join(', ')
  }, [email.routed_roles])

  return (
    <Link
      href={`/emails/${email.id}`}
      className={`group relative block rounded-xl border border-[var(--border-subtle)] transition-all duration-150 p-3.5 sm:p-4 hover:border-[var(--border-strong)] hover:shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] focus-visible:ring-offset-1 cursor-pointer ${hazardClasses}`}
    >
      {/* Mobile Card Layout (< sm): Subject first, sender & timestamp, badges, body */}
      <div className="sm:hidden space-y-2">
        {/* Row 1: Subject first & Timestamp */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] leading-snug group-hover:text-[var(--brand)] transition-colors line-clamp-1">
            {email.subject || '(No Subject)'}
          </h3>
          <span
            title={formattedDateTooltip}
            className="text-[11px] text-[var(--text-secondary)] tabular-nums shrink-0 pt-0.5 flex items-center gap-1"
          >
            <Clock className="w-3 h-3 text-[var(--text-tertiary)]" />
            {relativeTime}
          </span>
        </div>

        {/* Row 2: Sender & Monitored Account */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="font-semibold text-[var(--text-primary)] truncate max-w-[180px]">
            {email.from_name || email.from_address}
          </span>
          {email.from_name && (
            <span className="text-[11px] text-[var(--text-secondary)] truncate max-w-[150px]">
              &lt;{email.from_address}&gt;
            </span>
          )}
          {email.accounts && (
            <span
              className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[var(--surface-subtle)] text-[var(--text-secondary)] border border-[var(--border-subtle)] truncate max-w-[140px]"
              title={email.accounts.email_address}
            >
              {email.accounts.display_name || email.accounts.email_address}
            </span>
          )}
        </div>

        {/* Row 3: Decision Badges */}
        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
          <UrgencyBadge urgency={email.urgency} />
          <StatusBadge status={email.status} />
          <ThemeBadge theme={email.theme} />
          {rolesText && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-[var(--surface-subtle)] text-[var(--text-secondary)] border border-[var(--border-subtle)] capitalize">
              <User className="w-2.5 h-2.5 text-[var(--text-tertiary)]" />
              <span>{rolesText}</span>
            </span>
          )}
        </div>

        {/* Row 4: Body Preview (2 lines max) */}
        <p className="text-xs text-[var(--text-secondary)] line-clamp-2 leading-relaxed">
          {email.body_text || '(No text content)'}
        </p>
      </div>

      {/* Desktop / Tablet Layout (>= sm): High scanning density horizontal alignment */}
      <div className="hidden sm:block space-y-1">
        {/* Row 1: Sender info on left, Decision badges & timestamp on right */}
        <div className="flex items-center justify-between gap-3">
          {/* Sender & Monitored Account Tag */}
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-semibold text-sm text-[var(--text-primary)] truncate">
              {email.from_name || email.from_address}
            </span>
            {email.from_name && (
              <span className="text-xs text-[var(--text-secondary)] font-normal truncate max-w-[220px]">
                &lt;{email.from_address}&gt;
              </span>
            )}
            {email.accounts && (
              <span
                className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--surface-subtle)] text-[var(--text-secondary)] border border-[var(--border-subtle)] truncate max-w-[200px]"
                title={email.accounts.email_address}
              >
                {email.accounts.display_name || email.accounts.email_address}
              </span>
            )}
          </div>

          {/* Decision signals & Relative Timestamp */}
          <div className="flex items-center gap-2 shrink-0">
            <UrgencyBadge urgency={email.urgency} />
            <StatusBadge status={email.status} />
            <ThemeBadge theme={email.theme} />
            {rolesText && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-medium bg-[var(--surface-subtle)] text-[var(--text-secondary)] border border-[var(--border-subtle)] capitalize">
                <User className="w-3 h-3 text-[var(--text-tertiary)]" />
                <span>{rolesText}</span>
              </span>
            )}
            <span
              title={formattedDateTooltip}
              className="text-xs text-[var(--text-secondary)] tabular-nums flex items-center gap-1 pl-1"
            >
              <Clock className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
              <span>{relativeTime}</span>
            </span>
          </div>
        </div>

        {/* Row 2: Subject Line */}
        <h3 className="text-sm font-semibold text-[var(--text-primary)] leading-snug group-hover:text-[var(--brand)] transition-colors truncate">
          {email.subject || '(No Subject)'}
        </h3>

        {/* Row 3: Body Preview (2 lines max) */}
        <p className="text-xs text-[var(--text-secondary)] line-clamp-2 leading-relaxed">
          {email.body_text || '(No text content)'}
        </p>
      </div>
    </Link>
  )
}
