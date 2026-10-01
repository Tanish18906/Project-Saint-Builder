'use client'

import * as React from 'react'
import { CheckCircle2, Search, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui'

export interface ApprovalsEmptyStateProps {
  hasFilters: boolean
  onResetFilters: () => void
}

export function ApprovalsEmptyState({
  hasFilters,
  onResetFilters,
}: ApprovalsEmptyStateProps) {
  if (hasFilters) {
    return (
      <div className="py-16 px-4 text-center rounded-xl border border-dashed border-[var(--border-subtle)] bg-[var(--surface)]">
        <div className="w-10 h-10 rounded-full bg-[var(--surface-subtle)] text-[var(--text-tertiary)] flex items-center justify-center mx-auto mb-3">
          <Search className="w-5 h-5" />
        </div>
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">
          No matching approval drafts
        </h3>
        <p className="text-xs text-[var(--text-secondary)] max-w-sm mx-auto mt-1 leading-relaxed">
          No pending drafts match the current urgency, theme, account, or search criteria.
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
      <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3.5 border border-emerald-100">
        <CheckCircle2 className="w-6 h-6 text-emerald-600" />
      </div>
      <h3 className="text-base font-semibold text-[var(--text-primary)]">
        Approval Queue is Clear
      </h3>
      <p className="text-xs text-[var(--text-secondary)] max-w-md mx-auto mt-1.5 leading-relaxed">
        All pending email response drafts have been reviewed and approved or dispatched. Newly drafted messages from inbound communications will appear here automatically for staff sign-off.
      </p>
    </div>
  )
}
