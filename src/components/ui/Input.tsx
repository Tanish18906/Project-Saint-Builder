import * as React from 'react'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string | boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  helperText?: string
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', error, leftIcon, rightIcon, helperText, disabled, id, ...props }, ref) => {
    const hasError = Boolean(error)
    const generatedId = React.useId()
    const inputId = id || generatedId
    const errorId = `${inputId}-error`
    const helperId = `${inputId}-helper`

    return (
      <div className="w-full space-y-1">
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3 flex items-center pointer-events-none text-[var(--text-secondary)] shrink-0">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            aria-invalid={hasError ? 'true' : undefined}
            aria-describedby={
              hasError && typeof error === 'string'
                ? errorId
                : helperText
                ? helperId
                : undefined
            }
            className={`w-full rounded-lg text-sm bg-[var(--surface)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] border transition-colors outline-none ${
              hasError
                ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100'
                : 'border-[var(--border-subtle)] hover:border-[var(--border-strong)] focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand-subtle)]'
            } ${leftIcon ? 'pl-9' : 'pl-3.5'} ${
              rightIcon ? 'pr-9' : 'pr-3.5'
            } py-2 h-10 disabled:opacity-50 disabled:bg-[var(--surface-subtle)] disabled:cursor-not-allowed ${className}`}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 flex items-center pointer-events-none text-[var(--text-secondary)] shrink-0">
              {rightIcon}
            </div>
          )}
        </div>
        {hasError && typeof error === 'string' && (
          <p id={errorId} className="text-xs text-red-600 font-medium">
            {error}
          </p>
        )}
        {!hasError && helperText && (
          <p id={helperId} className="text-xs text-[var(--text-secondary)]">
            {helperText}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'
