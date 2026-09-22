'use client'

import React, { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ThemeBadge } from '@/components/ThemeBadge'
import { UrgencyBadge } from '@/components/UrgencyBadge'
import { StatusBadge } from '@/components/StatusBadge'
import {
  Search,
  Filter,
  AlertTriangle,
  Clock,
  Building2,
  User,
  Inbox,
  Mail,
  RotateCcw,
  Radio,
} from 'lucide-react'

export interface EmailItem {
  id: string
  account_id: string
  message_id: string
  thread_id: string | null
  from_address: string
  from_name: string | null
  subject: string | null
  body_text: string | null
  body_html: string | null
  received_at: string
  theme: string | null
  urgency: string | null
  routed_roles: string[] | null
  status: string
  created_at: string | null
  accounts?: {
    id?: string
    email_address: string
    display_name: string | null
  } | null
  drafts?: {
    id: string
    status: string
    draft_type: string
  }[] | null
}

export interface AccountItem {
  id: string
  email_address: string
  display_name: string | null
}

interface InboxViewProps {
  initialEmails: EmailItem[]
  accounts: AccountItem[]
}

const THEMES = [
  { value: 'all', label: 'All Themes' },
  { value: 'accounts', label: 'Accounts' },
  { value: 'orders', label: 'Orders' },
  { value: 'finance', label: 'Finance' },
  { value: 'suppliers', label: 'Suppliers' },
  { value: 'promotions', label: 'Promotions' },
  { value: 'nph_jobs', label: 'NPH Jobs' },
  { value: 'meetings_appointments', label: 'Meetings / Appointments' },
  { value: 'invoices', label: 'Invoices' },
  { value: 'certificates', label: 'Certificates' },
]

const URGENCIES = [
  { value: 'all', label: 'All Urgencies' },
  { value: 'urgent', label: 'Urgent' },
  { value: 'priority', label: 'Priority' },
  { value: 'normal', label: 'Normal' },
]

const ROLES = [
  { value: 'all', label: 'All Roles' },
  { value: 'director', label: 'Director' },
  { value: 'senior_admin', label: 'Senior Admin' },
  { value: 'progressor', label: 'Progressor' },
  { value: 'accountant', label: 'Accountant' },
]

const STATUSES = [
  { value: 'all', label: 'All Statuses' },
  { value: 'classified', label: 'Classified' },
  { value: 'drafted', label: 'Drafted' },
  { value: 'pending', label: 'Pending Review' },
  { value: 'approved', label: 'Approved' },
  { value: 'sent', label: 'Sent' },
  { value: 'discarded', label: 'Discarded' },
  { value: 'new', label: 'New' },
]

function formatRelativeTime(dateString: string): string {
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

export function InboxView({ initialEmails, accounts }: InboxViewProps) {
  const [emails, setEmails] = useState<EmailItem[]>(initialEmails)
  const [isRealtimeLive, setIsRealtimeLive] = useState<boolean>(false)
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState<boolean>(false)

  const [selectedAccountId, setSelectedAccountId] = useState<string>('all')
  const [selectedRole, setSelectedRole] = useState<string>('all')
  const [selectedTheme, setSelectedTheme] = useState<string>('all')
  const [selectedUrgency, setSelectedUrgency] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')

  // Sync state if initial server props change
  useEffect(() => {
    setEmails(initialEmails)
  }, [initialEmails])

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
              .eq('id', payload.new.id)
              .single()

            if (data) {
              setEmails((prev) => [data as any, ...prev.filter((e) => e.id !== data.id)])
            }
          } else if (payload.eventType === 'UPDATE') {
            const { data } = await supabase
              .from('emails')
              .select(`*, accounts (id, email_address, display_name)`)
              .eq('id', payload.new.id)
              .single()

            if (data) {
              setEmails((prev) => prev.map((e) => (e.id === data.id ? (data as any) : e)))
            }
          } else if (payload.eventType === 'DELETE') {
            setEmails((prev) => prev.filter((e) => e.id !== payload.old.id))
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'drafts' },
        (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const draft = payload.new as any
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
        const roles = (email.routed_roles || []).map((r) => r.toLowerCase())
        if (!roles.includes(selectedRole.toLowerCase())) {
          return false
        }
      }

      // Theme filter
      if (selectedTheme !== 'all') {
        const theme = (email.theme || '').toLowerCase()
        if (theme !== selectedTheme.toLowerCase()) {
          return false
        }
      }

      // Urgency filter
      if (selectedUrgency !== 'all') {
        const urgency = (email.urgency || '').toLowerCase()
        if (urgency !== selectedUrgency.toLowerCase()) {
          return false
        }
      }

      // Status filter
      if (selectedStatus !== 'all') {
        const stat = (email.status || '').toLowerCase()
        if (stat !== selectedStatus.toLowerCase()) {
          return false
        }
      }

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim()
        const matchSubject = (email.subject || '').toLowerCase().includes(query)
        const matchFrom = (email.from_name || '').toLowerCase().includes(query)
        const matchEmail = (email.from_address || '').toLowerCase().includes(query)
        const matchBody = (email.body_text || '').toLowerCase().includes(query)

        if (!matchSubject && !matchFrom && !matchEmail && !matchBody) {
          return false
        }
      }

      return true
    })
  }, [emails, selectedAccountId, selectedRole, selectedTheme, selectedUrgency, selectedStatus, searchQuery])

  // Count summaries
  const urgentCount = useMemo(() => {
    return emails.filter((e) => (e.urgency || '').toLowerCase() === 'urgent').length
  }, [emails])

  const draftedCount = useMemo(() => {
    return emails.filter((e) => (e.status || '').toLowerCase() === 'drafted').length
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
      {/* Top Filter Container */}
      <div className="bg-white rounded-lg border border-[#e8e2d4] p-3 sm:p-4 shadow-sm space-y-3">
        {/* Mobile Search & Filter Trigger Bar (Visible only on < md) */}
        <div className="flex md:hidden items-center gap-2">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#6b6559]">
              <Search className="h-4 w-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search sender, subject..."
              className="w-full pl-9 pr-8 py-2 text-xs border border-[#e8e2d4] rounded bg-white text-[#1c1a17] placeholder:text-[#6b6559]/50 focus:outline-none focus:ring-1 focus:ring-[#1c1a17] min-h-[44px]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm text-[#6b6559] hover:text-[#1c1a17] cursor-pointer min-h-[44px]"
              >
                ×
              </button>
            )}
          </div>

          <button
            onClick={() => setIsMobileFilterOpen(true)}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded border transition-colors cursor-pointer min-h-[44px] shrink-0 ${
              activeFilterCount > 0
                ? 'bg-[#1c1a17] text-[#f5f1e8] border-[#1c1a17]'
                : 'bg-[#f5f1e8] text-[#1c1a17] border-[#e8e2d4] hover:bg-[#e8e2d4]'
            }`}
          >
            <Filter className="w-4 h-4" />
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-[#f5f1e8] text-[#1c1a17] font-semibold text-[10px] flex items-center justify-center ml-0.5">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* Desktop Monitored Inbox Tabs & Live Status (Visible only on md+) */}
        <div className="hidden md:flex flex-wrap items-center justify-between gap-3 border-b border-[#e8e2d4] pb-2.5">
          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            <button
              onClick={() => setSelectedAccountId('all')}
              className={`text-xs font-medium transition-colors cursor-pointer py-1.5 border-b-2 ${
                selectedAccountId === 'all'
                  ? 'border-[#1c1a17] text-[#1c1a17] font-semibold'
                  : 'border-transparent text-[#6b6559] hover:text-[#1c1a17]'
              }`}
            >
              All monitored inboxes <span className="opacity-70 text-[11px]">({emails.length})</span>
            </button>

            {accounts.map((acc) => {
              const count = emails.filter((e) => e.account_id === acc.id).length
              return (
                <button
                  key={acc.id}
                  onClick={() => setSelectedAccountId(acc.id)}
                  className={`text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer py-1.5 border-b-2 ${
                    selectedAccountId === acc.id
                      ? 'border-[#1c1a17] text-[#1c1a17] font-semibold'
                      : 'border-transparent text-[#6b6559] hover:text-[#1c1a17]'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5 opacity-60" />
                  <span>{acc.display_name || acc.email_address}</span>
                  <span className="opacity-70 text-[11px]">({count})</span>
                </button>
              )
            })}
          </div>

          {/* Realtime Live Pulse & Quick Metrics */}
          <div className="flex items-center gap-2 text-xs">
            <div
              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded border font-medium text-[11px] ${
                isRealtimeLive
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-[#f5f1e8] text-[#6b6559] border-[#e8e2d4]'
              }`}
              title={isRealtimeLive ? 'Live WebSocket connected to Supabase' : 'Connecting to Supabase Realtime...'}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isRealtimeLive ? 'bg-emerald-500 animate-pulse' : 'bg-[#6b6559]'
                }`}
              />
              <span>{isRealtimeLive ? 'Realtime live' : 'Connecting'}</span>
            </div>

            {urgentCount > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#fef2f2] text-[#b91c1c] border border-[#fecaca] font-semibold text-[11px]">
                <AlertTriangle className="w-3 h-3" />
                {urgentCount} Urgent
              </span>
            )}
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#f5f1e8] text-[#6b6559] border border-[#e8e2d4] font-medium text-[11px] hidden sm:inline-flex">
              <Mail className="w-3 h-3 text-[#6b6559]" />
              {draftedCount} Drafted
            </span>
          </div>
        </div>

        {/* Desktop Search & Consolidated Filter Dropdowns (Visible only on md+) */}
        <div className="hidden md:flex flex-col md:flex-row gap-2.5 items-stretch md:items-center justify-between">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#6b6559]">
              <Search className="h-3.5 w-3.5" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search sender, subject, keywords..."
              className="w-full pl-8 pr-8 py-1.5 text-xs border border-[#e8e2d4] rounded bg-white text-[#1c1a17] placeholder:text-[#6b6559]/50 focus:outline-none focus:ring-1 focus:ring-[#1c1a17]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-xs text-[#6b6559] hover:text-[#1c1a17] cursor-pointer"
              >
                ×
              </button>
            )}
          </div>

          {/* Consolidated Dropdown Group */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Role Dropdown */}
            <div className="flex items-center gap-1 text-xs text-[#6b6559]">
              <User className="w-3.5 h-3.5 opacity-60" />
              <span>Role:</span>
            </div>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="px-2 py-1 text-xs border border-[#e8e2d4] rounded bg-white text-[#1c1a17] focus:outline-none focus:ring-1 focus:ring-[#1c1a17] cursor-pointer"
            >
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>

            {/* Theme Dropdown */}
            <div className="flex items-center gap-1 text-xs text-[#6b6559] ml-1">
              <Filter className="w-3.5 h-3.5 opacity-60" />
              <span>Theme:</span>
            </div>
            <select
              value={selectedTheme}
              onChange={(e) => setSelectedTheme(e.target.value)}
              className="px-2 py-1 text-xs border border-[#e8e2d4] rounded bg-white text-[#1c1a17] focus:outline-none focus:ring-1 focus:ring-[#1c1a17] cursor-pointer"
            >
              {THEMES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>

            {/* Urgency Dropdown */}
            <div className="flex items-center gap-1 text-xs text-[#6b6559] ml-1">
              <AlertTriangle className="w-3.5 h-3.5 opacity-60" />
              <span>Urgency:</span>
            </div>
            <select
              value={selectedUrgency}
              onChange={(e) => setSelectedUrgency(e.target.value)}
              className="px-2 py-1 text-xs border border-[#e8e2d4] rounded bg-white text-[#1c1a17] focus:outline-none focus:ring-1 focus:ring-[#1c1a17] cursor-pointer"
            >
              {URGENCIES.map((u) => (
                <option key={u.value} value={u.value}>
                  {u.label}
                </option>
              ))}
            </select>

            {/* Status Dropdown */}
            <div className="flex items-center gap-1 text-xs text-[#6b6559] ml-1">
              <span>Status:</span>
            </div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-2 py-1 text-xs border border-[#e8e2d4] rounded bg-white text-[#1c1a17] focus:outline-none focus:ring-1 focus:ring-[#1c1a17] cursor-pointer"
            >
              {STATUSES.map((stat) => (
                <option key={stat.value} value={stat.value}>
                  {stat.label}
                </option>
              ))}
            </select>

            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-[#6b6559] hover:text-[#1c1a17] bg-[#f5f1e8] hover:bg-[#e8e2d4] rounded transition-colors cursor-pointer ml-1"
                title="Reset all filters"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filter Bottom Sheet Modal */}
      {isMobileFilterOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 transition-opacity"
            onClick={() => setIsMobileFilterOpen(false)}
          />

          {/* Bottom Sheet Card */}
          <div className="fixed inset-x-0 bottom-0 bg-white rounded-t-xl border-t border-[#e8e2d4] p-5 space-y-4 max-h-[85vh] overflow-y-auto shadow-2xl z-50 animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between border-b border-[#e8e2d4] pb-3">
              <h3 className="text-sm font-bold text-[#1c1a17]">Filter inbox</h3>
              <button
                onClick={() => setIsMobileFilterOpen(false)}
                className="p-1.5 text-xs text-[#6b6559] hover:text-[#1c1a17] min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Account Selector */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[#1c1a17]">
                Monitored inbox
              </label>
              <select
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                className="w-full p-2.5 text-xs border border-[#e8e2d4] rounded bg-white text-[#1c1a17] min-h-[44px]"
              >
                <option value="all">All monitored inboxes ({emails.length})</option>
                {accounts.map((acc) => {
                  const count = emails.filter((e) => e.account_id === acc.id).length
                  return (
                    <option key={acc.id} value={acc.id}>
                      {acc.display_name || acc.email_address} ({count})
                    </option>
                  )
                })}
              </select>
            </div>

            {/* Role Selector */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[#1c1a17]">
                Role queue
              </label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full p-2.5 text-xs border border-[#e8e2d4] rounded bg-white text-[#1c1a17] min-h-[44px]"
              >
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Theme Selector */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[#1c1a17]">
                Theme
              </label>
              <select
                value={selectedTheme}
                onChange={(e) => setSelectedTheme(e.target.value)}
                className="w-full p-2.5 text-xs border border-[#e8e2d4] rounded bg-white text-[#1c1a17] min-h-[44px]"
              >
                {THEMES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Urgency Selector */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[#1c1a17]">
                Urgency
              </label>
              <select
                value={selectedUrgency}
                onChange={(e) => setSelectedUrgency(e.target.value)}
                className="w-full p-2.5 text-xs border border-[#e8e2d4] rounded bg-white text-[#1c1a17] min-h-[44px]"
              >
                {URGENCIES.map((u) => (
                  <option key={u.value} value={u.value}>
                    {u.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Selector */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[#1c1a17]">
                Status
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full p-2.5 text-xs border border-[#e8e2d4] rounded bg-white text-[#1c1a17] min-h-[44px]"
              >
                {STATUSES.map((stat) => (
                  <option key={stat.value} value={stat.value}>
                    {stat.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center gap-2 pt-2 border-t border-[#e8e2d4]">
              {hasActiveFilters && (
                <button
                  onClick={() => {
                    resetFilters()
                    setIsMobileFilterOpen(false)
                  }}
                  className="flex-1 py-2.5 px-3 text-xs font-medium text-[#6b6559] bg-[#f5f1e8] hover:bg-[#e8e2d4] rounded transition-colors min-h-[44px]"
                >
                  Reset filters
                </button>
              )}
              <button
                onClick={() => setIsMobileFilterOpen(false)}
                className="flex-1 py-2.5 px-3 text-xs font-semibold text-[#f5f1e8] bg-[#1c1a17] hover:bg-[#2a2723] rounded transition-colors min-h-[44px]"
              >
                Apply filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Feed Section Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-[#1c1a17]">
            Inbox feed · {filteredEmails.length} {filteredEmails.length === 1 ? 'email' : 'emails'}
          </h2>
          {urgentCount > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-[#fef2f2] text-[#b91c1c] border border-[#fecaca]">
              <AlertTriangle className="w-3 h-3" />
              {urgentCount} Urgent
            </span>
          )}
        </div>
        <span className="text-xs text-[#6b6559]">
          Sorted by received time
        </span>
      </div>

      {/* Email Cards Feed */}
      {filteredEmails.length === 0 ? (
        <div className="bg-white rounded-lg border border-[#e8e2d4] p-8 text-center shadow-sm">
          <Inbox className="w-5 h-5 mx-auto text-[#6b6559] opacity-60 mb-2" />
          <h3 className="text-xs font-medium text-[#1c1a17]">No emails match current filters</h3>
          <p className="text-[11px] text-[#6b6559] mt-0.5 max-w-xs mx-auto">
            {hasActiveFilters
              ? 'Try resetting your filters or adjusting your search query.'
              : 'The inbox is currently empty.'}
          </p>
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="mt-3 px-3 py-1 bg-[#1c1a17] hover:bg-[#2a2723] text-[#f5f1e8] text-xs font-medium rounded transition-colors cursor-pointer"
            >
              Reset filters
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredEmails.map((email) => {
            const urgency = (email.urgency || '').toLowerCase()
            const isUrgent = urgency === 'urgent'
            const isPriority = urgency === 'priority'

            return (
              <Link
                key={email.id}
                href={`/emails/${email.id}`}
                className={`block bg-white rounded-lg border transition-all duration-150 p-3.5 sm:p-4 shadow-sm hover:shadow hover:border-[#1c1a17]/50 group cursor-pointer ${
                  isUrgent
                    ? 'border-l-4 border-l-[#b91c1c] border-[#e8e2d4] bg-[#fef2f2]/30'
                    : isPriority
                    ? 'border-l-4 border-l-[#c2560c] border-[#e8e2d4] bg-[#fff7ed]/30'
                    : 'border-[#e8e2d4]'
                }`}
              >
                {/* Mobile View: Subject first, then sender & timestamp, then badges (Clean stacked format) */}
                <div className="sm:hidden space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-semibold text-[#1c1a17] leading-snug">
                      {email.subject || '(No Subject)'}
                    </h3>
                    <span
                      title={new Date(email.received_at).toLocaleString('en-GB')}
                      className="text-[11px] text-[#6b6559] shrink-0 pt-0.5"
                    >
                      {formatRelativeTime(email.received_at)}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 text-xs text-[#6b6559]">
                    <span className="font-medium text-[#1c1a17]">
                      {email.from_name || email.from_address}
                    </span>
                    {email.accounts && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#f5f1e8] text-[#6b6559] border border-[#e8e2d4] font-mono">
                        {email.accounts.email_address}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                    <ThemeBadge theme={email.theme} />
                    <UrgencyBadge urgency={email.urgency} />
                    {email.routed_roles && email.routed_roles.length > 0 && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-[#f5f1e8] text-[#1c1a17] border border-[#e8e2d4] capitalize">
                        <User className="w-2.5 h-2.5 opacity-60" />
                        {email.routed_roles.map((r) => r.replace(/_/g, ' ')).join(', ')}
                      </span>
                    )}
                    <StatusBadge status={email.status} />
                  </div>

                  <p className="text-xs text-[#6b6559] line-clamp-2 leading-relaxed pt-0.5">
                    {email.body_text || '(No text content)'}
                  </p>
                </div>

                {/* Desktop/Tablet View (sm+): Horizontal alignment with high scanning density */}
                <div className="hidden sm:block">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    {/* Sender & Monitored Account */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-normal text-sm text-[#1c1a17]">
                        {email.from_name || email.from_address}
                      </span>
                      {email.from_name && (
                        <span className="text-xs text-[#6b6559]">
                          &lt;{email.from_address}&gt;
                        </span>
                      )}
                      {email.accounts && (
                        <span className="text-[11px] px-2 py-0.5 rounded bg-[#f5f1e8] text-[#6b6559] border border-[#e8e2d4] font-mono">
                          {email.accounts.email_address}
                        </span>
                      )}
                    </div>

                    {/* Badges & Relative Timestamp */}
                    <div className="flex items-center gap-2 shrink-0">
                      <ThemeBadge theme={email.theme} />
                      <UrgencyBadge urgency={email.urgency} />
                      {email.routed_roles && email.routed_roles.length > 0 && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-[#f5f1e8] text-[#1c1a17] border border-[#e8e2d4] capitalize">
                          <User className="w-2.5 h-2.5 opacity-60" />
                          {email.routed_roles.map((r) => r.replace(/_/g, ' ')).join(', ')}
                        </span>
                      )}
                      <StatusBadge status={email.status} />
                      <span
                        title={new Date(email.received_at).toLocaleString('en-GB')}
                        className="text-xs text-[#6b6559] flex items-center gap-1 pl-1"
                      >
                        <Clock className="w-3 h-3 opacity-60" />
                        {formatRelativeTime(email.received_at)}
                      </span>
                    </div>
                  </div>

                  {/* Subject Line */}
                  <h3 className="text-sm font-semibold text-[#1c1a17] mb-1 leading-snug">
                    {email.subject || '(No Subject)'}
                  </h3>

                  {/* Body Preview */}
                  <p className="text-xs text-[#6b6559] line-clamp-2 leading-relaxed">
                    {email.body_text || '(No text content)'}
                  </p>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
