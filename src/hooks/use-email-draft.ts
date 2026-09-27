'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import { saveDraftAction, approveAndSendAction, discardDraftAction } from '@/app/(app)/emails/[id]/actions'
import { toUserMessage } from '@/lib/user-facing-error'
import { getDraftLockState, type DraftRecord, type EmailRecord } from '@/lib/domain'

export type DraftAction = 'save' | 'approve' | 'discard'

export type DraftActionResult = { ok: true; draftType?: string } | { ok: false; error: string }

const LOCKED: DraftActionResult = { ok: false, error: 'This reply has already been approved or sent, so it can no longer be changed.' }

/**
 * The dashboard reply state machine for one email:
 *   pending → (edit | save | discard→manual) → approved (locked) → sent (locked)
 *
 * Owns draft text, the `wasDiscarded` flag that makes a post-discard send a
 * `manual` reply, optimistic updates with rollback, and Realtime sync of the
 * draft/email rows. Every write goes through the three shared server actions —
 * this hook never talks to the database for writes itself.
 *
 * Actions resolve with a result instead of holding a message: the screen
 * decides what is transient (toast) and what is persistent (inline).
 * `savedText` is the last text known to be stored, so the composer can say
 * Saved / Unsaved changes without a second state model.
 */
export function useEmailDraft(email: EmailRecord, initialDraft: DraftRecord | null) {
  const [draft, setDraft] = useState(initialDraft)
  const initialText = initialDraft?.edited_text || initialDraft?.ai_generated_text || ''
  const [draftText, setDraftText] = useState<string>(initialText)
  const [savedText, setSavedText] = useState<string>(initialText)
  const [wasDiscarded, setWasDiscarded] = useState<boolean>(false)
  const [copied, setCopied] = useState<boolean>(false)
  const [pendingAction, setPendingAction] = useState<DraftAction | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const [emailRecord, setEmailRecord] = useState(email)

  useEffect(() => {
    setEmailRecord(email)
  }, [email])

  // Latest local state for the Realtime callback (subscribed once per email).
  const local = useRef({ draftText, savedText, wasDiscarded })
  useEffect(() => {
    local.current = { draftText, savedText, wasDiscarded }
  })

  // Realtime subscription for draft and email updates
  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel(`realtime-email-detail-${email.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'drafts',
          filter: `email_id=eq.${email.id}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const updated = payload.new as DraftRecord
            setDraft(updated)
            const serverText = updated.edited_text || updated.ai_generated_text || ''
            if (updated.status === 'approved') {
              setDraftText(serverText)
              setSavedText(serverText)
            } else {
              // A draft that arrives (or changes elsewhere, e.g. by voice) replaces the
              // text only when nothing here is unsaved — local edits always win.
              const l = local.current
              if (updated.status !== 'discarded' && !l.wasDiscarded && l.draftText === l.savedText) {
                setDraftText(serverText)
                setSavedText(serverText)
              }
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'emails',
          filter: `id=eq.${email.id}`,
        },
        (payload) => {
          if (payload.eventType === 'UPDATE') {
            const updated = payload.new as Partial<EmailRecord>
            setEmailRecord((prev) => ({ ...prev, ...updated }))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [email.id])

  const { isSent, isApproved, isLocked } = getDraftLockState(draft, emailRecord)

  // 1. Save Draft Handler
  const saveDraft = (): Promise<DraftActionResult> => {
    if (isLocked) return Promise.resolve(LOCKED)
    const text = draftText
    setSaveError(null)
    setPendingAction('save')

    return new Promise((resolve) => {
      startTransition(async () => {
        const res = await saveDraftAction({
          emailId: email.id,
          draftId: draft?.id,
          editedText: text,
        })

        if (res.success) {
          setSavedText(text)
          if (res.draftId && !draft) {
            setDraft({
              id: res.draftId,
              email_id: email.id,
              ai_generated_text: null,
              edited_text: text,
              draft_type: 'manual',
              status: 'pending',
              approved_by: null,
              approved_at: null,
              sent_at: null,
              updated_at: new Date().toISOString(),
            })
          }
          resolve({ ok: true })
        } else {
          console.error('[EmailDetail] saveDraftAction failed:', res.error)
          const message = toUserMessage(res.error, 'Unable to save the draft. Please try again.')
          setSaveError(message)
          resolve({ ok: false, error: message })
        }
        setPendingAction(null)
      })
    })
  }

  // 2. Approve & Send Handler (Optimistic)
  const approveAndSend = (): Promise<DraftActionResult> => {
    if (isLocked) return Promise.resolve(LOCKED)
    const prevDraft = draft
    const prevEmailRecord = emailRecord
    const text = draftText

    // Instant optimistic update
    if (draft) {
      setDraft({
        ...draft,
        status: 'approved',
        edited_text: text,
        approved_at: new Date().toISOString(),
      })
    }
    setEmailRecord((prev) => ({
      ...prev,
      status: 'approved',
    }))
    setPendingAction('approve')

    return new Promise((resolve) => {
      startTransition(async () => {
        const res = await approveAndSendAction({
          emailId: email.id,
          draftId: draft?.id,
          editedText: text,
          wasDiscarded,
        })

        if (res.success) {
          const approvedDraft = {
            status: 'approved',
            draft_type: res.draftType || 'ai_generated',
            edited_text: text,
            approved_at: new Date().toISOString(),
          }
          if (draft) {
            setDraft({ ...draft, ...approvedDraft })
          } else if (res.draftId) {
            // The action created the draft row; hold it locally so the lock survives
            // the page revalidating before the Realtime insert arrives.
            setDraft({
              id: res.draftId,
              email_id: email.id,
              ai_generated_text: null,
              approved_by: null,
              sent_at: null,
              updated_at: new Date().toISOString(),
              ...approvedDraft,
            })
          }
          setSavedText(text)
          resolve({ ok: true, draftType: res.draftType })
        } else {
          // Rollback on failure
          if (prevDraft) setDraft(prevDraft)
          setEmailRecord(prevEmailRecord)
          console.error('[EmailDetail] approveAndSendAction failed:', res.error)
          resolve({
            ok: false,
            error: toUserMessage(res.error, 'Unable to approve the draft. Nothing was sent — please try again.'),
          })
        }
        setPendingAction(null)
      })
    })
  }

  // 3. Discard Handler (Optimistic)
  const discard = (): Promise<DraftActionResult> => {
    if (isLocked) return Promise.resolve(LOCKED)
    const prevText = draftText
    const prevWasDiscarded = wasDiscarded
    const prevSavedText = savedText

    // Instant optimistic update
    setDraftText('')
    setWasDiscarded(true)
    setSavedText('')
    setPendingAction('discard')

    return new Promise((resolve) => {
      startTransition(async () => {
        const res = await discardDraftAction({
          emailId: email.id,
          draftId: draft?.id,
        })

        if (res.success) {
          resolve({ ok: true })
        } else {
          // Rollback on failure
          setDraftText(prevText)
          setWasDiscarded(prevWasDiscarded)
          setSavedText(prevSavedText)
          console.error('[EmailDetail] discardDraftAction failed:', res.error)
          resolve({ ok: false, error: toUserMessage(res.error, 'Unable to discard the draft. Please try again.') })
        }
        setPendingAction(null)
      })
    })
  }

  // Helper: Reset to original AI draft (local only; nothing is written until save or send)
  const resetToAiDraft = (): boolean => {
    if (isLocked) return false
    if (draft?.ai_generated_text) {
      setDraftText(draft.ai_generated_text)
      setWasDiscarded(false)
      return true
    }
    return false
  }

  // Helper: Copy draft
  const copyText = () => {
    if (draftText) {
      navigator.clipboard.writeText(draftText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const aiText = draft?.ai_generated_text ?? null
  const charCount = draftText.length
  const wordCount = draftText.trim() ? draftText.trim().split(/\s+/).length : 0
  const isDirty = !isLocked && draftText !== savedText

  return {
    draft,
    emailRecord,
    draftText,
    setDraftText,
    wasDiscarded,
    copied,
    isPending,
    pendingAction,
    /** Why the last save failed; cleared by the next save attempt. */
    saveError,
    isSent,
    isApproved,
    isLocked,
    /** Text differs from what is stored (never true once locked). */
    isDirty,
    /** True when the text differs from the stored AI draft (drives "Restore AI draft"). */
    isEditedFromAi: Boolean(aiText) && draftText !== aiText,
    matchesAiDraft: Boolean(aiText) && draftText === aiText,
    canSubmit: !isPending && Boolean(draftText.trim()),
    charCount,
    wordCount,
    saveDraft,
    approveAndSend,
    discard,
    resetToAiDraft,
    copyText,
  }
}

export type EmailDraftState = ReturnType<typeof useEmailDraft>
