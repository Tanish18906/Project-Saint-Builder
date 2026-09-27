import React from 'react'
import { cn } from '@/lib/cn'

interface KbdProps {
  children: React.ReactNode
  tone?: 'default' | 'inverse'
  className?: string
}

/** Keyboard shortcut hint. Hidden on touch-only devices where it means nothing. */
export function Kbd({ children, tone = 'default', className }: KbdProps) {
  return (
    <kbd
      className={cn(
        'inline-flex h-4.5 min-w-4.5 items-center justify-center rounded-xs px-1 font-sans text-2xs font-medium pointer-coarse:hidden',
        tone === 'default' ? 'border border-line-strong bg-panel text-fg-muted' : 'bg-fg-inverse/15 text-fg-inverse',
        className
      )}
    >
      {children}
    </kbd>
  )
}
