'use client'

import React from 'react'
import { Dialog as RadixDialog } from 'radix-ui'
import { X } from 'lucide-react'
import { cn } from '@/lib/cn'
import { IconButton } from './icon-button'

export const Sheet = RadixDialog.Root
export const SheetTrigger = RadixDialog.Trigger
export const SheetClose = RadixDialog.Close

const sides = {
  // Phones: filter panels, action lists. Respects the home-indicator safe area.
  bottom:
    'inset-x-0 bottom-0 max-h-[85dvh] rounded-t-xl border-t pb-[max(1rem,env(safe-area-inset-bottom))] ' +
    'data-[state=open]:animate-fm-slide-up data-[state=closed]:animate-fm-slide-down',
  // Tablet/desktop: secondary panels (e.g. details) without leaving the page.
  right:
    'inset-y-0 right-0 h-dvh w-[min(26rem,100vw)] border-l ' +
    'data-[state=open]:animate-fm-slide-left data-[state=closed]:animate-fm-slide-right',
} as const

interface SheetContentProps {
  title: React.ReactNode
  description?: React.ReactNode
  side?: keyof typeof sides
  footer?: React.ReactNode
  children: React.ReactNode
  className?: string
}

/** Edge-anchored modal panel. Same focus/escape/scroll-lock guarantees as Dialog. */
export function SheetContent({ title, description, side = 'bottom', footer, children, className }: SheetContentProps) {
  return (
    <RadixDialog.Portal>
      <RadixDialog.Overlay className="fixed inset-0 z-50 bg-overlay data-[state=open]:animate-fm-fade-in data-[state=closed]:animate-fm-fade-out" />
      <RadixDialog.Content
        className={cn('fixed z-50 flex flex-col border-line-strong bg-panel shadow-lg outline-none', sides[side], className)}
      >
        {side === 'bottom' && <div aria-hidden="true" className="mx-auto mt-2 h-1 w-9 rounded-full bg-line-strong" />}
        <div className="flex items-start justify-between gap-3 border-b border-line px-4 py-3">
          <div className="min-w-0">
            <RadixDialog.Title className="text-lg font-semibold text-fg">{title}</RadixDialog.Title>
            {description ? (
              <RadixDialog.Description className="mt-0.5 text-sm text-fg-muted">{description}</RadixDialog.Description>
            ) : (
              <RadixDialog.Description className="sr-only">{title}</RadixDialog.Description>
            )}
          </div>
          <RadixDialog.Close asChild>
            <IconButton label="Close" icon={<X />} size="sm" className="-mr-1.5" showTooltip={false} />
          </RadixDialog.Close>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">{children}</div>
        {footer && <div className="flex items-center gap-2 border-t border-line px-4 pt-3">{footer}</div>}
      </RadixDialog.Content>
    </RadixDialog.Portal>
  )
}
