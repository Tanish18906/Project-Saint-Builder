import * as React from 'react'

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'neutral' | 'brand' | 'success' | 'warning' | 'danger' | 'info'
  size?: 'sm' | 'md'
  dot?: boolean
  dotClassName?: string
  icon?: React.ReactNode
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  (
    {
      className = '',
      variant = 'neutral',
      size = 'sm',
      dot = false,
      dotClassName = '',
      icon,
      children,
      ...props
    },
    ref
  ) => {
    const variantStyles: Record<string, { badge: string; dot: string }> = {
      neutral: {
        badge: 'bg-[var(--surface-subtle)] text-[var(--text-secondary)] border border-[var(--border-subtle)]',
        dot: 'bg-[var(--text-tertiary)]',
      },
      brand: {
        badge: 'bg-[var(--brand-subtle)] text-[var(--brand)] border border-[var(--brand-subtle)] font-medium',
        dot: 'bg-[var(--brand)]',
      },
      success: {
        badge: 'bg-emerald-50 text-emerald-800 border border-emerald-200',
        dot: 'bg-emerald-600',
      },
      warning: {
        badge: 'bg-amber-50 text-amber-800 border border-amber-200',
        dot: 'bg-amber-600',
      },
      danger: {
        badge: 'bg-red-50 text-red-700 border border-red-200',
        dot: 'bg-red-600',
      },
      info: {
        badge: 'bg-sky-50 text-sky-800 border border-sky-200',
        dot: 'bg-sky-600',
      },
    }

    const currentVariant = variantStyles[variant] || variantStyles.neutral

    const sizeStyles: Record<string, string> = {
      sm: 'text-[11px] px-2 py-0.5 rounded font-medium',
      md: 'text-xs px-2.5 py-1 rounded-md font-medium',
    }

    return (
      <span
        ref={ref}
        className={`inline-flex items-center gap-1.5 select-none leading-none ${currentVariant.badge} ${
          sizeStyles[size] || sizeStyles.sm
        } ${className}`}
        {...props}
      >
        {dot && (
          <span
            aria-hidden="true"
            className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotClassName || currentVariant.dot}`}
          />
        )}
        {icon && <span className="shrink-0">{icon}</span>}
        <span>{children}</span>
      </span>
    )
  }
)

Badge.displayName = 'Badge'
