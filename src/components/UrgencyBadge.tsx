// LEGACY PRESENTATION — replaced per DESIGN_SYSTEM.md §12; do not extend. New UI uses src/components/ui.
import React from 'react'

export type EmailUrgency = 'urgent' | 'priority' | 'normal' | string

interface UrgencyBadgeProps {
  urgency: EmailUrgency | null | undefined
  className?: string
  /** Suppress the "Normal" badge — normal urgency isn't decision-relevant, so
   * rows shouldn't spend visual weight announcing the absence of a signal. */
  hideNormal?: boolean
}

const URGENCY_CONFIG: Record<
  string,
  { label: string; bg: string; text: string; border: string; dot?: string }
> = {
  urgent: {
    label: 'Urgent',
    bg: 'bg-signal-urgent-bg',
    text: 'text-signal-urgent',
    border: 'border-signal-urgent-border',
    dot: 'bg-signal-urgent',
  },
  priority: {
    label: 'Priority',
    bg: 'bg-signal-priority-bg',
    text: 'text-signal-priority-text',
    border: 'border-signal-priority-border',
    dot: 'bg-signal-priority',
  },
  normal: {
    label: 'Normal',
    bg: 'bg-surface',
    text: 'text-text-secondary',
    border: 'border-border-hairline',
  },
}

export function UrgencyBadge({ urgency, className = '', hideNormal = false }: UrgencyBadgeProps) {
  if (!urgency) return null
  if (hideNormal && urgency.toLowerCase() === 'normal') return null

  const config = URGENCY_CONFIG[urgency.toLowerCase()] || {
    label: urgency.replace(/_/g, ' '),
    bg: 'bg-surface',
    text: 'text-text-secondary',
    border: 'border-border-hairline',
  }

  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-px rounded-control whitespace-nowrap text-caption font-semibold border ${config.bg} ${config.text} ${config.border} ${className}`}
    >
      {config.dot && <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />}
      <span>{config.label}</span>
    </span>
  )
}
