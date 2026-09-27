'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { LOAD_ERROR, type QueueResult } from '@/lib/queue'
import { useRealtimeChanges, type LiveStatus } from './use-live-refresh'

export interface QueueData {
  /** Last result for the current search; null until the first load finishes. */
  result: QueueResult | null
  /** True while any request is in flight (first load, filter change, live refresh). */
  loading: boolean
  /** True when the shown result belongs to a previous search (a new one is loading). */
  stale: boolean
  /** A background refresh failed; the list shown is the last good one. */
  refreshFailed: boolean
  live: LiveStatus
  refetch: () => void
}

/**
 * Reads the queue for `search` (a normalised queueSearch string) from
 * /api/queue, and re-reads it whenever emails or drafts change. Responses that
 * arrive out of order are ignored.
 */
export function useQueueData(search: string): QueueData {
  const router = useRouter()
  const [state, setState] = useState<{ search: string | null; result: QueueResult | null }>({ search: null, result: null })
  const [loading, setLoading] = useState(true)
  const [refreshFailed, setRefreshFailed] = useState(false)
  const latest = useRef(0)
  const current = useRef(search)
  const shown = useRef(state)
  useEffect(() => {
    current.current = search
    shown.current = state
  })

  const load = useCallback(async (key: string) => {
    const id = ++latest.current
    setLoading(true)
    try {
      const res = await fetch(`/api/queue${key}`, { cache: 'no-store', headers: { accept: 'application/json' } })
      // Signed out (or the session expired): the middleware answers with the login page.
      if (res.status === 401 || res.redirected) {
        router.replace('/login')
        return
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const result = (await res.json()) as QueueResult
      if (id !== latest.current) return
      setState({ search: key, result })
      setRefreshFailed(false)
    } catch (err) {
      if (id !== latest.current) return
      console.error('[Queue] load failed:', err)
      const prev = shown.current
      // Keep a good list on screen when only a background refresh failed.
      if (prev.search === key && prev.result && !prev.result.error) {
        setRefreshFailed(true)
      } else {
        setState({
          search: key,
          result: { items: [], total: 0, hasMore: false, accounts: prev.result?.accounts ?? [], error: LOAD_ERROR },
        })
      }
    } finally {
      if (id === latest.current) setLoading(false)
    }
  }, [router])

  useEffect(() => {
    // Fetching on mount and on search change is the point of this hook.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load(search)
  }, [search, load])

  const refetch = useCallback(() => load(current.current), [load])
  const live = useRealtimeChanges('queue-live', [{ table: 'emails' }, { table: 'drafts' }], refetch)

  return {
    result: state.result,
    loading,
    stale: state.search !== search,
    refreshFailed,
    live,
    refetch,
  }
}
