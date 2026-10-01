'use client'

import * as React from 'react'
import Link from 'next/link'
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Building2,
  ArrowUpRight,
} from 'lucide-react'
import type { CommandCentreMetrics } from '@/components/home/types'

export interface OperationalMetricsGridProps {
  metrics: CommandCentreMetrics
}

export function OperationalMetricsGrid({ metrics }: OperationalMetricsGridProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {/* 1. Urgent Communications */}
      <Link
        href="/inbox?urgency=urgent"
        aria-label={`Urgent Communications: ${metrics.urgentCount} items requiring immediate attention`}
        className={`group relative bg-[var(--surface)] border border-[var(--border-subtle)] rounded-xl p-4 sm:p-5 flex flex-col justify-between transition-all duration-150 hover:border-[var(--border-strong)] hover:shadow-xs hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] focus-visible:ring-offset-2 select-none overflow-hidden ${
          metrics.urgentCount > 0 ? 'border-l-4 border-l-[var(--urgency-urgent)]' : ''
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          <div
            className={`p-2 rounded-lg border ${
              metrics.urgentCount > 0
                ? 'bg-[var(--urgency-urgent-bg)] border-[var(--urgency-urgent-border)] text-[var(--urgency-urgent)]'
                : 'bg-[var(--surface-subtle)] border-[var(--border-subtle)] text-[var(--text-tertiary)]'
            }`}
          >
            <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" />
          </div>
          <ArrowUpRight
            className="w-4 h-4 text-[var(--text-tertiary)] group-hover:text-[var(--text-primary)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-150 shrink-0"
            aria-hidden="true"
          />
        </div>

        <div className="mt-4">
          <div
            className={`text-2xl sm:text-3xl font-semibold tabular-nums ${
              metrics.urgentCount > 0
                ? 'text-[var(--urgency-urgent)]'
                : 'text-[var(--text-primary)]'
            }`}
          >
            {metrics.urgentCount}
          </div>
          <div className="text-xs sm:text-sm font-medium text-[var(--text-secondary)] mt-1">
            Urgent Communications
          </div>
          <div className="text-[11px] sm:text-xs text-[var(--text-tertiary)] mt-0.5">
            Requires immediate attention
          </div>
        </div>
      </Link>

      {/* 2. Drafts Awaiting Review */}
      <Link
        href="/approvals"
        aria-label={`Drafts Awaiting Review: ${metrics.pendingReviewCount} items pending human sign-off`}
        className={`group relative bg-[var(--surface)] border border-[var(--border-subtle)] rounded-xl p-4 sm:p-5 flex flex-col justify-between transition-all duration-150 hover:border-[var(--border-strong)] hover:shadow-xs hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] focus-visible:ring-offset-2 select-none overflow-hidden ${
          metrics.pendingReviewCount > 0 ? 'border-l-4 border-l-amber-500' : ''
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          <div
            className={`p-2 rounded-lg border ${
              metrics.pendingReviewCount > 0
                ? 'bg-amber-50 border-amber-200 text-amber-700'
                : 'bg-[var(--surface-subtle)] border-[var(--border-subtle)] text-[var(--text-tertiary)]'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
          </div>
          <ArrowUpRight
            className="w-4 h-4 text-[var(--text-tertiary)] group-hover:text-[var(--text-primary)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-150 shrink-0"
            aria-hidden="true"
          />
        </div>

        <div className="mt-4">
          <div className="text-2xl sm:text-3xl font-semibold tabular-nums text-[var(--text-primary)]">
            {metrics.pendingReviewCount}
          </div>
          <div className="text-xs sm:text-sm font-medium text-[var(--text-secondary)] mt-1">
            Drafts Awaiting Review
          </div>
          <div className="text-[11px] sm:text-xs text-[var(--text-tertiary)] mt-0.5">
            Pending human sign-off
          </div>
        </div>
      </Link>

      {/* 3. Priority Communications */}
      <Link
        href="/inbox?urgency=priority"
        aria-label={`Priority Communications: ${metrics.priorityCount} items of high operational importance`}
        className={`group relative bg-[var(--surface)] border border-[var(--border-subtle)] rounded-xl p-4 sm:p-5 flex flex-col justify-between transition-all duration-150 hover:border-[var(--border-strong)] hover:shadow-xs hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] focus-visible:ring-offset-2 select-none overflow-hidden ${
          metrics.priorityCount > 0 ? 'border-l-4 border-l-[var(--urgency-priority)]' : ''
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          <div
            className={`p-2 rounded-lg border ${
              metrics.priorityCount > 0
                ? 'bg-[var(--urgency-priority-bg)] border-[var(--urgency-priority-border)] text-[var(--urgency-priority)]'
                : 'bg-[var(--surface-subtle)] border-[var(--border-subtle)] text-[var(--text-tertiary)]'
            }`}
          >
            <Clock className="w-4 h-4 shrink-0" aria-hidden="true" />
          </div>
          <ArrowUpRight
            className="w-4 h-4 text-[var(--text-tertiary)] group-hover:text-[var(--text-primary)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-150 shrink-0"
            aria-hidden="true"
          />
        </div>

        <div className="mt-4">
          <div className="text-2xl sm:text-3xl font-semibold tabular-nums text-[var(--text-primary)]">
            {metrics.priorityCount}
          </div>
          <div className="text-xs sm:text-sm font-medium text-[var(--text-secondary)] mt-1">
            Priority Communications
          </div>
          <div className="text-[11px] sm:text-xs text-[var(--text-tertiary)] mt-0.5">
            High operational importance
          </div>
        </div>
      </Link>

      {/* 4. Monitored Inboxes */}
      <Link
        href="/inbox"
        aria-label={`Monitored Inboxes: ${metrics.activeInboxesCount} active corporate accounts`}
        className="group relative bg-[var(--surface)] border border-[var(--border-subtle)] rounded-xl p-4 sm:p-5 flex flex-col justify-between transition-all duration-150 hover:border-[var(--border-strong)] hover:shadow-xs hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] focus-visible:ring-offset-2 select-none overflow-hidden"
      >
        <div className="flex items-center justify-between gap-2">
          <div className="p-2 rounded-lg border bg-[var(--brand-subtle)] border-[var(--brand-subtle)] text-[var(--brand)]">
            <Building2 className="w-4 h-4 shrink-0" aria-hidden="true" />
          </div>
          <ArrowUpRight
            className="w-4 h-4 text-[var(--text-tertiary)] group-hover:text-[var(--text-primary)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-150 shrink-0"
            aria-hidden="true"
          />
        </div>

        <div className="mt-4">
          <div className="text-2xl sm:text-3xl font-semibold tabular-nums text-[var(--text-primary)]">
            {metrics.activeInboxesCount}
          </div>
          <div className="text-xs sm:text-sm font-medium text-[var(--text-secondary)] mt-1">
            Monitored Inboxes
          </div>
          <div className="text-[11px] sm:text-xs text-[var(--text-tertiary)] mt-0.5">
            Active corporate accounts
          </div>
        </div>
      </Link>
    </div>
  )
}
