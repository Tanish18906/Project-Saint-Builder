'use client'

import * as React from 'react'
import {
  Search,
  AlertTriangle,
  RotateCcw,
  X,
  Filter,
} from 'lucide-react'
import {
  APPROVAL_URGENCIES,
  APPROVAL_THEMES,
  type ApprovalsAccountItem,
} from './types'

export interface ApprovalsFilterBarProps {
  searchQuery: string
  onSearchChange: (value: string) => void
  selectedUrgency: string
  onSelectUrgency: (urgency: string) => void
  selectedTheme: string
  onSelectTheme: (theme: string) => void
  selectedAccountId: string
  onSelectAccount: (accountId: string) => void
  accounts: ApprovalsAccountItem[]
  hasActiveFilters: boolean
  onResetFilters: () => void
  isRealtimeLive: boolean
  urgentCount: number
}

export function ApprovalsFilterBar({
  searchQuery,
  onSearchChange,
  selectedUrgency,
  onSelectUrgency,
  selectedTheme,
  onSelectTheme,
  selectedAccountId,
  onSelectAccount,
  accounts,
  hasActiveFilters,
  onResetFilters,
  isRealtimeLive,
  urgentCount,
}: ApprovalsFilterBarProps) {
  return (
    <div className="space-y-3">
      {/* Top row: search + live pulse */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--text-tertiary)]">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search sender, subject, or draft text..."
            className="w-full pl-9 pr-9 py-2 text-xs border border-[var(--border-subtle)] rounded-lg bg-[var(--surface)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:border-transparent min-h-[38px] transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              aria-label="Clear search"
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Realtime Status Indicator & Urgent Counter */}
        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 text-xs">
          <div
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border select-none transition-colors ${
              isRealtimeLive
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-[var(--surface-subtle)] text-[var(--text-secondary)] border-[var(--border-subtle)]'
            }`}
            title={isRealtimeLive ? 'Live WebSocket connected to Supabase' : 'Connecting to Supabase Realtime...'}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                isRealtimeLive ? 'bg-emerald-500 animate-pulse' : 'bg-[var(--text-tertiary)]'
              }`}
            />
            <span>{isRealtimeLive ? 'Realtime live' : 'Connecting'}</span>
          </div>

          {urgentCount > 0 && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[var(--urgency-urgent-bg)] text-[var(--urgency-urgent)] border border-[var(--urgency-urgent-border)] text-[11px] font-semibold">
              <AlertTriangle className="w-3 h-3 text-[var(--urgency-urgent)]" />
              <span>{urgentCount} Urgent</span>
            </span>
          )}
        </div>
      </div>

      {/* Filter Selects Toolbar */}
      <div className="flex flex-wrap items-center gap-2 pt-1 pb-0.5 text-xs text-[var(--text-secondary)]">
        <span className="text-[11px] font-medium text-[var(--text-tertiary)] mr-1 flex items-center gap-1">
          <Filter className="w-3 h-3" />
          <span>Filter by:</span>
        </span>

        {/* Urgency */}
        <div className="relative">
          <select
            value={selectedUrgency}
            onChange={(e) => onSelectUrgency(e.target.value)}
            className="py-1.5 pl-2.5 pr-7 text-xs border border-[var(--border-subtle)] rounded-md bg-[var(--surface)] text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--brand)] cursor-pointer"
          >
            {APPROVAL_URGENCIES.map((u) => (
              <option key={u.value} value={u.value}>
                {u.label}
              </option>
            ))}
          </select>
        </div>

        {/* Theme */}
        <div className="relative">
          <select
            value={selectedTheme}
            onChange={(e) => onSelectTheme(e.target.value)}
            className="py-1.5 pl-2.5 pr-7 text-xs border border-[var(--border-subtle)] rounded-md bg-[var(--surface)] text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--brand)] cursor-pointer"
          >
            {APPROVAL_THEMES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        {/* Monitored Account */}
        {accounts.length > 0 && (
          <div className="relative">
            <select
              value={selectedAccountId}
              onChange={(e) => onSelectAccount(e.target.value)}
              className="py-1.5 pl-2.5 pr-7 text-xs border border-[var(--border-subtle)] rounded-md bg-[var(--surface)] text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--brand)] cursor-pointer max-w-[180px] truncate"
            >
              <option value="all">All Inboxes</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.display_name || acc.email_address}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Reset Filters */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="inline-flex items-center gap-1 px-2 py-1 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-[var(--surface-subtle)] hover:bg-[var(--surface-subtle)]/80 rounded transition-colors cursor-pointer ml-auto sm:ml-2"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset filters</span>
          </button>
        )}
      </div>
    </div>
  )
}
