'use client'

import React, { useState, useTransition, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { CategoryBadge } from '@/components/CategoryBadge'
import { StatusBadge } from '@/components/StatusBadge'
import {
  saveDraftAction,
  approveAndSendAction,
  discardDraftAction,
} from '@/app/emails/[id]/actions'
import {
  ArrowLeft,
  Mail,
  User,
  Clock,
  Building2,
  Sparkles,
  Send,
  Trash2,
  Save,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
  Loader2,
  Check,
  RotateCcw,
  Copy,
  Lock,
} from 'lucide-react'

export interface EmailDetailProps {
  email: {
    id: string
    account_id: string
    message_id: string
    thread_id: string | null
    from_address: string
    from_name: string | null
    subject: string | null
    body_text: string | null
    body_html: string | null
    received_at: string
    category: string | null
    routed_role: string | null
    status: string
    created_at: string | null
    accounts?: {
      id?: string
      email_address: string
      display_name: string | null
    } | null
  }
  draft: {
    id: string
    email_id: string
    ai_generated_text: string | null
    edited_text: string | null
    draft_type: string
    status: string
    approved_by: string | null
    approved_at: string | null
    sent_at: string | null
    updated_at: string | null
  } | null
  classificationAudit?: {
    category?: string
    routed_role?: string
    confidence?: number
    summary?: string
  } | null
}

export function EmailDetailView({ email, draft: initialDraft, classificationAudit }: EmailDetailProps) {
  const [draft, setDraft] = useState(initialDraft)
  const initialText = draft?.edited_text || draft?.ai_generated_text || ''
  const [draftText, setDraftText] = useState<string>(initialText)
  const [wasDiscarded, setWasDiscarded] = useState<boolean>(false)
  const [copied, setCopied] = useState<boolean>(false)

  // Status feedback states
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [isPending, startTransition] = useTransition()

  const [emailRecord, setEmailRecord] = useState(email)

  useEffect(() => {
    setEmailRecord(email)
  }, [email])

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
            const updated = payload.new as any
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
            const updated = payload.new as any
            setEmailRecord((prev) => ({ ...prev, ...updated }))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [email.id])

  const isUrgent = (emailRecord.category || '').toLowerCase() === 'urgent'
  const isSent = draft?.status === 'sent' || emailRecord.status === 'sent'
  const isApproved = draft?.status === 'approved' || emailRecord.status === 'approved'
  const isLocked = isApproved || isSent

  // Word & character stats
  const charCount = draftText.length
  const wordCount = draftText.trim() ? draftText.trim().split(/\s+/).length : 0

  // Format date helper
  const formattedDate = new Date(email.received_at).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  // 1. Save Draft Handler
  const handleSaveDraft = () => {
    if (isLocked) return
    setFeedback(null)
    startTransition(async () => {
      const res = await saveDraftAction({
        emailId: email.id,
        draftId: draft?.id,
        editedText: draftText,
      })

      if (res.success) {
        setFeedback({ type: 'success', message: 'Draft saved successfully without changing approval status.' })
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
        setFeedback({ type: 'error', message: res.error || 'Failed to save draft' })
      }
    })
  }

  // 2. Approve & Send Handler
  const handleApproveSend = () => {
    if (isLocked) return
    setFeedback(null)
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
          message: `Draft approved (${tagLabel})! Supabase trigger has notified n8n for email dispatch.`,
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
        setFeedback({ type: 'error', message: res.error || 'Failed to approve draft' })
      }
    })
  }

  // 3. Discard Handler
  const handleDiscard = () => {
    if (isLocked) return
    setFeedback(null)
    setDraftText('')
    setWasDiscarded(true)

    startTransition(async () => {
      const res = await discardDraftAction({
        emailId: email.id,
        draftId: draft?.id,
      })

      if (res.success) {
        setFeedback({
          type: 'success',
          message: 'Draft text cleared. You can now write a custom reply to send as a manual response.',
        })
      } else {
        setFeedback({ type: 'error', message: res.error || 'Failed to discard draft' })
      }
    })
  }

  // Helper: Reset to original AI draft
  const handleResetToOriginal = () => {
    if (isLocked) return
    if (draft?.ai_generated_text) {
      setDraftText(draft.ai_generated_text)
      setWasDiscarded(false)
      setFeedback({ type: 'success', message: 'Restored original AI draft reply.' })
    }
  }

  // Helper: Copy draft
  const handleCopyText = () => {
    if (draftText) {
      navigator.clipboard.writeText(draftText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Header & Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-lg border border-[#e8e2d4] shadow-sm">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#1c1a17] hover:text-[#6b6559] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Inbox</span>
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          {isUrgent && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700 border border-red-200">
              <ShieldAlert className="w-3.5 h-3.5" />
              Urgent Priority
            </span>
          )}
          <CategoryBadge category={emailRecord.category} />
          <StatusBadge status={isApproved ? 'approved' : emailRecord.status} />
          {emailRecord.accounts && (
            <span className="text-xs px-2.5 py-0.5 rounded bg-[#f5f1e8] text-[#6b6559] border border-[#e8e2d4] flex items-center gap-1 font-mono">
              <Building2 className="w-3 h-3 opacity-60" />
              {emailRecord.accounts.email_address}
            </span>
          )}
        </div>
      </div>

      {/* Two Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Original Email Content (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div
            className={`bg-white rounded-lg border shadow-sm overflow-hidden ${
              isUrgent ? 'border-l-4 border-l-red-600 border-[#e8e2d4]' : 'border-[#e8e2d4]'
            }`}
          >
            {/* Email Meta Header */}
            <div className="p-6 border-b border-[#e8e2d4] space-y-4">
              <h1 className="text-xl font-bold text-[#1c1a17] leading-snug">
                {email.subject || '(No Subject)'}
              </h1>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                <div>
                  <span className="text-[#6b6559] block text-[11px] uppercase tracking-wider font-semibold">
                    From
                  </span>
                  <p className="font-semibold text-[#1c1a17] mt-0.5">
                    {email.from_name ? `${email.from_name} ` : ''}
                    <span className="text-[#6b6559] font-normal">&lt;{email.from_address}&gt;</span>
                  </p>
                </div>

                <div>
                  <span className="text-[#6b6559] block text-[11px] uppercase tracking-wider font-semibold">
                    Received
                  </span>
                  <p className="font-medium text-[#1c1a17] mt-0.5 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-[#6b6559]" />
                    {formattedDate}
                  </p>
                </div>

                <div>
                  <span className="text-[#6b6559] block text-[11px] uppercase tracking-wider font-semibold">
                    Routed Role
                  </span>
                  <p className="font-semibold text-[#1c1a17] mt-0.5 capitalize flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-[#6b6559]" />
                    {email.routed_role ? email.routed_role.replace(/_/g, ' ') : 'Unassigned'}
                  </p>
                </div>

                <div>
                  <span className="text-[#6b6559] block text-[11px] uppercase tracking-wider font-semibold">
                    Message-ID
                  </span>
                  <p className="font-mono text-[11px] text-[#6b6559] mt-0.5 truncate" title={email.message_id}>
                    {email.message_id}
                  </p>
                </div>
              </div>
            </div>

            {/* Email Body Content */}
            <div className="p-6">
              <span className="text-[#6b6559] block text-[11px] uppercase tracking-wider font-semibold mb-3">
                Message Body
              </span>
              {email.body_html ? (
                <div
                  className="prose prose-sm max-w-none text-[#1c1a17] leading-relaxed break-words"
                  dangerouslySetInnerHTML={{ __html: email.body_html }}
                />
              ) : (
                <div className="text-sm text-[#1c1a17] leading-relaxed whitespace-pre-wrap font-sans bg-[#f5f1e8]/30 p-4 rounded border border-[#e8e2d4]">
                  {email.body_text || '(No text body available)'}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: AI Triage & Draft Actions Panel (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Classification & Triage Summary Card */}
          <div className="bg-white rounded-lg border border-[#e8e2d4] p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-[#e8e2d4] pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-[#1c1a17]">
                  AI Triage Analysis
                </h2>
              </div>
              {classificationAudit?.confidence !== undefined && (
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                  {classificationAudit.confidence}% Confidence
                </span>
              )}
            </div>

            {/* Summary Box */}
            <div>
              <span className="text-[11px] uppercase tracking-wider text-[#6b6559] font-medium block mb-1">
                Executive Summary
              </span>
              <p className="text-xs text-[#1c1a17] bg-[#f5f1e8] p-3 rounded border border-[#e8e2d4] leading-relaxed">
                {classificationAudit?.summary || 'No AI summary generated for this message.'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs pt-1">
              <div>
                <span className="text-[#6b6559] text-[11px] block">Assigned Role</span>
                <span className="font-semibold text-[#1c1a17] capitalize">
                  {classificationAudit?.routed_role || email.routed_role || 'General'}
                </span>
              </div>
              <div>
                <span className="text-[#6b6559] text-[11px] block">Triage Category</span>
                <span className="font-semibold text-[#1c1a17] capitalize">
                  {(classificationAudit?.category || email.category || 'other').replace(/_/g, ' ')}
                </span>
              </div>
            </div>
          </div>

          {/* Reply Draft Panel */}
          <div className="bg-white rounded-lg border border-[#e8e2d4] p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-[#e8e2d4] pb-3">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#1c1a17]" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-[#1c1a17]">
                  Review & Approve Reply
                </h2>
              </div>
              <div className="flex items-center gap-2">
                {draft && (
                  <>
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-stone-100 text-stone-700 border border-stone-200 uppercase">
                      {draft.draft_type.replace(/_/g, ' ')}
                    </span>
                    <StatusBadge status={draft.status} />
                  </>
                )}
              </div>
            </div>

            {/* Action Feedback Banner */}
            {feedback && (
              <div
                className={`p-3 rounded text-xs flex items-start gap-2.5 ${
                  feedback.type === 'success'
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                    : 'bg-red-50 border border-red-200 text-red-800'
                }`}
              >
                {feedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <p className="font-semibold">
                    {feedback.type === 'success' ? 'Action Completed' : 'Action Failed'}
                  </p>
                  <p className="mt-0.5 leading-normal">{feedback.message}</p>
                </div>
              </div>
            )}

            {/* Status Lockdown Banners */}
            {isSent ? (
              <div className="bg-[#1c1a17] text-[#f5f1e8] border border-[#1c1a17] rounded-lg p-3.5 text-xs flex items-start gap-2.5 shadow-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-white">Email Dispatched &amp; Sent</p>
                  <p className="text-[11px] text-[#f5f1e8]/80 mt-0.5 leading-relaxed">
                    This reply was sent to <strong className="text-white">{emailRecord.from_address}</strong>
                    {draft?.sent_at ? ` on ${new Date(draft.sent_at).toLocaleString('en-GB')}` : ''}.
                    The draft is locked and no further edits or re-sending are possible.
                  </p>
                </div>
              </div>
            ) : isApproved ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3.5 text-xs text-emerald-900 flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Approved — Queued for Dispatch</p>
                  <p className="text-[11px] text-emerald-800 mt-0.5 leading-relaxed">
                    This draft was approved
                    {draft?.approved_at ? ` on ${new Date(draft.approved_at).toLocaleString('en-GB')}` : ''} and n8n automation was notified for dispatch to <strong>{emailRecord.from_address}</strong>. All further edits are locked.
                  </p>
                </div>
              </div>
            ) : null}

            {/* Textarea (Locked/ReadOnly when Approved or Sent) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="draft-textarea"
                  className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider font-semibold text-[#6b6559]"
                >
                  {isLocked && <Lock className="w-3.5 h-3.5 text-[#6b6559]" />}
                  <span>{isLocked ? 'Final Reply Content (Locked)' : 'Reply Draft Content'}</span>
                </label>
                <div className="flex items-center gap-2">
                  {!isLocked && draft?.ai_generated_text && draftText !== draft.ai_generated_text && (
                    <button
                      type="button"
                      onClick={handleResetToOriginal}
                      className="text-[11px] text-[#6b6559] hover:text-[#1c1a17] flex items-center gap-1 cursor-pointer"
                      title="Reset back to AI draft"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Reset to AI
                    </button>
                  )}
                  {draftText && (
                    <button
                      type="button"
                      onClick={handleCopyText}
                      className="text-[11px] text-[#6b6559] hover:text-[#1c1a17] flex items-center gap-1 cursor-pointer"
                      title="Copy text to clipboard"
                    >
                      <Copy className="w-3 h-3" />
                      {copied ? 'Copied' : 'Copy'}
                    </button>
                  )}
                </div>
              </div>

              <textarea
                id="draft-textarea"
                rows={9}
                value={draftText}
                onChange={(e) => !isLocked && setDraftText(e.target.value)}
                placeholder={isLocked ? 'No reply content' : 'Write or edit reply here...'}
                readOnly={isLocked}
                disabled={isPending}
                className={`w-full p-3 text-xs sm:text-sm border rounded leading-relaxed focus:outline-none font-sans ${
                  isLocked
                    ? 'bg-[#f5f1e8]/60 border-[#e8e2d4] text-[#1c1a17] cursor-default select-text'
                    : 'bg-white border-[#e8e2d4] text-[#1c1a17] focus:ring-1 focus:ring-[#1c1a17] disabled:opacity-60'
                }`}
              />

              {/* Textarea Footer Stats */}
              <div className="flex items-center justify-between mt-1 text-[11px] text-[#6b6559]">
                <span>
                  {wordCount} words &middot; {charCount} chars
                </span>
                {isLocked ? (
                  <span className="font-medium text-[#6b6559] flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Read-Only
                  </span>
                ) : draft?.ai_generated_text ? (
                  <span className="italic">
                    {draftText === draft.ai_generated_text
                      ? 'Matches original AI draft'
                      : 'Modified from original AI draft'}
                  </span>
                ) : null}
              </div>
            </div>

            {/* Action Buttons or Locked State Banner */}
            {!isLocked ? (
              <div className="flex flex-wrap items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleApproveSend}
                  disabled={isPending || !draftText.trim()}
                  className="flex-1 py-2.5 px-4 bg-[#1c1a17] hover:bg-[#2a2723] text-[#f5f1e8] text-xs font-semibold rounded transition-colors disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isPending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  <span>Approve & Send</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveDraft}
                  disabled={isPending || !draftText.trim()}
                  className="py-2.5 px-3 bg-white hover:bg-[#f5f1e8] border border-[#e8e2d4] text-[#1c1a17] text-xs font-medium rounded transition-colors disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5 text-[#6b6559]" />
                  <span>Save Draft</span>
                </button>

                <button
                  type="button"
                  onClick={handleDiscard}
                  disabled={isPending}
                  className="py-2.5 px-3 bg-white hover:bg-red-50 border border-red-200 text-red-700 text-xs font-medium rounded transition-colors disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Discard</span>
                </button>
              </div>
            ) : (
              <div className="pt-2">
                <div className="w-full py-2.5 px-3.5 rounded-md border border-[#e8e2d4] bg-[#f5f1e8]/60 flex items-center justify-between text-xs text-[#6b6559]">
                  <div className="flex items-center gap-2">
                    <Lock className="w-3.5 h-3.5 text-[#6b6559]" />
                    <span className="font-medium">
                      {isSent
                        ? 'Email has been sent — decisions are locked'
                        : 'Draft has been approved — actions are locked'}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono font-semibold uppercase px-2 py-0.5 rounded bg-white border border-[#e8e2d4] text-[#1c1a17]">
                    {isSent ? 'Status: Sent' : 'Status: Approved'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
