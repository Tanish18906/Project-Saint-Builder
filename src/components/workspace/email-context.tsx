'use client'

import React from 'react'
import Link from 'next/link'
import { cn } from '@/lib/cn'
import { formatAuditTimestamp, formatFullTimestamp, formatQueueTime } from '@/lib/format'
import type { ThreadMessage, WorkspaceEvent } from '@/lib/workspace'

/**
 * Other received messages in the same conversation (same thread_id and inbox).
 * Only rendered when there are some — this app doesn't store the replies it
 * sends as emails, so it never pretends to show a full conversation.
 */
export function ThreadContext({ thread, hrefFor }: { thread: ThreadMessage[]; hrefFor: (id: string) => string }) {
  if (thread.length === 0) return null
  const now = new Date()
  return (
    <section aria-labelledby="thread-heading">
      <h2 id="thread-heading" className="text-sm font-semibold text-fg">
        Messages in this conversation <span className="font-normal tabular-nums text-fg-subtle">{thread.length}</span>
      </h2>
      <p className="mt-0.5 text-xs text-fg-subtle">Received messages only; replies sent from here appear in Activity.</p>
      <ol className="mt-2 divide-y divide-line border-y border-line">
        {thread.map((m) => {
          const body = (
            <>
              <span className="min-w-0 flex-1">
                <span className={cn('block truncate text-sm', m.current ? 'font-semibold text-fg' : 'text-fg')}>
                  {m.fromName || m.fromAddress}
                </span>
                <span className="block truncate text-xs text-fg-subtle">{m.subject || '(No subject)'}</span>
              </span>
              <span className="shrink-0 text-right text-xs">
                <time dateTime={m.receivedAt} title={formatFullTimestamp(m.receivedAt)} className="block tabular-nums text-fg-subtle">
                  {formatQueueTime(m.receivedAt, now)}
                </time>
                <span className="block text-fg-muted">{m.current ? 'Open now' : m.status.label}</span>
              </span>
            </>
          )
          return (
            <li key={m.id}>
              {m.current ? (
                <div aria-current="true" className="flex items-start gap-3 bg-selected px-2 py-2">
                  {body}
                </div>
              ) : (
                <Link
                  href={hrefFor(m.id)}
                  className="flex items-start gap-3 px-2 py-2 outline-none hover:bg-hover focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus pointer-coarse:min-h-(--fm-c-touch)"
                >
                  {body}
                </Link>
              )}
            </li>
          )
        })}
      </ol>
    </section>
  )
}

/** What has happened to this email, oldest first, with exact times (UK). */
export function EmailActivity({ events }: { events: WorkspaceEvent[] | null }) {
  return (
    <section aria-labelledby="activity-heading">
      <h2 id="activity-heading" className="text-sm font-semibold text-fg">
        Activity
      </h2>
      {events === null ? (
        <p role="alert" className="mt-1 text-sm text-danger-fg">
          The activity for this email couldn’t be loaded. Reload the page to try again.
        </p>
      ) : events.length === 0 ? (
        <p className="mt-1 text-sm text-fg-muted">Nothing has been recorded for this email yet.</p>
      ) : (
        <ol className="mt-2 space-y-2.5 border-l border-line pl-3.5">
          {events.map((e) => (
            <li key={e.id} className="relative">
              <span
                aria-hidden="true"
                className={cn(
                  'absolute -left-[1.1875rem] top-[0.4375rem] size-2 rounded-full ring-2 ring-panel',
                  e.action === 'sent' ? 'bg-success-mark' : e.action === 'whatsapp_skipped_no_recipient' ? 'bg-warning-mark' : 'bg-line-strong'
                )}
              />
              <p className="text-sm text-fg">
                <span className="font-medium">{e.label}</span>
                {e.actor && <span className="text-fg-muted"> · {e.actor}</span>}
              </p>
              {e.detail && <p className="text-sm text-fg-muted [overflow-wrap:anywhere]">{e.detail}</p>}
              {e.createdAt && (
                <time dateTime={e.createdAt} className="block text-xs tabular-nums text-fg-subtle">
                  {formatAuditTimestamp(e.createdAt)}
                </time>
              )}
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}
