import React from 'react'

export type EmailUrgency = 'urgent' | 'priority' | 'normal' | string

interface UrgencyBadgeProps {
  urgency: EmailUrgency | null | undefined
  className?: string
}

const URGENCY_CONFIG: Record<
  string,
  { label: string; bg: string; text: string; border: string; dot?: string }
> = {
  urgent: {
    label: 'Urgent',
    bg: 'bg-[#fef2f2]',
    text: 'text-[#b91c1c]',
    border: 'border-[#fecaca]',
    dot: 'bg-[#b91c1c]',
  },
  priority: {
    label: 'Priority',
    bg: 'bg-[#fff7ed]',
    text: 'text-[#c2560c]',
    border: 'border-[#fed7aa]',
    dot: 'bg-[#c2560c]',
  },
  normal: {
    label: 'Normal',
    bg: 'bg-[#f5f1e8]',
    text: 'text-[#6b6559]',
    border: 'border-[#e8e2d4]',
  },
}

export function UrgencyBadge({ urgency, className = '' }: UrgencyBadgeProps) {
  if (!urgency) return null

  const config = URGENCY_CONFIG[urgency.toLowerCase()] || {
    label: urgency.replace(/_/g, ' '),
    bg: 'bg-[#f5f1e8]',
    text: 'text-[#6b6559]',
    border: 'border-[#e8e2d4]',
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-semibold border ${config.bg} ${config.text} ${config.border} ${className}`}
    >
      {config.dot && <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />}
      <span>{config.label}</span>
    </span>
  )
}
