import React from 'react'

export type EmailStatus =
  | 'new'
  | 'classified'
  | 'drafted'
  | 'pending'
  | 'approved'
  | 'sent'
  | 'discarded'
  | string

interface StatusBadgeProps {
  status: EmailStatus | null | undefined
  className?: string
}

const STATUS_CONFIG: Record<
  string,
  { label: string; bg: string; text: string; border: string }
> = {
  new: {
    label: 'New',
    bg: 'bg-[var(--surface-subtle)]',
    text: 'text-[var(--text-secondary)]',
    border: 'border-[var(--border-subtle)]',
  },
  classified: {
    label: 'Classified',
    bg: 'bg-[var(--surface-subtle)]',
    text: 'text-[var(--text-secondary)]',
    border: 'border-[var(--border-subtle)]',
  },
  drafted: {
    label: 'Drafted',
    bg: 'bg-[var(--brand-subtle)]',
    text: 'text-[var(--brand-text)] font-medium',
    border: 'border-[var(--brand-subtle)]',
  },
  pending: {
    label: 'Pending review',
    bg: 'bg-amber-50',
    text: 'text-amber-800 font-medium',
    border: 'border-amber-200',
  },
  approved: {
    label: 'Approved',
    bg: 'bg-emerald-50',
    text: 'text-emerald-800 font-semibold',
    border: 'border-emerald-200',
  },
  sent: {
    label: 'Sent',
    bg: 'bg-[var(--text-primary)]',
    text: 'text-white font-medium',
    border: 'border-[var(--text-primary)]',
  },
  discarded: {
    label: 'Discarded',
    bg: 'bg-[var(--surface-subtle)]',
    text: 'text-[var(--text-tertiary)]',
    border: 'border-[var(--border-subtle)]',
  },
}

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  if (!status) return null

  const config = STATUS_CONFIG[status.toLowerCase()] || {
    label: status.replace(/_/g, ' '),
    bg: 'bg-[var(--surface-subtle)]',
    text: 'text-[var(--text-secondary)]',
    border: 'border-[var(--border-subtle)]',
  }

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border select-none ${config.bg} ${config.text} ${config.border} ${className}`}
    >
      {config.label}
    </span>
  )
}
