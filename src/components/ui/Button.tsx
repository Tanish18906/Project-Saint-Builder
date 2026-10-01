import * as React from 'react'
import { Loader2 } from 'lucide-react'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
  loading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className = '',
      variant = 'primary',
      size = 'md',
      isLoading = false,
      loading = false,
      leftIcon,
      rightIcon,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const isSpinnerActive = isLoading || loading
    const isDisabled = disabled || isSpinnerActive

    const baseStyles =
      'inline-flex items-center justify-center font-medium transition-colors cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] focus-visible:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none'

    const variantStyles: Record<string, string> = {
      primary:
        'bg-[var(--brand)] hover:bg-[var(--brand-light)] active:bg-[var(--brand-light)] text-white shadow-xs border border-transparent',
      secondary:
        'bg-[var(--surface)] hover:bg-[var(--surface-subtle)] text-[var(--text-primary)] border border-[var(--border-subtle)] shadow-xs',
      ghost:
        'bg-transparent hover:bg-[var(--surface-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-transparent',
      destructive:
        'bg-red-600 hover:bg-red-700 active:bg-red-800 text-white shadow-xs border border-transparent',
      outline:
        'bg-transparent hover:bg-[var(--surface-subtle)] text-[var(--text-primary)] border border-[var(--border-strong)]',
    }

    const sizeStyles: Record<string, string> = {
      sm: 'text-xs px-2.5 py-1.5 h-8 gap-1.5 rounded-md',
      md: 'text-sm px-3.5 py-2 h-9 sm:h-10 gap-2 rounded-lg',
      lg: 'text-base px-4 py-2.5 h-11 gap-2.5 rounded-lg',
    }

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={`${baseStyles} ${variantStyles[variant] || variantStyles.primary} ${
          sizeStyles[size] || sizeStyles.md
        } ${className}`}
        {...props}
      >
        {isSpinnerActive ? (
          <Loader2 className="w-4 h-4 animate-spin shrink-0" />
        ) : (
          leftIcon && <span className="shrink-0">{leftIcon}</span>
        )}
        {children}
        {!isSpinnerActive && rightIcon && <span className="shrink-0">{rightIcon}</span>}
      </button>
    )
  }
)

Button.displayName = 'Button'
