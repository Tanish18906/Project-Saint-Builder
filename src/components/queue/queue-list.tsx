'use client'

import React, { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import type { QueueView } from '@/lib/domain'
import type { QueueItem } from '@/lib/queue'
import { QueueRow } from './queue-row'

interface QueueListProps {
  items: QueueItem[]
  view: QueueView
  label: string
  hasMore: boolean
  onShowMore: () => void
  loadingMore: boolean
  /** Builds the row link; keeps the view so the open email knows where it came from. */
  hrefFor: (id: string) => string
  selectedId?: string | null
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  return target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)
}

/**
 * The rows, with roving focus: one row is in the Tab order; ↑/↓ move between
 * rows, Enter opens. With no email open, J/K also move (from anywhere on the
 * page when not typing); with an email open, J/K belong to the workspace
 * (next/previous email) and the open row follows along.
 */
export function QueueList({ items, view, label, hasMore, onShowMore, loadingMore, hrefFor, selectedId = null }: QueueListProps) {
  const rowRefs = useRef<(HTMLAnchorElement | null)[]>([])
  const [active, setActive] = useState(0)
  const selectedIndex = selectedId ? items.findIndex((i) => i.id === selectedId) : -1

  // The open email becomes the roving-focus row whenever it changes.
  const [syncedSelection, setSyncedSelection] = useState<string | null>(null)
  if (selectedId !== syncedSelection) {
    setSyncedSelection(selectedId)
    if (selectedIndex >= 0) setActive(selectedIndex)
  }
  const activeIndex = Math.min(active, Math.max(items.length - 1, 0))

  // Keep the open row visible, and move keyboard focus with it if focus is in the list.
  useEffect(() => {
    if (selectedIndex < 0) return
    const row = rowRefs.current[selectedIndex]
    if (!row) return
    row.scrollIntoView({ block: 'nearest' })
    if (rowRefs.current.includes(document.activeElement as HTMLAnchorElement) && document.activeElement !== row) {
      row.focus({ preventScroll: true })
    }
  }, [selectedIndex, selectedId])

  const focusRow = (index: number) => {
    const clamped = Math.max(0, Math.min(items.length - 1, index))
    setActive(clamped)
    rowRefs.current[clamped]?.focus()
  }

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey || isTypingTarget(e.target)) return
      if (document.querySelector('[role="dialog"], [role="alertdialog"], [role="menu"]')) return
      if (items.length === 0) return

      const inList = rowRefs.current.includes(document.activeElement as HTMLAnchorElement)
      const key = e.key
      if ((key === 'j' || key === 'k') && !selectedId) {
        e.preventDefault()
        // First press from outside the list lands on the current row.
        if (!inList) return focusRow(activeIndex)
        focusRow(activeIndex + (key === 'j' ? 1 : -1))
      } else if (inList && (key === 'ArrowDown' || key === 'ArrowUp')) {
        e.preventDefault()
        focusRow(activeIndex + (key === 'ArrowDown' ? 1 : -1))
      } else if (inList && (key === 'Home' || key === 'End')) {
        e.preventDefault()
        focusRow(key === 'Home' ? 0 : items.length - 1)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  })

  const now = new Date()

  return (
    <>
      <ul aria-label={label} className="divide-y divide-line">
        {items.map((item, i) => (
          <li key={item.id}>
            <QueueRow
              ref={(el) => {
                rowRefs.current[i] = el
              }}
              item={item}
              view={view}
              now={now}
              href={hrefFor(item.id)}
              selected={selectedId === item.id}
              tabIndex={i === activeIndex ? 0 : -1}
              onFocus={() => setActive(i)}
            />
          </li>
        ))}
      </ul>
      {hasMore && (
        <div className="border-t border-line px-4 py-3">
          <Button variant="ghost" size="sm" onClick={onShowMore} loading={loadingMore} className="w-full">
            Show more
          </Button>
        </div>
      )}
    </>
  )
}
