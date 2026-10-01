'use client'

import * as React from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  Clock,
  Mail,
  User,
  Bot,
  Activity,
} from 'lucide-react'
import {
  getActionConfig,
  getActorInfo,
  getHumanSummary,
  formatRelativeTime,
  type AuditLogItem,
} from '@/components/audit-log'
import type { AuditRecord } from './types'

export interface RecentActivityFeedProps {
  activities: AuditRecord[]
  maxItems?: number
  className?: string
}

export function RecentActivityFeed({
  activities,
  maxItems = 8,
  className = '',
}: RecentActivityFeedProps) {
  const displayActivities = React.useMemo(() => {
    return (activities || []).slice(0, maxItems)
  }, [activities, maxItems])

  return (
    <section className={`space-y-3 ${className}`}>
      {/* Section Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-1">
        <h2 className="text-base sm:text-lg font-bold text-[var(--text-primary)] tracking-tight">
          Recent Operational Activity
        </h2>
        <Link
          href="/audit-log"
          className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--brand)] hover:underline"
        >
          <span>View Full Audit Log</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Empty State */}
      {displayActivities.length === 0 ? (
        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] p-6 text-center flex flex-col items-center justify-center space-y-2 shadow-xs">
          <div className="w-9 h-9 rounded-full bg-[var(--surface-subtle)] text-[var(--text-tertiary)] border border-[var(--border-subtle)] flex items-center justify-center">
            <Activity className="w-4 h-4" />
          </div>
          <p className="text-xs sm:text-sm font-medium text-[var(--text-secondary)]">
            No recent operational activity recorded.
          </p>
        </div>
      ) : (
        /* Vertical Timeline */
        <div className="relative border-l-2 border-[var(--border-subtle)] ml-3 sm:ml-4 pl-5 sm:pl-6 space-y-3 py-1">
          {displayActivities.map((activity) => {
            const config = getActionConfig(activity.action)
            const ActionIcon = config.icon
            const actor = getActorInfo(activity as AuditLogItem)
            const summary = getHumanSummary(activity as AuditLogItem)
            const relativeTime = formatRelativeTime(activity.created_at)

            return (
              <div key={activity.id} className="relative group">
                {/* Timeline node icon */}
                <div
                  className={`absolute -left-[31px] sm:-left-[33px] top-2.5 w-6 h-6 rounded-full flex items-center justify-center border shadow-2xs ${config.colorClass}`}
                >
                  <ActionIcon className="w-3 h-3 shrink-0" />
                </div>

                {/* Event Card */}
                <div className="bg-[var(--surface)] border border-[var(--border-subtle)] rounded-xl p-3 sm:p-3.5 transition-all duration-150 hover:border-[var(--border-strong)] hover:shadow-xs space-y-2">
                  {/* Top Header Row */}
                  <div className="flex flex-wrap items-center justify-between gap-1.5 text-xs">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {/* Event action verb */}
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${config.colorClass}`}
                      >
                        {config.verb}
                      </span>

                      {/* Actor */}
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-[var(--surface-subtle)] text-[var(--text-secondary)] border border-[var(--border-subtle)]">
                        {actor.isSystem ? (
                          <Bot className="w-2.5 h-2.5 text-[var(--brand)] shrink-0" />
                        ) : (
                          <User className="w-2.5 h-2.5 text-[var(--text-tertiary)] shrink-0" />
                        )}
                        <span className="truncate max-w-[130px]">
                          {actor.label}
                        </span>
                      </span>
                    </div>

                    {/* Relative timestamp */}
                    <div className="flex items-center gap-1 text-[11px] text-[var(--text-tertiary)] font-mono tabular-nums shrink-0">
                      <Clock className="w-2.5 h-2.5 opacity-60 shrink-0" />
                      <span>{relativeTime}</span>
                    </div>
                  </div>

                  {/* Human-readable summary */}
                  <p className="text-xs text-[var(--text-primary)] font-medium leading-relaxed">
                    {summary}
                  </p>

                  {/* Linked email subject */}
                  {activity.emails && activity.email_id && (
                    <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-[var(--border-subtle)] text-[11px]">
                      <div className="min-w-0 flex items-center gap-1.5 text-[var(--text-secondary)]">
                        <Mail className="w-3 h-3 text-[var(--text-tertiary)] shrink-0" />
                        <span className="truncate font-medium text-[var(--text-primary)]">
                          {activity.emails.subject || '(No subject)'}
                        </span>
                      </div>

                      <Link
                        href={`/emails/${activity.email_id}`}
                        className="inline-flex items-center gap-0.5 font-semibold text-[var(--brand)] hover:underline shrink-0 text-[11px]"
                      >
                        <span>View</span>
                        <ArrowRight className="w-2.5 h-2.5" />
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
