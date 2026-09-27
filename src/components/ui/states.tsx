import React from 'react'
import { AlertCircle, AlertTriangle, CheckCircle2, Info } from 'lucide-react'
import { cn } from '@/lib/cn'

/* ------------------------------------------------------------ EmptyState */

interface EmptyStateProps {
  /** One line saying what's (not) here. */
  title: string
  /** Optional: what happens next or what to do. Skip decorative filler. */
  description?: React.ReactNode
  icon?: React.ReactNode
  action?: React.ReactNode
  /** 'inline' sits where the first row would be; 'page' centers in a region. */
  layout?: 'inline' | 'page'
  className?: string
}

/**
 * "Nothing here" — never used for failures (see ErrorState). Distinguish
 * "no data yet" from "no results for these filters" in the copy.
 */
export function EmptyState({ title, description, icon, action, layout = 'inline', className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-1',
        layout === 'page' ? 'items-center px-6 py-16 text-center' : 'items-start px-4 py-8',
        className
      )}
    >
      {icon && <span className="mb-1 flex text-fg-subtle [&_svg]:size-5" aria-hidden="true">{icon}</span>}
      <p className="text-base font-medium text-fg">{title}</p>
      {description && <p className="max-w-md text-sm text-fg-muted">{description}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  )
}

/* ------------------------------------------------------------ ErrorState */

interface ErrorStateProps {
  title: string
  /** Plain-language cause + what to do. Never raw error text. */
  description?: React.ReactNode
  /** Support reference (e.g. Next error digest), shown small in mono. */
  reference?: string
  action?: React.ReactNode
  layout?: 'inline' | 'page'
  className?: string
}

/** A failure to load or act. Visibly different from EmptyState, and announced. */
export function ErrorState({ title, description, reference, action, layout = 'inline', className }: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        'flex gap-3',
        layout === 'page' ? 'mx-auto max-w-md flex-col items-center px-6 py-16 text-center' : 'items-start px-4 py-6',
        className
      )}
    >
      <span className="flex text-danger-fg [&_svg]:size-5" aria-hidden="true">
        <AlertCircle />
      </span>
      <div className={cn('flex flex-col gap-1', layout === 'page' && 'items-center')}>
        <p className="text-base font-semibold text-fg">{title}</p>
        {description && <p className="text-sm text-fg-muted">{description}</p>}
        {reference && (
          <p className="text-xs text-fg-subtle">
            Reference <span className="font-mono">{reference}</span>
          </p>
        )}
        {action && <div className="mt-3">{action}</div>}
      </div>
    </div>
  )
}

/* ----------------------------------------------------------- InlineAlert */

type AlertTone = 'info' | 'success' | 'warning' | 'danger'

const alertSkin: Record<AlertTone, { box: string; icon: React.ReactNode }> = {
  info: { box: 'border-accent-line bg-accent-subtle text-accent-fg', icon: <Info /> },
  success: { box: 'border-success-line bg-success-subtle text-success-fg', icon: <CheckCircle2 /> },
  warning: { box: 'border-warning-line bg-warning-subtle text-warning-fg', icon: <AlertTriangle /> },
  danger: { box: 'border-danger-line bg-danger-subtle text-danger-fg', icon: <AlertCircle /> },
}

interface InlineAlertProps {
  tone?: AlertTone
  title: React.ReactNode
  children?: React.ReactNode
  action?: React.ReactNode
  className?: string
}

/**
 * Persistent, in-context message (e.g. "This reply is locked", "Microphone
 * blocked"). Errors are announced assertively; others politely.
 */
export function InlineAlert({ tone = 'info', title, children, action, className }: InlineAlertProps) {
  const skin = alertSkin[tone]
  return (
    <div
      role={tone === 'danger' ? 'alert' : 'status'}
      className={cn('flex items-start gap-2.5 rounded-md border px-3 py-2.5', skin.box, className)}
    >
      <span className="mt-0.5 flex shrink-0 [&_svg]:size-4" aria-hidden="true">
        {skin.icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-base font-medium">{title}</p>
        {children && <div className="mt-0.5 text-sm text-fg">{children}</div>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
