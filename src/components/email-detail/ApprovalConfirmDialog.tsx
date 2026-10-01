'use client'

import * as React from 'react'
import {
  Send,
  AlertTriangle,
  X,
  CheckCircle2,
  Mail,
  FileText,
  ShieldAlert,
} from 'lucide-react'
import { Button, Badge } from '@/components/ui'

export interface ApprovalConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  isSubmitting: boolean
  recipient: string
  subject: string
  draftText: string
  hasPlaceholders: boolean
}

export function ApprovalConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  isSubmitting,
  recipient,
  subject,
  draftText,
  hasPlaceholders,
}: ApprovalConfirmDialogProps) {
  // Listen for Escape key
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isSubmitting) {
        onClose()
      }
    }
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      window.addEventListener('keydown', handleKeyDown)
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, isSubmitting, onClose])

  if (!isOpen) return null

  const wordCount = draftText.trim() ? draftText.trim().split(/\s+/).length : 0
  const charCount = draftText.length

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="approval-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-150"
        onClick={() => {
          if (!isSubmitting) onClose()
        }}
        aria-hidden="true"
      />

      {/* Modal Surface */}
      <div className="relative w-full max-w-xl bg-[var(--surface)] border border-[var(--border-subtle)] rounded-xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-subtle)] bg-[var(--surface-subtle)]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[var(--brand)]/10 text-[var(--brand)] flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5 text-[var(--brand)]" />
            </div>
            <div>
              <h2
                id="approval-modal-title"
                className="text-sm font-semibold text-[var(--text-primary)]"
              >
                Confirm Approval &amp; Dispatch
              </h2>
              <p className="text-[11px] text-[var(--text-secondary)]">
                Final review checklist before irreversible email transmission
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Close confirmation dialog"
            className="p-1.5 rounded-md text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface)] transition-colors disabled:opacity-50 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* Unresolved Placeholder Warning */}
          {hasPlaceholders && (
            <div className="p-3.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-semibold text-xs block text-amber-900">
                  Unresolved Placeholders Detected
                </span>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  This draft contains unresolved template tokens (e.g.{' '}
                  <code className="px-1 py-0.5 rounded bg-amber-100 font-mono text-[10px] text-amber-900">
                    [CONFIRM ...]
                  </code>
                  ). Please ensure these are intentional before authorizing delivery.
                </p>
              </div>
            </div>
          )}

          {/* Outgoing Details Card */}
          <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-subtle)] p-3.5 space-y-2.5">
            <div className="flex items-center justify-between text-[11px] pb-2 border-b border-[var(--border-subtle)]">
              <span className="text-[var(--text-secondary)] font-medium">Outgoing Dispatch Summary</span>
              <div className="flex items-center gap-2">
                <Badge variant="brand" size="sm">Ready to Send</Badge>
                <span className="font-mono text-[11px] text-[var(--text-tertiary)]">
                  {wordCount} words / {charCount} chars
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-start gap-2">
                <Mail className="w-3.5 h-3.5 text-[var(--text-tertiary)] shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <span className="text-[11px] font-semibold text-[var(--text-secondary)] mr-1">
                    To:
                  </span>
                  <span className="font-mono text-xs text-[var(--text-primary)] break-all">
                    {recipient || '(Unknown recipient)'}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <FileText className="w-3.5 h-3.5 text-[var(--text-tertiary)] shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <span className="text-[11px] font-semibold text-[var(--text-secondary)] mr-1">
                    Subject:
                  </span>
                  <span className="font-medium text-xs text-[var(--text-primary)]">
                    {subject ? (subject.toLowerCase().startsWith('re:') ? subject : `Re: ${subject}`) : 'Re: (No subject)'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Outgoing Body Preview */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
              Exact Outgoing Message Body
            </label>
            <div className="p-3.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface)] text-[var(--text-primary)] font-mono text-[11px] leading-relaxed max-h-48 overflow-y-auto whitespace-pre-wrap select-text">
              {draftText}
            </div>
          </div>

          {/* Irreversible notice */}
          <p className="text-[11px] text-[var(--text-tertiary)] italic">
            Note: Once approved, this draft status will transition to Approved and trigger automated external dispatch.
          </p>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2.5 px-5 py-3.5 border-t border-[var(--border-subtle)] bg-[var(--surface-subtle)]">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel / Edit
          </Button>

          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={onConfirm}
            isLoading={isSubmitting}
            leftIcon={hasPlaceholders ? <AlertTriangle className="w-3.5 h-3.5 text-amber-300" /> : <Send className="w-3.5 h-3.5" />}
          >
            {hasPlaceholders ? 'Authorize & Send Anyway' : 'Confirm & Dispatch'}
          </Button>
        </div>
      </div>
    </div>
  )
}
