import React from 'react'
import { cn } from '@/lib/cn'
import { controlBase, controlDefaultColors } from './field'

type InputSize = 'sm' | 'md' | 'lg'

const heights: Record<InputSize, string> = {
  sm: 'h-(--fm-c-control-sm) text-sm',
  md: 'h-(--fm-c-control-md) text-base',
  lg: 'h-(--fm-c-control-lg) text-base',
}

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  size?: InputSize
  /** Decorative icon inside the left edge (e.g. search). */
  leadingIcon?: React.ReactNode
  /** Interactive element inside the right edge (e.g. clear button). */
  trailing?: React.ReactNode
  invalid?: boolean
  /**
   * 'quiet': filled, borderless at rest (search fields in toolbars). The icon and
   * placeholder identify it; the border appears on hover and focus. Not for forms.
   */
  variant?: 'default' | 'quiet'
}

const quietColors =
  'border-transparent bg-sunken hover:border-line-control focus-visible:bg-panel [&::-webkit-search-cancel-button]:hidden'

export const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input(
  { size = 'md', leadingIcon, trailing, invalid, variant = 'default', className, ...props },
  ref
) {
  return (
    <div className={cn('relative flex items-center', className)}>
      {leadingIcon && (
        <span className="pointer-events-none absolute left-2.5 flex text-fg-subtle [&_svg]:size-4" aria-hidden="true">
          {leadingIcon}
        </span>
      )}
      <input
        ref={ref}
        aria-invalid={invalid || undefined}
        className={cn(
          controlBase,
          variant === 'quiet' ? quietColors : controlDefaultColors,
          heights[size],
          // 16px on touch devices prevents iOS zoom-on-focus.
          'px-2.5 pointer-coarse:min-h-(--fm-c-touch) pointer-coarse:text-lg',
          leadingIcon ? 'pl-8' : null,
          trailing ? 'pr-9' : null
        )}
        {...props}
      />
      {trailing && <span className="absolute right-1 flex">{trailing}</span>}
    </div>
  )
})
