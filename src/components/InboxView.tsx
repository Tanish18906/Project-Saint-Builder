'use client'

import * as React from 'react'
import { useState, useMemo, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { AlertTriangle } from 'lucide-react'
import {
  InboxTabs,
  InboxFilterBar,
  InboxListItem,
  InboxEmptyState,
} from '@/components/inbox'
import type { EmailItem, AccountItem, InboxViewProps } from '@/components/inbox'

export type { EmailItem, AccountItem, InboxViewProps }

export function InboxView({ initialEmails, accounts }: InboxViewProps) {
  const searchParams = useSearchParams()
  const paramUrgency = searchParams.get('urgency') || 'all'
  const paramStatus = searchParams.get('status') || 'all'
  const paramTheme = searchParams.get('theme') || 'all'
  const paramAccount = searchParams.get('account') || 'all'
  const paramRole = searchParams.get('role') || 'all'

  const [emails, setEmails] = useState<EmailItem[]>(initialEmails)
  const [prevInitialEmails, setPrevInitialEmails] = useState<EmailItem[]>(initialEmails)

  // Synchronize state when initial server props update (React 19 safe pattern without effect-cascading)
  if (prevInitialEmails !== initialEmails) {
    setPrevInitialEmails(initialEmails)
    setEmails(initialEmails)
  }

  const [isRealtimeLive, setIsRealtimeLive] = useState<boolean>(false)

  // Filter and Search states initialized from URL params if present
  const [selectedAccountId, setSelectedAccountId] = useState<string>(paramAccount)
  const [selectedRole, setSelectedRole] = useState<string>(paramRole)
  const [selectedTheme, setSelectedTheme] = useState<string>(paramTheme)
  const [selectedUrgency, setSelectedUrgency] = useState<string>(paramUrgency)
  const [selectedStatus, setSelectedStatus] = useState<string>(paramStatus)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const deferredSearchQuery = React.useDeferredValue(searchQuery)

  // Supabase Realtime WebSocket Subscription
  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel('realtime-inbox-feed')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'emails' },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            const { data } = await supabase
              .from('emails')
              .select(`*, accounts (id, email_address, display_name)`)
              .eq('id', (payload.new as { id: string }).id)
              .single()

            if (data) {
              const newEmail = data as unknown as EmailItem
              setEmails((prev) => [newEmail, ...prev.filter((e) => e.id !== newEmail.id)])
            }
          } else if (payload.eventType === 'UPDATE') {
            const { data } = await supabase
              .from('emails')
              .select(`*, accounts (id, email_address, display_name)`)
              .eq('id', (payload.new as { id: string }).id)
              .single()

            if (data) {
              const updatedEmail = data as unknown as EmailItem
              setEmails((prev) =>
                prev.map((e) => (e.id === updatedEmail.id ? updatedEmail : e))
              )
            }
          } else if (payload.eventType === 'DELETE') {
            const oldId = (payload.old as { id?: string }).id
            if (oldId) {
              setEmails((prev) => prev.filter((e) => e.id !== oldId))
            }
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'drafts' },
        (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const draft = payload.new as { email_id?: string; status?: string }
            if (draft.email_id) {
              setEmails((prev) =>
                prev.map((e) => {
                  if (e.id === draft.email_id) {
                    return {
                      ...e,
                      status: draft.status === 'approved' ? 'approved' : e.status,
                    }
                  }
                  return e
                })
              )
            }
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

  // Filtered emails computation
  const filteredEmails = useMemo(() => {
    return emails.filter((email) => {
      // Account filter
      if (selectedAccountId !== 'all' && email.account_id !== selectedAccountId) {
        return false
      }

      // Role filter — matches if the selected role appears anywhere in routed_roles
      if (selectedRole !== 'all') {
        const roles = (email.routed_roles || []).map((r) => r.toLowerCase().trim())
        if (!roles.includes(selectedRole.toLowerCase())) {
          return false
        }
      }

      // Theme filter
      if (selectedTheme !== 'all') {
        const theme = (email.theme || '').toLowerCase().trim()
        if (theme !== selectedTheme.toLowerCase()) {
          return false
        }
      }

      // Urgency filter (with compatibility for routine / normal)
      if (selectedUrgency !== 'all') {
        const urgency = (email.urgency || '').toLowerCase().trim()
        if (selectedUrgency === 'routine' || selectedUrgency === 'normal') {
          if (urgency !== 'routine' && urgency !== 'normal') {
            return false
          }
        } else if (urgency !== selectedUrgency.toLowerCase()) {
          return false
        }
      }

      // Status filter
      if (selectedStatus !== 'all') {
        const stat = (email.status || '').toLowerCase().trim()
        if (stat !== selectedStatus.toLowerCase()) {
          return false
        }
      }

      // Search query across sender, email, subject, body, and account
      if (deferredSearchQuery.trim()) {
        const query = deferredSearchQuery.toLowerCase().trim()
        const matchSubject = (email.subject || '').toLowerCase().includes(query)
        const matchFrom = (email.from_name || '').toLowerCase().includes(query)
        const matchEmail = (email.from_address || '').toLowerCase().includes(query)
        const matchBody = (email.body_text || '').toLowerCase().includes(query)
        const matchAccount =
          (email.accounts?.email_address || '').toLowerCase().includes(query) ||
          (email.accounts?.display_name || '').toLowerCase().includes(query)

        if (!matchSubject && !matchFrom && !matchEmail && !matchBody && !matchAccount) {
          return false
        }
      }

      return true
    })
  }, [
    emails,
    selectedAccountId,
    selectedRole,
    selectedTheme,
    selectedUrgency,
    selectedStatus,
    deferredSearchQuery,
  ])

  // Count summaries
  const urgentCount = useMemo(() => {
    return emails.filter((e) => (e.urgency || '').toLowerCase().trim() === 'urgent').length
  }, [emails])

  const draftedCount = useMemo(() => {
    return emails.filter((e) => (e.status || '').toLowerCase().trim() === 'drafted').length
  }, [emails])

  const activeFilterCount = useMemo(() => {
    let count = 0
    if (selectedAccountId !== 'all') count++
    if (selectedRole !== 'all') count++
    if (selectedTheme !== 'all') count++
    if (selectedUrgency !== 'all') count++
    if (selectedStatus !== 'all') count++
    return count
  }, [selectedAccountId, selectedRole, selectedTheme, selectedUrgency, selectedStatus])

  const hasActiveFilters = activeFilterCount > 0 || searchQuery.trim().length > 0

  const resetFilters = () => {
    setSelectedAccountId('all')
    setSelectedRole('all')
    setSelectedTheme('all')
    setSelectedUrgency('all')
    setSelectedStatus('all')
    setSearchQuery('')
  }

  return (
    <div className="space-y-4">
      {/* Top Filter Container with Tabs and Filter Bar */}
      <div className="bg-[var(--surface)] rounded-xl border border-[var(--border-subtle)] p-3.5 sm:p-5 shadow-xs space-y-3.5">
        {/* Monitored Inboxes Navigation Tabs & Realtime Metrics */}
        <InboxTabs
          accounts={accounts}
          emails={emails}
          selectedAccountId={selectedAccountId}
          onSelectAccount={setSelectedAccountId}
          isRealtimeLive={isRealtimeLive}
          urgentCount={urgentCount}
          draftedCount={draftedCount}
        />

        {/* Integrated Filter & Search Bar */}
        <InboxFilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedRole={selectedRole}
          onSelectRole={setSelectedRole}
          selectedTheme={selectedTheme}
          onSelectTheme={setSelectedTheme}
          selectedUrgency={selectedUrgency}
          onSelectUrgency={setSelectedUrgency}
          selectedStatus={selectedStatus}
          onSelectStatus={setSelectedStatus}
          activeFilterCount={activeFilterCount}
          hasActiveFilters={hasActiveFilters}
          onResetFilters={resetFilters}
          accounts={accounts}
          selectedAccountId={selectedAccountId}
          onSelectAccount={setSelectedAccountId}
          totalEmailsCount={emails.length}
        />
      </div>

      {/* Feed Section Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">
            Inbox feed · {filteredEmails.length} {filteredEmails.length === 1 ? 'email' : 'emails'}
          </h2>
          {urgentCount > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-[var(--urgency-urgent-bg)] text-[var(--urgency-urgent)] border border-[var(--urgency-urgent-border)]">
              <AlertTriangle className="w-3 h-3" />
              {urgentCount} Urgent
            </span>
          )}
        </div>
        <span className="text-xs text-[var(--text-tertiary)] hidden sm:inline">
          Sorted by received time
        </span>
      </div>

      {/* Email Cards Feed or Empty State */}
      {filteredEmails.length === 0 ? (
        <InboxEmptyState
          hasActiveFilters={hasActiveFilters}
          onResetFilters={resetFilters}
        />
      ) : (
        <div className="space-y-2.5">
          {filteredEmails.map((email) => (
            <InboxListItem key={email.id} email={email} />
          ))}
        </div>
      )}
    </div>
  )
}
