'use client'

import React from 'react'
import Link from 'next/link'
import { Select } from '@/components/Select'
import { RealtimeIndicator } from '@/components/RealtimeIndicator'
import {
  FileClock,
  Search,
  User,
  Bot,
  Tag,
  CheckCircle2,
  Trash2,
  Edit3,
  Mail,
  Send,
  RotateCcw,
  X,
} from 'lucide-react'
import { AUDIT_ACTION_OPTIONS as ACTION_FILTERS, type AuditLogRecord } from '@/lib/domain'
import { themeLabel, formatRelativeTime, formatPreciseTimestamp, shortRef } from '@/lib/format'
import { useAuditLog } from '@/hooks/use-audit-log'

// LEGACY PRESENTATION — scheduled for the activity rebuild (DESIGN_SYSTEM.md §12).
// Live data and filtering live in useAuditLog; this file is markup only.

export type AuditLogItem = AuditLogRecord

interface AuditLogViewProps {
  initialLogs: AuditLogItem[]
}

const NEUTRAL_CHIP = 'bg-tag-bg text-tag-text'

const DRAFT_TYPE_LABELS: Record<string, string> = {
  ai_generated: 'AI draft · unedited',
  ai_edited: 'AI draft · edited',
  manual: 'Manual reply',
}

function getActionBadge(action: string) {
  const norm = action.toLowerCase()
  switch (norm) {
    case 'classified':
      return { style: NEUTRAL_CHIP, icon: Tag, label: 'Classified' }
    case 'drafted':
      return { style: NEUTRAL_CHIP, icon: Mail, label: 'Drafted' }
    case 'edited':
      return { style: NEUTRAL_CHIP, icon: Edit3, label: 'Draft edited' }
    case 'approved':
      return {
        style: 'bg-signal-success-bg text-signal-success border border-signal-success-border',
        icon: CheckCircle2,
        label: 'Approved',
      }
    case 'discarded':
      return { style: 'bg-surface text-text-secondary border border-border-hairline', icon: Trash2, label: 'Discarded' }
    case 'sent':
      return { style: 'bg-tag-bg text-text-primary', icon: Send, label: 'Sent' }
    default:
      return { style: NEUTRAL_CHIP, icon: FileClock, label: action }
  }
}

function urgencyChipStyle(urgency: string): string {
  const u = urgency.toLowerCase()
  if (u === 'urgent') return 'bg-signal-urgent-bg text-signal-urgent border border-signal-urgent-border'
  if (u === 'priority') return 'bg-signal-priority-bg text-signal-priority-text border border-signal-priority-border'
  return NEUTRAL_CHIP
}

function renderDetails(details: any, action: string, nested = false) {
  if (!details) return <span className="text-text-tertiary text-caption">—</span>

  let parsed = details
  if (typeof details === 'string') {
    try {
      parsed = JSON.parse(details)
    } catch {
      return <span className="text-caption text-text-secondary truncate">{details}</span>
    }
  }

  if (action === 'classified') {
    // Current classify prompt writes {theme, urgency, routed_roles[], confidence, summary}.
    // Historical rows from before the theme-routing migration may still carry the old
    // {category, routed_role, confidence, summary} shape — render both defensively.
    const isLegacyShape = parsed.theme === undefined && parsed.category !== undefined
    const confidencePercent =
      parsed.confidence !== undefined
        ? parsed.confidence <= 1
          ? Math.round(parsed.confidence * 100)
          : Math.round(parsed.confidence)
        : undefined

    return (
      <div className="space-y-1 text-caption">
        <div className="flex flex-wrap items-center gap-1.5">
          {isLegacyShape ? (
            <>
              {parsed.category && (
                <span className={`px-1.5 py-px rounded-control whitespace-nowrap font-medium ${NEUTRAL_CHIP}`}>
                  {parsed.category}
                </span>
              )}
              {parsed.routed_role && (
                <span className="text-text-secondary capitalize">
                  {parsed.routed_role}
                </span>
              )}
            </>
          ) : (
            <>
              {parsed.theme && (
                <span className={`px-1.5 py-px rounded-control whitespace-nowrap font-medium ${NEUTRAL_CHIP}`}>
                  {themeLabel(String(parsed.theme))}
                </span>
              )}
              {parsed.urgency && (
                <span className={`px-1.5 py-px rounded-control whitespace-nowrap font-medium capitalize ${urgencyChipStyle(String(parsed.urgency))}`}>
                  {parsed.urgency}
                </span>
              )}
              {Array.isArray(parsed.routed_roles) && parsed.routed_roles.length > 0 && (
                <span className="text-text-secondary capitalize">
                  {parsed.routed_roles.map((r: string) => r.replace(/_/g, ' ')).join(', ')}
                </span>
              )}
            </>
          )}
          {confidencePercent !== undefined && (
            <span className="font-mono tabular-nums text-text-tertiary" title="Classification confidence">
              {confidencePercent}%
            </span>
          )}
        </div>
        {parsed.summary && (
          <p className="text-caption text-text-secondary line-clamp-1">
            &ldquo;{parsed.summary}&rdquo;
          </p>
        )}
      </div>
    )
  }

  if (action === 'approved') {
    const draftType = parsed.draft_type || 'ai_generated'
    return (
      <div className="flex flex-wrap items-center gap-1.5 text-caption">
        <span className={`px-1.5 py-px rounded-control whitespace-nowrap font-medium ${NEUTRAL_CHIP}`}>
          {DRAFT_TYPE_LABELS[draftType] || draftType.replace(/_/g, ' ')}
        </span>
        {parsed.was_discarded && (
          <span className="text-text-secondary">· discarded &amp; rewritten</span>
        )}
      </div>
    )
  }

  if (action === 'edited') {
    return (
      <span className="text-caption text-text-secondary">
        Draft content updated{' '}
        {parsed.text_length ? <span className="font-mono tabular-nums">({parsed.text_length} chars)</span> : ''}
      </span>
    )
  }

  // Anything else is a raw payload: quiet mono key/value pairs, behind a disclosure unless
  // the caller is already inside one (mobile cards).
  if (parsed === null || typeof parsed !== 'object') {
    return <span className="font-mono text-caption text-text-secondary break-all">{String(parsed)}</span>
  }
  const entries = Object.entries(parsed)
  const fields = (
    <dl className="font-mono text-caption text-text-secondary space-y-0.5 break-all">
      {entries.map(([key, value]) => (
        <div key={key}>
          <dt className="inline text-text-tertiary">{key}: </dt>
          <dd className="inline">{typeof value === 'string' ? value : JSON.stringify(value)}</dd>
        </div>
      ))}
    </dl>
  )
  if (nested) return fields

  return (
    <details className="group">
      <summary className="cursor-pointer list-none inline-flex items-center gap-1 text-caption text-text-secondary hover:text-text-primary transition-colors duration-150">
        <span className="group-open:hidden">Show payload</span>
        <span className="hidden group-open:inline">Hide payload</span>
        <span className="text-text-tertiary tabular-nums">
          · {entries.length} {entries.length === 1 ? 'field' : 'fields'}
        </span>
      </summary>
      <div className="mt-1.5">{fields}</div>
    </details>
  )
}

export function AuditLogView({ initialLogs }: AuditLogViewProps) {
  const {
    filteredLogs,
    isLive: isRealtimeLive,
    selectedAction,
    setSelectedAction,
    searchQuery,
    setSearchQuery,
    hasActiveFilters,
    clearFilters,
    actionCount,
    visibleActions,
  } = useAuditLog(initialLogs)

  const FOCUS =
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-brand focus-visible:ring-offset-1 focus-visible:ring-offset-surface-raised'
  const SEARCH_INPUT =
    'w-full rounded-control border border-border-control bg-surface-raised text-text-primary placeholder:text-text-tertiary transition-[border-color,box-shadow] duration-150 hover:border-text-secondary focus:outline-none focus-visible:ring-2 focus-visible:ring-border-brand focus-visible:ring-offset-1 focus-visible:ring-offset-surface-raised'

  const timeAndRef = (log: AuditLogItem) => (
    <span className="font-mono tabular-nums text-caption text-text-tertiary whitespace-nowrap" title="Exact time · audit record reference">
      {log.created_at &&
        `${new Date(log.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} · `}
      {shortRef(log.id)}
    </span>
  )

  const actor = (log: AuditLogItem) =>
    log.user_id && log.users ? (
      <span className="inline-flex items-center gap-1.5 text-text-primary min-w-0">
        <User className="w-3.5 h-3.5 text-text-secondary shrink-0" aria-hidden="true" />
        <span className="truncate">{log.users.name || log.users.email || 'Staff user'}</span>
      </span>
    ) : (
      <span className="inline-flex items-center gap-1.5 text-text-secondary">
        <Bot className="w-3.5 h-3.5 text-text-tertiary shrink-0" aria-hidden="true" />
        System
      </span>
    )

  const emailRef = (log: AuditLogItem) =>
    log.email_id ? (
      <Link
        href={`/emails/${log.email_id}`}
        className={`block truncate font-medium text-text-primary hover:underline rounded-control ${FOCUS}`}
      >
        {log.emails?.subject || (
          <span className="font-mono font-normal text-text-secondary">Email {shortRef(log.email_id)}</span>
        )}
      </Link>
    ) : (
      <span className="text-text-tertiary">—</span>
    )

  return (
    <section
      aria-labelledby="audit-heading"
      className="bg-surface-raised rounded-surface border border-border-hairline shadow-sm overflow-hidden"
    >
      <div className="flex items-start justify-between gap-3 px-4 pt-3.5 pb-3">
        <div className="min-w-0">
          <h1 id="audit-heading" className="text-heading font-semibold text-text-primary">
            Audit log
          </h1>
          <p className="text-caption text-text-secondary tabular-nums mt-0.5">
            {filteredLogs.length} {filteredLogs.length === 1 ? 'event' : 'events'}
            <span className="hidden sm:inline text-text-tertiary"> · newest first</span>
          </p>
        </div>
        <div className="pt-1">
          <RealtimeIndicator live={isRealtimeLive} />
        </div>
      </div>

      {/* Below lg: search + action select */}
      <div className="lg:hidden flex flex-col sm:flex-row gap-2 px-3 pb-3">
        <div className="relative flex-1 min-w-0">
          <Search aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search audit trail…"
            aria-label="Search audit trail"
            className={`${SEARCH_INPUT} h-11 pl-9 pr-10 text-body`}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              aria-label="Clear search"
              className={`absolute right-1 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-control text-text-secondary hover:text-text-primary cursor-pointer ${FOCUS}`}
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          )}
        </div>
        <Select
          touch
          wrapperClassName="sm:w-56"
          aria-label="Filter by action"
          value={selectedAction}
          onChange={(e) => setSelectedAction(e.target.value)}
        >
          {ACTION_FILTERS.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label} ({actionCount(item.value)})
            </option>
          ))}
        </Select>
      </div>

      {/* lg+: segmented action filter + search, one row */}
      <div className="hidden lg:flex flex-wrap items-center gap-3 px-4 pb-3">
        <div role="group" aria-label="Filter by action" className="inline-flex p-0.5 rounded-control bg-surface">
          {visibleActions.map((item) => {
            const active = selectedAction === item.value
            return (
              <button
                key={item.value}
                onClick={() => setSelectedAction(item.value)}
                aria-pressed={active}
                className={`h-7 px-3 rounded-control inline-flex items-center gap-1.5 text-secondary font-medium whitespace-nowrap transition-[background-color,color,box-shadow] duration-150 cursor-pointer ${
                  active ? 'bg-surface-raised text-text-primary shadow-sm' : 'text-text-secondary hover:text-text-primary'
                } ${FOCUS}`}
              >
                {item.label}
                <span className="text-caption text-text-tertiary tabular-nums">{actionCount(item.value)}</span>
              </button>
            )
          })}
        </div>

        <div className="relative ml-auto w-64">
          <Search aria-hidden="true" className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-secondary pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search subject, sender, details"
            aria-label="Search audit trail"
            className={`${SEARCH_INPUT} h-8 pl-8 pr-8 text-secondary`}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              aria-label="Clear search"
              className={`absolute right-1 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-control text-text-secondary hover:text-text-primary cursor-pointer ${FOCUS}`}
            >
              <X className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      {filteredLogs.length === 0 ? (
        <div className="border-t border-border-hairline px-6 py-10 text-center">
          <FileClock className="w-4 h-4 mx-auto text-text-tertiary mb-2" aria-hidden="true" />
          <p className="text-secondary font-medium text-text-primary">
            {hasActiveFilters ? 'No events match these filters' : 'No activity recorded yet'}
          </p>
          <p className="text-caption text-text-secondary mt-1">
            {hasActiveFilters
              ? 'Try a different action type or search term.'
              : 'Classification, drafting, and approval events will appear here as they happen.'}
          </p>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className={`mt-3 h-8 inline-flex items-center gap-1.5 px-3 rounded-control border border-border-control text-secondary font-medium text-text-primary hover:border-text-secondary transition-colors duration-150 cursor-pointer ${FOCUS}`}
            >
              <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Cards below lg — phones and tablets */}
          <ul className="lg:hidden border-t border-border-hairline divide-y divide-border-hairline" aria-label="Audit events">
            {filteredLogs.map((log) => {
              const badge = getActionBadge(log.action)
              const ActionIcon = badge.icon
              return (
                <li key={log.id} className="px-4 py-3 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`inline-flex items-center gap-1.5 px-1.5 py-px rounded-control whitespace-nowrap text-caption font-medium ${badge.style}`}>
                      <ActionIcon className="w-3 h-3" aria-hidden="true" />
                      {badge.label}
                    </span>
                    <time
                      dateTime={log.created_at || undefined}
                      title={formatPreciseTimestamp(log.created_at)}
                      className="text-caption tabular-nums text-text-secondary"
                    >
                      {formatRelativeTime(log.created_at)}
                    </time>
                  </div>

                  {log.email_id && (
                    <div className="text-secondary min-w-0">
                      {emailRef(log)}
                      {log.emails?.from_name && (
                        <span className="block text-caption text-text-secondary truncate">From {log.emails.from_name}</span>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-3 text-caption min-w-0">
                    {actor(log)}
                    {timeAndRef(log)}
                  </div>

                  {log.details && (
                    <details className="group">
                      <summary className="cursor-pointer list-none inline-flex items-center min-h-11 -mb-2 text-caption font-medium text-text-secondary hover:text-text-primary transition-colors duration-150">
                        <span className="group-open:hidden">Show details</span>
                        <span className="hidden group-open:inline">Hide details</span>
                      </summary>
                      <div className="pb-2">{renderDetails(log.details, log.action, true)}</div>
                    </details>
                  )}
                </li>
              )
            })}
          </ul>

          {/* Table at lg+ */}
          <div className="hidden lg:block border-t border-border-hairline overflow-x-auto">
            <table className="w-full table-fixed text-left border-collapse">
              <colgroup>
                <col className="w-44" />
                <col className="w-40" />
                <col />
                <col className="w-44" />
                <col className="w-[30%]" />
              </colgroup>
              <thead>
                <tr className="border-b border-border-hairline text-caption font-medium text-text-secondary">
                  <th scope="col" className="py-2 px-4 font-medium">Time</th>
                  <th scope="col" className="py-2 px-4 font-medium">Action</th>
                  <th scope="col" className="py-2 px-4 font-medium">Email</th>
                  <th scope="col" className="py-2 px-4 font-medium">Actor</th>
                  <th scope="col" className="py-2 px-4 font-medium">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-hairline text-secondary">
                {filteredLogs.map((log) => {
                  const badge = getActionBadge(log.action)
                  const ActionIcon = badge.icon
                  return (
                    <tr key={log.id} className="align-top hover:bg-surface/40 transition-colors duration-150">
                      <td className="py-2.5 px-4">
                        <time
                          dateTime={log.created_at || undefined}
                          title={formatPreciseTimestamp(log.created_at)}
                          className="block text-text-primary"
                        >
                          {formatRelativeTime(log.created_at)}
                        </time>
                        <span className="block mt-0.5">{timeAndRef(log)}</span>
                      </td>
                      <td className="py-2.5 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-1.5 py-px rounded-control whitespace-nowrap text-caption font-medium ${badge.style}`}>
                          <ActionIcon className="w-3 h-3" aria-hidden="true" />
                          {badge.label}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 min-w-0">
                        {emailRef(log)}
                        {log.emails?.from_name && (
                          <span className="block text-caption text-text-secondary truncate mt-0.5">From {log.emails.from_name}</span>
                        )}
                      </td>
                      <td className="py-2.5 px-4 min-w-0">{actor(log)}</td>
                      <td className="py-2.5 px-4 min-w-0">{renderDetails(log.details, log.action)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  )
}
