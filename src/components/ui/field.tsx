import React, { useId } from 'react'
import { AlertCircle } from 'lucide-react'
import { cn } from '@/lib/cn'
import { focusRing } from './button'

/**
 * Shared control skin for Input / Textarea / Select so every form control has
 * the same geometry, hover, focus, invalid and disabled states. Colours are a
 * separate set so a variant can swap them without competing utilities.
 */
export const controlBase =
  'w-full rounded-md border text-fg placeholder:text-fg-subtle ' +
  'transition-[border-color,box-shadow,background-color] duration-(--fm-duration-fast) ease-standard ' +
  'disabled:cursor-not-allowed disabled:border-line disabled:bg-sunken disabled:text-fg-disabled ' +
  // :read-only also matches every <select>, so scope it to text fields.
  '[&:read-only:not(select)]:bg-sunken [&:read-only:not(select):hover]:border-line-control ' +
  'aria-invalid:border-danger aria-invalid:hover:border-danger ' +
  focusRing

/** Default colours: 3:1 line-control border on panel. */
export const controlDefaultColors = 'border-line-control bg-panel hover:border-fg-muted'

export const controlSkin = `${controlBase} ${controlDefaultColors}`

interface FieldProps {
  label: string
  /** Visually hide the label (it stays available to assistive tech). */
  hideLabel?: boolean
  hint?: React.ReactNode
  error?: string | null
  required?: boolean
  className?: string
  /** Receives the ids to wire onto the control. */
  children: (ids: { id: string; describedBy?: string; invalid: boolean }) => React.ReactNode
}

/** Label + control + hint/error, with ids and aria wiring handled. */
export function Field({ label, hideLabel, hint, error, required, className, children }: FieldProps) {
  const id = useId()
  const hintId = hint ? `${id}-hint` : undefined
  const errorId = error ? `${id}-error` : undefined
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={id} className={cn('text-sm font-medium text-fg', hideLabel && 'sr-only')}>
        {label}
        {required && (
          <span className="text-fg-subtle" aria-hidden="true">
            {' '}
            *
          </span>
        )}
      </label>
      {children({ id, describedBy, invalid: Boolean(error) })}
      {hint && !error && (
        <p id={hintId} className="text-xs text-fg-subtle">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="flex items-start gap-1 text-xs text-danger-fg">
          <AlertCircle className="mt-px size-3.5 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}
    </div>
  )
}
