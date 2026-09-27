'use client'

import React, { useState } from 'react'
import { AlertCircle, Check, Copy, GitCompareArrows, Lock, RotateCcw, Save, Send, Trash2 } from 'lucide-react'
import { cn } from '@/lib/cn'
import { draftTypeLabel, formatAuditTimestamp } from '@/lib/format'
import type { EmailDraftState } from '@/hooks/use-email-draft'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { Textarea } from '@/components/ui/textarea'
import { Tooltip } from '@/components/ui/tooltip'
import { DraftDiff } from './draft-diff'

export type SaveState = 'saved' | 'saving' | 'unsaved' | 'error' | 'locked' | null

export function saveStateOf(reply: EmailDraftState): SaveState {
  if (reply.isLocked) return 'locked'
  if (reply.pendingAction === 'save') return 'saving'
  if (reply.saveError && reply.isDirty) return 'error'
  if (reply.isDirty) return 'unsaved'
  return reply.draft ? 'saved' : null
}

/**
 * Where the text came from, in the same words as the stored draft_type
 * (draftTypeLabel). Display only — the server derives the real draft_type on
 * approval.
 */
export function provenanceOf(reply: EmailDraftState): string | null {
  const { draft, draftText, wasDiscarded, isLocked } = reply
  if (isLocked) return draft ? draftTypeLabel(draft.draft_type) : null
  if (wasDiscarded) return 'Manual reply · AI draft discarded'
  if (!draft) return draftText.trim() ? 'Manual reply' : null
  if (draft.status === 'discarded') return 'AI draft was discarded earlier'
  if (!draft.ai_generated_text) return 'Manual reply'
  return draftText.trim() === draft.ai_generated_text.trim() ? 'AI draft · unedited' : 'AI draft · edited'
}

const isMac = () => typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)

export interface AfterSend {
  nextLabel: string | null
  onNext: (() => void) | null
  onBack: () => void
  backLabel: string
  /** "That was the last email in Review." when there's no next one. */
  endOfQueue: string | null
}

interface ReplyComposerProps {
  reply: EmailDraftState
  to: { name: string | null; address: string }
  fromInbox: string | null
  approvedBy: string | null
  /** Waiting for n8n to create the AI draft (no draft row yet, email not yet drafted). */
  awaitingDraft: boolean
  closedWithoutReply: boolean
  afterSend: AfterSend
  textareaRef: React.Ref<HTMLTextAreaElement>
  lockedRef: React.Ref<HTMLDivElement>
  onSave: () => void
  onRequestSend: () => void
  onRequestDiscard: () => void
  onRestore: () => void
  className?: string
}

/**
 * The reply: who it goes to, where the text came from, whether it's stored,
 * and the three decisions. Consequence lives in the send dialog; this surface
 * stays calm.
 */
export function ReplyComposer({
  reply,
  to,
  fromInbox,
  approvedBy,
  awaitingDraft,
  closedWithoutReply,
  afterSend,
  textareaRef,
  lockedRef,
  onSave,
  onRequestSend,
  onRequestDiscard,
  onRestore,
  className,
}: ReplyComposerProps) {
  const [comparing, setComparing] = useState(false)
  const { draft, draftText, isLocked, isSent, pendingAction } = reply
  const aiText = draft?.ai_generated_text ?? null
  const canCompare = Boolean(aiText) && Boolean(draftText.trim()) && !reply.wasDiscarded && draftText.trim() !== aiText!.trim()
  const saveState = saveStateOf(reply)
  const provenance = provenanceOf(reply)
  const busy = pendingAction !== null
  const mod = isMac() ? '⌘' : 'Ctrl'
  // Discard is for a stored draft that is still in play (not one already discarded).
  const canDiscard = Boolean(draft) && draft!.status === 'pending' && !reply.wasDiscarded

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!(e.metaKey || e.ctrlKey)) return
    if (e.key === 's' || e.key === 'S') {
      e.preventDefault()
      if (reply.isDirty && draftText.trim() && !busy) onSave()
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (reply.canSubmit) onRequestSend()
    }
  }

  return (
    <section aria-labelledby="reply-heading" className={cn('flex min-w-0 flex-col', className)}>
      {/* Heading row: what this is, where it came from, whether it's stored */}
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
        <h2 id="reply-heading" className="text-lg font-semibold tracking-[-0.01em] text-fg">
          Reply
        </h2>
        {provenance && <span className="text-sm text-fg-muted">{provenance}</span>}
        <SaveStatus state={saveState} className="ml-auto" />
      </div>

      <dl className="mt-2 grid grid-cols-[3rem_minmax(0,1fr)] gap-y-0.5 text-sm">
        <dt className="text-fg-subtle">To</dt>
        <dd className="min-w-0 truncate text-fg">
          {to.name && <span>{to.name} </span>}
          <span className={to.name ? 'text-fg-muted' : undefined}>{to.address}</span>
        </dd>
        <dt className="text-fg-subtle">From</dt>
        <dd className="min-w-0 truncate text-fg">{fromInbox ?? 'The inbox it arrived at'}</dd>
      </dl>

      {/* Persistent state, inline */}
      {isLocked && (
        <LockedState
          ref={lockedRef}
          isSent={isSent}
          draftApprovedAt={draft?.approved_at ?? null}
          draftSentAt={draft?.sent_at ?? null}
          approvedBy={approvedBy}
          to={to.address}
          fromInbox={fromInbox}
          afterSend={afterSend}
        />
      )}
      {!isLocked && closedWithoutReply && (
        <p className="mt-3 text-sm text-fg-muted">This email was closed without a reply. You can still send one.</p>
      )}
      {!isLocked && awaitingDraft && !draftText && (
        <p role="status" className="mt-3 flex items-center gap-2 text-sm text-fg-muted">
          <Spinner size="sm" />
          Waiting for the suggested reply. It appears here automatically — or write your own.
        </p>
      )}
      {!isLocked && reply.wasDiscarded && (
        <div role="status" className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-fg-muted">
          <span>The AI draft was discarded. Write your own reply — it will be sent as a manual reply.</span>
          {aiText && (
            <Button variant="ghost" size="sm" leadingIcon={<RotateCcw />} onClick={onRestore} className="-ml-2.5">
              Restore AI draft
            </Button>
          )}
        </div>
      )}

      {/* The text */}
      <div className="mt-3">
        {isLocked ? (
          <div
            aria-label="Final reply"
            className="max-w-(--fm-c-reading-max) whitespace-pre-wrap break-words border-l-2 border-line-strong pl-3 text-md text-fg"
          >
            {draftText || <span className="italic text-fg-subtle">No reply text</span>}
          </div>
        ) : (
          <>
            <label htmlFor="reply-text" className="sr-only">
              Reply text
            </label>
            <Textarea
              id="reply-text"
              ref={textareaRef}
              reading
              autoGrow
              value={draftText}
              onChange={(e) => reply.setDraftText(e.target.value)}
              onKeyDown={onKeyDown}
              disabled={pendingAction === 'approve' || pendingAction === 'discard'}
              placeholder="Write a reply…"
              aria-describedby="reply-meta"
              className="min-h-48 w-full"
            />
          </>
        )}
      </div>

      {/* Meta + secondary tools */}
      <div id="reply-meta" className="mt-1.5 flex flex-wrap items-center gap-x-1 gap-y-1 text-xs text-fg-subtle">
        <span className="mr-2 tabular-nums">
          {reply.wordCount} {reply.wordCount === 1 ? 'word' : 'words'}
        </span>
        {canCompare && (
          <Button
            variant="ghost"
            size="sm"
            leadingIcon={<GitCompareArrows />}
            aria-expanded={comparing}
            aria-controls="reply-diff"
            onClick={() => setComparing((v) => !v)}
          >
            {comparing ? 'Hide changes' : 'Compare with AI draft'}
          </Button>
        )}
        {!isLocked && !reply.wasDiscarded && aiText && reply.isEditedFromAi && (
          <Button variant="ghost" size="sm" leadingIcon={<RotateCcw />} onClick={onRestore}>
            Restore AI draft
          </Button>
        )}
        {draftText && (
          <Button variant="ghost" size="sm" leadingIcon={reply.copied ? <Check /> : <Copy />} onClick={reply.copyText}>
            {reply.copied ? 'Copied' : 'Copy'}
          </Button>
        )}
      </div>

      {comparing && canCompare && (
        <div className="mt-2">
          <DraftDiff id="reply-diff" aiText={aiText!} text={draftText} />
        </div>
      )}

      {/* Decisions. Sticks to the bottom of the screen while the reply is in view. */}
      {!isLocked && (
        <div
          data-composer-actions=""
          className={cn(
            'sticky bottom-0 z-10 mt-4 flex items-center gap-2 border-t border-line bg-panel py-3',
            '-mx-4 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:-mx-6 sm:px-6',
            '@min-[60rem]:-ml-6 @min-[60rem]:mr-0 @min-[60rem]:pl-6 @min-[60rem]:pr-0'
          )}
        >
          {canDiscard && (
            <Button
              variant="ghost"
              leadingIcon={<Trash2 />}
              onClick={onRequestDiscard}
              disabled={busy}
              loading={pendingAction === 'discard'}
              className="-ml-3 max-sm:px-2.5"
            >
              <span className="max-sm:sr-only">Discard draft</span>
            </Button>
          )}
          {!draftText.trim() && !awaitingDraft && (
            <p id="send-hint" className="text-xs text-fg-subtle max-sm:sr-only">
              Write a reply to enable sending.
            </p>
          )}
          <div className="ml-auto flex items-center gap-2 max-sm:flex-1 max-sm:justify-end">
            <Tooltip content="Save draft" shortcut={[mod, 'S']}>
              <Button
                variant="secondary"
                leadingIcon={<Save />}
                onClick={onSave}
                disabled={!reply.isDirty || !draftText.trim() || (busy && pendingAction !== 'save')}
                loading={pendingAction === 'save'}
              >
                <span className="max-sm:sr-only">Save draft</span>
              </Button>
            </Tooltip>
            <Tooltip content="Review and send" shortcut={[mod, '↵']}>
              <Button
                variant="primary"
                leadingIcon={<Send />}
                onClick={onRequestSend}
                disabled={!reply.canSubmit}
                aria-describedby={!draftText.trim() && !awaitingDraft ? 'send-hint' : undefined}
                className="max-sm:flex-1"
              >
                Approve &amp; send…
              </Button>
            </Tooltip>
          </div>
        </div>
      )}
    </section>
  )
}

function SaveStatus({ state, className }: { state: SaveState; className?: string }) {
  const content: Record<Exclude<SaveState, null>, React.ReactNode> = {
    saved: (
      <>
        <Check aria-hidden="true" className="size-3.5 text-success-mark" />
        Saved
      </>
    ),
    saving: (
      <>
        <Spinner size="sm" />
        Saving…
      </>
    ),
    unsaved: (
      <>
        <span aria-hidden="true" className="size-1.5 rounded-full bg-warning-mark" />
        Unsaved changes
      </>
    ),
    error: (
      <span className="flex items-center gap-1.5 text-danger-fg">
        <AlertCircle aria-hidden="true" className="size-3.5" />
        Not saved
      </span>
    ),
    locked: (
      <>
        <Lock aria-hidden="true" className="size-3.5" />
        Locked
      </>
    ),
  }
  return (
    <span role="status" aria-live="polite" className={cn('flex items-center gap-1.5 text-xs font-medium text-fg-muted', className)}>
      {state ? content[state] : null}
    </span>
  )
}

interface LockedStateProps {
  isSent: boolean
  draftApprovedAt: string | null
  draftSentAt: string | null
  approvedBy: string | null
  to: string
  fromInbox: string | null
  afterSend: AfterSend
}

/** Approved or sent: what happened, when, by whom — and where to go next. */
const LockedState = React.forwardRef<HTMLDivElement, LockedStateProps>(function LockedState(
  { isSent, draftApprovedAt, draftSentAt, approvedBy, to, fromInbox, afterSend },
  ref
) {
  const from = fromInbox ? ` from ${fromInbox}` : ''
  return (
    <div
      ref={ref}
      tabIndex={-1}
      role="status"
      className="mt-3 rounded-md border border-success-line bg-success-subtle px-3 py-2.5 outline-none focus-visible:ring-2 focus-visible:ring-focus"
    >
      <p className="flex items-center gap-2 text-base font-medium text-success-fg">
        <Lock aria-hidden="true" className="size-4" />
        {isSent ? 'Sent' : 'Approved — sending'}
      </p>
      <p className="mt-0.5 text-sm text-fg">
        {isSent ? (
          <>
            Sent{draftSentAt && <> {formatAuditTimestamp(draftSentAt)}</>} to {to}
            {from}.
          </>
        ) : (
          <>
            Approved{draftApprovedAt && <> {formatAuditTimestamp(draftApprovedAt)}</>}
            {approvedBy && <> by {approvedBy}</>}. It’s sent automatically to {to}
            {from}; this updates when it has gone.
          </>
        )}{' '}
        This reply can’t be edited or sent again.
      </p>
      <div className="mt-2.5 flex flex-wrap items-center gap-2">
        {afterSend.onNext ? (
          <Button size="sm" variant="primary" onClick={afterSend.onNext}>
            {afterSend.nextLabel}
          </Button>
        ) : (
          afterSend.endOfQueue && <span className="text-sm text-fg-muted">{afterSend.endOfQueue}</span>
        )}
        <Button size="sm" variant="secondary" onClick={afterSend.onBack}>
          {afterSend.backLabel}
        </Button>
      </div>
    </div>
  )
})
