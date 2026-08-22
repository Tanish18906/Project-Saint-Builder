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
  { label: string; bg?: string; text?: string; border?: string; dot?: string; isUrgent?: boolean }
> = {
  urgent: {
    label: 'Urgent',
    bg: 'bg-[#fef2f2]',
    text: 'text-[#b91c1c]',
    border: 'border-[#fecaca]',
    dot: 'bg-[#b91c1c]',
    isUrgent: true,
  },
  priority: {
    label: 'Priority',
    bg: 'bg-[#fff7ed]',
    text: 'text-[#c2560c]',
    border: 'border-[#fed7aa]',
    dot: 'bg-[#c2560c]',
    isUrgent: true,
  },
  finance_accounts: {
    label: 'Finance',
  },
  contracts: {
    label: 'Contracts',
  },
  nph_job_update: {
    label: 'NPH Update',
  },
  read_later: {
    label: 'Read Later',
  },
  other: {
    label: 'Other',
  },
}

export function CategoryBadge({ category, className = '' }: CategoryBadgeProps) {
  if (!category) {
    return (
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[#ece7db] text-[#4a453c] border border-[#e2dbcd] ${className}`}
      >
        Unclassified
      </span>
    )
  }

  const key = category.toLowerCase()
  const config = CATEGORY_CONFIG[key]
  const label = config?.label || category.replace(/_/g, ' ')

  if (config?.isUrgent) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-semibold border ${config.bg} ${config.text} ${config.border} ${className}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
        <span>{label}</span>
      </span>
    )
  }

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[#ece7db] text-[#4a453c] border border-[#e2dbcd] capitalize ${className}`}
    >
      {label}
    </span>
  )
}
