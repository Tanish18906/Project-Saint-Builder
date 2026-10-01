'use client'

import * as React from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  Clock,
  Building2,
  AlertTriangle,
  CheckCircle2,
  User,
} from 'lucide-react'
import { UrgencyBadge } from '@/components/UrgencyBadge'
import { ThemeBadge } from '@/components/ThemeBadge'
import { formatRelativeTime } from '@/components/audit-log'
import type { NeedsAttentionItem } from './types'

export interface NeedsAttentionFeedProps {
  items: NeedsAttentionItem[]
  maxItems?: number
  className?: string
}

export function NeedsAttentionFeed({
  items,
  maxItems = 7,
  className = '',
}: NeedsAttentionFeedProps) {
  const displayItems = React.useMemo(() => {
    return (items || []).slice(0, maxItems)
  }, [items, maxItems])

  return (
    <section className={`space-y-3 ${className}`}>
      {/* Section Header */}
      <div className="flex flex-wrap items-end justify-between gap-2 pb-1">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-[var(--text-primary)] tracking-tight">
            Needs Attention
          </h2>
          <p className="text-xs text-[var(--text-secondary)]">
            Prioritized by operational urgency and age
          </p>
        </div>
        <Link
          href="/inbox"
          className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--brand)] hover:underline"
        >
          <span>View All in Inbox</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Empty State */}
      {displayItems.length === 0 ? (
        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] p-8 text-center flex flex-col items-center justify-center space-y-3 shadow-xs">
          <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-[var(--text-primary)]">
              All caught up! Zero urgent or priority items pending triage.
            </p>
            <p className="text-xs text-[var(--text-tertiary)]">
              Operational queue clear for active inboxes.
            </p>
          </div>
        </div>
      ) : (
        /* Items List */
        <div className="space-y-3">
          {displayItems.map((item) => {
            const urgency = (item.email.urgency || '').toLowerCase().trim()
            const isUrgent = urgency === 'urgent'
            const isPriority = urgency === 'priority'

            const hazardBorderClass = isUrgent
              ? 'border-l-4 border-l-[var(--urgency-urgent)]'
              : isPriority
              ? 'border-l-4 border-l-[var(--urgency-priority)]'
              : 'border-l-4 border-l-[var(--border-subtle)]'

            const senderLabel =
              item.email.from_name || item.email.from_address || 'Unknown sender'

            return (
              <div
                key={item.email.id}
                className={`group relative bg-[var(--surface)] border border-[var(--border-subtle)] rounded-xl p-4 transition-all duration-150 hover:border-[var(--border-strong)] hover:shadow-xs space-y-3 ${hazardBorderClass}`}
              >
                {/* Header Row */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                    <span className="font-semibold text-[var(--text-primary)] truncate max-w-[200px]">
                      {senderLabel}
                    </span>

                    {item.email.from_name && item.email.from_address && (
                      <span className="text-[11px] text-[var(--text-tertiary)] truncate max-w-[160px] hidden sm:inline">
                        &lt;{item.email.from_address}&gt;
                      </span>
                    )}

                    {/* Corporate Account Tag */}
                    {item.email.accounts && (
                      <span
                        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-[var(--surface-subtle)] text-[var(--text-secondary)] border border-[var(--border-subtle)] truncate max-w-[140px]"
                        title={item.email.accounts.email_address}
                      >
                        <Building2 className="w-2.5 h-2.5 opacity-60 shrink-0" />
                        <span className="truncate">
                          {item.email.accounts.display_name ||
                            item.email.accounts.email_address}
                        </span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {/* Aging Pill */}
                    {item.isAging && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                        <AlertTriangle className="w-2.5 h-2.5 text-amber-600 shrink-0" />
                        <span>Aging</span>
                      </span>
                    )}

                    {/* Received Relative Timestamp */}
                    <span className="inline-flex items-center gap-1 text-[11px] text-[var(--text-tertiary)] font-mono tabular-nums">
                      <Clock className="w-3 h-3 opacity-60 shrink-0" />
                      <span>{formatRelativeTime(item.email.received_at)}</span>
                    </span>
                  </div>
                </div>

                {/* Subject Line */}
                <div>
                  <Link
                    href={`/emails/${item.email.id}`}
                    className="text-sm sm:text-base font-semibold text-[var(--text-primary)] group-hover:text-[var(--brand)] transition-colors line-clamp-1 leading-snug"
                  >
                    {item.email.subject || '(No subject)'}
                  </Link>
                </div>

                {/* 2-line preview of body_text */}
                <p className="text-xs text-[var(--text-secondary)] line-clamp-2 leading-relaxed">
                  {item.email.body_text?.trim() || (
                    <span className="italic text-[var(--text-tertiary)]">
                      (No email body text)
                    </span>
                  )}
                </p>

                {/* Badges footer & Direct action button */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2.5 border-t border-[var(--border-subtle)]">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <UrgencyBadge urgency={item.email.urgency} />
                    <ThemeBadge theme={item.email.theme} />

                    {item.email.routed_roles && item.email.routed_roles.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1">
                        {item.email.routed_roles.map((role) => (
                          <span
                            key={role}
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-[var(--surface-subtle)] text-[var(--text-secondary)] border border-[var(--border-subtle)] capitalize"
                          >
                            <User className="w-2.5 h-2.5 text-[var(--text-tertiary)]" />
                            <span>{role.replace(/_/g, ' ')}</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Direct Action Button */}
                  <Link
                    href={`/emails/${item.email.id}`}
                    className="inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[var(--brand)] text-white hover:bg-[var(--brand-light)] transition-colors shadow-xs shrink-0"
                  >
                    <span>{item.pendingDraft ? 'Review Draft' : 'Review'}</span>
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
