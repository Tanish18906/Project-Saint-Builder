'use client'

import { useCallback, useMemo } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { parseQueueParams, queueSearch, type QueueParams } from '@/lib/queue'

/**
 * Queue view/filter/search state lives in the URL (shareable, survives
 * list → email → back). Changes replace the history entry through the native
 * History API, which Next keeps in sync with useSearchParams: the queue pane
 * re-reads its data, and an open email is left untouched (no server render,
 * no remount, no lost edits).
 */
export function useQueueUrl() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const search = searchParams.toString()
  const params = useMemo(() => parseQueueParams(new URLSearchParams(search)), [search])

  const update = useCallback(
    (patch: Partial<QueueParams>) => {
      const next = { ...params, ...patch }
      // Any change other than paging starts again from the first page.
      if (!('limit' in patch)) next.limit = 0
      let query = queueSearch(next)
      // An open email always names its view (see emailHref).
      if (pathname.startsWith('/emails/') && !query.includes('view=')) {
        query = `?view=${next.view}${query ? `&${query.slice(1)}` : ''}`
      }
      window.history.replaceState(null, '', `${pathname}${query}`)
    },
    [params, pathname]
  )

  return { params, update }
}
