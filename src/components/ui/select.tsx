import React from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/cn'
import { controlSkin } from './field'

type SelectSize = 'sm' | 'md' | 'lg'

const heights: Record<SelectSize, string> = {
  sm: 'h-(--fm-c-control-sm) text-sm',
  md: 'h-(--fm-c-control-md) text-base',
  lg: 'h-(--fm-c-control-lg) text-base',
}

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  size?: SelectSize
  invalid?: boolean
}

/**
 * Native <select> with the OS chrome removed. Keyboard, screen-reader and the
 * mobile picker stay native — the right choice for simple single-value filters.
 * Use DropdownMenu for action menus, not this.
 */
export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { size = 'md', invalid, className, children, ...props },
  ref
) {
  return (
    <div className={cn('relative inline-flex', className)}>
      <select
        ref={ref}
        aria-invalid={invalid || undefined}
        className={cn(controlSkin, heights[size], 'cursor-pointer appearance-none pl-2.5 pr-8 pointer-coarse:min-h-(--fm-c-touch)')}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        aria-hidden="true"
        className="pointer-events-none absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2 text-fg-subtle"
      />
    </div>
  )
})
