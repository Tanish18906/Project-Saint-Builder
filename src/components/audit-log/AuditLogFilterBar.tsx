'use client'

import * as React from 'react'
import { Search, RotateCcw, X, Filter } from 'lucide-react'
import { ACTION_FILTERS } from './types'

export interface AuditLogFilterBarProps {
  searchQuery: string
  onSearchChange: (value: string) => void
  selectedAction: string
  onSelectAction: (action: string) => void
  hasActiveFilters: boolean
  onResetFilters: () => void
  isRealtimeLive: boolean
  totalCount: number
}

export function AuditLogFilterBar({
  searchQuery,
  onSearchChange,
  selectedAction,
  onSelectAction,
  hasActiveFilters,
  onResetFilters,
  isRealtimeLive,
  totalCount,
}: AuditLogFilterBarProps) {
  return (
    <div className="space-y-3">
      {/* Top Search & Realtime Pulse */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--text-tertiary)]">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search action, actor, subject, or keywords..."
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

        {/* Realtime Live Pulse */}
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

          <span className="text-[11px] text-[var(--text-tertiary)] font-mono tabular-nums">
            {totalCount} total {totalCount === 1 ? 'record' : 'records'}
          </span>
        </div>
      </div>

      {/* Action Filter Pills / Select */}
      <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs">
        <span className="text-[11px] font-medium text-[var(--text-tertiary)] mr-1 flex items-center gap-1">
          <Filter className="w-3 h-3" />
          <span>Action:</span>
        </span>

        {/* Desktop Pills */}
        <div className="hidden sm:flex flex-wrap items-center gap-1">
          {ACTION_FILTERS.map((f) => {
            const isActive = selectedAction === f.value
            return (
              <button
                key={f.value}
                type="button"
                onClick={() => onSelectAction(f.value)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer border ${
                  isActive
                    ? 'bg-[var(--brand)] text-white border-[var(--brand)] shadow-xs'
                    : 'bg-[var(--surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-subtle)] border-[var(--border-subtle)]'
                }`}
              >
                {f.label}
              </button>
            )
          })}
        </div>

        {/* Mobile Dropdown */}
        <div className="sm:hidden flex-1">
          <select
            value={selectedAction}
            onChange={(e) => onSelectAction(e.target.value)}
            className="w-full py-1.5 px-2.5 text-xs border border-[var(--border-subtle)] rounded-md bg-[var(--surface)] text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--brand)]"
          >
            {ACTION_FILTERS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </div>

        {/* Reset Filter Button */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="inline-flex items-center gap-1 px-2 py-1 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-[var(--surface-subtle)] hover:bg-[var(--surface-subtle)]/80 rounded transition-colors cursor-pointer ml-auto"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        )}
      </div>
    </div>
  )
}
