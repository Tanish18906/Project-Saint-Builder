'use client'

import * as React from 'react'
import { ChevronDown, ChevronUp, Copy, Check, Mail, Clock } from 'lucide-react'

export interface OriginalEmailCollapsibleProps {
  fromName: string | null
  fromAddress: string
  subject: string | null
  bodyText: string | null
  receivedAt: string
}

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
 * Mobile-first collapsible card displaying the original inbound email.
 * Includes 48px touch-target toggle button, collapsed 1-line preview,
 * full formatted body display, sender metadata, and copy button with feedback.
 */
export function OriginalEmailCollapsible({
  fromName,
  fromAddress,
  subject,
  bodyText,
  receivedAt,
}: OriginalEmailCollapsibleProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [copied, setCopied] = React.useState(false)

  const senderDisplayName = fromName || fromAddress

  // 1-line truncated preview snippet for collapsed state
  const previewSnippet = React.useMemo(() => {
    if (!bodyText || !bodyText.trim()) {
      return subject || '(No message preview available)'
    }
    return bodyText.replace(/\s+/g, ' ').trim()
  }, [bodyText, subject])

  const formattedDate = React.useMemo(
    () => formatReceivedDate(receivedAt),
    [receivedAt]
  )

  const handleCopyText = async () => {
    if (!bodyText) return
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(bodyText)
      } else {
        const textarea = document.createElement('textarea')
        textarea.value = bodyText
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
      // Fallback: clipboard write failed silently
    }
  }

  return (
    <section
      aria-label="Original inbound email"
      className="max-w-md mx-auto w-full bg-white rounded-2xl border border-[var(--border-subtle)] shadow-sm overflow-hidden transition-all"
    >
      {/* 48px+ Touch Target Header Toggle Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-controls="original-email-content"
        className="w-full min-h-[48px] px-3.5 sm:px-4 py-3 flex items-center justify-between gap-3 text-left transition-colors hover:bg-stone-50 active:bg-stone-100 cursor-pointer select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]"
      >
        <div className="flex-1 min-w-0 pr-2">
          <div className="flex items-center gap-1.5">
            <Mail
              className="w-4 h-4 text-[var(--text-secondary)] shrink-0"
              aria-hidden="true"
            />
            <span className="text-xs sm:text-sm font-semibold text-[var(--text-primary)] truncate">
              View original message (from {senderDisplayName})
            </span>
          </div>

          {/* 1-line snippet shown when collapsed */}
          {!isOpen && (
            <p className="text-xs text-[var(--text-secondary)] truncate mt-1 pl-5.5">
              {previewSnippet}
            </p>
          )}
        </div>

        <div className="shrink-0 p-1 rounded-full text-[var(--text-secondary)]">
          {isOpen ? (
            <ChevronUp className="w-4 h-4" aria-hidden="true" />
          ) : (
            <ChevronDown className="w-4 h-4" aria-hidden="true" />
          )}
        </div>
      </button>

      {/* Expanded Content Panel */}
      {isOpen && (
        <div
          id="original-email-content"
          className="border-t border-[var(--border-subtle)] p-3.5 sm:p-4 space-y-3 bg-white"
        >
          {/* Sender & Timestamp Meta */}
          <div className="text-xs text-[var(--text-secondary)] space-y-1 bg-[var(--surface-subtle)]/50 p-2.5 rounded-xl border border-[var(--border-subtle)]/70">
            <p className="truncate">
              <span className="font-semibold text-[var(--text-primary)]">Sender: </span>
              {fromName ? `${fromName} ` : ''}
              <span className="text-[var(--text-tertiary)]">&lt;{fromAddress}&gt;</span>
            </p>

            {subject && (
              <p className="truncate">
                <span className="font-semibold text-[var(--text-primary)]">Subject: </span>
                <span>{subject}</span>
              </p>
            )}

            {formattedDate && (
              <p className="flex items-center gap-1.5 text-[11px] text-[var(--text-tertiary)] pt-0.5">
                <Clock className="w-3 h-3 shrink-0" aria-hidden="true" />
                <span>Received {formattedDate}</span>
              </p>
            )}
          </div>

          {/* Full Message Body */}
          <div className="space-y-1.5">
            <span className="text-[11px] uppercase tracking-wider font-bold text-[var(--text-secondary)] block">
              Inbound Message Body
            </span>
            <div
              tabIndex={0}
              role="region"
              aria-label="Full email text"
              className="whitespace-pre-wrap font-sans text-xs sm:text-sm text-[var(--text-primary)] leading-relaxed bg-[var(--surface-subtle)] p-3 sm:p-3.5 rounded-xl border border-[var(--border-subtle)] max-h-64 sm:max-h-80 overflow-y-auto break-words select-text focus:outline-none focus:ring-1 focus:ring-[var(--brand)]"
            >
              {bodyText || '(No text content in original message)'}
            </div>
          </div>

          {/* Actions: Copy button with minimum 48px touch target */}
          <div className="pt-1">
            <button
              type="button"
              onClick={handleCopyText}
              disabled={!bodyText}
              aria-label={copied ? 'Original email text copied' : 'Copy original email text'}
              className="w-full min-h-[48px] px-4 py-2.5 rounded-xl border border-[var(--border-subtle)] bg-white text-xs font-semibold text-[var(--text-primary)] hover:bg-stone-50 active:bg-stone-100 flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-xs disabled:opacity-50 disabled:cursor-not-allowed select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" aria-hidden="true" />
                  <span className="text-emerald-700 font-semibold">Copied to clipboard!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-[var(--text-secondary)] shrink-0" aria-hidden="true" />
                  <span>Copy original message text</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
