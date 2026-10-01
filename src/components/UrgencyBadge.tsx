import React from 'react'

export type EmailUrgency =
  | 'urgent'
  | 'priority'
  | 'routine'
  | 'read_later'
  | 'normal'
  | string

interface UrgencyBadgeProps {
  urgency: EmailUrgency | null | undefined
  className?: string
}

const URGENCY_CONFIG: Record<
  string,
  { label: string; bg: string; text: string; border: string; dot: string }
> = {
  urgent: {
    label: 'Urgent',
    bg: 'bg-[var(--urgency-urgent-bg)]',
    text: 'text-[var(--urgency-urgent)]',
    border: 'border-[var(--urgency-urgent-border)]',
    dot: 'bg-[var(--urgency-urgent)]',
  },
  priority: {
    label: 'Priority',
    bg: 'bg-[var(--urgency-priority-bg)]',
    text: 'text-[var(--urgency-priority)]',
    border: 'border-[var(--urgency-priority-border)]',
    dot: 'bg-[var(--urgency-priority)]',
  },
  routine: {
    label: 'Routine',
    bg: 'bg-[var(--urgency-routine-bg)]',
    text: 'text-[var(--urgency-routine)]',
    border: 'border-[var(--urgency-routine-border)]',
    dot: 'bg-[var(--urgency-routine)]',
  },
  read_later: {
    label: 'Read later',
    bg: 'bg-[var(--urgency-read-later-bg)]',
    text: 'text-[var(--urgency-read-later)]',
    border: 'border-[var(--urgency-read-later-border)]',
    dot: 'bg-[var(--urgency-read-later)]',
  },
  normal: {
    label: 'Routine',
    bg: 'bg-[var(--urgency-routine-bg)]',
    text: 'text-[var(--urgency-routine)]',
    border: 'border-[var(--urgency-routine-border)]',
    dot: 'bg-[var(--urgency-routine)]',
  },
}

export function UrgencyBadge({ urgency, className = '' }: UrgencyBadgeProps) {
  if (!urgency) return null

  const normalized = urgency.toLowerCase().trim()
  const config = URGENCY_CONFIG[normalized] || {
    label: urgency.replace(/_/g, ' '),
    bg: 'bg-[var(--urgency-routine-bg)]',
    text: 'text-[var(--urgency-routine)]',
    border: 'border-[var(--urgency-routine-border)]',
    dot: 'bg-[var(--urgency-routine)]',
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-semibold border select-none ${config.bg} ${config.text} ${config.border} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${config.dot}`} aria-hidden="true" />
      <span>{config.label}</span>
    </span>
  )
}
