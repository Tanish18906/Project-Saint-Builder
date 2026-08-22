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
    bg: 'bg-[#f5f1e8]',
    text: 'text-[#6b6559]',
    border: 'border-[#e8e2d4]',
  },
  classified: {
    label: 'Classified',
    bg: 'bg-[#f5f1e8]',
    text: 'text-[#6b6559]',
    border: 'border-[#e8e2d4]',
  },
  drafted: {
    label: 'Drafted',
    bg: 'bg-[#f5f1e8]',
    text: 'text-[#6b6559]',
    border: 'border-[#e8e2d4]',
  },
  pending: {
    label: 'Pending review',
    bg: 'bg-[#f5f1e8]',
    text: 'text-[#6b6559]',
    border: 'border-[#e8e2d4]',
  },
  approved: {
    label: 'Approved',
    bg: 'bg-emerald-50/70',
    text: 'text-[#2f6b3f] font-semibold',
    border: 'border-emerald-200/80',
  },
  sent: {
    label: 'Sent',
    bg: 'bg-[#1c1a17]',
    text: 'text-[#f5f1e8] font-medium',
    border: 'border-[#1c1a17]',
  },
  discarded: {
    label: 'Discarded',
    bg: 'bg-[#f5f1e8]',
    text: 'text-[#6b6559]',
    border: 'border-[#e8e2d4]',
  },
}

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  if (!status) return null

  const config = STATUS_CONFIG[status.toLowerCase()] || {
    label: status.replace(/_/g, ' '),
    bg: 'bg-[#f5f1e8]',
    text: 'text-[#6b6559]',
    border: 'border-[#e8e2d4]',
  }

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${config.bg} ${config.text} ${config.border} ${className}`}
    >
      {config.label}
    </span>
  )
}
