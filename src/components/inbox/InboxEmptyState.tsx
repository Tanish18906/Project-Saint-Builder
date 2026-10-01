import * as React from 'react'
import { FilterX, Inbox, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui'

interface InboxEmptyStateProps {
  hasActiveFilters: boolean
  onResetFilters: () => void
}

export function InboxEmptyState({
  hasActiveFilters,
  onResetFilters,
}: InboxEmptyStateProps) {
  return (
    <div className="bg-[var(--surface)] rounded-xl border border-[var(--border-subtle)] p-8 sm:p-12 text-center shadow-xs">
      <div className="w-12 h-12 rounded-full bg-[var(--surface-subtle)] border border-[var(--border-subtle)] flex items-center justify-center mx-auto mb-3 text-[var(--text-secondary)]">
        {hasActiveFilters ? (
          <FilterX className="w-6 h-6 text-[var(--text-secondary)]" aria-hidden="true" />
        ) : (
          <Inbox className="w-6 h-6 text-[var(--text-secondary)]" aria-hidden="true" />
        )}
      </div>

      <h3 className="text-sm sm:text-base font-semibold text-[var(--text-primary)]">
        {hasActiveFilters ? 'No matching emails' : 'Inbox is all caught up'}
      </h3>

      <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1 max-w-sm mx-auto leading-relaxed">
        {hasActiveFilters
          ? 'No emails match your selected filters. Try adjusting your search query or clearing active filters.'
          : 'There are no incoming emails in this inbox right now.'}
      </p>

      {hasActiveFilters && (
        <div className="mt-4 flex justify-center">
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={onResetFilters}
            leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
          >
            Reset filters
          </Button>
        </div>
      )}
    </div>
  )
}
