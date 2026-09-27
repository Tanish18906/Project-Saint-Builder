import React from 'react'
import Link from 'next/link'
import { cn } from '@/lib/cn'
import { formatFullTimestamp, formatQueueTime, formatRole, themeLabel } from '@/lib/format'
import type { QueueView, ReviewStatus } from '@/lib/domain'
import type { QueueItem } from '@/lib/queue'

const statusTone: Record<ReviewStatus['tone'], string> = {
  accent: 'text-accent-fg',
  neutral: 'text-fg-muted',
  subtle: 'text-fg-subtle',
  success: 'text-success-fg',
}

/** In Review every row has a ready draft, so saying so on each row is noise. */
function showStatus(view: QueueView, status: ReviewStatus): boolean {
  return !(view === 'review' && status.key === 'draft_ready')
}

interface QueueRowProps {
  item: QueueItem
  href: string
  view: QueueView
  now: Date
  /** The email currently open in the workspace. */
  selected?: boolean
  tabIndex: number
  onFocus: () => void
}

/**
 * One email in the queue. Three lines, read left to right:
 *   sender · urgency · time
 *   subject · reply state
 *   context · preview
 * A blue dot in the gutter means "needs your decision". Urgent work adds an
 * inset stripe plus the word; priority is the word alone. Never a tinted row.
 */
export const QueueRow = React.forwardRef<HTMLAnchorElement, QueueRowProps>(function QueueRow(
  { item, href, view, now, selected = false, tabIndex, onFocus },
  ref
) {
  const urgency = (item.urgency || '').toLowerCase()
  const flagUrgency = !item.isHandled && (urgency === 'urgent' || urgency === 'priority')
  const sender = item.fromName || item.fromAddress
  const context = [item.theme ? themeLabel(item.theme) : null, item.routedRoles.map(formatRole).join(', ') || null]
    .filter(Boolean)
    .join(' · ')

  return (
    <Link
      ref={ref}
      href={href}
      prefetch={false}
      tabIndex={tabIndex}
      onFocus={onFocus}
      aria-current={selected ? 'true' : undefined}
      data-queue-row=""
      className={cn(
        'relative grid grid-cols-[0.75rem_minmax(0,1fr)] gap-x-2 py-2 pl-2.5 pr-4 outline-none max-sm:py-2.5 sm:pl-3.5',
        'transition-colors duration-(--fm-duration-fast)',
        'focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus',
        selected ? 'bg-selected' : 'hover:bg-hover',
        // Only urgent work gets the stripe; priority is carried by its label alone,
        // so the queue never reads as a column of warning colours.
        flagUrgency && urgency === 'urgent' && 'shadow-[inset_3px_0_0_0_var(--fm-danger-mark)]'
      )}
    >
      {/* Gutter: decision marker */}
      <span aria-hidden="true" className="flex justify-center pt-[7px]">
        {item.needsReview && <span className="size-2 rounded-full bg-accent" />}
      </span>

      <span className="min-w-0">
        {/* Line 1 */}
        <span className="flex items-baseline gap-2">
          <span
            className={cn(
              'min-w-0 truncate text-base text-fg',
              item.needsReview ? 'font-semibold' : 'font-medium',
              item.isHandled && 'text-fg-muted'
            )}
          >
            {sender}
          </span>
          {flagUrgency && (
            <span className={cn('shrink-0 text-xs font-medium', urgency === 'urgent' ? 'text-danger-fg' : 'text-warning-fg')}>
              {urgency === 'urgent' ? 'Urgent' : 'Priority'}
            </span>
          )}
          <time
            dateTime={item.receivedAt}
            title={formatFullTimestamp(item.receivedAt)}
            className="ml-auto shrink-0 pl-2 text-xs tabular-nums text-fg-subtle"
          >
            {formatQueueTime(item.receivedAt, now)}
          </time>
        </span>

        {/* Line 2 */}
        <span className="mt-px flex items-baseline gap-3">
          <span className={cn('min-w-0 truncate text-sm', item.isHandled ? 'text-fg-muted' : 'text-fg')}>
            {item.subject || '(No subject)'}
          </span>
          {showStatus(view, item.status) ? (
            <span className={cn('ml-auto shrink-0 text-xs font-medium', statusTone[item.status.tone])}>{item.status.label}</span>
          ) : (
            <span className="sr-only">. {item.status.label}</span>
          )}
        </span>

        {/* Line 3 */}
        <span className="mt-px block truncate text-sm text-fg-subtle">
          {context && <span className="text-fg-muted">{context}</span>}
          {context && item.preview && <span aria-hidden="true"> — </span>}
          {item.preview || (!context && <span className="italic">No message text</span>)}
        </span>
      </span>
    </Link>
  )
})
