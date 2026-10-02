'use client'

import * as React from 'react'
import Link from 'next/link'
import {
  User,
  Bot,
  Mail,
  ChevronDown,
  ChevronUp,
  Clock,
  ArrowRight,
  LayoutList,
} from 'lucide-react'
import {
  getActionConfig,
  getActorInfo,
  getHumanSummary,
  parseDetails,
} from './eventHelpers'
import { formatRelativeTime, formatExactTimestamp, type AuditLogItem } from './types'
import { AuditLogDetails } from './AuditLogDetails'

export interface AuditLogCardProps {
  log: AuditLogItem
}

export const AuditLogCard = React.memo(function AuditLogCard({ log }: AuditLogCardProps) {
  const [isExpanded, setIsExpanded] = React.useState(false)

  const config = getActionConfig(log.action)
  const ActionIcon = config.icon
  const actor = getActorInfo(log)
  const summary = getHumanSummary(log)
  const details = parseDetails(log.details)

  return (
    <div className="bg-[var(--surface)] border border-[var(--border-subtle)] rounded-xl p-4 sm:p-5 transition-all duration-150 hover:border-[var(--border-strong)] hover:shadow-xs space-y-3">
      {/* Top Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {/* Action Badge */}
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border ${config.colorClass}`}
          >
            <ActionIcon className="w-3.5 h-3.5 shrink-0" />
            <span>{config.title}</span>
          </span>

          {/* Actor Pill */}
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-[var(--surface-subtle)] text-[var(--text-secondary)] border border-[var(--border-subtle)]">
            {actor.isSystem ? (
              <Bot className="w-3 h-3 text-[var(--brand)] shrink-0" />
            ) : (
              <User className="w-3 h-3 text-[var(--text-tertiary)] shrink-0" />
            )}
            <span className="truncate max-w-[140px]">{actor.label}</span>
          </span>
        </div>

        {/* Timestamp */}
        <div
          className="flex items-center gap-1 text-[11px] text-[var(--text-tertiary)] font-mono tabular-nums"
          title={formatExactTimestamp(log.created_at)}
        >
          <Clock className="w-3 h-3 opacity-60 shrink-0" />
          <span>{formatRelativeTime(log.created_at)}</span>
        </div>
      </div>

      {/* Human Summary */}
      <p className="text-xs text-[var(--text-primary)] font-medium leading-relaxed">
        {summary}
      </p>

      {/* Associated Email Reference */}
      {log.emails && log.email_id ? (
        <div className="p-2.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-subtle)] flex items-center justify-between gap-3 text-xs">
          <div className="min-w-0 flex items-center gap-2">
            <Mail className="w-3.5 h-3.5 text-[var(--text-tertiary)] shrink-0" />
            <div className="truncate">
              <span className="font-semibold text-[var(--text-primary)] mr-1.5">
                {log.emails.subject || '(No subject)'}
              </span>
              {log.emails.from_name && (
                <span className="text-[11px] text-[var(--text-tertiary)]">
                  from {log.emails.from_name}
                </span>
              )}
            </div>
          </div>

          <Link
            href={`/emails/${log.email_id}`}
            className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--brand)] hover:underline shrink-0"
          >
            <span>View Email</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      ) : null}

      {/* Collapsible Event Details Disclosure */}
      <div className="pt-1 border-t border-[var(--border-subtle)]">
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer select-none py-1"
        >
          <LayoutList className="w-3.5 h-3.5 text-[var(--brand)]" />
          <span>{isExpanded ? 'Hide Event Details' : 'View Event Details'}</span>
          {isExpanded ? (
            <ChevronUp className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
          )}
        </button>

        {isExpanded && (
          <div className="mt-2 animate-in fade-in duration-150">
            <AuditLogDetails log={log} details={details} />
          </div>
        )}
      </div>
    </div>
  )
})
