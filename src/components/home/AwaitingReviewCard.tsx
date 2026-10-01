'use client'

import * as React from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  Sparkles,
  Edit3,
  CheckCircle2,
  Clock,
  Mail,
} from 'lucide-react'
import { UrgencyBadge } from '@/components/UrgencyBadge'
import { formatRelativeTime } from '@/components/audit-log'
import type { DraftRecord, EmailRecord } from './types'

export interface AwaitingReviewCardProps {
  pendingDrafts: DraftRecord[]
  emails: EmailRecord[]
  maxItems?: number
  className?: string
}

export function AwaitingReviewCard({
  pendingDrafts,
  emails,
  maxItems = 4,
  className = '',
}: AwaitingReviewCardProps) {
  const emailMap = React.useMemo(() => {
    const map = new Map<string, EmailRecord>()
    for (const email of emails) {
      map.set(email.id, email)
    }
    return map
  }, [emails])

  const displayDrafts = React.useMemo(() => {
    return (pendingDrafts || []).slice(0, maxItems)
  }, [pendingDrafts, maxItems])

  const count = pendingDrafts ? pendingDrafts.length : 0

  return (
    <section className={`space-y-3 ${className}`}>
      {/* Section Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-1">
        <div className="flex items-center gap-2">
          <h2 className="text-base sm:text-lg font-bold text-[var(--text-primary)] tracking-tight">
            Waiting on Review
          </h2>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 tabular-nums">
            {count}
          </span>
        </div>
        <Link
          href="/approvals"
          className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--brand)] hover:underline"
        >
          <span>Go to Approvals</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Empty State */}
      {count === 0 ? (
        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] p-6 text-center flex flex-col items-center justify-center space-y-2 shadow-xs">
          <div className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <p className="text-xs sm:text-sm font-medium text-[var(--text-secondary)]">
            No drafts awaiting authorization. Queue clear.
          </p>
        </div>
      ) : (
        /* Up to 3-4 Quick Cards */
        <div className="space-y-3">
          {displayDrafts.map((draft) => {
            const matchedEmail = emailMap.get(draft.email_id)
            const draftText = draft.edited_text || draft.ai_generated_text || ''

            const isStaffEdited =
              Boolean(draft.edited_text) ||
              draft.draft_type === 'ai_edited' ||
              draft.draft_type === 'manual'

            const targetHref = draft.email_id
              ? `/emails/${draft.email_id}`
              : '/approvals'

            return (
              <div
                key={draft.id}
                className="group relative bg-[var(--surface)] border border-[var(--border-subtle)] rounded-xl p-3.5 sm:p-4 transition-all duration-150 hover:border-[var(--border-strong)] hover:shadow-xs space-y-2.5"
              >
                {/* Top Meta Bar */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {/* AI Draft Provenance Badge */}
                    {isStaffEdited ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-800 border border-amber-200">
                        <Edit3 className="w-2.5 h-2.5 text-amber-600 shrink-0" />
                        <span>Staff Edited</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-[var(--brand-subtle)] text-[var(--brand)] border border-[var(--brand-subtle)]">
                        <Sparkles className="w-2.5 h-2.5 text-[var(--brand)] shrink-0" />
                        <span>AI Generated</span>
                      </span>
                    )}

                    {/* Matched email urgency if available */}
                    {matchedEmail?.urgency && (
                      <UrgencyBadge urgency={matchedEmail.urgency} />
                    )}
                  </div>

                  {/* Relative timestamp */}
                  {(draft.updated_at || draft.created_at) && (
                    <span className="inline-flex items-center gap-1 text-[11px] text-[var(--text-tertiary)] font-mono tabular-nums">
                      <Clock className="w-3 h-3 opacity-60 shrink-0" />
                      <span>
                        {formatRelativeTime(
                          draft.updated_at || draft.created_at
                        )}
                      </span>
                    </span>
                  )}
                </div>

                {/* Target Email Subject & Sender */}
                <div>
                  <Link
                    href={targetHref}
                    className="text-sm font-semibold text-[var(--text-primary)] group-hover:text-[var(--brand)] transition-colors line-clamp-1 block leading-snug"
                  >
                    {matchedEmail?.subject || '(No subject)'}
                  </Link>

                  {matchedEmail && (
                    <div className="flex items-center gap-1 text-xs text-[var(--text-secondary)] mt-0.5">
                      <Mail className="w-3 h-3 text-[var(--text-tertiary)] shrink-0" />
                      <span className="truncate">
                        for {matchedEmail.from_name || matchedEmail.from_address}
                      </span>
                    </div>
                  )}
                </div>

                {/* Excerpt of draft text */}
                <p className="text-xs text-[var(--text-secondary)] line-clamp-2 leading-relaxed bg-[var(--surface-subtle)] p-2.5 rounded-lg border border-[var(--border-subtle)] font-sans">
                  {draftText.trim() ? (
                    draftText.trim()
                  ) : (
                    <span className="italic text-[var(--text-tertiary)]">
                      (Empty response draft)
                    </span>
                  )}
                </p>

                {/* Action Row */}
                <div className="flex items-center justify-end pt-1">
                  <Link
                    href={targetHref}
                    className="inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[var(--brand)] text-white hover:bg-[var(--brand-light)] transition-colors shadow-xs"
                  >
                    <span>Review & Authorize</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
