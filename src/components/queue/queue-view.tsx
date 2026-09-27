'use client'

import React from 'react'
import { RotateCcw } from 'lucide-react'
import { cn } from '@/lib/cn'
import { activeFilterCount, PAGE_SIZE, queueSummary } from '@/lib/queue'
import type { QueueView as QueueViewId } from '@/lib/domain'
import { Button } from '@/components/ui/button'
import { ErrorState } from '@/components/ui/states'
import { Spinner } from '@/components/ui/spinner'
import { ActiveFilters, FilterControl } from './queue-filters'
import { QueueList } from './queue-list'
import { QueueSearch } from './queue-search'
import { QueueEmpty, QueueRowsSkeleton } from './queue-states'
import { useMail } from './mail-context'

export const VIEW_TITLE: Record<QueueViewId, string> = {
  review: 'Review',
  urgent: 'Urgent',
  all: 'All mail',
  handled: 'Handled',
}

/**
 * The review queue column. View, filters and search live in the URL; data
 * comes from the mail context (read through the canonical classification and
 * refreshed live). Persistent beside the workspace, so scroll position and
 * focus survive opening emails.
 */
export function QueueView({ className }: { className?: string }) {
  const { params, update, result, loading, stale, refreshFailed, live, refetch, selectedId, hrefFor } = useMail()

  const filters = activeFilterCount(params)
  const filtered = filters > 0 || params.q.length > 0
  const title = VIEW_TITLE[params.view]
  // With an email open, the email's subject is the page heading.
  const Heading = selectedId ? 'h2' : 'h1'

  const clearAll = () => update({ q: '', inbox: null, urgency: null, theme: null, role: null })

  return (
    <section
      aria-labelledby="queue-title"
      className={cn(
        'flex w-full min-w-0 flex-col xl:sticky xl:top-0 xl:h-dvh xl:w-(--fm-c-queue-w) xl:shrink-0 xl:border-r xl:border-line-strong',
        className
      )}
    >
      {/* Toolbar: title/summary, search, filter. Sticks under the phone top bar. */}
      <div className="sticky top-(--fm-c-topbar-h) z-10 shrink-0 border-b border-line bg-panel sm:top-0 xl:static">
        <div className="flex h-(--fm-c-topbar-h) items-center gap-2 px-4 max-sm:h-auto max-sm:pt-2.5">
          <Heading id="queue-title" className="text-lg font-semibold tracking-[-0.01em] text-fg max-sm:sr-only">
            {title}
          </Heading>
          <p className="truncate text-sm tabular-nums text-fg-subtle" aria-live="polite">
            {result && !result.error && !stale ? queueSummary(params.view, result.total, filtered) : ''}
          </p>
          <span className="ml-auto flex items-center gap-2 text-xs text-fg-subtle">
            {loading && result && <Spinner size="sm" label="Updating" />}
            {refreshFailed ? <span>Couldn’t refresh</span> : live === 'offline' && <span>Updates paused</span>}
          </span>
        </div>
        <div className="flex items-center gap-1.5 px-3 pb-2.5 pt-1 max-sm:pt-2">
          <QueueSearch value={params.q} onSearch={(q) => update({ q })} />
          <FilterControl params={params} accounts={result?.accounts ?? []} onChange={update} activeCount={filters} />
        </div>
        {filters > 0 && (
          <div className="px-3 pb-2.5">
            <ActiveFilters params={params} onChange={update} />
          </div>
        )}
      </div>

      {/* Body */}
      <div
        className={cn(
          'fm-scroll min-h-0 flex-1 xl:overflow-y-auto',
          stale && result && 'opacity-60 transition-opacity duration-(--fm-duration-base)'
        )}
      >
        {!result ? (
          <QueueRowsSkeleton rows={9} />
        ) : result.error ? (
          <ErrorState
            title="Couldn’t load the queue"
            description={result.error}
            action={
              <Button size="sm" variant="secondary" leadingIcon={<RotateCcw />} loading={loading} onClick={refetch}>
                Try again
              </Button>
            }
          />
        ) : result.items.length === 0 ? (
          <QueueEmpty view={params.view} filtered={filtered} onClear={clearAll} />
        ) : (
          <QueueList
            items={result.items}
            view={params.view}
            label={`${title} emails`}
            hasMore={result.hasMore}
            loadingMore={loading && stale}
            onShowMore={() => update({ limit: params.limit + PAGE_SIZE })}
            hrefFor={hrefFor}
            selectedId={selectedId}
          />
        )}
      </div>
    </section>
  )
}
