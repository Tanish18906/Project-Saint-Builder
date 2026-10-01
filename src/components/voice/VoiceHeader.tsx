'use client'

import * as React from 'react'
import Link from 'next/link'
import { ArrowLeft, Lock, ChevronDown, ChevronUp, Copy, Check, Clock } from 'lucide-react'
import { ThemeBadge } from '@/components/ThemeBadge'
import { UrgencyBadge } from '@/components/UrgencyBadge'
import { StatusBadge } from '@/components/StatusBadge'
import type { VoiceHeaderProps } from './types'
export type { VoiceHeaderProps }

function formatReceivedDate(isoString: string): string {
  try {
    const d = new Date(isoString)
    if (isNaN(d.getTime())) return ''
    return d.toLocaleString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return ''
  }
}

/**
 * Compact Context Anchor (Tier 1)
 * Consolidates context, navigation, status, subject, and original email
 * into a single unified anchor (~80px collapsed height).
 */
export function VoiceHeader({ email, draft, isLocked }: VoiceHeaderProps) {
  const [showOriginal, setShowOriginal] = React.useState(false)
  const [copied, setCopied] = React.useState(false)

  const activeStatus = isLocked ? 'approved' : draft?.status || email.status
  const senderDisplayName = email.from_name || email.from_address
  const formattedDate = React.useMemo(
    () => formatReceivedDate(email.received_at),
    [email.received_at]
  )

  const handleCopyText = async () => {
    if (!email.body_text) return
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(email.body_text)
      } else {
        const textarea = document.createElement('textarea')
        textarea.value = email.body_text
        textarea.style.position = 'fixed'
        textarea.style.opacity = '0'
        document.body.appendChild(textarea)
        textarea.select()
        document.execCommand('copy')
        document.body.removeChild(textarea)
      }
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback
    }
  }

  return (
    <header className="w-full max-w-md mx-auto bg-white rounded-2xl border border-[var(--border-subtle)] p-3 sm:p-3.5 shadow-2xs space-y-2">
      {/* Top Micro-Bar: Navigation, Badges, and Security Indicator */}
      <div className="flex items-center justify-between gap-1.5 flex-wrap">
        <div className="flex items-center gap-1.5">
          <Link
            href="/inbox"
            className="inline-flex items-center gap-1 text-xs font-semibold text-stone-600 hover:text-stone-900 transition-colors py-1 pr-2 rounded-lg"
            title="Return to Inbox"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Inbox</span>
          </Link>
          <div className="h-3 w-px bg-stone-200" />
          <ThemeBadge theme={email.theme} />
          <UrgencyBadge urgency={email.urgency} />
          <StatusBadge status={activeStatus} />
        </div>

        {/* 24h HMAC Signed Pill */}
        <div
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200/80 select-none shrink-0"
          title="Cryptographically signed session with 24-hour expiration"
        >
          <Lock className="w-2.5 h-2.5 text-emerald-700 shrink-0" aria-hidden="true" />
          <span>Signed 24h</span>
        </div>
      </div>

      {/* Subject Line & Inline Expand Trigger */}
      <div className="space-y-1">
        <h1 className="text-[14px] sm:text-[15px] font-bold text-stone-900 leading-snug line-clamp-2">
          {email.subject || '(No Subject)'}
        </h1>

        {/* Sender details + Integrated Accordion Toggle */}
        <div className="flex items-center justify-between text-xs text-stone-500 pt-0.5">
          <p className="truncate text-[11px] sm:text-xs">
            <span className="text-stone-400">From: </span>
            <span className="font-medium text-stone-700">{senderDisplayName}</span>
          </p>

          <button
            type="button"
            onClick={() => setShowOriginal((prev) => !prev)}
            aria-expanded={showOriginal}
            className="inline-flex items-center gap-1 text-[11px] font-medium text-stone-600 hover:text-stone-900 py-0.5 px-1.5 rounded-md hover:bg-stone-100 transition-colors shrink-0"
          >
            <span>{showOriginal ? 'Hide original' : 'View original'}</span>
            {showOriginal ? (
              <ChevronUp className="w-3.5 h-3.5 text-stone-500" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-stone-500" />
            )}
          </button>
        </div>
      </div>

      {/* Expanded Inbound Email Panel */}
      {showOriginal && (
        <div className="mt-2 pt-2 border-t border-stone-200/70 space-y-2 text-xs">
          <div className="flex items-center justify-between text-[11px] text-stone-500 bg-stone-50 p-2 rounded-lg border border-stone-200/60">
            <div className="truncate pr-2">
              <span className="font-semibold text-stone-700">&lt;{email.from_address}&gt;</span>
              {formattedDate && (
                <span className="ml-1 text-stone-400 inline-flex items-center gap-1">
                  • <Clock className="w-3 h-3 text-stone-400" /> {formattedDate}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={handleCopyText}
              className="inline-flex items-center gap-1 text-[10px] font-medium text-stone-700 hover:text-stone-900 bg-white border border-stone-200 px-2 py-0.5 rounded shadow-2xs shrink-0"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-emerald-600" />
                  <span className="text-emerald-700">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3 text-stone-500" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>

          <div
            tabIndex={0}
            role="region"
            aria-label="Original inbound email body"
            className="whitespace-pre-wrap font-sans text-xs text-stone-800 leading-relaxed bg-stone-50/70 p-3 rounded-xl border border-stone-200/60 max-h-48 overflow-y-auto break-words select-text"
          >
            {email.body_text || '(No text content in original message)'}
          </div>
        </div>
      )}
    </header>
  )
}
