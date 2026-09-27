import React from 'react'
import { cn } from '@/lib/cn'

export type BadgeTone = 'neutral' | 'accent' | 'danger' | 'warning' | 'success'
export type BadgeVariant = 'subtle' | 'outline' | 'solid'

const subtle: Record<BadgeTone, string> = {
  neutral: 'bg-sunken text-fg-muted',
  accent: 'bg-accent-subtle text-accent-fg',
  danger: 'bg-danger-subtle text-danger-fg',
  warning: 'bg-warning-subtle text-warning-fg',
  success: 'bg-success-subtle text-success-fg',
}

const outline: Record<BadgeTone, string> = {
  neutral: 'border border-line-strong text-fg-muted',
  accent: 'border border-accent-line text-accent-fg',
  danger: 'border border-danger-line text-danger-fg',
  warning: 'border border-warning-line text-warning-fg',
  success: 'border border-success-line text-success-fg',
}

// Solid is reserved for final/terminal states (e.g. Sent) and the one urgent signal.
const solid: Record<BadgeTone, string> = {
  neutral: 'bg-inverse text-fg-inverse',
  accent: 'bg-accent text-fg-on-accent',
  danger: 'bg-danger text-fg-on-accent',
  warning: 'bg-warning-fg text-fg-on-accent',
  success: 'bg-success-fg text-fg-on-accent',
}

const dotColor: Record<BadgeTone, string> = {
  neutral: 'bg-fg-subtle',
  accent: 'bg-accent',
  danger: 'bg-danger-mark',
  warning: 'bg-warning-mark',
  success: 'bg-success-mark',
}

export interface BadgeProps {
  tone?: BadgeTone
  variant?: BadgeVariant
  /** Leading dot — a shape cue in addition to colour. */
  dot?: boolean
  icon?: React.ReactNode
  className?: string
  children: React.ReactNode
}

/** Compact label for a state or category. The text always carries the meaning. */
export function Badge({ tone = 'neutral', variant = 'subtle', dot, icon, className, children }: BadgeProps) {
  const skin = variant === 'solid' ? solid[tone] : variant === 'outline' ? outline[tone] : subtle[tone]
  return (
    <span
      className={cn(
        'inline-flex h-5 shrink-0 items-center gap-1 whitespace-nowrap rounded-sm px-1.5 text-2xs font-medium [&_svg]:size-3',
        skin,
        className
      )}
    >
      {dot && (
        <span
          aria-hidden="true"
          className={cn('size-1.5 rounded-full', variant === 'solid' ? 'bg-current' : dotColor[tone])}
        />
      )}
      {icon}
      {children}
    </span>
  )
}
