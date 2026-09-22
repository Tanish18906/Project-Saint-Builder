import React from 'react'

export type EmailTheme =
  | 'accounts'
  | 'orders'
  | 'finance'
  | 'suppliers'
  | 'promotions'
  | 'nph_jobs'
  | 'meetings_appointments'
  | 'invoices'
  | 'certificates'
  | string

interface ThemeBadgeProps {
  theme: EmailTheme | null | undefined
  className?: string
}

export function ThemeBadge({ theme, className = '' }: ThemeBadgeProps) {
  if (!theme) {
    return (
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[#ece7db] text-[#4a453c] border border-[#e2dbcd] ${className}`}
      >
        Unclassified
      </span>
    )
  }

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[#ece7db] text-[#4a453c] border border-[#e2dbcd] capitalize ${className}`}
    >
      {theme.replace(/_/g, ' ')}
    </span>
  )
}
