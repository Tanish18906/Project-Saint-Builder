'use client'

import React from 'react'
import { cn } from '@/lib/cn'
import { focusRing } from './button'
import { Spinner } from './spinner'
import { Tooltip } from './tooltip'

type IconButtonSize = 'sm' | 'md' | 'lg'

const sizes: Record<IconButtonSize, string> = {
  sm: 'size-(--fm-c-control-sm) [&_svg]:size-3.5',
  md: 'size-(--fm-c-control-md) [&_svg]:size-4',
  lg: 'size-(--fm-c-control-lg) [&_svg]:size-5',
}

export interface IconButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'aria-label'> {
  /** Required: the accessible name, also shown as the tooltip. */
  label: string
  icon: React.ReactNode
  size?: IconButtonSize
  variant?: 'ghost' | 'secondary'
  shortcut?: string[]
  /** Pressed/selected toggle state. */
  active?: boolean
  loading?: boolean
  /** Set false where a visible label already sits next to the button. */
  showTooltip?: boolean
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  {
    label,
    icon,
    size = 'md',
    variant = 'ghost',
    shortcut,
    active,
    loading,
    showTooltip = true,
    disabled,
    className,
    type,
    ...props
  },
  ref
) {
  const button = (
    <button
      ref={ref}
      type={type ?? 'button'}
      aria-label={label}
      aria-pressed={active}
      aria-busy={loading || undefined}
      disabled={disabled || loading}
      className={cn(
        'inline-flex shrink-0 cursor-pointer items-center justify-center rounded-md',
        'transition-[background-color,color,border-color] duration-(--fm-duration-fast) ease-standard',
        'disabled:cursor-not-allowed disabled:text-fg-disabled pointer-coarse:min-h-(--fm-c-touch) pointer-coarse:min-w-(--fm-c-touch)',
        variant === 'ghost'
          ? 'text-fg-muted hover:bg-hover hover:text-fg active:bg-pressed disabled:bg-transparent'
          : 'border border-line-strong bg-panel text-fg-muted shadow-xs hover:bg-hover hover:text-fg',
        active && 'bg-selected text-accent-fg hover:bg-accent-subtle-hover hover:text-accent-fg',
        sizes[size],
        focusRing,
        className
      )}
      {...props}
    >
      {loading ? <Spinner size={size === 'sm' ? 'sm' : 'md'} /> : icon}
    </button>
  )

  if (!showTooltip) return button
  return (
    <Tooltip content={label} shortcut={shortcut}>
      {button}
    </Tooltip>
  )
})
