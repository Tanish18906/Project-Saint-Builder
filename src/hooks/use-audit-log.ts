'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { AUDIT_ACTION_OPTIONS, type AuditLogRecord } from '@/lib/domain'

const AUDIT_SELECT = `
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
`

/**
 * Live audit trail (Realtime INSERTs on audit_log, joined to email + user),
 * plus action/search filtering. Logic moved unchanged from AuditLogView.
 */
export function useAuditLog(initialLogs: AuditLogRecord[]) {
  const [logs, setLogs] = useState<AuditLogRecord[]>(initialLogs)
  const [isLive, setIsLive] = useState<boolean>(false)
  const [selectedAction, setSelectedAction] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')

  useEffect(() => {
    setLogs(initialLogs)
  }, [initialLogs])

  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel('realtime-audit-log')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'audit_log' }, async (payload) => {
        const { data } = await supabase.from('audit_log').select(AUDIT_SELECT).eq('id', payload.new.id).single()

        if (data) {
          setLogs((prev) => [data as any, ...prev])
        }
      })
      .subscribe((status) => {
        setIsLive(status === 'SUBSCRIBED')
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

  const hasActiveFilters = selectedAction !== 'all' || searchQuery.trim().length > 0

  const clearFilters = () => {
    setSelectedAction('all')
    setSearchQuery('')
  }

  const actionCount = (value: string) =>
    value === 'all' ? logs.length : logs.filter((l) => l.action.toLowerCase() === value).length

  // Zero-count actions are hidden from the tab row unless currently selected.
  const visibleActions = AUDIT_ACTION_OPTIONS.filter(
    (item) => item.value === 'all' || item.value === selectedAction || actionCount(item.value) > 0
  )

  return {
    logs,
    isLive,
    filteredLogs,
    selectedAction,
    setSelectedAction,
    searchQuery,
    setSearchQuery,
    hasActiveFilters,
    clearFilters,
    actionCount,
    visibleActions,
  }
}
