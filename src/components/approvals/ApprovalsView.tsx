'use client'

import * as React from 'react'
import { useState, useMemo, useEffect } from 'react'
import { CheckCircle2, AlertTriangle, Clock } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { ApprovalQueueCard } from './ApprovalQueueCard'
import { ApprovalsFilterBar } from './ApprovalsFilterBar'
import { ApprovalsEmptyState } from './ApprovalsEmptyState'
import {
  type ApprovalItem,
  type ApprovalsViewProps,
} from './types'

interface DraftRealtimePayload {
  id: string
  status: string
  draft_type?: string
  edited_text?: string | null
  ai_generated_text?: string | null
  created_at?: string | null
  updated_at?: string | null
}

interface EmailRealtimePayload {
  id: string
  status: string
  theme?: string | null
  urgency?: string | null
  subject?: string | null
}

export function ApprovalsView({ initialItems, accounts }: ApprovalsViewProps) {
  const [items, setItems] = useState<ApprovalItem[]>(initialItems)
  const [prevInitialItems, setPrevInitialItems] = useState<ApprovalItem[]>(initialItems)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedUrgency, setSelectedUrgency] = useState('all')
  const [selectedTheme, setSelectedTheme] = useState('all')
  const [selectedAccountId, setSelectedAccountId] = useState('all')
  const [isRealtimeLive, setIsRealtimeLive] = useState(false)

  // Adjust state during render when props change (React recommended pattern)
  if (initialItems !== prevInitialItems) {
    setPrevInitialItems(initialItems)
    setItems(initialItems)
  }

  // Supabase Realtime subscription for live queue updates
  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel('foreman-approvals-queue-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'drafts' },
        (payload) => {
          if (payload.eventType === 'UPDATE') {
            const updated = payload.new as unknown as DraftRealtimePayload
            // If draft is no longer pending, remove it from the pending queue
            if (updated.status !== 'pending') {
              setItems((prev) => prev.filter((item) => item.draft?.id !== updated.id))
            } else {
              setItems((prev) =>
                prev.map((item) => {
                  if (item.draft?.id === updated.id) {
                    return {
                      ...item,
                      draft: {
                        ...item.draft,
                        id: updated.id,
                        status: updated.status,
                        draft_type: updated.draft_type ?? item.draft?.draft_type ?? 'ai_generated',
                        edited_text: updated.edited_text ?? item.draft?.edited_text ?? null,
                        ai_generated_text: updated.ai_generated_text ?? item.draft?.ai_generated_text ?? null,
                        created_at: updated.created_at ?? item.draft?.created_at ?? null,
                        updated_at: updated.updated_at ?? item.draft?.updated_at ?? null,
                      },
                    }
                  }
                  return item
                })
              )
            }
          } else if (payload.eventType === 'DELETE') {
            const deleted = payload.old as unknown as { id: string }
            setItems((prev) => prev.filter((item) => item.draft?.id !== deleted.id))
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'emails' },
        (payload) => {
          if (payload.eventType === 'UPDATE') {
            const updated = payload.new as unknown as EmailRealtimePayload
            // If email is no longer drafted/pending, remove from queue
            if (updated.status === 'approved' || updated.status === 'sent' || updated.status === 'discarded') {
              setItems((prev) => prev.filter((item) => item.id !== updated.id))
            } else {
              setItems((prev) =>
                prev.map((item) => {
                  if (item.id === updated.id) {
                    return {
                      ...item,
                      ...updated,
                    }
                  }
                  return item
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

  // Urgent count across all pending items
  const urgentCount = useMemo(() => {
    return items.filter(
      (item) => (item.urgency || '').toLowerCase() === 'urgent'
    ).length
  }, [items])

  // Filter evaluation
  const hasActiveFilters =
    Boolean(searchQuery.trim()) ||
    selectedUrgency !== 'all' ||
    selectedTheme !== 'all' ||
    selectedAccountId !== 'all'

  const handleResetFilters = () => {
    setSearchQuery('')
    setSelectedUrgency('all')
    setSelectedTheme('all')
    setSelectedAccountId('all')
  }

  // Filtered and sorted items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // 1. Account filter
      if (selectedAccountId !== 'all' && item.account_id !== selectedAccountId) {
        return false
      }

      // 2. Urgency filter
      if (selectedUrgency !== 'all') {
        const itemUrg = (item.urgency || '').toLowerCase()
        if (itemUrg !== selectedUrgency.toLowerCase()) return false
      }

      // 3. Theme filter
      if (selectedTheme !== 'all') {
        const itemTheme = (item.theme || '').toLowerCase()
        if (itemTheme !== selectedTheme.toLowerCase()) return false
      }

      // 4. Text Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const matchSubject = (item.subject || '').toLowerCase().includes(q)
        const matchSender =
          (item.from_address || '').toLowerCase().includes(q) ||
          (item.from_name || '').toLowerCase().includes(q)
        const draftText = (item.draft?.edited_text || item.draft?.ai_generated_text || '').toLowerCase()
        const matchDraft = draftText.includes(q)

        if (!matchSubject && !matchSender && !matchDraft) return false
      }

      return true
    })
  }, [items, selectedAccountId, selectedUrgency, selectedTheme, searchQuery])

  return (
    <div className="space-y-6">
      {/* Header Summary Card */}
      <div className="bg-[var(--surface)] border border-[var(--border-subtle)] rounded-xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[var(--brand)]/10 text-[var(--brand)] flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-[var(--brand)]" />
              </div>
              <h1 className="text-lg sm:text-xl font-bold text-[var(--text-primary)]">
                Approvals Queue
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)]">
              Pending response drafts awaiting explicit human verification and send authorization.
            </p>
          </div>

          {/* Quick Metrics Badges */}
          <div className="flex items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[var(--surface-subtle)] border border-[var(--border-subtle)] text-[var(--text-primary)] font-medium">
              <Clock className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
              <span>{items.length} {items.length === 1 ? 'draft' : 'drafts'} pending</span>
            </span>

            {urgentCount > 0 && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[var(--urgency-urgent-bg)] border border-[var(--urgency-urgent-border)] text-[var(--urgency-urgent)] font-semibold">
                <AlertTriangle className="w-3.5 h-3.5 text-[var(--urgency-urgent)]" />
                <span>{urgentCount} urgent</span>
              </span>
            )}
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="pt-2 border-t border-[var(--border-subtle)]">
          <ApprovalsFilterBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedUrgency={selectedUrgency}
            onSelectUrgency={setSelectedUrgency}
            selectedTheme={selectedTheme}
            onSelectTheme={setSelectedTheme}
            selectedAccountId={selectedAccountId}
            onSelectAccount={setSelectedAccountId}
            accounts={accounts}
            hasActiveFilters={hasActiveFilters}
            onResetFilters={handleResetFilters}
            isRealtimeLive={isRealtimeLive}
            urgentCount={urgentCount}
          />
        </div>
      </div>

      {/* Queue Items Feed */}
      {filteredItems.length === 0 ? (
        <ApprovalsEmptyState
          hasFilters={hasActiveFilters}
          onResetFilters={handleResetFilters}
        />
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-[var(--text-secondary)] px-1">
            <span className="font-semibold text-[var(--text-primary)]">
              Showing {filteredItems.length} {filteredItems.length === 1 ? 'approval request' : 'approval requests'}
            </span>
            <span className="text-[11px] text-[var(--text-tertiary)]">
              Sorted by received date (urgency prioritized)
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3.5">
            {filteredItems.map((item) => (
              <ApprovalQueueCard key={item.id} item={item} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
