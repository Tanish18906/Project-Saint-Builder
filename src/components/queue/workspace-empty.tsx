'use client'

import React from 'react'
import { Kbd } from '@/components/ui/kbd'
import { activeFilterCount, queueSummary } from '@/lib/queue'
import { useMail } from './mail-context'

/** The review workspace with nothing open. Desktop only (below 1280 the queue is the whole screen). */
export function WorkspaceEmpty() {
  const { params, result, stale } = useMail()
  const filtered = activeFilterCount(params) > 0 || params.q.length > 0
  const summary = result && !result.error && !stale ? queueSummary(params.view, result.total, filtered) : null

  return (
    <section
      aria-label="Review workspace"
      className="sticky top-0 hidden h-dvh min-w-0 flex-1 flex-col items-center justify-center gap-1 px-8 text-center xl:flex"
    >
      <p className="text-base font-medium text-fg-muted">No email selected</p>
      {summary && <p className="text-sm text-fg-subtle">{summary}</p>}
      <p className="mt-3 flex items-center gap-1.5 text-xs text-fg-subtle">
        <Kbd>J</Kbd>
        <Kbd>K</Kbd>
        <span>to move</span>
        <span aria-hidden="true">·</span>
        <Kbd>↵</Kbd>
        <span>to open</span>
        <span aria-hidden="true">·</span>
        <Kbd>/</Kbd>
        <span>to search</span>
      </p>
    </section>
  )
}
