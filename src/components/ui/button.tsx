import React from 'react'
import { Slot } from 'radix-ui'
import { cn } from '@/lib/cn'
import { Spinner } from './spinner'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'danger-ghost'
export type ButtonSize = 'sm' | 'md' | 'lg'

/** Shared focus ring for every interactive primitive. */
export const focusRing =
  'outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-panel'

const base =
  'relative inline-flex shrink-0 select-none items-center justify-center gap-1.5 whitespace-nowrap rounded-md font-medium ' +
  'transition-[background-color,border-color,color,box-shadow] duration-(--fm-duration-fast) ease-standard ' +
  'cursor-pointer disabled:cursor-not-allowed aria-disabled:cursor-not-allowed aria-busy:cursor-wait aria-busy:opacity-85 ' +
  focusRing

const variants: Record<ButtonVariant, string> = {
  primary:
    'bg-accent text-fg-on-accent shadow-xs hover:bg-accent-hover active:bg-accent-pressed ' +
    'disabled:bg-sunken disabled:text-fg-disabled disabled:shadow-none',
  secondary:
    'border border-line-strong bg-panel text-fg shadow-xs hover:bg-hover hover:border-line-control active:bg-pressed ' +
    'disabled:bg-panel disabled:text-fg-disabled disabled:border-line disabled:shadow-none',
  ghost:
    'text-fg-muted hover:bg-hover hover:text-fg active:bg-pressed disabled:text-fg-disabled disabled:bg-transparent',
  danger:
    'bg-danger text-fg-on-accent shadow-xs hover:bg-danger-hover disabled:bg-sunken disabled:text-fg-disabled disabled:shadow-none',
  'danger-ghost':
    'text-danger-fg hover:bg-danger-subtle active:bg-danger-subtle disabled:text-fg-disabled disabled:bg-transparent',
}

// Coarse pointers (touch) always get a 44px target, whatever the visual size.
const sizes: Record<ButtonSize, string> = {
  sm: 'h-(--fm-c-control-sm) px-2.5 text-sm pointer-coarse:min-h-(--fm-c-touch)',
  md: 'h-(--fm-c-control-md) px-3 text-base pointer-coarse:min-h-(--fm-c-touch)',
  lg: 'h-(--fm-c-control-lg) px-4 text-base pointer-coarse:min-h-(--fm-c-touch)',
}

const iconSize: Record<ButtonSize, string> = {
  sm: '[&_svg]:size-3.5',
  md: '[&_svg]:size-4',
  lg: '[&_svg]:size-4',
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  /** Shows a spinner, keeps the label (width stays stable) and blocks clicks. */
  loading?: boolean
  leadingIcon?: React.ReactNode
  trailingIcon?: React.ReactNode
  /** Render the child element (e.g. next/link) with button styling. */
  asChild?: boolean
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'secondary',
    size = 'md',
    loading = false,
    leadingIcon,
    trailingIcon,
    asChild = false,
    disabled,
    className,
    children,
    type,
    onClick,
    ...props
  },
  ref
) {
  // Loading is not "disabled": the button keeps its colour so the user can see
  // which action is in flight, but it is marked busy and ignores clicks.
  const classes = cn(base, variants[variant], sizes[size], iconSize[size], className)

  if (asChild) {
    return (
      <Slot.Root ref={ref} className={classes} onClick={onClick} {...props}>
        {children}
      </Slot.Root>
    )
  }

  return (
    <button
      ref={ref}
      type={type ?? 'button'}
      disabled={disabled}
      aria-busy={loading || undefined}
      aria-disabled={loading || undefined}
      onClick={loading ? (e) => e.preventDefault() : onClick}
      className={classes}
      {...props}
    >
      {loading ? <Spinner size={size === 'sm' ? 'sm' : 'md'} /> : leadingIcon}
      {children}
      {!loading && trailingIcon}
    </button>
  )
})
