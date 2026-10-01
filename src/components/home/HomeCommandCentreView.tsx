'use client'

import * as React from 'react'
import { useState, useMemo, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  CommandCentreHeader,
  OperationalMetricsGrid,
  NeedsAttentionFeed,
  AwaitingReviewCard,
  RecentActivityFeed,
} from './index'
import type {
  EmailRecord,
  DraftRecord,
  AuditRecord,
  HomeCommandCentreViewProps,
  CommandCentreMetrics,
  NeedsAttentionItem,
} from './types'

export function HomeCommandCentreView({
  initialEmails,
  accounts,
  initialPendingDrafts,
  initialRecentAudit,
  userEmail,
}: HomeCommandCentreViewProps) {
  // 1. Reactive state with React 19 recommended sync pattern (no setState in useEffect)
  const [emails, setEmails] = useState<EmailRecord[]>(initialEmails)
  const [prevInitialEmails, setPrevInitialEmails] = useState<EmailRecord[]>(initialEmails)
  if (initialEmails !== prevInitialEmails) {
    setPrevInitialEmails(initialEmails)
    setEmails(initialEmails)
  }

  const [pendingDrafts, setPendingDrafts] = useState<DraftRecord[]>(initialPendingDrafts)
  const [prevPendingDrafts, setPrevPendingDrafts] = useState<DraftRecord[]>(initialPendingDrafts)
  if (initialPendingDrafts !== prevPendingDrafts) {
    setPrevPendingDrafts(initialPendingDrafts)
    setPendingDrafts(initialPendingDrafts)
  }

  const [recentAudit, setRecentAudit] = useState<AuditRecord[]>(initialRecentAudit)
  const [prevRecentAudit, setPrevRecentAudit] = useState<AuditRecord[]>(initialRecentAudit)
  if (initialRecentAudit !== prevRecentAudit) {
    setPrevRecentAudit(initialRecentAudit)
    setRecentAudit(initialRecentAudit)
  }

  const [isRealtimeLive, setIsRealtimeLive] = useState<boolean>(false)

  // 2. Real-time Supabase WebSocket subscription
  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel('foreman-home-command-centre-realtime')
      // A. Emails subscription
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'emails' },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            const { data } = await supabase
              .from('emails')
              .select('*, accounts (id, email_address, display_name)')
              .eq('id', (payload.new as { id: string }).id)
              .single()

            if (data) {
              const newEmail = data as unknown as EmailRecord
              setEmails((prev) => [newEmail, ...prev.filter((e) => e.id !== newEmail.id)])
            }
          } else if (payload.eventType === 'UPDATE') {
            const { data } = await supabase
              .from('emails')
              .select('*, accounts (id, email_address, display_name)')
              .eq('id', (payload.new as { id: string }).id)
              .single()

            if (data) {
              const updated = data as unknown as EmailRecord
              setEmails((prev) => prev.map((e) => (e.id === updated.id ? updated : e)))
            }
          } else if (payload.eventType === 'DELETE') {
            const oldId = (payload.old as { id?: string }).id
            if (oldId) {
              setEmails((prev) => prev.filter((e) => e.id !== oldId))
            }
          }
        }
      )
      // B. Drafts subscription
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'drafts' },
        (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const updated = payload.new as unknown as DraftRecord
            if ((updated.status || '').toLowerCase() === 'pending') {
              setPendingDrafts((prev) => [
                updated,
                ...prev.filter((d) => d.id !== updated.id),
              ])
            } else {
              setPendingDrafts((prev) => prev.filter((d) => d.id !== updated.id))
            }
          } else if (payload.eventType === 'DELETE') {
            const oldId = (payload.old as { id?: string }).id
            if (oldId) {
              setPendingDrafts((prev) => prev.filter((d) => d.id !== oldId))
            }
          }
        }
      )
      // C. Audit Log subscription
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'audit_log' },
        async (payload) => {
          const newRow = payload.new as unknown as { id: string }
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
            setRecentAudit((prev) => [enriched as unknown as AuditRecord, ...prev.slice(0, 7)])
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

  // 3. Computed High-Impact Operational Metrics
  const metrics: CommandCentreMetrics = useMemo(() => {
    const unhandledEmails = emails.filter((e) => {
      const s = (e.status || '').toLowerCase()
      return s !== 'sent' && s !== 'discarded'
    })

    const urgentCount = unhandledEmails.filter(
      (e) => (e.urgency || '').toLowerCase().trim() === 'urgent'
    ).length

    const priorityCount = unhandledEmails.filter(
      (e) => (e.urgency || '').toLowerCase().trim() === 'priority'
    ).length

    const pendingReviewCount = pendingDrafts.filter(
      (d) => (d.status || '').toLowerCase() === 'pending'
    ).length

    const activeInboxesCount = accounts.length

    // Today's dispatch count from audit or sent status
    const startOfToday = new Date()
    startOfToday.setHours(0, 0, 0, 0)
    const dispatchedTodayCount = emails.filter((e) => {
      if ((e.status || '').toLowerCase() !== 'sent') return false
      try {
        return new Date(e.received_at) >= startOfToday
      } catch {
        return false
      }
    }).length

    return {
      urgentCount,
      pendingReviewCount,
      priorityCount,
      activeInboxesCount,
      totalEmailsCount: emails.length,
      dispatchedTodayCount,
    }
  }, [emails, pendingDrafts, accounts])

  // 4. Prioritized "Needs Attention" Queue (Ordered by operational risk & age)
  const needsAttentionItems: NeedsAttentionItem[] = useMemo(() => {
    // eslint-disable-next-line react-hooks/purity
    const now = Date.now()
    const draftEmailMap = new Map<string, DraftRecord>()
    for (const d of pendingDrafts) {
      if (d.email_id && (d.status || '').toLowerCase() === 'pending') {
        draftEmailMap.set(d.email_id, d)
      }
    }

    const items: NeedsAttentionItem[] = []

    for (const email of emails) {
      const stat = (email.status || '').toLowerCase()
      // Skip completed / closed communications
      if (stat === 'sent' || stat === 'discarded') continue

      const urg = (email.urgency || '').toLowerCase().trim()
      const draft = draftEmailMap.get(email.id) || null
      const isUrgent = urg === 'urgent'
      const isPriority = urg === 'priority'

      // Surfaced if urgent, priority, or has a draft awaiting sign-off
      if (isUrgent || isPriority || draft) {
        let isAging = false
        if (email.received_at) {
          try {
            const receivedTime = new Date(email.received_at).getTime()
            // Mark as aging if older than 2 hours without resolution
            isAging = now - receivedTime > 2 * 60 * 60 * 1000
          } catch {
            isAging = false
          }
        }

        items.push({
          email,
          pendingDraft: draft,
          isAging,
        })
      }
    }

    // Sort by risk priority:
    // 1. Urgent items first
    // 2. Items with pending draft awaiting human sign-off
    // 3. Priority items
    // 4. Age (older items surfaced before newer items in the same tier)
    return items.sort((a, b) => {
      const aUrgent = (a.email.urgency || '').toLowerCase() === 'urgent' ? 1 : 0
      const bUrgent = (b.email.urgency || '').toLowerCase() === 'urgent' ? 1 : 0
      if (aUrgent !== bUrgent) return bUrgent - aUrgent

      const aHasDraft = a.pendingDraft ? 1 : 0
      const bHasDraft = b.pendingDraft ? 1 : 0
      if (aHasDraft !== bHasDraft) return bHasDraft - aHasDraft

      const aPriority = (a.email.urgency || '').toLowerCase() === 'priority' ? 1 : 0
      const bPriority = (b.email.urgency || '').toLowerCase() === 'priority' ? 1 : 0
      if (aPriority !== bPriority) return bPriority - aPriority

      // Older items first
      const timeA = new Date(a.email.received_at).getTime() || 0
      const timeB = new Date(b.email.received_at).getTime() || 0
      return timeA - timeB
    })
  }, [emails, pendingDrafts])

  return (
    <div className="space-y-6">
      {/* 1. Executive Context Header */}
      <CommandCentreHeader
        userEmail={userEmail}
        isRealtimeLive={isRealtimeLive}
        urgentCount={metrics.urgentCount}
        pendingReviewCount={metrics.pendingReviewCount}
      />

      {/* 2. Clickable Operational KPI Counters */}
      <OperationalMetricsGrid metrics={metrics} />

      {/* 3. Operational Main Section: Fast-Triage Feed + Right Action Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start">
        {/* Left / Primary Column (8 cols): Needs Attention Fast-Triage Queue */}
        <div className="lg:col-span-8">
          <NeedsAttentionFeed items={needsAttentionItems} />
        </div>

        {/* Right / Secondary Column (4 cols): Awaiting Review & Live Activity */}
        <div className="lg:col-span-4 space-y-6">
          <AwaitingReviewCard pendingDrafts={pendingDrafts} emails={emails} />
          <RecentActivityFeed activities={recentAudit} />
        </div>
      </div>
    </div>
  )
}
