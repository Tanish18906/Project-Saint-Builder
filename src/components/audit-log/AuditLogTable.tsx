'use client'

import * as React from 'react'
import Link from 'next/link'
import {
  User,
  Bot,
  ArrowRight,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import {
  getActionConfig,
  getActorInfo,
  getHumanSummary,
  parseDetails,
} from './eventHelpers'
import { formatRelativeTime, formatExactTimestamp, type AuditLogItem } from './types'
import { AuditLogDetails } from './AuditLogDetails'

export interface AuditLogTableProps {
  logs: AuditLogItem[]
}

export function AuditLogTable({ logs }: AuditLogTableProps) {
  const [expandedId, setExpandedId] = React.useState<string | null>(null)

  const toggleRow = (id: string) => {
    setExpandedId(expandedId === id ? null : id)
  }

  return (
    <div className="bg-[var(--surface)] rounded-xl border border-[var(--border-subtle)] shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[var(--surface-subtle)] border-b border-[var(--border-subtle)] text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
              <th scope="col" className="py-3 px-4 w-36">Time</th>
              <th scope="col" className="py-3 px-4 w-48">Event Action</th>
              <th scope="col" className="py-3 px-4">Subject / Email Reference</th>
              <th scope="col" className="py-3 px-4 w-40">Actor</th>
              <th scope="col" className="py-3 px-4">Summary</th>
              <th scope="col" className="py-3 px-4 w-24 text-right">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-subtle)] text-xs">
            {logs.map((log) => {
              const config = getActionConfig(log.action)
              const ActionIcon = config.icon
              const actor = getActorInfo(log)
              const summary = getHumanSummary(log)
              const details = parseDetails(log.details)
              const isExpanded = expandedId === log.id

              return (
                <React.Fragment key={log.id}>
                  <tr className="hover:bg-[var(--surface-subtle)]/60 transition-colors">
                    {/* Timestamp */}
                    <td className="py-3 px-4 whitespace-nowrap text-[11px] font-mono tabular-nums text-[var(--text-tertiary)]">
                      <span className="font-semibold text-[var(--text-primary)] block">
                        {formatRelativeTime(log.created_at)}
                      </span>
                      <span>{formatExactTimestamp(log.created_at)}</span>
                    </td>

                    {/* Action Badge */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold border ${config.colorClass}`}
                      >
                        <ActionIcon className="w-3.5 h-3.5 shrink-0" />
                        <span>{config.verb}</span>
                      </span>
                    </td>

                    {/* Email reference */}
                    <td className="py-3 px-4">
                      {log.email_id && log.emails ? (
                        <div className="space-y-0.5">
                          <Link
                            href={`/emails/${log.email_id}`}
                            className="group inline-flex items-center gap-1 text-[var(--text-primary)] hover:text-[var(--brand)] font-medium leading-snug"
                          >
                            <span className="truncate max-w-xs">{log.emails.subject || '(No subject)'}</span>
                            <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                          </Link>
                          {log.emails.from_name && (
                            <span className="block text-[11px] text-[var(--text-tertiary)] truncate max-w-xs">
                              From: {log.emails.from_name}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-[var(--text-tertiary)] italic">System event</span>
                      )}
                    </td>

                    {/* Actor */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-[var(--text-primary)]">
                        {actor.isSystem ? (
                          <Bot className="w-3.5 h-3.5 text-[var(--brand)] shrink-0" />
                        ) : (
                          <User className="w-3.5 h-3.5 text-[var(--text-tertiary)] shrink-0" />
                        )}
                        <span className="truncate max-w-[130px] font-medium">{actor.label}</span>
                      </div>
                      {actor.role && (
                        <span className="text-[10px] text-[var(--text-tertiary)] block capitalize">
                          {actor.role.replace(/_/g, ' ')}
                        </span>
                      )}
                    </td>

                    {/* Summary */}
                    <td className="py-3 px-4">
                      <p className="text-xs text-[var(--text-secondary)] line-clamp-2 leading-relaxed">
                        {summary}
                      </p>
                    </td>

                    {/* Toggle Event Details */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => toggleRow(log.id)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors border cursor-pointer ${
                          isExpanded
                            ? 'bg-[var(--brand)] text-white border-[var(--brand)] shadow-2xs font-semibold'
                            : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-[var(--surface-subtle)] hover:bg-[var(--surface-subtle)]/80 border-[var(--border-subtle)]'
                        }`}
                        title={isExpanded ? 'Hide event details' : 'View event details'}
                      >
                        <span>{isExpanded ? 'Close' : 'Details'}</span>
                        {isExpanded ? (
                          <ChevronUp className="w-3 h-3" />
                        ) : (
                          <ChevronDown className="w-3 h-3" />
                        )}
                      </button>
                    </td>
                  </tr>

                  {/* Accordion Row for Structured Event Details */}
                  {isExpanded && (
                    <tr className="bg-[var(--surface-subtle)]/50 border-b border-[var(--border-subtle)]">
                      <td colSpan={6} className="p-3 sm:p-4">
                        <AuditLogDetails log={log} details={details} />
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
