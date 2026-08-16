import React from 'react'

export type EmailCategory =
  | 'urgent'
  | 'priority'
  | 'finance_accounts'
  | 'contracts'
  | 'nph_job_update'
  | 'read_later'
  | 'other'
  | string

interface CategoryBadgeProps {
  category: EmailCategory | null | undefined
  className?: string
}

const CATEGORY_CONFIG: Record<
  string,
  { label: string; bg: string; text: string; border: string; dot: string }
> = {
  urgent: {
    label: 'Urgent',
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-200',
    dot: 'bg-red-600',
  },
  priority: {
    label: 'Priority',
    bg: 'bg-orange-50',
    text: 'text-orange-700',
    border: 'border-orange-200',
    dot: 'bg-orange-600',
  },
  finance_accounts: {
    label: 'Finance / Accounts',
    bg: 'bg-cyan-50',
    text: 'text-cyan-800',
    border: 'border-cyan-200',
    dot: 'bg-cyan-600',
  },
  contracts: {
    label: 'Contracts',
    bg: 'bg-purple-50',
    text: 'text-purple-800',
    border: 'border-purple-200',
    dot: 'bg-purple-600',
  },
  nph_job_update: {
    label: 'NPH Job Update',
    bg: 'bg-emerald-50',
    text: 'text-emerald-800',
    border: 'border-emerald-200',
    dot: 'bg-emerald-600',
  },
  read_later: {
    label: 'Read Later',
    bg: 'bg-stone-100',
    text: 'text-stone-700',
    border: 'border-stone-200',
    dot: 'bg-stone-500',
  },
  other: {
    label: 'Other',
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-200',
    dot: 'bg-slate-500',
  },
}

export function CategoryBadge({ category, className = '' }: CategoryBadgeProps) {
  if (!category) {
    return (
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-zinc-100 text-zinc-600 border border-zinc-200 ${className}`}
      >
        Unclassified
      </span>
    )
  }

  const config = CATEGORY_CONFIG[category.toLowerCase()] || {
    label: category.replace(/_/g, ' '),
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-200',
    dot: 'bg-slate-500',
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.bg} ${config.text} ${config.border} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      <span className="capitalize">{config.label}</span>
    </span>
  )
}
