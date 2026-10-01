'use client'

import * as React from 'react'
import { useState, useTransition, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  saveDraftAction,
  approveAndSendAction,
  discardDraftAction,
} from '@/app/emails/[id]/actions'
import {
  EmailDetailHeader,
  OriginalEmailCard,
  ClassificationCard,
  DraftEditorCard,
  ActionToolbar,
  ApprovalConfirmDialog,
  DiscardConfirmDialog,
  extractPlaceholders,
  type EmailRecord,
  type DraftRecord,
  type ClassificationAudit,
  type EmailDetailProps,
} from '@/components/email-detail'

export type { EmailDetailProps, EmailRecord, DraftRecord, ClassificationAudit }

export function EmailDetailView({
  email,
  draft: initialDraft,
  classificationAudit,
}: EmailDetailProps) {
  const [draft, setDraft] = useState<DraftRecord | null>(initialDraft)
  const initialText = draft?.edited_text || draft?.ai_generated_text || ''
  const [draftText, setDraftText] = useState<string>(initialText)
  const [wasDiscarded, setWasDiscarded] = useState<boolean>(false)

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [isPending, startTransition] = useTransition()

  // Phase 4: Confirmation dialog states
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState<boolean>(false)
  const [isDiscardModalOpen, setIsDiscardModalOpen] = useState<boolean>(false)

  const [prevEmail, setPrevEmail] = useState<EmailRecord>(email)
  const [emailRecord, setEmailRecord] = useState<EmailRecord>(email)

  if (email !== prevEmail) {
    setPrevEmail(email)
    setEmailRecord(email)
  }


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
            const updated = payload.new as unknown as DraftRecord
            setDraft(updated)
            if (updated.status === 'approved') {
              setDraftText(updated.edited_text || updated.ai_generated_text || '')
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
            const updated = payload.new as unknown as EmailRecord
            setEmailRecord((prev) => ({ ...prev, ...updated }))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [email.id])

  const isSent = draft?.status === 'sent' || emailRecord.status === 'sent'
  const isApproved = draft?.status === 'approved' || emailRecord.status === 'approved'
  const isLocked = isApproved || isSent

  // Detect unresolved placeholders like [CONFIRM ...]
  const placeholders = useMemo(() => extractPlaceholders(draftText), [draftText])
  const hasPlaceholders = placeholders.length > 0

  // 1. Save Draft Handler (Optimistic)
  const handleSaveDraft = () => {
    if (isLocked) return
    setFeedback({ type: 'success', message: 'Saving draft...' })

    startTransition(async () => {
      const res = await saveDraftAction({
        emailId: email.id,
        draftId: draft?.id,
        editedText: draftText,
      })

      if (res.success) {
        setFeedback({ type: 'success', message: 'Draft saved successfully.' })
        if (res.draftId && !draft) {
          setDraft({
            id: res.draftId,
            email_id: email.id,
            ai_generated_text: null,
            edited_text: draftText,
            draft_type: 'manual',
            status: 'pending',
            approved_by: null,
            approved_at: null,
            sent_at: null,
            updated_at: new Date().toISOString(),
          })
        }
      } else {
        setFeedback({
          type: 'error',
          message: res.error || 'Failed to save draft. Please try again.',
        })
      }
    })
  }

  // 2. Approve & Send Handler (Optimistic)
  const handleApproveSend = () => {
    if (isLocked) return
    setIsApprovalModalOpen(false)
    const prevDraft = draft
    const prevEmailRecord = emailRecord

    // Instant optimistic update
    setFeedback({ type: 'success', message: 'Approving draft and dispatching reply...' })
    if (draft) {
      setDraft({
        ...draft,
        status: 'approved',
        edited_text: draftText,
        approved_at: new Date().toISOString(),
      })
    }
    setEmailRecord((prev) => ({
      ...prev,
      status: 'approved',
    }))

    startTransition(async () => {
      const res = await approveAndSendAction({
        emailId: email.id,
        draftId: draft?.id,
        editedText: draftText,
        wasDiscarded,
      })

      if (res.success) {
        const tagLabel =
          res.draftType === 'ai_generated'
            ? 'AI-Generated (unedited)'
            : res.draftType === 'ai_edited'
            ? 'AI-Edited'
            : 'Manual'

        setFeedback({
          type: 'success',
          message: `Draft approved (${tagLabel})! Automation notified for email dispatch.`,
        })

        if (draft) {
          setDraft({
            ...draft,
            status: 'approved',
            draft_type: res.draftType || 'ai_generated',
            edited_text: draftText,
            approved_at: new Date().toISOString(),
          })
        }
      } else {
        // Rollback on failure
        if (prevDraft) setDraft(prevDraft)
        setEmailRecord(prevEmailRecord)
        setFeedback({
          type: 'error',
          message: res.error || 'Failed to approve draft. Please try again.',
        })
      }
    })
  }

  // 3. Discard Handler (Optimistic)
  const handleDiscard = () => {
    if (isLocked) return
    setIsDiscardModalOpen(false)
    const prevText = draftText
    const prevWasDiscarded = wasDiscarded

    // Instant optimistic update
    setDraftText('')
    setWasDiscarded(true)
    setFeedback({ type: 'success', message: 'Discarding draft...' })

    startTransition(async () => {
      const res = await discardDraftAction({
        emailId: email.id,
        draftId: draft?.id,
      })

      if (res.success) {
        setFeedback({
          type: 'success',
          message: 'Draft text cleared. You can write a custom reply to send as a manual response.',
        })
      } else {
        // Rollback on failure
        setDraftText(prevText)
        setWasDiscarded(prevWasDiscarded)
        setFeedback({
          type: 'error',
          message: res.error || 'Failed to discard draft. Please try again.',
        })
      }
    })
  }

  // 4. Reset to original AI draft
  const handleResetToOriginal = () => {
    if (isLocked) return
    if (draft?.ai_generated_text) {
      setDraftText(draft.ai_generated_text)
      setWasDiscarded(false)
      setFeedback({ type: 'success', message: 'Restored original AI draft reply.' })
    }
  }

  return (
    <div className="space-y-4 pb-20 lg:pb-0">
      {/* Top Header & Context Badges */}
      <EmailDetailHeader email={emailRecord} isApproved={isApproved} />

      {/* Two Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Original Email Content (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <OriginalEmailCard email={emailRecord} />
        </div>

        {/* Right Column: AI Triage & Draft Actions Panel (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Classification & Triage Summary Card */}
          <ClassificationCard
            email={emailRecord}
            classificationAudit={classificationAudit}
          />

          {/* Reply Draft Panel with Nested Action Toolbar */}
          <DraftEditorCard
            draft={draft}
            draftText={draftText}
            onDraftTextChange={setDraftText}
            isLocked={isLocked}
            isSent={isSent}
            isApproved={isApproved}
            fromAddress={emailRecord.from_address}
            feedback={feedback}
            isPending={isPending}
            onResetToOriginal={handleResetToOriginal}
          >
            <ActionToolbar
              isLocked={isLocked}
              isPending={isPending}
              draftText={draftText}
              isSent={isSent}
              hasPlaceholders={hasPlaceholders}
              onApproveSend={() => setIsApprovalModalOpen(true)}
              onSaveDraft={handleSaveDraft}
              onDiscard={() => setIsDiscardModalOpen(true)}
            />
          </DraftEditorCard>
        </div>
      </div>

      {/* Phase 4: Approval & Send Confirmation Modal */}
      <ApprovalConfirmDialog
        isOpen={isApprovalModalOpen}
        onClose={() => setIsApprovalModalOpen(false)}
        onConfirm={handleApproveSend}
        isSubmitting={isPending}
        recipient={emailRecord.from_address}
        subject={emailRecord.subject || ''}
        draftText={draftText}
        hasPlaceholders={hasPlaceholders}
      />

      {/* Phase 4: Discard Confirmation Modal */}
      <DiscardConfirmDialog
        isOpen={isDiscardModalOpen}
        onClose={() => setIsDiscardModalOpen(false)}
        onConfirm={handleDiscard}
        isSubmitting={isPending}
      />
    </div>
  )
}
