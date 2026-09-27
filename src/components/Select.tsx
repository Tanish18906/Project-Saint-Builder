// LEGACY PRESENTATION — replaced per DESIGN_SYSTEM.md §12; do not extend. New UI uses src/components/ui.
import React from 'react'
import { ChevronDown } from 'lucide-react'

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  /** 44px touch height, full width — for the mobile filter sheet. */
  touch?: boolean
  wrapperClassName?: string
}

// A native <select> with the OS chrome removed: keyboard, screen-reader and
// mobile picker behaviour stay exactly native; only the visible styling changes.
export function Select({ touch = false, className = '', wrapperClassName = '', children, ...props }: SelectProps) {
  return (
    <div className={`relative ${touch ? 'w-full' : 'inline-flex'} ${wrapperClassName}`}>
      <select
        {...props}
        className={`appearance-none w-full rounded-control border border-border-control bg-surface-raised text-text-primary text-secondary pl-2.5 pr-8 cursor-pointer transition-[border-color,box-shadow] duration-150 hover:border-text-secondary focus:outline-none focus-visible:ring-2 focus-visible:ring-border-brand focus-visible:ring-offset-1 focus-visible:ring-offset-surface ${
          touch ? 'h-11' : 'h-8'
        } ${className}`}
      >
        {children}
      </select>
      <ChevronDown
        aria-hidden="true"
        className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-secondary"
      />
    </div>
  )
}
