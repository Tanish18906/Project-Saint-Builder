import React from 'react'
import { CircleCheck, Inbox, Mails, SearchX, TriangleAlert, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/states'
import { Skeleton, SkeletonRegion } from '@/components/ui/skeleton'
import type { QueueView } from '@/lib/domain'

const EMPTY: Record<QueueView, { icon: React.ReactNode; title: string; description: string }> = {
  review: {
    icon: <Inbox />,
    title: 'You’re all caught up',
    description: 'Nothing is waiting for a decision. New drafts appear here as soon as they’re ready.',
  },
  urgent: {
    icon: <TriangleAlert />,
    title: 'No urgent emails',
    description: 'Emails classified as urgent appear here until they’re handled.',
  },
  all: {
    icon: <Mails />,
    title: 'No emails yet',
    description: 'Emails appear here as soon as they’re received and classified.',
  },
  handled: {
    icon: <CircleCheck />,
    title: 'Nothing handled yet',
    description: 'Approved, sent and closed emails are kept here for reference.',
  },
}

/** Empty queue. "Nothing here" and "nothing matches" say different things. */
export function QueueEmpty({ view, filtered, onClear }: { view: QueueView; filtered: boolean; onClear: () => void }) {
  if (filtered) {
    return (
      <EmptyState
        icon={<SearchX />}
        title="No emails match"
        description="Try a different search, or remove a filter."
        action={
          <Button size="sm" variant="secondary" leadingIcon={<X />} onClick={onClear}>
            Clear search and filters
          </Button>
        }
      />
    )
  }
  const copy = EMPTY[view]
  return <EmptyState icon={copy.icon} title={copy.title} description={copy.description} />
}

/** Row-shaped placeholders, same rhythm as QueueRow. */
export function QueueRowsSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <SkeletonRegion label="Loading emails…" className="divide-y divide-line">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="grid grid-cols-[0.75rem_minmax(0,1fr)] gap-x-2 py-3 pl-2.5 pr-4 sm:pl-3.5">
          <span />
          <div className="space-y-2">
            <div className="flex justify-between gap-6">
              <Skeleton className="h-3.5 w-2/5" />
              <Skeleton className="h-3 w-9" />
            </div>
            <Skeleton className="h-3 w-4/5" />
            <Skeleton className="h-3 w-3/5" />
          </div>
        </div>
      ))}
    </SkeletonRegion>
  )
}
