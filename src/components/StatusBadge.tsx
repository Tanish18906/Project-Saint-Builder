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
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-200',
  },
  classified: {
    label: 'Classified',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
  },
  drafted: {
    label: 'Drafted',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
  },
  pending: {
    label: 'Pending Review',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
  },
  approved: {
    label: 'Approved',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
  },
  sent: {
    label: 'Sent',
    bg: 'bg-[#1c1a17]',
    text: 'text-[#f5f1e8]',
    border: 'border-[#1c1a17]',
  },
  discarded: {
    label: 'Discarded',
    bg: 'bg-stone-100',
    text: 'text-stone-600',
    border: 'border-stone-200',
  },
}

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  if (!status) return null

  const config = STATUS_CONFIG[status.toLowerCase()] || {
    label: status.replace(/_/g, ' '),
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-200',
  }

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${config.bg} ${config.text} ${config.border} ${className}`}
    >
      {config.label}
    </span>
  )
}
