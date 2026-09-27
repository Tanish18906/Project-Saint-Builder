import React from 'react'
import { cn } from '@/lib/cn'
import { formatFullTimestamp, formatRoles, themeLabel } from '@/lib/format'
import type { EmailRecord } from '@/lib/domain'
import type { Triage } from '@/lib/workspace'

/**
 * Who, what, when, how urgent — in reading order. The subject is the one
 * large line; everything else is 13–14px metadata.
 */
export const MessageHeader = React.forwardRef<HTMLHeadingElement, { email: EmailRecord; urgency: string | null; className?: string }>(
  function MessageHeader({ email, urgency, className }, headingRef) {
    const u = (urgency || '').toLowerCase()
    const inbox = email.accounts?.email_address

    return (
      <header className={cn('min-w-0', className)}>
        <h1
          id="email-subject"
          ref={headingRef}
          tabIndex={-1}
          className="text-xl font-semibold tracking-[-0.01em] text-fg outline-none [overflow-wrap:anywhere]"
        >
          {email.subject || '(No subject)'}
        </h1>

        <div className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className="text-base font-semibold text-fg">{email.from_name || email.from_address}</span>
          {email.from_name && <span className="min-w-0 break-all text-sm text-fg-muted">{email.from_address}</span>}
          <time dateTime={email.received_at} className="ml-auto shrink-0 pl-2 text-sm tabular-nums text-fg-subtle">
            {formatFullTimestamp(email.received_at)}
          </time>
        </div>

        <p className="mt-0.5 flex flex-wrap items-baseline gap-x-2 text-sm text-fg-muted">
          {inbox && (
            <span>
              to <span className="text-fg">{inbox}</span>
            </span>
          )}
          {(u === 'urgent' || u === 'priority') && (
            <>
              {inbox && <span aria-hidden="true">·</span>}
              <span className={cn('font-medium', u === 'urgent' ? 'text-danger-fg' : 'text-warning-fg')}>
                {u === 'urgent' ? 'Urgent' : 'Priority'}
              </span>
            </>
          )}
        </p>
      </header>
    )
  }
)

/**
 * Decision support, not a feature banner: what the email is about, why it's
 * here, and how sure the classifier was — in words.
 */
export function TriageSummary({ triage, className }: { triage: Triage; className?: string }) {
  const { summary, theme, routedRoles, confidence } = triage
  return (
    <section aria-labelledby="triage-heading" className={cn('min-w-0', className)}>
      <h2 id="triage-heading" className="text-xs font-medium text-fg-subtle">
        Triage
      </h2>
      {summary ? (
        <p className="mt-1 max-w-(--fm-c-reading-max) text-base text-fg">{summary}</p>
      ) : (
        <p className="mt-1 text-base text-fg-muted">No summary was recorded for this email.</p>
      )}
      <dl className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm">
        <div className="flex gap-1.5">
          <dt className="text-fg-subtle">Routed to</dt>
          <dd className="text-fg">{formatRoles(routedRoles)}</dd>
        </div>
        {theme && (
          <div className="flex gap-1.5">
            <dt className="text-fg-subtle">Theme</dt>
            <dd className="text-fg">{themeLabel(theme)}</dd>
          </div>
        )}
        {confidence && (
          <div className="flex gap-1.5">
            <dt className="text-fg-subtle">Confidence</dt>
            <dd className={confidence === 'Low' ? 'font-medium text-warning-fg' : 'text-fg'}>
              {confidence}
              {confidence === 'Low' && <span className="font-normal text-fg-muted"> — check the routing</span>}
            </dd>
          </div>
        )}
      </dl>
    </section>
  )
}
