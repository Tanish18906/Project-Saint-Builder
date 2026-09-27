// LEGACY PRESENTATION — replaced per DESIGN_SYSTEM.md §12; do not extend. New UI uses src/components/ui.
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
    bg: 'bg-surface',
    text: 'text-text-secondary',
    border: 'border-border-hairline',
  },
  classified: {
    label: 'Classified',
    bg: 'bg-surface',
    text: 'text-text-secondary',
    border: 'border-border-hairline',
  },
  drafted: {
    label: 'Drafted',
    bg: 'bg-surface',
    text: 'text-text-secondary',
    border: 'border-border-hairline',
  },
  pending: {
    label: 'Pending review',
    bg: 'bg-surface',
    text: 'text-text-secondary',
    border: 'border-border-hairline',
  },
  approved: {
    label: 'Approved',
    bg: 'bg-signal-success-bg',
    text: 'text-signal-success font-semibold',
    border: 'border-signal-success-border',
  },
  sent: {
    label: 'Sent',
    bg: 'bg-surface-brand',
    text: 'text-text-on-brand font-medium',
    border: 'border-surface-brand',
  },
  discarded: {
    label: 'Discarded',
    bg: 'bg-surface',
    text: 'text-text-secondary',
    border: 'border-border-hairline',
  },
}

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  if (!status) return null

  const config = STATUS_CONFIG[status.toLowerCase()] || {
    label: status.replace(/_/g, ' '),
    bg: 'bg-surface',
    text: 'text-text-secondary',
    border: 'border-border-hairline',
  }

  return (
    <span
      className={`inline-flex items-center px-1.5 py-px rounded-control whitespace-nowrap text-caption font-medium border ${config.bg} ${config.text} ${config.border} ${className}`}
    >
      {config.label}
    </span>
  )
}
