import * as React from 'react'
import Link from 'next/link'
import { ArrowLeft, ShieldAlert, Building2 } from 'lucide-react'
import { Badge } from '@/components/ui'
import { ThemeBadge } from '@/components/ThemeBadge'
import { UrgencyBadge } from '@/components/UrgencyBadge'
import { StatusBadge } from '@/components/StatusBadge'
import type { EmailRecord } from '@/components/email-detail/types'

export interface EmailDetailHeaderProps {
  email: EmailRecord
  isApproved: boolean
  className?: string
}

export function EmailDetailHeader({ email, isApproved, className = '' }: EmailDetailHeaderProps) {
  const urgency = (email.urgency || '').toLowerCase().trim()
  const isUrgent = urgency === 'urgent'

  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-3 bg-[var(--surface)] p-3 sm:p-4 rounded-xl border border-[var(--border-subtle)] shadow-xs ${className}`.trim()}
    >
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-xs font-medium text-[var(--text-primary)] hover:text-[var(--brand)] transition-colors cursor-pointer min-h-[44px] sm:min-h-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] rounded-md px-1 py-0.5"
      >
        <ArrowLeft className="w-4 h-4 shrink-0" />
        <span>Back to inbox</span>
      </Link>

      <div className="flex flex-wrap items-center gap-2">
        {isUrgent && (
          <Badge
            variant="danger"
            size="sm"
            icon={<ShieldAlert className="w-3.5 h-3.5 shrink-0" />}
            className="bg-[var(--urgency-urgent-bg)] text-[var(--urgency-urgent)] border-[var(--urgency-urgent-border)] font-semibold"
          >
            Urgent priority
          </Badge>
        )}
        <ThemeBadge theme={email.theme} />
        <UrgencyBadge urgency={email.urgency} />
        <StatusBadge status={isApproved ? 'approved' : email.status} />
        {email.accounts?.email_address && (
          <span
            className="text-xs px-2.5 py-0.5 rounded-md bg-[var(--surface-subtle)] text-[var(--text-secondary)] border border-[var(--border-subtle)] flex items-center gap-1.5 font-mono select-none"
            title={email.accounts.email_address}
          >
            <Building2 className="w-3 h-3 text-[var(--text-tertiary)] shrink-0 opacity-70" />
            <span className="truncate max-w-[200px] sm:max-w-none">{email.accounts.email_address}</span>
          </span>
        )}
      </div>
    </div>
  )
}
