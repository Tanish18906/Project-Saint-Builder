'use client'

import * as React from 'react'
import { ShieldCheck, Save, Trash2, Lock, Loader2 } from 'lucide-react'
import type { VoiceActionToolbarProps } from './types'

/**
 * Docked Safety Action Bar (Tier 4 Sticky Footer)
 * Ensures non-negotiable safety: voice cannot send emails;
 * manual on-screen confirmation tap is strictly required.
 */
export const VoiceActionToolbar = React.memo(function VoiceActionToolbar({
  onApproveClick,
  onSaveClick,
  onDiscardClick,
  isPending,
  isLocked,
  canApprove,
  hasDraftText,
}: VoiceActionToolbarProps) {
  const isApproveDisabled = isLocked || isPending || !hasDraftText || !canApprove
  const isSaveDisabled = isLocked || isPending || !hasDraftText
  const isDiscardDisabled = isLocked || isPending

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-[var(--border-subtle)] shadow-lg pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <div className="max-w-md mx-auto px-3.5 pt-2.5 pb-1 space-y-2 box-border">
        {/* Primary Action: 52px high-contrast Approve & Send Reply */}
        <button
          type="button"
          onClick={onApproveClick}
          disabled={isApproveDisabled}
          aria-label="Approve and send reply"
          className="w-full h-[52px] min-h-[52px] bg-[#1c1a17] hover:bg-[#2a2723] active:bg-[#111] text-[#f5f1e8] text-xs sm:text-sm font-bold uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.99] select-none focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          {isPending ? (
            <Loader2 className="w-5 h-5 animate-spin text-emerald-400" />
          ) : (
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
          )}
          <span>Approve &amp; Send Reply</span>
        </button>

        {/* Secondary Actions Row: Save Draft (44px) and Discard (44px) */}
        <div className="grid grid-cols-2 gap-2 w-full">
          <button
            type="button"
            onClick={onSaveClick}
            disabled={isSaveDisabled}
            className="h-[44px] min-h-[44px] bg-white hover:bg-stone-50 active:bg-stone-100 text-stone-700 border border-stone-200 text-xs sm:text-sm font-semibold rounded-xl flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs transition-colors select-none focus:outline-none focus:ring-2 focus:ring-stone-400"
          >
            <Save className="w-4 h-4 text-stone-500 shrink-0" />
            <span>Save Draft</span>
          </button>

          <button
            type="button"
            onClick={onDiscardClick}
            disabled={isDiscardDisabled}
            className="h-[44px] min-h-[44px] bg-white hover:bg-rose-50 active:bg-rose-100 text-rose-700 border border-rose-200 text-xs sm:text-sm font-semibold rounded-xl flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs transition-colors select-none focus:outline-none focus:ring-2 focus:ring-rose-400"
          >
            <Trash2 className="w-4 h-4 text-rose-600 shrink-0" />
            <span>Discard</span>
          </button>
        </div>

        {/* Safety Micro-Caption */}
        <p className="text-[11px] text-stone-500 flex items-center justify-center gap-1.5 text-center font-medium select-none pt-0.5">
          <Lock className="w-3 h-3 shrink-0 text-stone-400" />
          <span>Voice sending disabled for safety — tap confirmation required.</span>
        </p>
      </div>
    </footer>
  )
})
export default VoiceActionToolbar
