'use client'

import React from 'react'
import { Popover as RadixPopover } from 'radix-ui'
import { cn } from '@/lib/cn'

export const Popover = RadixPopover.Root
export const PopoverTrigger = RadixPopover.Trigger
export const PopoverClose = RadixPopover.Close

interface PopoverContentProps {
  children: React.ReactNode
  align?: 'start' | 'center' | 'end'
  side?: 'top' | 'right' | 'bottom' | 'left'
  /** Accessible name for the panel (it has no visible title of its own). */
  label: string
  className?: string
}

/**
 * Non-modal panel anchored to its trigger (filters, small forms). Escape and
 * outside clicks close it; focus moves in on open and back to the trigger on close.
 */
export function PopoverContent({ children, align = 'start', side = 'bottom', label, className }: PopoverContentProps) {
  return (
    <RadixPopover.Portal>
      <RadixPopover.Content
        align={align}
        side={side}
        sideOffset={6}
        collisionPadding={8}
        aria-label={label}
        tabIndex={-1}
        // Focus the panel, not its first field: no stray focus ring when opened by
        // pointer, and Tab moves straight into the fields for keyboard users.
        onOpenAutoFocus={(e) => {
          e.preventDefault()
          ;(e.currentTarget as HTMLElement | null)?.focus()
        }}
        className={cn(
          'z-50 w-72 rounded-lg border border-line-strong bg-panel p-3 shadow-md outline-none',
          'data-[state=open]:animate-fm-pop-in data-[state=closed]:animate-fm-pop-out',
          className
        )}
      >
        {children}
      </RadixPopover.Content>
    </RadixPopover.Portal>
  )
}
