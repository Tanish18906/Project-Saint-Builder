'use client'

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { usePathname } from 'next/navigation'
import { emailHref, PAGE_SIZE, queueHref, queueSearch, type QueueParams, type QueueResult } from '@/lib/queue'
import { useQueueUrl } from '@/hooks/use-queue-url'
import { useQueueData } from '@/hooks/use-queue-data'
import type { LiveStatus } from '@/hooks/use-live-refresh'

interface MailContextValue {
  params: QueueParams
  update: (patch: Partial<QueueParams>) => void
  result: QueueResult | null
  loading: boolean
  stale: boolean
  refreshFailed: boolean
  live: LiveStatus
  refetch: () => void
  /** The email open in the workspace, if any. */
  selectedId: string | null
  hrefFor: (id: string) => string
  queueHref: string
}

const MailContext = createContext<MailContextValue | null>(null)

export function useMail(): MailContextValue {
  const ctx = useContext(MailContext)
  if (!ctx) throw new Error('useMail must be used inside <MailProvider>')
  return ctx
}

function selectedFrom(pathname: string): string | null {
  const match = /^\/emails\/([^/]+)/.exec(pathname)
  return match ? decodeURIComponent(match[1]) : null
}

/**
 * One queue for the mail screens: the queue pane lists it, the empty
 * workspace summarises it, and the open email walks it (next/previous). Lives
 * above both `/` and `/emails/[id]`, so opening or switching emails never
 * reloads or re-scrolls the list.
 */
export function MailProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { params, update } = useQueueUrl()
  const data = useQueueData(queueSearch(params))
  const selectedId = selectedFrom(pathname)

  const hrefFor = useCallback((id: string) => emailHref(id, params), [params])

  const value = useMemo<MailContextValue>(
    () => ({ ...data, params, update, selectedId, hrefFor, queueHref: queueHref(params) }),
    [data, params, update, selectedId, hrefFor]
  )
  return <MailContext.Provider value={value}>{children}</MailContext.Provider>
}

export interface QueueNeighbours {
  /** 0-based position in the loaded list; -1 when the email isn't in it. */
  index: number
  /** The email is, or was while open, part of the current queue. */
  known: boolean
  total: number
  prevId: string | null
  nextId: string | null
  /** The email is the last loaded row and more rows exist. */
  moreAfter: boolean
  loadMore: () => void
}

interface Remembered {
  id: string
  index: number
  prevId: string | null
  nextId: string | null
}

/**
 * Previous/next in the current queue order. When the open email leaves the
 * view (e.g. it was just approved, and Review no longer lists it), the last
 * known neighbours are used, so "Next email" still continues the sequence.
 */
export function useQueueNeighbours(id: string): QueueNeighbours {
  const { result, params, update } = useMail()
  const items = result?.items ?? []
  const index = items.findIndex((i) => i.id === id)
  const [remembered, setRemembered] = useState<Remembered | null>(null)

  const here: Remembered | null =
    index >= 0 ? { id, index, prevId: items[index - 1]?.id ?? null, nextId: items[index + 1]?.id ?? null } : null
  // Store what we learnt during render (React's "adjust state on change" pattern).
  if (
    here &&
    (remembered?.id !== here.id ||
      remembered.index !== here.index ||
      remembered.prevId !== here.prevId ||
      remembered.nextId !== here.nextId)
  ) {
    setRemembered(here)
  }

  let prevId: string | null = null
  let nextId: string | null = null
  if (here) {
    prevId = here.prevId
    nextId = here.nextId
  } else if (remembered?.id === id) {
    const has = (x: string | null) => (x && items.some((i) => i.id === x) ? x : null)
    // The item that slid into this email's old position is the next one.
    nextId = has(remembered.nextId) ?? items[remembered.index]?.id ?? null
    prevId = has(remembered.prevId) ?? items[remembered.index - 1]?.id ?? null
  }

  return {
    index,
    known: index >= 0 || remembered?.id === id,
    total: result?.total ?? 0,
    prevId,
    nextId,
    moreAfter: index >= 0 && index === items.length - 1 && Boolean(result?.hasMore),
    loadMore: () => update({ limit: params.limit + PAGE_SIZE }),
  }
}
