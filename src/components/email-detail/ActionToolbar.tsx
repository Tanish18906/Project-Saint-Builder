'use client'

import * as React from 'react'
import { Send, Save, Trash2, Loader2, Lock, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui'

export interface ActionToolbarProps {
  isLocked: boolean
  isPending: boolean
  draftText: string
  isSent: boolean
  hasPlaceholders?: boolean
  onApproveSend: () => void
  onSaveDraft: () => void
  onDiscard: () => void
}

export function ActionToolbar({
  isLocked,
  isPending,
  draftText,
  isSent,
  hasPlaceholders = false,
  onApproveSend,
  onSaveDraft,
  onDiscard,
}: ActionToolbarProps) {
  const isSendDisabled = isPending || !draftText.trim()
  const isSaveDisabled = isPending || !draftText.trim()

  if (isLocked) {
    return (
      <div className="pt-2">
        <div className="w-full py-2.5 px-3.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-subtle)] flex items-center justify-between text-xs text-[var(--text-secondary)]">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-[var(--text-tertiary)]" />
            <span className="font-medium">
              {isSent
                ? 'Email has been sent — decisions are locked'
                : 'Draft has been approved — actions are locked'}
            </span>
          </div>
          <span className="text-[10px] font-mono font-semibold uppercase px-2 py-0.5 rounded bg-[var(--surface)] border border-[var(--border-subtle)] text-[var(--text-primary)]">
            {isSent ? 'Status: Sent' : 'Status: Approved'}
          </span>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Desktop Action Buttons */}
      <div className="hidden lg:flex flex-wrap items-center gap-2 pt-2">
        <Button
          type="button"
          variant="primary"
          size="md"
          onClick={onApproveSend}
          disabled={isSendDisabled}
          isLoading={isPending}
          leftIcon={hasPlaceholders ? <AlertTriangle className="w-3.5 h-3.5 text-amber-300" /> : <Send className="w-3.5 h-3.5" />}
          className="flex-1"
        >
          <span>Approve &amp; Send</span>
        </Button>

        <Button
          type="button"
          variant="secondary"
          size="md"
          onClick={onSaveDraft}
          disabled={isSaveDisabled}
          leftIcon={<Save className="w-3.5 h-3.5 text-[var(--text-secondary)]" />}
        >
          <span>Save draft</span>
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="md"
          onClick={onDiscard}
          disabled={isPending}
          leftIcon={<Trash2 className="w-3.5 h-3.5" />}
          className="text-[var(--text-secondary)] hover:text-red-700 hover:bg-red-50"
        >
          <span>Discard</span>
        </Button>
      </div>

      {/* Mobile Sticky Bottom Action Bar (44px touch targets) */}
      <div className="fixed bottom-0 inset-x-0 bg-[var(--surface)]/95 backdrop-blur-sm border-t border-[var(--border-subtle)] p-3 z-40 shadow-lg flex lg:hidden items-center gap-2">
        <button
          type="button"
          onClick={onApproveSend}
          disabled={isSendDisabled}
          className="flex-1 py-3 px-4 bg-[var(--brand)] hover:bg-[var(--brand-light)] text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer min-h-[44px] shadow-xs"
        >
          {isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : hasPlaceholders ? (
            <AlertTriangle className="w-4 h-4 text-amber-300" />
          ) : (
            <Send className="w-4 h-4" />
          )}
          <span>Approve &amp; Send</span>
        </button>

        <button
          type="button"
          onClick={onSaveDraft}
          disabled={isSaveDisabled}
          className="py-3 px-3.5 bg-[var(--surface)] hover:bg-[var(--surface-subtle)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-xs font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1 cursor-pointer min-h-[44px]"
        >
          <Save className="w-4 h-4 text-[var(--text-secondary)]" />
          <span className="hidden sm:inline">Save</span>
        </button>

        <button
          type="button"
          onClick={onDiscard}
          disabled={isPending}
          className="py-3 px-3.5 bg-[var(--surface)] hover:bg-red-50 hover:text-red-700 hover:border-red-200 border border-[var(--border-subtle)] text-[var(--text-secondary)] text-xs font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1 cursor-pointer min-h-[44px]"
        >
          <Trash2 className="w-4 h-4" />
          <span className="hidden sm:inline">Discard</span>
        </button>
      </div>
    </>
  )
}
