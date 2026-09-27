import React from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/cn'

const sizes = { sm: 'size-3.5', md: 'size-4', lg: 'size-5' } as const

interface SpinnerProps {
  size?: keyof typeof sizes
  /** When set, announced to screen readers; otherwise decorative. */
  label?: string
  className?: string
}

export function Spinner({ size = 'md', label, className }: SpinnerProps) {
  return (
    <>
      <Loader2 aria-hidden="true" className={cn('shrink-0 animate-spin', sizes[size], className)} />
      {label && <span className="sr-only">{label}</span>}
    </>
  )
}
