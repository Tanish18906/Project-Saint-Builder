'use client'

import React from 'react'
import { Send, Trash2 } from 'lucide-react'
import { ConfirmDialog } from '@/components/ui/dialog'
import { InlineAlert } from '@/components/ui/states'

interface SendDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  to: { name: string | null; address: string }
  fromInbox: string | null
  subject: string
  provenance: string | null
  wordCount: number
  text: string
  sending: boolean
  error: string | null
  onConfirm: () => void
  onCloseAutoFocus?: (event: Event) => void
}

/**
 * The one deliberate pause in the product. Says exactly what will go, to
 * whom, from where, and that it can't be taken back — through hierarchy and
 * plain words, not alarm colours. Cancel has initial focus; the scrim doesn't
 * dismiss it (ConfirmDialog).
 */
export function SendDialog({
  open,
  onOpenChange,
  to,
  fromInbox,
  subject,
  provenance,
  wordCount,
  text,
  sending,
  error,
  onConfirm,
  onCloseAutoFocus,
}: SendDialogProps) {
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Send this reply?"
      description="Approving sends this email now, from the company inbox. It can’t be undone or recalled."
      confirmLabel={error ? 'Try again' : 'Approve & send'}
      confirmIcon={<Send />}
      loading={sending}
      onConfirm={onConfirm}
      onCloseAutoFocus={onCloseAutoFocus}
    >
      <dl className="grid grid-cols-[4.5rem_minmax(0,1fr)] gap-x-3 gap-y-1.5 text-base">
        <dt className="text-fg-muted">To</dt>
        <dd className="min-w-0 text-fg [overflow-wrap:anywhere]">
          {to.name ? (
            <>
              {to.name} <span className="text-fg-muted">&lt;{to.address}&gt;</span>
            </>
          ) : (
            to.address
          )}
        </dd>
        <dt className="text-fg-muted">From</dt>
        <dd className="min-w-0 text-fg [overflow-wrap:anywhere]">{fromInbox ?? 'The inbox this email arrived at'}</dd>
        <dt className="text-fg-muted">Subject</dt>
        <dd className="min-w-0 text-fg [overflow-wrap:anywhere]">{subject}</dd>
        <dt className="text-fg-muted">Reply</dt>
        <dd className="text-fg-muted">
          {[provenance, `${wordCount} ${wordCount === 1 ? 'word' : 'words'}`, 'plain text'].filter(Boolean).join(' · ')}
        </dd>
      </dl>
      <p className="mt-3 max-h-32 overflow-y-auto whitespace-pre-wrap break-words rounded-md border border-line bg-canvas px-3 py-2 text-sm text-fg">
        {text}
      </p>
      {error && (
        <InlineAlert tone="danger" title="Nothing was sent" className="mt-3">
          {error}
        </InlineAlert>
      )}
    </ConfirmDialog>
  )
}

interface DiscardDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** True when the draft being discarded came from the AI (it can be restored). */
  isAiDraft: boolean
  discarding: boolean
  onConfirm: () => void
  onCloseAutoFocus?: (event: Event) => void
}

/**
 * Discard clears the drafted text so a manual reply can be written. It does
 * not close or archive the email — the copy says exactly that.
 */
export function DiscardDialog({ open, onOpenChange, isAiDraft, discarding, onConfirm, onCloseAutoFocus }: DiscardDialogProps) {
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={isAiDraft ? 'Discard the AI draft?' : 'Discard this draft?'}
      description={
        isAiDraft
          ? 'The drafted text is cleared so you can write your own reply, which will be sent as a manual reply. The email stays in Review until a reply is approved, and you can restore the AI draft until then.'
          : 'Your saved text is cleared so you can start again. The email stays in Review until a reply is approved.'
      }
      confirmLabel="Discard draft"
      confirmIcon={<Trash2 />}
      tone="danger"
      loading={discarding}
      onConfirm={onConfirm}
      onCloseAutoFocus={onCloseAutoFocus}
    />
  )
}

export function LeaveDialog({
  open,
  onOpenChange,
  onConfirm,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}) {
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Leave without saving?"
      description="Your changes to this reply haven’t been saved. If you leave now, they’re lost."
      cancelLabel="Keep editing"
      confirmLabel="Leave without saving"
      tone="danger"
      onConfirm={onConfirm}
    />
  )
}
