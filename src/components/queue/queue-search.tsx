'use client'

import React, { useEffect, useRef, useState } from 'react'
import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { IconButton } from '@/components/ui/icon-button'
import { Kbd } from '@/components/ui/kbd'

interface QueueSearchProps {
  value: string
  onSearch: (q: string) => void
}

/**
 * Quiet search that belongs to the list: writes `q` to the URL after a short
 * pause. "/" focuses it from anywhere; Escape clears, then leaves the field.
 */
export function QueueSearch({ value, onSearch }: QueueSearchProps) {
  const [draft, setDraft] = useState(value)
  const inputRef = useRef<HTMLInputElement>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastSent = useRef(value)

  // Follow the URL when it changes elsewhere (back/forward, "Clear").
  useEffect(() => {
    if (value !== lastSent.current) {
      lastSent.current = value
      setDraft(value)
    }
  }, [value])

  const send = (q: string) => {
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      lastSent.current = q.trim()
      onSearch(q.trim())
    }, 300)
  }

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey) return
      const t = e.target as HTMLElement | null
      if (t && (t.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName))) return
      if (document.querySelector('[role="dialog"], [role="alertdialog"], [role="menu"]')) return
      e.preventDefault()
      inputRef.current?.focus()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      if (timer.current) clearTimeout(timer.current)
    }
  }, [])

  return (
    <div role="search" className="min-w-0 flex-1 sm:max-w-sm">
      <label htmlFor="queue-search" className="sr-only">
        Search emails
      </label>
      <Input
        ref={inputRef}
        id="queue-search"
        type="search"
        size="sm"
        value={draft}
        placeholder="Search"
        autoComplete="off"
        leadingIcon={<Search />}
        onChange={(e) => {
          setDraft(e.target.value)
          send(e.target.value)
        }}
        onKeyDown={(e) => {
          if (e.key !== 'Escape') return
          if (draft) {
            setDraft('')
            send('')
          } else {
            e.currentTarget.blur()
          }
        }}
        trailing={
          draft ? (
            <IconButton
              label="Clear search"
              icon={<X />}
              size="sm"
              showTooltip={false}
              className="size-6"
              onClick={() => {
                setDraft('')
                send('')
                inputRef.current?.focus()
              }}
            />
          ) : (
            <span className="pointer-events-none flex pr-1.5" aria-hidden="true">
              <Kbd>/</Kbd>
            </span>
          )
        }
        variant="quiet"
      />
    </div>
  )
}
