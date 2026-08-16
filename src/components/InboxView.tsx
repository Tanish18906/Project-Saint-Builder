'use client'

import React, { useState, useMemo } from 'react'
import { CategoryBadge } from '@/components/CategoryBadge'
import { StatusBadge } from '@/components/StatusBadge'
import { Search, Filter, Mail, AlertTriangle, Clock, Building2, User, Inbox } from 'lucide-react'

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

const STATUSES = [
  { value: 'all', label: 'All Statuses' },
  { value: 'classified', label: 'Classified' },
  { value: 'drafted', label: 'Drafted' },
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
  const [selectedAccountId, setSelectedAccountId] = useState<string>('all')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')

  // Filtered emails computation
  const filteredEmails = useMemo(() => {
    return initialEmails.filter((email) => {
      // Account filter
      if (selectedAccountId !== 'all' && email.account_id !== selectedAccountId) {
        return false
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
  }, [initialEmails, selectedAccountId, selectedCategory, selectedStatus, searchQuery])

  // Count helper
  const urgentCount = useMemo(() => {
    return initialEmails.filter((e) => (e.category || '').toLowerCase() === 'urgent').length
  }, [initialEmails])

  return (
    <div className="space-y-6">
      {/* Top Filter Bar */}
      <div className="bg-white rounded-lg border border-[#e8e2d4] p-4 shadow-sm space-y-4">
        {/* Monitored Inbox Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-[#e8e2d4] pb-4">
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
            All Monitored Inboxes ({initialEmails.length})
          </button>

          {accounts.map((acc) => {
            const count = initialEmails.filter((e) => e.account_id === acc.id).length
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
                <Building2 className="w-3 h-3 opacity-70" />
                <span>{acc.display_name || acc.email_address}</span>
                <span className="opacity-60 text-[11px]">({count})</span>
              </button>
            )
          })}
        </div>

        {/* Secondary Filters: Search, Category, Status */}
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
              placeholder="Search by sender, subject, or content..."
              className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm border border-[#e8e2d4] rounded bg-white text-[#1c1a17] placeholder:text-[#6b6559]/50 focus:outline-none focus:ring-1 focus:ring-[#1c1a17]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-[#6b6559] hover:text-[#1c1a17]"
              >
                Clear
              </button>
            )}
          </div>

          {/* Category and Status Dropdowns */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-[#6b6559]">
              <Filter className="w-3.5 h-3.5" />
              <span>Category:</span>
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-2.5 py-1.5 text-xs border border-[#e8e2d4] rounded bg-white text-[#1c1a17] focus:outline-none focus:ring-1 focus:ring-[#1c1a17]"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>

            <div className="flex items-center gap-1.5 text-xs text-[#6b6559] ml-2">
              <span>Status:</span>
            </div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-2.5 py-1.5 text-xs border border-[#e8e2d4] rounded bg-white text-[#1c1a17] focus:outline-none focus:ring-1 focus:ring-[#1c1a17]"
            >
              {STATUSES.map((stat) => (
                <option key={stat.value} value={stat.value}>
                  {stat.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Results Header */}
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
          Sorted by Received Time (Newest first)
        </span>
      </div>

      {/* Email List Feed */}
      {filteredEmails.length === 0 ? (
        <div className="bg-white rounded-lg border border-[#e8e2d4] p-12 text-center shadow-sm">
          <div className="w-12 h-12 rounded-full bg-[#f5f1e8] flex items-center justify-center mx-auto mb-3 text-[#6b6559]">
            <Inbox className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-[#1c1a17]">No emails found</h3>
          <p className="text-xs text-[#6b6559] mt-1 max-w-sm mx-auto">
            {searchQuery || selectedCategory !== 'all' || selectedAccountId !== 'all' || selectedStatus !== 'all'
              ? 'Try adjusting your filters or search query to find what you are looking for.'
              : 'The monitored inboxes are currently empty.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredEmails.map((email) => {
            const isUrgent = (email.category || '').toLowerCase() === 'urgent'

            return (
              <div
                key={email.id}
                className={`bg-white rounded-lg border transition-all duration-150 p-4 shadow-sm hover:shadow hover:border-[#1c1a17]/30 ${
                  isUrgent
                    ? 'border-l-4 border-l-red-600 border-red-200 bg-red-50/10'
                    : 'border-[#e8e2d4]'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  {/* Sender & Account */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-sm text-[#1c1a17]">
                      {email.from_name || email.from_address}
                    </span>
                    {email.from_name && (
                      <span className="text-xs text-[#6b6559]">
                        &lt;{email.from_address}&gt;
                      </span>
                    )}
                    {email.accounts && (
                      <span className="text-[11px] px-2 py-0.5 rounded bg-[#f5f1e8] text-[#6b6559] border border-[#e8e2d4]">
                        {email.accounts.email_address}
                      </span>
                    )}
                  </div>

                  {/* Badges & Timestamp */}
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
                <h3 className="text-sm font-medium text-[#1c1a17] mb-1.5">
                  {email.subject || '(No Subject)'}
                </h3>

                {/* Body Preview snippet */}
                <p className="text-xs text-[#6b6559] line-clamp-2 leading-relaxed">
                  {email.body_text || '(No text content)'}
                </p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
