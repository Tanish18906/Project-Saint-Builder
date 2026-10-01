'use client'

import * as React from 'react'
import { FileClock, Search, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui'

export interface AuditLogEmptyStateProps {
  hasFilters: boolean
  onResetFilters: () => void
}

export function AuditLogEmptyState({
  hasFilters,
  onResetFilters,
}: AuditLogEmptyStateProps) {
  if (hasFilters) {
    return (
      <div className="py-16 px-4 text-center rounded-xl border border-dashed border-[var(--border-subtle)] bg-[var(--surface)]">
        <div className="w-10 h-10 rounded-full bg-[var(--surface-subtle)] text-[var(--text-tertiary)] flex items-center justify-center mx-auto mb-3">
          <Search className="w-5 h-5" />
        </div>
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">
          No matching audit events
        </h3>
        <p className="text-xs text-[var(--text-secondary)] max-w-sm mx-auto mt-1 leading-relaxed">
          No activity logs match your current search query or action filter.
        </p>
        <div className="mt-4">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onResetFilters}
            leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
          >
            Clear Filters
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="py-16 px-4 text-center rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] shadow-xs">
      <div className="w-12 h-12 rounded-full bg-[var(--surface-subtle)] text-[var(--text-tertiary)] flex items-center justify-center mx-auto mb-3.5 border border-[var(--border-subtle)]">
        <FileClock className="w-6 h-6 text-[var(--text-tertiary)]" />
      </div>
      <h3 className="text-base font-semibold text-[var(--text-primary)]">
        No Activity Recorded Yet
      </h3>
      <p className="text-xs text-[var(--text-secondary)] max-w-md mx-auto mt-1.5 leading-relaxed">
        Operational actions such as email triage, AI response draft generation, staff edits, approvals, and dispatch notifications will be logged here as an immutable audit timeline.
      </p>
    </div>
  )
}
