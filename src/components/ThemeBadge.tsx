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

const THEME_LABELS: Record<string, string> = {
  accounts: 'Accounts',
  orders: 'Orders',
  finance: 'Finance',
  suppliers: 'Suppliers',
  promotions: 'Promotions',
  nph_jobs: 'NPH Jobs',
  meetings_appointments: 'Meetings & Appointments',
  invoices: 'Invoices',
  certificates: 'Certificates',
}

export function ThemeBadge({ theme, className = '' }: ThemeBadgeProps) {
  if (!theme) {
    return (
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-[var(--surface-subtle)] text-[var(--text-tertiary)] border border-[var(--border-subtle)] select-none ${className}`}
      >
        Unclassified
      </span>
    )
  }

  const normalized = theme.toLowerCase().trim()
  const label = THEME_LABELS[normalized] || theme.replace(/_/g, ' ')

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-[var(--surface-subtle)] text-[var(--text-secondary)] border border-[var(--border-subtle)] capitalize select-none ${className}`}
    >
      {label}
    </span>
  )
}
