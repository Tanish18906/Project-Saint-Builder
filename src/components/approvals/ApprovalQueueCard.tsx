'use client'

import * as React from 'react'
import Link from 'next/link'
import {
  Building2,
  Clock,
  Sparkles,
  Edit3,
  AlertTriangle,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react'
import { Badge } from '@/components/ui'
import { ThemeBadge } from '@/components/ThemeBadge'
import { UrgencyBadge } from '@/components/UrgencyBadge'
import { extractPlaceholders } from '@/components/email-detail'
import { formatRelativeTime, type ApprovalItem } from './types'

export interface ApprovalQueueCardProps {
  item: ApprovalItem
}

export function ApprovalQueueCard({ item }: ApprovalQueueCardProps) {
  const urgency = (item.urgency || '').toLowerCase()
  const isUrgent = urgency === 'urgent'
  const isPriority = urgency === 'priority'

  const draftText = item.draft?.edited_text || item.draft?.ai_generated_text || ''
  const placeholders = React.useMemo(() => extractPlaceholders(draftText), [draftText])
  const hasPlaceholders = placeholders.length > 0

  const draftType = item.draft?.draft_type || 'ai_generated'
  const isEdited =
    draftType === 'ai_edited' ||
    (Boolean(item.draft?.ai_generated_text) && draftText !== item.draft?.ai_generated_text)

  return (
    <div
      className={`group relative bg-[var(--surface)] border border-[var(--border-subtle)] rounded-xl transition-all duration-150 hover:border-[var(--border-strong)] hover:shadow-sm overflow-hidden ${
        isUrgent
          ? 'border-l-4 border-l-[var(--urgency-urgent)]'
          : isPriority
          ? 'border-l-4 border-l-[var(--urgency-priority)]'
          : ''
      }`}
    >
      <div className="p-4 sm:p-5 space-y-3.5">
        {/* Top Meta Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            {/* Urgency Badge */}
            <UrgencyBadge urgency={item.urgency} />

            {/* Business Theme */}
            {item.theme && <ThemeBadge theme={item.theme} />}

            {/* Monitored Account */}
            {item.accounts && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-[var(--surface-subtle)] text-[var(--text-secondary)] border border-[var(--border-subtle)]">
                <Building2 className="w-3 h-3 opacity-60 shrink-0" />
                <span className="truncate max-w-[130px]">
                  {item.accounts.display_name || item.accounts.email_address}
                </span>
              </span>
            )}
          </div>

          {/* Timestamp */}
          <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-tertiary)] font-mono tabular-nums">
            <Clock className="w-3 h-3 opacity-60 shrink-0" />
            <span>{formatRelativeTime(item.received_at)}</span>
          </div>
        </div>

        {/* Sender & Subject */}
        <div>
          <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)] mb-1">
            <span className="font-semibold text-[var(--text-primary)]">
              {item.from_name || item.from_address}
            </span>
            {item.from_name && (
              <span className="text-[11px] text-[var(--text-tertiary)] font-mono truncate max-w-[200px]">
                &lt;{item.from_address}&gt;
              </span>
            )}
          </div>
          <h3 className="text-sm sm:text-base font-semibold text-[var(--text-primary)] group-hover:text-[var(--brand)] transition-colors leading-snug">
            {item.subject || '(No subject)'}
          </h3>
        </div>

        {/* Draft Review Preview Box */}
        {draftText ? (
          <div className="p-3 sm:p-3.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-subtle)] space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                {isEdited ? (
                  <Badge variant="warning" size="sm">
                    <Edit3 className="w-3 h-3 text-amber-600" />
                    <span>Staff Edited</span>
                  </Badge>
                ) : (
                  <Badge variant="neutral" size="sm">
                    <Sparkles className="w-3 h-3 text-[var(--brand)]" />
                    <span>AI Draft Ready</span>
                  </Badge>
                )}

                {hasPlaceholders && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-900 border border-amber-300">
                    <AlertTriangle className="w-3 h-3 text-amber-700" />
                    <span>{placeholders.length} {placeholders.length === 1 ? 'placeholder' : 'placeholders'}</span>
                  </span>
                )}
              </div>

              <span className="text-[11px] text-[var(--text-tertiary)] font-mono">
                {draftText.trim().split(/\s+/).length} words
              </span>
            </div>

            {/* Excerpt */}
            <p className="text-xs text-[var(--text-secondary)] font-mono line-clamp-2 leading-relaxed bg-[var(--surface)] p-2 rounded border border-[var(--border-subtle)] select-text">
              {draftText}
            </p>
          </div>
        ) : (
          <div className="p-3 rounded-lg border border-dashed border-[var(--border-subtle)] bg-[var(--surface-subtle)] text-xs text-[var(--text-tertiary)] italic">
            No draft text generated. Manual review required.
          </div>
        )}

        {/* Action Bar */}
        <div className="flex items-center justify-between pt-1">
          {hasPlaceholders ? (
            <span className="text-[11px] text-amber-800 flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
              <span>Requires confirmation before sending</span>
            </span>
          ) : (
            <span className="text-[11px] text-[var(--text-tertiary)]">
              Status: Draft awaiting approval
            </span>
          )}

          <Link
            href={`/emails/${item.id}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[var(--brand)] hover:bg-[var(--brand-light)] text-white shadow-xs transition-colors cursor-pointer min-h-[36px]"
          >
            <span>Review &amp; Authorize</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  )
}
