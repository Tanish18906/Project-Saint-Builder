'use client'

import * as React from 'react'
import Link from 'next/link'
import { CheckCircle2, AlertTriangle, Inbox } from 'lucide-react'
import { Badge } from '@/components/ui'

export interface CommandCentreHeaderProps {
  userEmail?: string | null
  isRealtimeLive: boolean
  urgentCount: number
  pendingReviewCount: number
}

export function CommandCentreHeader({
  userEmail,
  isRealtimeLive,
  urgentCount,
  pendingReviewCount,
}: CommandCentreHeaderProps) {
  const greetingName = userEmail || 'Team Member'
  const isUrgent = urgentCount > 0

  return (
    <div className="bg-[var(--surface)] border border-[var(--border-subtle)] rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-7 shadow-xs space-y-4">
      {/* Top Banner Row: Workspace & Realtime Status */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[var(--border-subtle)]">
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
            Allsaints Builders
          </span>
          <span className="text-[var(--border-strong)]" aria-hidden="true">
            •
          </span>
          <Badge variant="brand" size="sm">
            Operational Command Centre
          </Badge>
        </div>

        {/* Supabase Realtime live WebSocket status pill with pulsating emerald dot */}
        <div
          role="status"
          aria-live="polite"
          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium select-none transition-colors ${
            isRealtimeLive
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-amber-50 text-amber-800 border border-amber-200'
          }`}
          title={isRealtimeLive ? 'Live WebSocket connection active' : 'Connecting to Supabase Realtime...'}
        >
          <span className="relative flex h-2 w-2">
            {isRealtimeLive ? (
              <>
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </>
            ) : (
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500 animate-pulse" />
            )}
          </span>
          <span>{isRealtimeLive ? 'Realtime Live' : 'Connecting...'}</span>
        </div>
      </div>

      {/* Main Greeting, Context & Quick Action Buttons */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        {/* Compact Greeting & Operational Status Indicator */}
        <div className="space-y-1.5">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-primary)]">
            Welcome back, {greetingName}
          </h1>
          <div className="flex items-center gap-2 text-xs sm:text-sm">
            {isUrgent ? (
              <div className="inline-flex items-center gap-1.5 font-medium text-[var(--urgency-urgent)]">
                <AlertTriangle className="w-4 h-4 shrink-0 text-[var(--urgency-urgent)]" aria-hidden="true" />
                <span>
                  Attention required: {urgentCount} urgent items
                </span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-1.5 font-medium text-emerald-700">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" aria-hidden="true" />
                <span>All systems operational</span>
              </div>
            )}
          </div>
        </div>

        {/* Quick Action Buttons (44px min touch targets) */}
        <div className="flex flex-wrap items-center gap-3">
          {pendingReviewCount > 0 && (
            <Link
              href="/approvals"
              className="inline-flex items-center justify-center min-h-[44px] px-4 py-2.5 rounded-lg text-sm font-medium bg-[var(--brand)] hover:bg-[var(--brand-light)] active:bg-[var(--brand-light)] text-white shadow-xs transition-colors cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] focus-visible:ring-offset-1"
            >
              <CheckCircle2 className="w-4 h-4 mr-2 shrink-0" aria-hidden="true" />
              <span>Review Approvals ({pendingReviewCount})</span>
            </Link>
          )}

          <Link
            href="/inbox"
            className="inline-flex items-center justify-center min-h-[44px] px-4 py-2.5 rounded-lg text-sm font-medium border border-[var(--border-strong)] bg-transparent hover:bg-[var(--surface-subtle)] text-[var(--text-primary)] transition-colors cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] focus-visible:ring-offset-1"
          >
            <Inbox className="w-4 h-4 mr-2 shrink-0 text-[var(--text-secondary)]" aria-hidden="true" />
            <span>Open Full Inbox</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
