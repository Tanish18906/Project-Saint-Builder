'use client'

import React, { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { CategoryBadge } from '@/components/CategoryBadge'
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
  category: string | null
  routed_role: string | null
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

const CATEGORIES = [
  { value: 'all', label: 'All Categories' },
  { value: 'urgent', label: 'Urgent' },
  { value: 'priority', label: 'Priority' },
  { value: 'finance_accounts', label: 'Finance / Accounts' },
  { value: 'contracts', label: 'Contracts' },
  { value: 'nph_job_update', label: 'NPH Job Update' },
  { value: 'read_later', label: 'Read Later' },
  { value: 'other', label: 'Other' },
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

  const [selectedAccountId, setSelectedAccountId] = useState<string>('all')
  const [selectedRole, setSelectedRole] = useState<string>('all')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
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

      // Role filter
      if (selectedRole !== 'all') {
        const role = (email.routed_role || '').toLowerCase()
        if (role !== selectedRole.toLowerCase()) {
          return false
        }
      }

      // Category filter
      if (selectedCategory !== 'all') {
        const cat = (email.category || '').toLowerCase()
        if (cat !== selectedCategory.toLowerCase()) {
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
  }, [emails, selectedAccountId, selectedRole, selectedCategory, selectedStatus, searchQuery])

  // Count summaries
  const urgentCount = useMemo(() => {
    return emails.filter((e) => (e.category || '').toLowerCase() === 'urgent').length
  }, [emails])

  const draftedCount = useMemo(() => {
    return emails.filter((e) => (e.status || '').toLowerCase() === 'drafted').length
  }, [emails])

  const hasActiveFilters =
    selectedAccountId !== 'all' ||
    selectedRole !== 'all' ||
    selectedCategory !== 'all' ||
    selectedStatus !== 'all' ||
    searchQuery.trim().length > 0

  const resetFilters = () => {
    setSelectedAccountId('all')
    setSelectedRole('all')
    setSelectedCategory('all')
    setSelectedStatus('all')
    setSearchQuery('')
  }

  return (
    <div className="space-y-6">
      {/* Top Filter Container */}
      <div className="bg-white rounded-lg border border-[#e8e2d4] p-5 shadow-sm space-y-4">
        {/* Monitored Inbox Tabs & Live Status */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e8e2d4] pb-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#6b6559] mr-2">
              Inboxes:
            </span>
            <button
              onClick={() => setSelectedAccountId('all')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                selectedAccountId === 'all'
                  ? 'bg-[#1c1a17] text-[#f5f1e8]'
                  : 'bg-[#f5f1e8] text-[#1c1a17] hover:bg-[#e8e2d4]'
              }`}
            >
              All Monitored Inboxes ({emails.length})
            </button>

            {accounts.map((acc) => {
              const count = emails.filter((e) => e.account_id === acc.id).length
              return (
                <button
                  key={acc.id}
                  onClick={() => setSelectedAccountId(acc.id)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
                    selectedAccountId === acc.id
                      ? 'bg-[#1c1a17] text-[#f5f1e8]'
                      : 'bg-[#f5f1e8] text-[#1c1a17] hover:bg-[#e8e2d4]'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5 opacity-70" />
                  <span>{acc.display_name || acc.email_address}</span>
                  <span className="opacity-60 text-[11px]">({count})</span>
                </button>
              )
            })}
          </div>

          {/* Realtime Live Pulse & Quick Metrics */}
          <div className="flex items-center gap-2 text-xs">
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

            {urgentCount > 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-red-50 text-red-700 border border-red-200 font-semibold">
                <AlertTriangle className="w-3 h-3 text-red-600" />
                {urgentCount} Urgent
              </span>
            )}
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#f5f1e8] text-[#6b6559] border border-[#e8e2d4] font-medium hidden sm:inline-flex">
              <Mail className="w-3 h-3 text-[#6b6559]" />
              {draftedCount} Drafted
            </span>
          </div>
        </div>

        {/* Role Filters */}
        <div className="flex flex-wrap items-center gap-1.5 border-b border-[#e8e2d4] pb-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#6b6559] mr-2 flex items-center gap-1">
            <User className="w-3.5 h-3.5 opacity-60" />
            Role Queue:
          </span>
          {ROLES.map((r) => {
            const count =
              r.value === 'all'
                ? emails.length
                : emails.filter((e) => (e.routed_role || '').toLowerCase() === r.value).length

            return (
              <button
                key={r.value}
                onClick={() => setSelectedRole(r.value)}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                  selectedRole === r.value
                    ? 'bg-[#2a2723] text-[#f5f1e8]'
                    : 'bg-[#f5f1e8]/70 text-[#6b6559] hover:bg-[#e8e2d4] hover:text-[#1c1a17]'
                }`}
              >
                <span>{r.label}</span>
                <span className="opacity-60 ml-1 text-[11px]">({count})</span>
              </button>
            )
          })}
        </div>

        {/* Search, Category, Status Filters */}
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#6b6559]">
              <Search className="h-4 w-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search sender, subject, keywords..."
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

          {/* Category and Status Dropdowns */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 text-xs text-[#6b6559]">
              <Filter className="w-3.5 h-3.5" />
              <span>Category:</span>
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-2.5 py-1.5 text-xs border border-[#e8e2d4] rounded bg-white text-[#1c1a17] focus:outline-none focus:ring-1 focus:ring-[#1c1a17] cursor-pointer"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>

            <div className="flex items-center gap-1 text-xs text-[#6b6559] ml-2">
              <span>Status:</span>
            </div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-2.5 py-1.5 text-xs border border-[#e8e2d4] rounded bg-white text-[#1c1a17] focus:outline-none focus:ring-1 focus:ring-[#1c1a17] cursor-pointer"
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
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-[#6b6559] hover:text-[#1c1a17] bg-[#f5f1e8] hover:bg-[#e8e2d4] rounded transition-colors cursor-pointer ml-1"
                title="Reset all filters"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Feed Section Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[#1c1a17]">
            Inbox Feed ({filteredEmails.length})
          </h2>
          {urgentCount > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-red-100 text-red-700 border border-red-200">
              <AlertTriangle className="w-3 h-3" />
              {urgentCount} Urgent
            </span>
          )}
        </div>
        <span className="text-xs text-[#6b6559]">
          Sorted by Received Time (Newest First)
        </span>
      </div>

      {/* Email Cards Feed */}
      {filteredEmails.length === 0 ? (
        <div className="bg-white rounded-lg border border-[#e8e2d4] p-12 text-center shadow-sm">
          <div className="w-12 h-12 rounded-full bg-[#f5f1e8] flex items-center justify-center mx-auto mb-3 text-[#6b6559]">
            <Inbox className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-[#1c1a17]">No emails match current filters</h3>
          <p className="text-xs text-[#6b6559] mt-1 max-w-sm mx-auto">
            {hasActiveFilters
              ? 'Try resetting or broadening your filters to find the messages you are looking for.'
              : 'The inbox is currently empty.'}
          </p>
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="mt-4 px-3.5 py-1.5 bg-[#1c1a17] text-[#f5f1e8] text-xs font-medium rounded hover:bg-[#2a2723] transition-colors cursor-pointer"
            >
              Clear All Filters
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredEmails.map((email) => {
            const isUrgent = (email.category || '').toLowerCase() === 'urgent'

            return (
              <Link
                key={email.id}
                href={`/emails/${email.id}`}
                className={`block bg-white rounded-lg border transition-all duration-150 p-4 shadow-sm hover:shadow hover:border-[#1c1a17]/50 group cursor-pointer ${
                  isUrgent
                    ? 'border-l-4 border-l-red-600 border-red-200 bg-red-50/15'
                    : 'border-[#e8e2d4]'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  {/* Sender & Monitored Account */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-sm text-[#1c1a17] group-hover:text-black">
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
                  <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                    <CategoryBadge category={email.category} />
                    {email.routed_role && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-[#f5f1e8] text-[#1c1a17] border border-[#e8e2d4] capitalize">
                        <User className="w-2.5 h-2.5 opacity-60" />
                        {email.routed_role.replace(/_/g, ' ')}
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
                <h3 className="text-sm font-semibold text-[#1c1a17] mb-1.5 leading-snug">
                  {email.subject || '(No Subject)'}
                </h3>

                {/* Body Preview */}
                <p className="text-xs text-[#6b6559] line-clamp-2 leading-relaxed">
                  {email.body_text || '(No text content)'}
                </p>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
