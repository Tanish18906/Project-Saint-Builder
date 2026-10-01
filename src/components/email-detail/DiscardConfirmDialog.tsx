'use client'

import * as React from 'react'
import { Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui'

export interface DiscardConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  isSubmitting: boolean
}

export function DiscardConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  isSubmitting,
}: DiscardConfirmDialogProps) {
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

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="discard-modal-title"
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

      {/* Dialog Surface */}
      <div className="relative w-full max-w-md bg-[var(--surface)] border border-[var(--border-subtle)] rounded-xl shadow-2xl overflow-hidden z-10 flex flex-col animate-in zoom-in-95 duration-150">
        <div className="flex items-start justify-between p-5 pb-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-red-50 text-red-600 flex items-center justify-center shrink-0 border border-red-200">
              <Trash2 className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h2
                id="discard-modal-title"
                className="text-sm font-semibold text-[var(--text-primary)]"
              >
                Discard Response Draft?
              </h2>
              <p className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed">
                This will mark the draft as discarded and remove the proposed response text. This action is recorded in the immutable audit log.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Close dialog"
            className="p-1.5 rounded-md text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-subtle)] transition-colors disabled:opacity-50 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 px-5 py-3.5 border-t border-[var(--border-subtle)] bg-[var(--surface-subtle)]">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Keep Draft
          </Button>

          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={onConfirm}
            isLoading={isSubmitting}
            leftIcon={<Trash2 className="w-3.5 h-3.5" />}
          >
            Yes, Discard Draft
          </Button>
        </div>
      </div>
    </div>
  )
}
