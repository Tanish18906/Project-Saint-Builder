'use client'

import * as React from 'react'
import {
  Send,
  Trash2,
  X,
  AlertTriangle,
  Loader2,
  Mail,
  ShieldCheck,
} from 'lucide-react'

export interface VoiceApprovalModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  isPending: boolean
  recipient: string
  subject: string
  draftText: string
}

export interface VoiceDiscardModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  isPending: boolean
}

/**
 * Checks for unresolved placeholders like [CONFIRM ...], [...], etc.
 */
function hasUnresolvedPlaceholders(text: string): boolean {
  if (!text) return false
  return /\[(?:CONFIRM|INSERT|TODO|VERIFY|\.{3}|…|[A-Z_\s]{2,})[^\]]*\]/i.test(text)
}

/**
 * Mobile-first bottom-sheet confirmation modal for "Approve & Send".
 */
export function VoiceApprovalModal({
  isOpen,
  onClose,
  onConfirm,
  isPending,
  recipient,
  subject,
  draftText,
}: VoiceApprovalModalProps) {
  // ESC key handler and body scroll lock
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isPending) {
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
  }, [isOpen, isPending, onClose])

  if (!isOpen) return null

  const hasPlaceholders = hasUnresolvedPlaceholders(draftText)

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="approval-modal-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={() => {
          if (!isPending) onClose()
        }}
        aria-hidden="true"
      />

      {/* Bottom Sheet / Modal Card */}
      <div className="relative w-full sm:max-w-lg bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl border border-[var(--border-subtle)] flex flex-col max-h-[90vh] overflow-hidden z-10 animate-in slide-in-from-bottom sm:zoom-in-95 duration-200 pb-safe sm:pb-0">
        {/* Mobile drag handle bar */}
        <div className="w-12 h-1.5 bg-stone-300 rounded-full mx-auto my-2.5 shrink-0 sm:hidden" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--border-subtle)] bg-stone-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <h2
                id="approval-modal-title"
                className="text-sm sm:text-base font-bold text-stone-900"
              >
                Review &amp; Confirm Dispatch
              </h2>
              <p className="text-[11px] text-stone-500">
                Email will be queued and sent immediately upon confirmation
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            aria-label="Close approval modal"
            className="p-2 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-200/50 transition-colors disabled:opacity-50 cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-3.5 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Recipient & Subject info */}
          <div className="bg-stone-50 rounded-xl p-3 border border-stone-200/70 space-y-1.5 text-xs text-stone-600">
            <div className="flex items-center gap-1.5 truncate">
              <Mail className="w-3.5 h-3.5 text-stone-400 shrink-0" />
              <span className="font-semibold text-stone-700 shrink-0">To:</span>
              <span className="truncate text-stone-900 font-mono font-medium">
                {recipient || '(Unknown recipient)'}
              </span>
            </div>
            <div className="flex items-start gap-1.5">
              <span className="font-semibold text-stone-700 shrink-0">Re:</span>
              <span className="text-stone-900 font-medium line-clamp-2">
                {subject || '(No subject)'}
              </span>
            </div>
          </div>

          {/* Unresolved Placeholder Warning (SINGLE ICON FIX) */}
          {hasPlaceholders && (
            <div
              role="alert"
              className="rounded-xl border border-amber-300 bg-amber-50 p-3.5 text-amber-900 shadow-2xs flex items-start gap-2.5 animate-in fade-in duration-150"
            >
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs font-semibold leading-relaxed">
                Placeholder Warning: This draft contains unverified placeholders. Please ensure all details are confirmed before dispatching.
              </div>
            </div>
          )}

          {/* Scrollable Draft Preview */}
          <div className="space-y-1.5">
            <label className="text-[11px] uppercase tracking-wider font-bold text-stone-500">
              Draft Message Preview
            </label>
            <div className="max-h-48 overflow-y-auto whitespace-pre-wrap bg-white p-3.5 rounded-xl border border-stone-200 text-xs sm:text-sm text-stone-800 leading-relaxed font-sans shadow-2xs select-text">
              {draftText || '(Empty message)'}
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="p-4 border-t border-stone-200 bg-stone-50/60 flex flex-col gap-2 pb-[max(1rem,env(safe-area-inset-bottom))] sm:pb-4">
          {/* 52px Primary Confirm Button */}
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending || !draftText.trim()}
            className="w-full h-[52px] min-h-[52px] bg-[#1c1a17] hover:bg-[#2a2723] active:bg-[#111] text-[#f5f1e8] text-xs sm:text-sm font-bold uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.99] select-none focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {isPending ? (
              <Loader2 className="w-5 h-5 animate-spin text-emerald-400" />
            ) : (
              <Send className="w-5 h-5 text-emerald-400" />
            )}
            <span>Confirm &amp; Send Email</span>
          </button>

          {/* 48px Secondary Cancel Button */}
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="w-full h-[48px] min-h-[48px] bg-white hover:bg-stone-100 text-stone-700 border border-stone-200 text-xs sm:text-sm font-semibold rounded-xl flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50 select-none focus:outline-none focus:ring-2 focus:ring-stone-400"
          >
            Cancel / Edit Draft
          </button>
        </div>
      </div>
    </div>
  )
}

/**
 * Mobile-first confirmation modal for "Discard Draft".
 */
export function VoiceDiscardModal({
  isOpen,
  onClose,
  onConfirm,
  isPending,
}: VoiceDiscardModalProps) {
  // ESC key handler and body scroll lock
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isPending) {
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
  }, [isOpen, isPending, onClose])

  if (!isOpen) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="discard-modal-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={() => {
          if (!isPending) onClose()
        }}
        aria-hidden="true"
      />

      {/* Dialog Surface */}
      <div className="relative w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl border border-[var(--border-subtle)] flex flex-col overflow-hidden z-10 animate-in slide-in-from-bottom sm:zoom-in-95 duration-200 pb-safe sm:pb-0">
        {/* Mobile drag handle bar */}
        <div className="w-12 h-1.5 bg-stone-300 rounded-full mx-auto my-2.5 shrink-0 sm:hidden" />

        <div className="p-5 space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0 border border-red-200">
              <Trash2 className="w-5 h-5 text-red-600" />
            </div>
            <div className="space-y-1">
              <h2
                id="discard-modal-title"
                className="text-base font-bold text-stone-900"
              >
                Discard Draft?
              </h2>
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                Discard this draft? You can speak or write a fresh reply afterwards.
              </p>
            </div>
          </div>
        </div>

        {/* Modal Actions Footer */}
        <div className="p-4 border-t border-stone-200 bg-stone-50/60 flex flex-col gap-2 pb-[max(1rem,env(safe-area-inset-bottom))] sm:pb-4">
          {/* 48px Red Discard Button */}
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className="w-full h-[48px] min-h-[48px] bg-red-600 hover:bg-red-700 active:bg-red-800 text-white text-xs sm:text-sm font-bold uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99] select-none focus:outline-none focus:ring-2 focus:ring-red-400"
          >
            {isPending ? (
              <Loader2 className="w-4 h-4 animate-spin text-white" />
            ) : (
              <Trash2 className="w-4 h-4 text-white" />
            )}
            <span>Discard Draft</span>
          </button>

          {/* 48px Cancel Button */}
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="w-full h-[48px] min-h-[48px] bg-white hover:bg-stone-100 text-stone-700 border border-stone-200 text-xs sm:text-sm font-semibold rounded-xl flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50 select-none focus:outline-none focus:ring-2 focus:ring-stone-400"
          >
            Keep Draft
          </button>
        </div>
      </div>
    </div>
  )
}
