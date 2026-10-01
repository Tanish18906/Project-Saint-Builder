'use client'

import * as React from 'react'
import Link from 'next/link'
import {
  Sparkles,
  ShieldCheck,
  Clock,
  Copy,
  Check,
  Code,
  LayoutList,
  ArrowRight,
  Info,
  Radio,
  AlertTriangle,
} from 'lucide-react'
import { ThemeBadge } from '@/components/ThemeBadge'
import { UrgencyBadge } from '@/components/UrgencyBadge'
import { formatExactTimestamp, type AuditLogItem } from './types'

export interface AuditLogDetailsProps {
  log: AuditLogItem
  details: Record<string, unknown> | null
}

export function AuditLogDetails({ log, details }: AuditLogDetailsProps) {
  const [activeTab, setActiveTab] = React.useState<'formatted' | 'json'>('formatted')
  const [copiedId, setCopiedId] = React.useState<string | null>(null)
  const [copiedJson, setCopiedJson] = React.useState(false)

  const handleCopy = async (key: string, text: string) => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text)
        setCopiedId(key)
        setTimeout(() => setCopiedId(null), 2000)
      }
    } catch (err) {
      console.error('Failed to copy text:', err)
    }
  }

  const handleCopyJson = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(JSON.stringify(details || {}, null, 2))
        setCopiedJson(true)
        setTimeout(() => setCopiedJson(false), 2000)
      }
    } catch (err) {
      console.error('Failed to copy JSON:', err)
    }
  }

  const normAction = (log.action || '').toLowerCase().trim()
  const hasDetails = details !== null && Object.keys(details).length > 0

  return (
    <div className="space-y-3 p-3.5 sm:p-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] shadow-xs">
      {/* Top Toolbar: View Switcher Tabs & Copy Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2.5 border-b border-[var(--border-subtle)]">
        {/* Tabs: Formatted Details vs Raw JSON */}
        <div className="inline-flex items-center p-0.5 rounded-lg bg-[var(--surface-subtle)] border border-[var(--border-subtle)] text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('formatted')}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
              activeTab === 'formatted'
                ? 'bg-[var(--surface)] text-[var(--text-primary)] shadow-2xs font-semibold'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <LayoutList className="w-3.5 h-3.5 text-[var(--brand)]" />
            <span>Event Details</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('json')}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
              activeTab === 'json'
                ? 'bg-[var(--surface)] text-[var(--text-primary)] shadow-2xs font-semibold'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Code className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
            <span>Raw JSON</span>
          </button>
        </div>

        {/* Quick Action Badges / Copy Buttons */}
        <div className="flex items-center gap-2 text-xs">
          <button
            type="button"
            onClick={() => handleCopy('event-id', log.id)}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-mono text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-[var(--surface-subtle)] hover:bg-[var(--surface-subtle)]/80 border border-[var(--border-subtle)] cursor-pointer"
            title="Copy Event UUID"
          >
            {copiedId === 'event-id' ? (
              <Check className="w-3 h-3 text-emerald-600" />
            ) : (
              <Copy className="w-3 h-3" />
            )}
            <span>{copiedId === 'event-id' ? 'Copied ID' : 'Copy ID'}</span>
          </button>

          <button
            type="button"
            onClick={handleCopyJson}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-[var(--surface-subtle)] hover:bg-[var(--surface-subtle)]/80 border border-[var(--border-subtle)] cursor-pointer"
            title="Copy event JSON payload"
          >
            {copiedJson ? (
              <Check className="w-3 h-3 text-emerald-600" />
            ) : (
              <Copy className="w-3 h-3" />
            )}
            <span>{copiedJson ? 'Copied JSON' : 'Copy JSON'}</span>
          </button>
        </div>
      </div>

      {/* Identifiers & Links Reference Banner */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-[var(--text-secondary)] font-mono">
        <span className="inline-flex items-center gap-1">
          <span className="text-[var(--text-tertiary)] font-sans">Event ID:</span>
          <span className="font-semibold text-[var(--text-primary)]">{log.id.slice(0, 13)}...</span>
        </span>

        {log.email_id && (
          <span className="inline-flex items-center gap-1">
            <span className="text-[var(--text-tertiary)] font-sans">Email ID:</span>
            <Link
              href={`/emails/${log.email_id}`}
              className="font-medium text-[var(--brand)] hover:underline inline-flex items-center gap-0.5"
            >
              <span>{log.email_id.slice(0, 13)}...</span>
              <ArrowRight className="w-2.5 h-2.5" />
            </Link>
          </span>
        )}

        {log.draft_id && (
          <span className="inline-flex items-center gap-1">
            <span className="text-[var(--text-tertiary)] font-sans">Draft ID:</span>
            <span>{log.draft_id.slice(0, 13)}...</span>
          </span>
        )}

        {log.created_at && (
          <span className="inline-flex items-center gap-1 text-[var(--text-tertiary)] ml-auto font-sans">
            <Clock className="w-3 h-3 opacity-60" />
            <span>{formatExactTimestamp(log.created_at)}</span>
          </span>
        )}
      </div>

      {/* Main Content Area */}
      {activeTab === 'json' ? (
        /* Raw JSON Inspector Mode */
        <div className="relative">
          <pre className="p-3.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-subtle)] text-[var(--text-secondary)] font-mono text-[11px] leading-relaxed max-h-60 overflow-y-auto select-text">
            {JSON.stringify(details || {}, null, 2)}
          </pre>
        </div>
      ) : (
        /* Human-Readable Formatted Details Mode */
        <div className="space-y-3">
          {!hasDetails ? (
            <div className="p-3 rounded-lg bg-[var(--surface-subtle)] border border-[var(--border-subtle)] text-xs text-[var(--text-secondary)] flex items-center gap-2">
              <Info className="w-4 h-4 text-[var(--text-tertiary)] shrink-0" />
              <span>Standard workflow event recorded with no additional parameter payload.</span>
            </div>
          ) : (
            <>
              {/* Classified Action Details */}
              {normAction === 'classified' && (
                <div className="space-y-2.5">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                    {/* Theme */}
                    <div className="p-2.5 rounded-lg bg-[var(--surface-subtle)] border border-[var(--border-subtle)]">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)] block mb-1">
                        Theme
                      </span>
                      <ThemeBadge theme={details.theme as string} />
                    </div>

                    {/* Urgency */}
                    <div className="p-2.5 rounded-lg bg-[var(--surface-subtle)] border border-[var(--border-subtle)]">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)] block mb-1">
                        Urgency
                      </span>
                      <UrgencyBadge urgency={details.urgency as string} />
                    </div>

                    {/* AI Confidence */}
                    <div className="p-2.5 rounded-lg bg-[var(--surface-subtle)] border border-[var(--border-subtle)]">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)] block mb-1">
                        Confidence
                      </span>
                      {details.confidence !== undefined ? (
                        <div className="flex items-center gap-1.5 font-semibold text-emerald-800">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                          <span>
                            {Number(details.confidence) <= 1
                              ? `${Math.round(Number(details.confidence) * 100)}%`
                              : `${Math.round(Number(details.confidence))}%`}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[var(--text-tertiary)]">—</span>
                      )}
                    </div>

                    {/* Routed Roles */}
                    <div className="p-2.5 rounded-lg bg-[var(--surface-subtle)] border border-[var(--border-subtle)]">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)] block mb-1">
                        Routed Roles
                      </span>
                      {Array.isArray(details.routed_roles) && details.routed_roles.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {details.routed_roles.map((role: string) => (
                            <span
                              key={role}
                              className="px-1.5 py-0.5 rounded bg-[var(--surface)] text-[var(--text-secondary)] font-medium text-[10px] capitalize border border-[var(--border-subtle)]"
                            >
                              {String(role).replace(/_/g, ' ')}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[var(--text-tertiary)]">—</span>
                      )}
                    </div>
                  </div>

                  {/* Summary Box */}
                  {details.summary ? (
                    <div className="p-3 rounded-lg bg-[var(--surface-subtle)] border border-[var(--border-subtle)] space-y-1">
                      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[var(--brand)]">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>AI Triage Analysis</span>
                      </div>
                      <p className="text-xs text-[var(--text-primary)] leading-relaxed">
                        {String(details.summary)}
                      </p>
                    </div>
                  ) : null}
                </div>
              )}

              {/* WhatsApp Notification Details */}
              {(normAction === 'whatsapp_notified' || normAction === 'whatsapp_alert_sent') && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                  <div className="p-2.5 rounded-lg bg-[var(--surface-subtle)] border border-[var(--border-subtle)]">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)] block mb-1">
                      Recipient Staff
                    </span>
                    <span className="font-semibold text-[var(--text-primary)] capitalize">
                      {String(details.user_name || 'Staff User')}
                    </span>
                    {Boolean(details.role) && (
                      <span className="block text-[11px] text-[var(--text-tertiary)] capitalize">
                        Role: {String(details.role).replace(/_/g, ' ')}
                      </span>
                    )}
                  </div>

                  <div className="p-2.5 rounded-lg bg-[var(--surface-subtle)] border border-[var(--border-subtle)]">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)] block mb-1">
                      WhatsApp Destination
                    </span>
                    <span className="font-mono font-medium text-[var(--text-primary)]">
                      {String(details.whatsapp_number || details.recipient || '—')}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-[var(--surface-subtle)] border border-[var(--border-subtle)]">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)] block mb-1">
                      Dispatch Status
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 capitalize">
                      <Radio className="w-3 h-3 text-emerald-600" />
                      <span>{String(details.status || 'Dispatched')}</span>
                    </span>
                  </div>
                </div>
              )}

              {/* WhatsApp Skipped Details */}
              {normAction === 'whatsapp_skipped_no_recipient' && (
                <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 space-y-1.5 text-xs">
                  <div className="flex items-center gap-1.5 font-semibold text-amber-900">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    <span>WhatsApp Alert Skipped</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    {Boolean(details.category) && (
                      <span>
                        <strong>Urgency:</strong> <UrgencyBadge urgency={details.category as string} />
                      </span>
                    )}
                    {Boolean(details.routed_role) && (
                      <span>
                        <strong>Target Role:</strong> {String(details.routed_role).replace(/_/g, ' ')}
                      </span>
                    )}
                  </div>
                  {Boolean(details.reason) && (
                    <p className="text-[11px] text-amber-800">
                      <strong>Reason:</strong> {String(details.reason)}
                    </p>
                  )}
                </div>
              )}

              {/* Sent / Dispatched Email Details */}
              {normAction === 'sent' && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                  <div className="p-2.5 rounded-lg bg-[var(--surface-subtle)] border border-[var(--border-subtle)] sm:col-span-2">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)] block mb-1">
                      Recipient (To)
                    </span>
                    <span className="font-mono font-medium text-[var(--text-primary)]">
                      {String(details.to || '—')}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-[var(--surface-subtle)] border border-[var(--border-subtle)]">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)] block mb-1">
                      Dispatched From Account
                    </span>
                    <span className="font-mono text-[var(--text-primary)]">
                      {String(details.account || '—')}
                    </span>
                  </div>

                  {Boolean(details.subject) && (
                    <div className="p-2.5 rounded-lg bg-[var(--surface-subtle)] border border-[var(--border-subtle)] sm:col-span-3">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)] block mb-1">
                        Outbound Subject
                      </span>
                      <span className="font-medium text-[var(--text-primary)]">
                        {String(details.subject)}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Approved Action Details */}
              {normAction === 'approved' && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                  <div className="p-2.5 rounded-lg bg-[var(--surface-subtle)] border border-[var(--border-subtle)]">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)] block mb-1">
                      Draft Provenance
                    </span>
                    <span className="font-semibold text-[var(--text-primary)] capitalize">
                      {String(details.draft_type || 'AI-generated').replace(/_/g, ' ')}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-[var(--surface-subtle)] border border-[var(--border-subtle)]">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)] block mb-1">
                      Authorization Channel
                    </span>
                    <span className="font-medium text-[var(--text-primary)] capitalize">
                      {String(details.via || 'Web Dashboard')}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-[var(--surface-subtle)] border border-[var(--border-subtle)]">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)] block mb-1">
                      Revision Status
                    </span>
                    <span className="text-[var(--text-secondary)]">
                      {details.was_discarded
                        ? 'Draft rewritten after discard'
                        : 'Approved directly without discard'}
                    </span>
                  </div>
                </div>
              )}

              {/* Edited Action Details */}
              {normAction === 'edited' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  <div className="p-2.5 rounded-lg bg-[var(--surface-subtle)] border border-[var(--border-subtle)]">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)] block mb-1">
                      Edited Content Length
                    </span>
                    <span className="font-mono font-semibold text-[var(--text-primary)]">
                      {details.text_length ? `${details.text_length} characters` : 'Updated'}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-[var(--surface-subtle)] border border-[var(--border-subtle)]">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)] block mb-1">
                      Editor Interface
                    </span>
                    <span className="font-medium text-[var(--text-primary)] capitalize">
                      {String(details.via || 'Web Interface')}
                    </span>
                  </div>
                </div>
              )}

              {/* Discarded Action Details */}
              {normAction === 'discarded' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  <div className="p-2.5 rounded-lg bg-[var(--surface-subtle)] border border-[var(--border-subtle)]">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)] block mb-1">
                      Discarded Via
                    </span>
                    <span className="font-medium text-[var(--text-primary)] capitalize">
                      {String(details.via || 'Web Dashboard')}
                    </span>
                  </div>

                  {Boolean(details.discarded_at) && (
                    <div className="p-2.5 rounded-lg bg-[var(--surface-subtle)] border border-[var(--border-subtle)]">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)] block mb-1">
                        Discarded Timestamp
                      </span>
                      <span className="font-mono text-[var(--text-primary)]">
                        {formatExactTimestamp(String(details.discarded_at))}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Generic Key-Value List for Any Other Custom/Unmatched Fields */}
              {(() => {
                const knownKeys = new Set([
                  'theme',
                  'urgency',
                  'confidence',
                  'routed_roles',
                  'summary',
                  'user_name',
                  'role',
                  'whatsapp_number',
                  'recipient',
                  'status',
                  'category',
                  'routed_role',
                  'reason',
                  'to',
                  'account',
                  'subject',
                  'draft_type',
                  'via',
                  'was_discarded',
                  'text_length',
                  'discarded_at',
                ])
                const extraEntries = Object.entries(details).filter(
                  ([key]) => !knownKeys.has(key)
                )

                if (extraEntries.length === 0) return null

                return (
                  <div className="pt-2 border-t border-[var(--border-subtle)] space-y-1.5">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)] block">
                      Additional Parameters
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {extraEntries.map(([k, v]) => (
                        <div
                          key={k}
                          className="p-2 rounded bg-[var(--surface-subtle)] border border-[var(--border-subtle)] text-xs flex items-center justify-between gap-2"
                        >
                          <span className="text-[var(--text-secondary)] font-medium capitalize">
                            {k.replace(/_/g, ' ')}:
                          </span>
                          <span className="font-mono text-[var(--text-primary)] truncate max-w-[200px]">
                            {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })()}
            </>
          )}
        </div>
      )}
    </div>
  )
}
