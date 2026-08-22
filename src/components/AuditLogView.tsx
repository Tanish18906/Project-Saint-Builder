'use client'

import React, { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import {
  FileClock,
  Search,
  Filter,
  ArrowRight,
  User,
  Bot,
  Sparkles,
  CheckCircle2,
  Trash2,
  Edit3,
  Mail,
  Send,
  Radio,
} from 'lucide-react'

export interface AuditLogItem {
  id: string
  action: string
  details: any
  created_at: string | null
  email_id: string | null
  draft_id: string | null
  user_id: string | null
  emails?: {
    id: string
    subject: string | null
    from_name: string | null
    from_address: string | null
  } | null
  users?: {
    id: string
    name: string | null
    email: string | null
    role: string | null
  } | null
}

interface AuditLogViewProps {
  initialLogs: AuditLogItem[]
}

const ACTION_FILTERS = [
  { value: 'all', label: 'All Actions' },
  { value: 'classified', label: 'Classified' },
  { value: 'drafted', label: 'Drafted' },
  { value: 'edited', label: 'Edited' },
  { value: 'approved', label: 'Approved' },
  { value: 'discarded', label: 'Discarded' },
  { value: 'sent', label: 'Sent' },
]

function getActionBadge(action: string) {
  const norm = action.toLowerCase()
  switch (norm) {
    case 'classified':
      return {
        bg: 'bg-[#ece7db]',
        text: 'text-[#4a453c]',
        border: 'border-[#e2dbcd]',
        icon: Sparkles,
        label: 'Classified',
      }
    case 'drafted':
      return {
        bg: 'bg-[#ece7db]',
        text: 'text-[#4a453c]',
        border: 'border-[#e2dbcd]',
        icon: Mail,
        label: 'Drafted',
      }
    case 'edited':
      return {
        bg: 'bg-[#ece7db]',
        text: 'text-[#4a453c]',
        border: 'border-[#e2dbcd]',
        icon: Edit3,
        label: 'Draft edited',
      }
    case 'approved':
      return {
        bg: 'bg-emerald-50/70',
        text: 'text-[#2f6b3f]',
        border: 'border-emerald-200/80',
        icon: CheckCircle2,
        label: 'Approved',
      }
    case 'discarded':
      return {
        bg: 'bg-[#f5f1e8]',
        text: 'text-[#6b6559]',
        border: 'border-[#e8e2d4]',
        icon: Trash2,
        label: 'Discarded',
      }
    case 'sent':
      return {
        bg: 'bg-[#1c1a17]',
        text: 'text-[#f5f1e8]',
        border: 'border-[#1c1a17]',
        icon: Send,
        label: 'Dispatched / Sent',
      }
    default:
      return {
        bg: 'bg-[#ece7db]',
        text: 'text-[#4a453c]',
        border: 'border-[#e2dbcd]',
        icon: FileClock,
        label: action,
      }
  }
}

function formatRelativeTime(dateString: string | null): string {
  if (!dateString) return '—'
  try {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
  } catch {
    return dateString
  }
}

function renderDetails(details: any, action: string) {
  if (!details) return <span className="text-[#6b6559]/60 italic text-xs">—</span>

  let parsed = details
  if (typeof details === 'string') {
    try {
      parsed = JSON.parse(details)
    } catch {
      return <span className="text-xs text-[#6b6559] truncate">{details}</span>
    }
  }

  if (action === 'classified') {
    return (
      <div className="space-y-1 text-xs">
        <div className="flex flex-wrap items-center gap-1.5">
          {parsed.category && (
            <span className="px-1.5 py-0.5 rounded bg-[#f5f1e8] text-[#1c1a17] font-medium border border-[#e8e2d4]">
              {parsed.category}
            </span>
          )}
          {parsed.routed_role && (
            <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 capitalize">
              Role: {parsed.routed_role}
            </span>
          )}
          {parsed.confidence !== undefined && (
            <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
              {parsed.confidence}%
            </span>
          )}
        </div>
        {parsed.summary && (
          <p className="text-[11px] text-[#6b6559] line-clamp-1 italic">
            &ldquo;{parsed.summary}&rdquo;
          </p>
        )}
      </div>
    )
  }

  if (action === 'approved') {
    const draftType = parsed.draft_type || 'ai_generated'
    return (
      <div className="flex items-center gap-1.5 text-xs">
        <span className="font-medium text-[#1c1a17]">Type:</span>
        <span className="px-2 py-0.5 rounded bg-stone-100 text-stone-800 border border-stone-200 uppercase font-semibold text-[10px]">
          {draftType.replace(/_/g, ' ')}
        </span>
        {parsed.was_discarded && (
          <span className="text-[10px] text-amber-700 font-medium">(Discarded & Re-written)</span>
        )}
      </div>
    )
  }

  if (action === 'edited') {
    return (
      <span className="text-xs text-[#6b6559]">
        Draft content updated {parsed.text_length ? `(${parsed.text_length} chars)` : ''}
      </span>
    )
  }

  return (
    <pre className="text-[11px] text-[#6b6559] bg-[#f5f1e8] p-1.5 rounded max-h-16 overflow-y-auto">
      {JSON.stringify(parsed, null, 2)}
    </pre>
  )
}

export function AuditLogView({ initialLogs }: AuditLogViewProps) {
  const [logs, setLogs] = useState<AuditLogItem[]>(initialLogs)
  const [isRealtimeLive, setIsRealtimeLive] = useState<boolean>(false)
  const [selectedAction, setSelectedAction] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')

  useEffect(() => {
    setLogs(initialLogs)
  }, [initialLogs])

  // Realtime subscription for audit log entries
  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel('realtime-audit-log')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'audit_log' },
        async (payload) => {
          const { data } = await supabase
            .from('audit_log')
            .select(`
              *,
              emails (
                id,
                subject,
                from_name,
                from_address
              ),
              users (
                id,
                name,
                email,
                role
              )
            `)
            .eq('id', payload.new.id)
            .single()

          if (data) {
            setLogs((prev) => [data as any, ...prev])
          }
        }
      )
      .subscribe((status) => {
        setIsRealtimeLive(status === 'SUBSCRIBED')
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (selectedAction !== 'all' && log.action.toLowerCase() !== selectedAction.toLowerCase()) {
        return false
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const matchSubject = (log.emails?.subject || '').toLowerCase().includes(q)
        const matchFrom = (log.emails?.from_name || '').toLowerCase().includes(q)
        const matchAction = log.action.toLowerCase().includes(q)
        const matchDetails = JSON.stringify(log.details || {}).toLowerCase().includes(q)

        if (!matchSubject && !matchFrom && !matchAction && !matchDetails) {
          return false
        }
      }

      return true
    })
  }, [logs, selectedAction, searchQuery])

  return (
    <div className="space-y-6">
      {/* Top Filter Card */}
      <div className="bg-white rounded-lg border border-[#e8e2d4] p-4 shadow-sm space-y-4">
        {/* Action Type Filter Buttons & Live Status */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e8e2d4] pb-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#6b6559] mr-2">
              Action:
            </span>
            {ACTION_FILTERS.map((item) => {
              const count =
                item.value === 'all'
                  ? logs.length
                  : logs.filter((l) => l.action.toLowerCase() === item.value).length

              return (
                <button
                  key={item.value}
                  onClick={() => setSelectedAction(item.value)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                    selectedAction === item.value
                      ? 'bg-[#1c1a17] text-[#f5f1e8]'
                      : 'bg-[#f5f1e8] text-[#1c1a17] hover:bg-[#e8e2d4]'
                  }`}
                >
                  <span>{item.label}</span>
                  <span className="opacity-60 ml-1 text-[11px]">({count})</span>
                </button>
              )
            })}
          </div>

          <div
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded border font-medium text-[11px] ${
              isRealtimeLive
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-stone-100 text-stone-600 border-stone-200'
            }`}
            title={isRealtimeLive ? 'Live WebSocket Connected to Supabase' : 'Connecting to Supabase Realtime...'}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isRealtimeLive ? 'bg-emerald-500 animate-pulse' : 'bg-stone-400'
              }`}
            />
            <span>{isRealtimeLive ? 'Realtime Live' : 'Connecting'}</span>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#6b6559]">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search audit trail by subject, sender, or details..."
            className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm border border-[#e8e2d4] rounded bg-white text-[#1c1a17] placeholder:text-[#6b6559]/50 focus:outline-none focus:ring-1 focus:ring-[#1c1a17]"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-[#6b6559] hover:text-[#1c1a17] cursor-pointer"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between px-1">
        <h2 className="text-sm font-semibold text-[#1c1a17]">
          Activity trail · {filteredLogs.length} {filteredLogs.length === 1 ? 'event' : 'events'}
        </h2>
        <span className="text-xs text-[#6b6559]">Sorted by created time</span>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-lg border border-[#e8e2d4] shadow-sm overflow-hidden">
        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-[#f5f1e8] flex items-center justify-center mx-auto mb-3 text-[#6b6559]">
              <FileClock className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-[#1c1a17]">No audit log events found</h3>
            <p className="text-xs text-[#6b6559] mt-1">
              Try adjusting your action filter or search query.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#f5f1e8]/60 border-b border-[#e8e2d4] text-[11px] font-semibold text-[#6b6559]">
                  <th className="py-2.5 px-4">Timestamp</th>
                  <th className="py-2.5 px-4">Action</th>
                  <th className="py-2.5 px-4">Email reference</th>
                  <th className="py-2.5 px-4">Actor</th>
                  <th className="py-2.5 px-4">Details / metadata</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e8e2d4] text-xs">
                {filteredLogs.map((log) => {
                  const badge = getActionBadge(log.action)
                  const ActionIcon = badge.icon

                  return (
                    <tr key={log.id} className="hover:bg-[#f5f1e8]/30 transition-colors">
                      {/* Timestamp */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-[#6b6559]">
                        <span
                          title={log.created_at ? new Date(log.created_at).toLocaleString('en-GB') : ''}
                          className="font-medium text-[#1c1a17]"
                        >
                          {formatRelativeTime(log.created_at)}
                        </span>
                        {log.created_at && (
                          <span className="block text-[11px] text-[#6b6559]">
                            {new Date(log.created_at).toLocaleTimeString('en-GB', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        )}
                      </td>

                      {/* Action Badge */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-medium border text-xs ${badge.bg} ${badge.text} ${badge.border}`}
                        >
                          <ActionIcon className="w-3 h-3" />
                          <span>{badge.label}</span>
                        </span>
                      </td>

                      {/* Email Reference */}
                      <td className="py-3.5 px-4 max-w-xs">
                        {log.email_id ? (
                          <Link
                            href={`/emails/${log.email_id}`}
                            className="group inline-flex items-center gap-1 text-[#1c1a17] hover:text-blue-700 font-medium"
                          >
                            <span className="truncate max-w-[220px]">
                              {log.emails?.subject || `Email (${log.email_id.slice(0, 8)})`}
                            </span>
                            <ArrowRight className="w-3 h-3 opacity-40 group-hover:opacity-100 transition-opacity shrink-0" />
                          </Link>
                        ) : (
                          <span className="text-[#6b6559] italic">—</span>
                        )}
                        {log.emails?.from_name && (
                          <span className="block text-[11px] text-[#6b6559] truncate">
                            From: {log.emails.from_name}
                          </span>
                        )}
                      </td>

                      {/* Actor */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {log.user_id && log.users ? (
                          <div className="flex items-center gap-1.5 text-[#1c1a17]">
                            <User className="w-3.5 h-3.5 text-[#6b6559]" />
                            <span>{log.users.name || log.users.email || 'Staff User'}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-[#6b6559]">
                            <Bot className="w-3.5 h-3.5 text-[#6b6559]/70" />
                            <span className="italic">System (Automation)</span>
                          </div>
                        )}
                      </td>

                      {/* Details */}
                      <td className="py-3.5 px-4">{renderDetails(log.details, log.action)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
