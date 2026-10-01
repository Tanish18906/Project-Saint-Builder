import * as React from 'react'
import { Building2, AlertTriangle, Mail, Layers } from 'lucide-react'
import type { AccountItem, EmailItem } from './types'

interface InboxTabsProps {
  accounts: AccountItem[]
  emails: EmailItem[]
  selectedAccountId: string
  onSelectAccount: (accountId: string) => void
  isRealtimeLive: boolean
  urgentCount: number
  draftedCount: number
}

export function InboxTabs({
  accounts,
  emails,
  selectedAccountId,
  onSelectAccount,
  isRealtimeLive,
  urgentCount,
  draftedCount,
}: InboxTabsProps) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-[var(--border-subtle)]">
      {/* Monitored Inboxes Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5 max-w-full">
        <button
          type="button"
          onClick={() => onSelectAccount('all')}
          className={`shrink-0 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] ${
            selectedAccountId === 'all'
              ? 'bg-[var(--brand)] text-white font-semibold shadow-xs'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-subtle)] font-medium'
          }`}
        >
          <Layers className="w-3.5 h-3.5 opacity-80" />
          <span>All monitored inboxes</span>
          <span
            className={`text-[11px] px-1.5 py-0.2 rounded-full tabular-nums ${
              selectedAccountId === 'all'
                ? 'bg-white/20 text-white font-semibold'
                : 'bg-[var(--surface-subtle)] text-[var(--text-secondary)] font-medium border border-[var(--border-subtle)]'
            }`}
          >
            {emails.length}
          </span>
        </button>

        {accounts.map((acc) => {
          const count = emails.filter((e) => e.account_id === acc.id).length
          const isSelected = selectedAccountId === acc.id

          return (
            <button
              key={acc.id}
              type="button"
              onClick={() => onSelectAccount(acc.id)}
              className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] ${
                isSelected
                  ? 'bg-[var(--brand)] text-white font-semibold shadow-xs'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-subtle)] font-medium'
              }`}
            >
              <Building2 className="w-3.5 h-3.5 opacity-70" />
              <span className="truncate max-w-[160px] sm:max-w-none">
                {acc.display_name || acc.email_address}
              </span>
              <span
                className={`text-[11px] px-1.5 py-0.2 rounded-full tabular-nums ${
                  isSelected
                    ? 'bg-white/20 text-white font-semibold'
                    : 'bg-[var(--surface-subtle)] text-[var(--text-secondary)] font-medium border border-[var(--border-subtle)]'
                }`}
              >
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Realtime Live Pulse & Quick Metrics */}
      <div className="flex items-center gap-2 self-start lg:self-auto shrink-0 text-xs">
        <div
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border select-none transition-colors ${
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
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[var(--urgency-urgent-bg)] text-[var(--urgency-urgent)] border border-[var(--urgency-urgent-border)] font-semibold text-xs tabular-nums select-none">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>{urgentCount} Urgent</span>
          </span>
        )}

        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[var(--brand-subtle)] text-[var(--brand-text)] border border-[var(--brand-subtle)] font-medium text-xs tabular-nums select-none">
          <Mail className="w-3.5 h-3.5" />
          <span>{draftedCount} Drafted</span>
        </span>
      </div>
    </div>
  )
}
