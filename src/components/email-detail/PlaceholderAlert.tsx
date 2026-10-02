import * as React from 'react'
import { AlertTriangle } from 'lucide-react'
import { Badge } from '@/components/ui'

export interface PlaceholderAlertProps {
  placeholders: string[]
  className?: string
}

/**
 * Accessible warning banner displayed when a draft reply contains unresolved
 * template placeholders (e.g. [CONFIRM ...], [INSERT ...]) that must be reviewed
 * and resolved before sending.
 */
export function PlaceholderAlert({ placeholders, className = '' }: PlaceholderAlertProps) {
  if (!placeholders || placeholders.length === 0) {
    return null
  }

  const count = placeholders.length
  const headingText =
    count === 1 ? 'Unresolved placeholder detected' : `${count} unresolved placeholders detected`
  const bodyText =
    count === 1
      ? 'This draft contains an unresolved placeholder that must be completed or removed before approving and sending.'
      : 'This draft contains unresolved placeholders that must be completed or removed before approving and sending.'

  return (
    <div
      role="alert"
      aria-live="polite"
      className={`rounded-lg border border-amber-200 bg-amber-50/80 p-3 sm:p-3.5 text-xs text-amber-900 shadow-xs flex flex-col gap-2.5 transition-all ${className}`}
    >
      <div className="flex items-start gap-2.5">
        <AlertTriangle
          className="w-4 h-4 text-amber-600 shrink-0 mt-0.5"
          aria-hidden="true"
        />
        <div className="space-y-0.5 flex-1">
          <p className="font-semibold text-amber-950 leading-tight">{headingText}</p>
          <p className="text-[11px] text-amber-800/90 leading-relaxed">{bodyText}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 pt-0.5 pl-6 sm:pl-6.5">
        {placeholders.map((placeholder, idx) => (
          <Badge
            key={`${placeholder}-${idx}`}
            variant="warning"
            size="sm"
            className="font-mono text-[11px] font-medium tracking-tight bg-amber-100 text-amber-900 border-amber-300"
          >
            {placeholder}
          </Badge>
        ))}
      </div>
    </div>
  )
}
