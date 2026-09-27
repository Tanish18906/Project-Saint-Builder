'use client'

import React from 'react'
import { Tooltip as RadixTooltip } from 'radix-ui'
import { cn } from '@/lib/cn'
import { Kbd } from './kbd'

/** Mount once near the root. Tooltips share open/skip delays through it. */
export function TooltipProvider({ children }: { children: React.ReactNode }) {
  return (
    <RadixTooltip.Provider delayDuration={400} skipDelayDuration={200}>
      {children}
    </RadixTooltip.Provider>
  )
}

interface TooltipProps {
  /** Short supplementary text. Never the only place essential information lives. */
  content: React.ReactNode
  /** Optional keyboard shortcut shown after the text, e.g. ['⌘', 'Enter']. */
  shortcut?: string[]
  side?: 'top' | 'right' | 'bottom' | 'left'
  children: React.ReactElement
}

export function Tooltip({ content, shortcut, side = 'top', children }: TooltipProps) {
  return (
    <RadixTooltip.Root>
      <RadixTooltip.Trigger asChild>{children}</RadixTooltip.Trigger>
      <RadixTooltip.Portal>
        <RadixTooltip.Content
          side={side}
          sideOffset={6}
          collisionPadding={8}
          className={cn(
            'z-50 flex max-w-64 items-center gap-2 rounded-md bg-inverse px-2 py-1 text-xs text-fg-inverse shadow-md',
            'data-[state=delayed-open]:animate-fm-fade-in data-[state=instant-open]:animate-fm-fade-in data-[state=closed]:animate-fm-fade-out'
          )}
        >
          <span>{content}</span>
          {shortcut && (
            <span className="flex items-center gap-0.5">
              {shortcut.map((k) => (
                <Kbd key={k} tone="inverse">
                  {k}
                </Kbd>
              ))}
            </span>
          )}
        </RadixTooltip.Content>
      </RadixTooltip.Portal>
    </RadixTooltip.Root>
  )
}
