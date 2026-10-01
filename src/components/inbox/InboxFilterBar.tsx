'use client'

import * as React from 'react'
import {
  Search,
  Filter,
  User,
  Tag,
  AlertTriangle,
  CheckCircle2,
  RotateCcw,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui'
import { ROLES, THEMES, URGENCIES, STATUSES } from './types'
import type { AccountItem } from './types'

interface InboxFilterBarProps {
  searchQuery: string
  onSearchChange: (value: string) => void
  selectedRole: string
  onSelectRole: (role: string) => void
  selectedTheme: string
  onSelectTheme: (theme: string) => void
  selectedUrgency: string
  onSelectUrgency: (urgency: string) => void
  selectedStatus: string
  onSelectStatus: (status: string) => void
  activeFilterCount: number
  hasActiveFilters: boolean
  onResetFilters: () => void
  accounts: AccountItem[]
  selectedAccountId: string
  onSelectAccount: (accountId: string) => void
  totalEmailsCount: number
}

export function InboxFilterBar({
  searchQuery,
  onSearchChange,
  selectedRole,
  onSelectRole,
  selectedTheme,
  onSelectTheme,
  selectedUrgency,
  onSelectUrgency,
  selectedStatus,
  onSelectStatus,
  activeFilterCount,
  hasActiveFilters,
  onResetFilters,
  accounts,
  selectedAccountId,
  onSelectAccount,
  totalEmailsCount,
}: InboxFilterBarProps) {
  const [isMobileModalOpen, setIsMobileModalOpen] = React.useState(false)

  // Handle escape key to close mobile bottom sheet
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileModalOpen) {
        setIsMobileModalOpen(false)
      }
    }
    if (isMobileModalOpen) {
      document.body.style.overflow = 'hidden'
      window.addEventListener('keydown', handleKeyDown)
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isMobileModalOpen])

  return (
    <div>
      {/* Mobile Search & Filter Trigger Bar (< lg) */}
      <div className="flex lg:hidden items-center gap-2">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--text-secondary)]">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search sender, subject, keywords..."
            className="w-full pl-9 pr-9 py-2.5 text-xs border border-[var(--border-subtle)] rounded-lg bg-[var(--surface)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:border-transparent min-h-[44px] transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              aria-label="Clear search"
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] min-h-[44px] min-w-[36px] justify-center cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => setIsMobileModalOpen(true)}
          className={`flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold rounded-lg border transition-colors cursor-pointer min-h-[44px] shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] ${
            activeFilterCount > 0
              ? 'bg-[var(--brand)] text-white border-[var(--brand)]'
              : 'bg-[var(--surface)] text-[var(--text-primary)] border-[var(--border-subtle)] hover:bg-[var(--surface-subtle)]'
          }`}
        >
          <Filter className="w-4 h-4" />
          <span>Filters</span>
          {activeFilterCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-white text-[var(--brand)] font-bold text-[10px] flex items-center justify-center ml-0.5">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Desktop Integrated Search & Filter Controls (>= lg) */}
      <div className="hidden lg:flex flex-wrap items-center justify-between gap-3">
        {/* Search Input Box */}
        <div className="relative flex-1 min-w-[260px] max-w-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--text-secondary)]">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search sender, subject, keywords..."
            className="w-full pl-9 pr-9 py-2 text-xs border border-[var(--border-subtle)] rounded-lg bg-[var(--surface)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] hover:border-[var(--border-strong)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:border-transparent h-9 transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              aria-label="Clear search"
              className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Dropdowns Cluster */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Role Dropdown */}
          <div className="relative flex items-center">
            <select
              aria-label="Filter by role queue"
              value={selectedRole}
              onChange={(e) => onSelectRole(e.target.value)}
              className={`h-9 pl-7 pr-2.5 text-xs font-medium rounded-lg border bg-[var(--surface)] transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:border-transparent ${
                selectedRole !== 'all'
                  ? 'border-[var(--brand)] text-[var(--brand)] font-semibold bg-[var(--brand-subtle)]/40'
                  : 'border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)]'
              }`}
            >
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
            <div className="absolute left-2.5 pointer-events-none text-[var(--text-secondary)]">
              <User className="w-3.5 h-3.5 opacity-70" />
            </div>
          </div>

          {/* Theme Dropdown */}
          <div className="relative flex items-center">
            <select
              aria-label="Filter by theme"
              value={selectedTheme}
              onChange={(e) => onSelectTheme(e.target.value)}
              className={`h-9 pl-7 pr-2.5 text-xs font-medium rounded-lg border bg-[var(--surface)] transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:border-transparent ${
                selectedTheme !== 'all'
                  ? 'border-[var(--brand)] text-[var(--brand)] font-semibold bg-[var(--brand-subtle)]/40'
                  : 'border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)]'
              }`}
            >
              {THEMES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
            <div className="absolute left-2.5 pointer-events-none text-[var(--text-secondary)]">
              <Tag className="w-3.5 h-3.5 opacity-70" />
            </div>
          </div>

          {/* Urgency Dropdown */}
          <div className="relative flex items-center">
            <select
              aria-label="Filter by urgency"
              value={selectedUrgency}
              onChange={(e) => onSelectUrgency(e.target.value)}
              className={`h-9 pl-7 pr-2.5 text-xs font-medium rounded-lg border bg-[var(--surface)] transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:border-transparent ${
                selectedUrgency !== 'all'
                  ? 'border-[var(--urgency-urgent)] text-[var(--urgency-urgent)] font-semibold bg-[var(--urgency-urgent-bg)]/50'
                  : 'border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)]'
              }`}
            >
              {URGENCIES.map((u) => (
                <option key={u.value} value={u.value}>
                  {u.label}
                </option>
              ))}
            </select>
            <div className="absolute left-2.5 pointer-events-none text-[var(--text-secondary)]">
              <AlertTriangle className="w-3.5 h-3.5 opacity-70" />
            </div>
          </div>

          {/* Status Dropdown */}
          <div className="relative flex items-center">
            <select
              aria-label="Filter by status"
              value={selectedStatus}
              onChange={(e) => onSelectStatus(e.target.value)}
              className={`h-9 pl-7 pr-2.5 text-xs font-medium rounded-lg border bg-[var(--surface)] transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:border-transparent ${
                selectedStatus !== 'all'
                  ? 'border-[var(--brand)] text-[var(--brand)] font-semibold bg-[var(--brand-subtle)]/40'
                  : 'border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)]'
              }`}
            >
              {STATUSES.map((stat) => (
                <option key={stat.value} value={stat.value}>
                  {stat.label}
                </option>
              ))}
            </select>
            <div className="absolute left-2.5 pointer-events-none text-[var(--text-secondary)]">
              <CheckCircle2 className="w-3.5 h-3.5 opacity-70" />
            </div>
          </div>

          {/* Active Filter Indicators & Reset Button */}
          {hasActiveFilters && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onResetFilters}
              leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
              className="h-9 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-medium"
              title="Reset all active filters"
            >
              <span>Reset</span>
              {activeFilterCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full bg-[var(--brand)] text-white text-[10px] font-semibold">
                  {activeFilterCount}
                </span>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Mobile Filter Bottom Sheet / Drawer Modal */}
      {isMobileModalOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileModalOpen(false)}
            aria-hidden="true"
          />

          {/* Bottom Sheet Card */}
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="filter-modal-title"
            className="fixed inset-x-0 bottom-0 bg-[var(--surface)] rounded-t-2xl border-t border-[var(--border-subtle)] p-5 space-y-4 max-h-[88vh] overflow-y-auto shadow-2xl z-50 animate-in slide-in-from-bottom duration-200"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
              <div>
                <h3 id="filter-modal-title" className="text-base font-semibold text-[var(--text-primary)]">
                  Filter Inbox
                </h3>
                <p className="text-xs text-[var(--text-secondary)]">
                  Narrow down emails by monitored account, role, theme, urgency, and status
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileModalOpen(false)}
                aria-label="Close filters"
                className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer rounded-lg hover:bg-[var(--surface-subtle)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Account Selector */}
            <div className="space-y-1.5">
              <label htmlFor="mobile-account-filter" className="block text-xs font-semibold text-[var(--text-primary)]">
                Monitored inbox
              </label>
              <select
                id="mobile-account-filter"
                value={selectedAccountId}
                onChange={(e) => onSelectAccount(e.target.value)}
                className="w-full p-3 text-xs border border-[var(--border-subtle)] rounded-lg bg-[var(--surface)] text-[var(--text-primary)] min-h-[44px] focus:ring-2 focus:ring-[var(--brand)] focus:outline-none"
              >
                <option value="all">All monitored inboxes ({totalEmailsCount})</option>
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.display_name || acc.email_address}
                  </option>
                ))}
              </select>
            </div>

            {/* Role Selector */}
            <div className="space-y-1.5">
              <label htmlFor="mobile-role-filter" className="block text-xs font-semibold text-[var(--text-primary)]">
                Role queue
              </label>
              <select
                id="mobile-role-filter"
                value={selectedRole}
                onChange={(e) => onSelectRole(e.target.value)}
                className="w-full p-3 text-xs border border-[var(--border-subtle)] rounded-lg bg-[var(--surface)] text-[var(--text-primary)] min-h-[44px] focus:ring-2 focus:ring-[var(--brand)] focus:outline-none"
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
              <label htmlFor="mobile-theme-filter" className="block text-xs font-semibold text-[var(--text-primary)]">
                Theme
              </label>
              <select
                id="mobile-theme-filter"
                value={selectedTheme}
                onChange={(e) => onSelectTheme(e.target.value)}
                className="w-full p-3 text-xs border border-[var(--border-subtle)] rounded-lg bg-[var(--surface)] text-[var(--text-primary)] min-h-[44px] focus:ring-2 focus:ring-[var(--brand)] focus:outline-none"
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
              <label htmlFor="mobile-urgency-filter" className="block text-xs font-semibold text-[var(--text-primary)]">
                Urgency
              </label>
              <select
                id="mobile-urgency-filter"
                value={selectedUrgency}
                onChange={(e) => onSelectUrgency(e.target.value)}
                className="w-full p-3 text-xs border border-[var(--border-subtle)] rounded-lg bg-[var(--surface)] text-[var(--text-primary)] min-h-[44px] focus:ring-2 focus:ring-[var(--brand)] focus:outline-none"
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
              <label htmlFor="mobile-status-filter" className="block text-xs font-semibold text-[var(--text-primary)]">
                Status
              </label>
              <select
                id="mobile-status-filter"
                value={selectedStatus}
                onChange={(e) => onSelectStatus(e.target.value)}
                className="w-full p-3 text-xs border border-[var(--border-subtle)] rounded-lg bg-[var(--surface)] text-[var(--text-primary)] min-h-[44px] focus:ring-2 focus:ring-[var(--brand)] focus:outline-none"
              >
                {STATUSES.map((stat) => (
                  <option key={stat.value} value={stat.value}>
                    {stat.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center gap-3 pt-3 border-t border-[var(--border-subtle)]">
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={() => {
                    onResetFilters()
                    setIsMobileModalOpen(false)
                  }}
                  className="flex-1 py-3 px-4 text-xs font-medium text-[var(--text-secondary)] bg-[var(--surface-subtle)] hover:bg-[var(--border-subtle)] rounded-lg transition-colors min-h-[44px] flex items-center justify-center cursor-pointer"
                >
                  Reset filters
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsMobileModalOpen(false)}
                className="flex-1 py-3 px-4 text-xs font-semibold text-white bg-[var(--brand)] hover:bg-[var(--brand-light)] rounded-lg transition-colors min-h-[44px] flex items-center justify-center cursor-pointer shadow-xs"
              >
                Apply filters
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
