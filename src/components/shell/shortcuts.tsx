'use client'

import React, { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog, DialogClose, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Kbd } from '@/components/ui/kbd'
import { NAV_ITEMS } from './nav'

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  if (target.isContentEditable) return true
  return ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)
}

/**
 * Shell-level keyboard shortcuts:
 *   G then R/U/A/H/L  go to Review / Urgent / All mail / Handled / Activity
 *   [                 hide or show the sidebar (desktop)
 *   ?                 list shortcuts
 * Ignored while typing, with modifier keys held, or when a dialog/menu is open.
 */
export function useShellShortcuts({ onToggleSidebar, onShowHelp }: { onToggleSidebar: () => void; onShowHelp: () => void }) {
  const router = useRouter()
  const pendingG = useRef<number | null>(null)

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey || isTypingTarget(e.target)) return
      // Let open overlays (Radix dialogs/menus) own the keyboard.
      if (document.querySelector('[role="dialog"], [role="alertdialog"], [role="menu"]')) return

      const key = e.key.toLowerCase()

      if (pendingG.current !== null) {
        window.clearTimeout(pendingG.current)
        pendingG.current = null
        const target = NAV_ITEMS.find((i) => i.shortcut.toLowerCase() === key)
        if (target) {
          e.preventDefault()
          router.push(target.href)
        }
        return
      }

      if (key === 'g' && !e.shiftKey) {
        pendingG.current = window.setTimeout(() => (pendingG.current = null), 1000)
        return
      }
      if (e.key === '[') {
        e.preventDefault()
        onToggleSidebar()
        return
      }
      if (e.key === '?') {
        e.preventDefault()
        onShowHelp()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      if (pendingG.current !== null) window.clearTimeout(pendingG.current)
    }
  }, [router, onToggleSidebar, onShowHelp])
}

export function ShortcutsDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const rows: { label: string; keys: string[] }[] = [
    ...NAV_ITEMS.map((i) => ({ label: `Go to ${i.label}`, keys: ['G', i.shortcut] })),
    { label: 'Hide or show the sidebar', keys: ['['] },
    { label: 'Show keyboard shortcuts', keys: ['?'] },
  ]
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        title="Keyboard shortcuts"
        description="Press the keys in sequence. Shortcuts pause while you type in a field."
        size="sm"
        footer={
          <DialogClose asChild>
            <Button>Done</Button>
          </DialogClose>
        }
      >
        <dl className="divide-y divide-line">
          {rows.map((r) => (
            <div key={r.label} className="flex items-center justify-between gap-4 py-2">
              <dt className="text-base text-fg">{r.label}</dt>
              <dd className="flex items-center gap-1">
                {r.keys.map((k, i) => (
                  <React.Fragment key={k + i}>
                    {i > 0 && <span className="text-xs text-fg-subtle">then</span>}
                    <Kbd>{k}</Kbd>
                  </React.Fragment>
                ))}
              </dd>
            </div>
          ))}
        </dl>
      </DialogContent>
    </Dialog>
  )
}
