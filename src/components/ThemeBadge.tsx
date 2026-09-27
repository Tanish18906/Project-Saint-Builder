// LEGACY PRESENTATION — replaced per DESIGN_SYSTEM.md §12; do not extend. New UI uses src/components/ui.
import React from 'react'
import { themeLabel } from '@/lib/format'

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

// Label logic lives in lib/format so every screen shares it.
export { themeLabel }

interface ThemeBadgeProps {
  theme: EmailTheme | null | undefined
  className?: string
}

export function ThemeBadge({ theme, className = '' }: ThemeBadgeProps) {
  if (!theme) {
    return (
      <span
        className={`inline-flex items-center px-1.5 py-px rounded-control whitespace-nowrap text-caption font-medium bg-tag-bg text-tag-text ${className}`}
      >
        Unclassified
      </span>
    )
  }

  return (
    <span
      className={`inline-flex items-center px-1.5 py-px rounded-control whitespace-nowrap text-caption font-medium bg-tag-bg text-tag-text ${className}`}
    >
      {themeLabel(theme)}
    </span>
  )
}
