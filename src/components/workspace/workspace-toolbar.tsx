'use client'

import React from 'react'
import { ChevronDown, ChevronLeft, ChevronUp, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { IconButton } from '@/components/ui/icon-button'
import type { QueueNeighbours } from '@/components/queue/mail-context'

interface WorkspaceToolbarProps {
  /** e.g. "Review" — the queue this email was opened from. */
  backLabel: string
  onBack: () => void
  nav?: {
    neighbours: QueueNeighbours
    onPrev: () => void
    onNext: () => void
  }
  children?: React.ReactNode
}

/**
 * Top of the workspace: back to the queue, and walk it (previous / next).
 * Under 1280 the queue is off-screen, so "back" is labelled; beside the queue
 * it becomes a close button.
 */
export function WorkspaceToolbar({ backLabel, onBack, nav, children }: WorkspaceToolbarProps) {
  const n = nav?.neighbours
  return (
    <div className="sticky top-[calc(var(--fm-c-topbar-h)+env(safe-area-inset-top))] z-20 flex h-(--fm-c-topbar-h) shrink-0 items-center gap-1 border-b border-line bg-panel px-2 sm:top-0 sm:px-3">
      <Button variant="ghost" size="sm" leadingIcon={<ChevronLeft />} onClick={onBack} className="xl:hidden">
        {backLabel}
      </Button>
      <IconButton label={`Close and return to ${backLabel}`} icon={<X />} size="sm" shortcut={['Esc']} onClick={onBack} className="max-xl:hidden" />

      {nav && n && (
        <div className="ml-1 flex items-center gap-0.5 border-l border-line pl-2">
          <IconButton
            label={n.prevId ? 'Previous email' : 'No previous email'}
            icon={<ChevronUp />}
            size="sm"
            shortcut={n.prevId ? ['K'] : undefined}
            disabled={!n.prevId}
            onClick={nav.onPrev}
          />
          <IconButton
            label={n.nextId ? 'Next email' : n.moreAfter ? 'Load more emails' : 'No next email'}
            icon={<ChevronDown />}
            size="sm"
            shortcut={n.nextId ? ['J'] : undefined}
            disabled={!n.nextId && !n.moreAfter}
            onClick={n.nextId ? nav.onNext : n.loadMore}
          />
          {n.index >= 0 && (
            <span className="ml-1.5 text-xs tabular-nums text-fg-subtle">
              {n.index + 1} of {n.total}
            </span>
          )}
        </div>
      )}

      <div className="ml-auto flex items-center gap-2">{children}</div>
    </div>
  )
}
