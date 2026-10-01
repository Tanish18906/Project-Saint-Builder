'use client'

import * as React from 'react'
import { useState, useMemo, useEffect } from 'react'
import { FileClock, Activity } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import {
  AuditLogCard,
  AuditLogTable,
  AuditLogFilterBar,
  AuditLogEmptyState,
  getHumanSummary,
  getActorInfo,
  type AuditLogItem,
  type AuditLogViewProps,
} from '@/components/audit-log'

export type { AuditLogItem, AuditLogViewProps }

export function AuditLogView({ initialLogs }: AuditLogViewProps) {
  const [logs, setLogs] = useState<AuditLogItem[]>(initialLogs)
  const [prevInitialLogs, setPrevInitialLogs] = useState<AuditLogItem[]>(initialLogs)
  const [isRealtimeLive, setIsRealtimeLive] = useState<boolean>(false)
  const [selectedAction, setSelectedAction] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')

  // Adjust state during render when props change (React recommended pattern)
  if (initialLogs !== prevInitialLogs) {
    setPrevInitialLogs(initialLogs)
    setLogs(initialLogs)
  }

  // Supabase Realtime subscription for live audit log entries
  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel('foreman-audit-log-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'audit_log' },
        async (payload) => {
          const newRow = payload.new as unknown as { id: string } & Record<string, unknown>

          // Fetch enriched user and email relationships
          const { data: enriched } = await supabase
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
            .eq('id', newRow.id)
            .single()

          if (enriched) {
            setLogs((prev) => [enriched as unknown as AuditLogItem, ...prev])
          } else {
            setLogs((prev) => [newRow as unknown as AuditLogItem, ...prev])
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'audit_log' },
        (payload) => {
          const updatedRow = payload.new as unknown as { id: string } & Partial<AuditLogItem>
          setLogs((prev) =>
            prev.map((log) =>
              log.id === updatedRow.id
                ? { ...log, ...updatedRow }
                : log
            )
          )
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'audit_log' },
        (payload) => {
          const deletedRow = payload.old as unknown as { id: string }
          setLogs((prev) => prev.filter((log) => log.id !== deletedRow.id))
        }
      )
      .subscribe((status) => {
        setIsRealtimeLive(status === 'SUBSCRIBED')
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  // Filter evaluation
  const hasActiveFilters = Boolean(searchQuery.trim()) || selectedAction !== 'all'

  const handleResetFilters = () => {
    setSearchQuery('')
    setSelectedAction('all')
  }

  // Filtered logs
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      // 1. Action filter
      if (selectedAction !== 'all') {
        const normAction = (log.action || '').toLowerCase()
        if (selectedAction === 'whatsapp') {
          if (!normAction.startsWith('whatsapp_')) {
            return false
          }
        } else if (normAction !== selectedAction.toLowerCase()) {
          return false
        }
      }

      // 2. Text Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const matchAction = (log.action || '').toLowerCase().includes(q)
        const matchSubject = (log.emails?.subject || '').toLowerCase().includes(q)
        const matchSender =
          (log.emails?.from_name || '').toLowerCase().includes(q) ||
          (log.emails?.from_address || '').toLowerCase().includes(q)
        const actor = getActorInfo(log)
        const matchActor = actor.label.toLowerCase().includes(q)
        const summary = getHumanSummary(log).toLowerCase()
        const matchSummary = summary.includes(q)

        if (!matchAction && !matchSubject && !matchSender && !matchActor && !matchSummary) {
          return false
        }
      }

      return true
    })
  }, [logs, selectedAction, searchQuery])

  return (
    <div className="space-y-6">
      {/* Header Summary Card */}
      <div className="bg-[var(--surface)] border border-[var(--border-subtle)] rounded-xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[var(--brand)]/10 text-[var(--brand)] flex items-center justify-center">
                <Activity className="w-5 h-5 text-[var(--brand)]" />
              </div>
              <h1 className="text-lg sm:text-xl font-bold text-[var(--text-primary)]">
                Activity &amp; Audit Log
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)]">
              Immutable ledger of system triage, AI draft generation, staff reviews, approvals, and dispatches.
            </p>
          </div>

          {/* Quick Stats Pill */}
          <div className="flex items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[var(--surface-subtle)] border border-[var(--border-subtle)] text-[var(--text-primary)] font-medium">
              <FileClock className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
              <span>{logs.length} {logs.length === 1 ? 'event' : 'events'} recorded</span>
            </span>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="pt-2 border-t border-[var(--border-subtle)]">
          <AuditLogFilterBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedAction={selectedAction}
            onSelectAction={setSelectedAction}
            hasActiveFilters={hasActiveFilters}
            onResetFilters={handleResetFilters}
            isRealtimeLive={isRealtimeLive}
            totalCount={logs.length}
          />
        </div>
      </div>

      {/* Audit Log Content Feed */}
      {filteredLogs.length === 0 ? (
        <AuditLogEmptyState
          hasFilters={hasActiveFilters}
          onResetFilters={handleResetFilters}
        />
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-[var(--text-secondary)] px-1">
            <span className="font-semibold text-[var(--text-primary)]">
              Showing {filteredLogs.length} of {logs.length} {logs.length === 1 ? 'event' : 'events'}
            </span>
            <span className="text-[11px] text-[var(--text-tertiary)] font-mono">
              Chronological order (newest first)
            </span>
          </div>

          {/* Mobile Card View (< md) */}
          <div className="md:hidden space-y-3">
            {filteredLogs.map((log) => (
              <AuditLogCard key={log.id} log={log} />
            ))}
          </div>

          {/* Desktop Table View (md+) */}
          <div className="hidden md:block">
            <AuditLogTable logs={filteredLogs} />
          </div>
        </div>
      )}
    </div>
  )
}
