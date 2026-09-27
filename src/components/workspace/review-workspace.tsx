'use client'

import React, { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/toast'
import { useMail, useQueueNeighbours } from '@/components/queue/mail-context'
import { VIEW_TITLE } from '@/components/queue/queue-view'
import { useEmailDraft } from '@/hooks/use-email-draft'
import { useLiveRefresh } from '@/hooks/use-live-refresh'
import { useUnsavedGuard } from '@/hooks/use-unsaved-guard'
import { replySubject, type WorkspaceData } from '@/lib/workspace'
import { EmailActivity, ThreadContext } from './email-context'
import { MessageBody } from './message-body'
import { MessageHeader, TriageSummary } from './message-header'
import { ReplyComposer, provenanceOf, type AfterSend } from './reply-composer'
import { DiscardDialog, LeaveDialog, SendDialog } from './workspace-dialogs'
import { WorkspaceToolbar } from './workspace-toolbar'
import { workspaceFrame } from './workspace-states'

type LoadedWorkspace = Extract<WorkspaceData, { status: 'ok' }>

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  return target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)
}

/**
 * The review workspace for one email. Reading order is decision order:
 *   who / what / when / urgency → triage → the email → the reply → context.
 * Wide panes put the reply beside the email; narrow ones stack it after.
 * All writes go through useEmailDraft (the unchanged server actions).
 */
export function ReviewWorkspace({ email, draft, triage, events, thread }: Omit<LoadedWorkspace, 'status'>) {
  const router = useRouter()
  const toast = useToast()
  const mail = useMail()
  const neighbours = useQueueNeighbours(email.id)
  const reply = useEmailDraft(email, draft)
  const guard = useUnsavedGuard(reply.isDirty)

  const [dialog, setDialog] = useState<'send' | 'discard' | null>(null)
  const [sendError, setSendError] = useState<string | null>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const lockedRef = useRef<HTMLDivElement>(null)
  const sendButtonRef = useRef<HTMLButtonElement>(null)

  // New activity for this email (n8n "sent", edits by voice…) re-reads the page.
  useLiveRefresh(`email-activity-${email.id}`, [{ table: 'audit_log', event: 'INSERT', filter: `email_id=eq.${email.id}` }])

  const viewLabel = VIEW_TITLE[mail.params.view]
  const inbox = reply.emailRecord.accounts?.email_address ?? email.accounts?.email_address ?? null
  const to = { name: email.from_name, address: email.from_address }

  const goTo = (id: string | null) => {
    if (id) guard.navigate(mail.hrefFor(id))
  }
  const goNext = () => goTo(neighbours.nextId)
  const goPrev = () => goTo(neighbours.prevId)
  const goBack = () => guard.navigate(mail.queueHref)

  // Latest navigation for callbacks that outlive this render (toast actions, key handler).
  const actions = useRef({ goNext, goPrev, goBack })
  useEffect(() => {
    actions.current = { goNext, goPrev, goBack }
  })

  // Make the neighbours instant to open.
  const nextHref = neighbours.nextId ? mail.hrefFor(neighbours.nextId) : null
  const prevHref = neighbours.prevId ? mail.hrefFor(neighbours.prevId) : null
  useEffect(() => {
    for (const href of [nextHref, prevHref]) if (href) router.prefetch(href)
  }, [nextHref, prevHref, router])

  // If focus was lost on open (e.g. the queue row that had it is now hidden), start at the subject.
  useEffect(() => {
    const active = document.activeElement as HTMLElement | null
    if (!active || active === document.body || active.offsetParent === null) {
      headingRef.current?.focus({ preventScroll: true })
    }
  }, [email.id])

  // J/K next/previous, Esc back to the queue, R to the reply.
  useEffect(() => {
    let afterG = false
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || isTypingTarget(e.target)) return
      // "G then …" belongs to the shell's navigation shortcuts.
      if (e.key === 'g' || e.key === 'G') {
        afterG = true
        return
      }
      if (afterG) {
        afterG = false
        return
      }
      if (e.defaultPrevented) return
      if (document.querySelector('[role="dialog"], [role="alertdialog"], [role="menu"]')) return

      if (e.key === 'j') {
        e.preventDefault()
        actions.current.goNext()
      } else if (e.key === 'k') {
        e.preventDefault()
        actions.current.goPrev()
      } else if (e.key === 'Escape') {
        e.preventDefault()
        actions.current.goBack()
      } else if (e.key === 'r') {
        const textarea = textareaRef.current
        if (!textarea) return
        e.preventDefault()
        textarea.focus({ preventScroll: true })
        textarea.scrollIntoView({ block: 'center' })
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  /* ---------------------------------------------------------------- actions */

  const save = async () => {
    const res = await reply.saveDraft()
    if (res.ok) toast({ title: 'Draft saved', tone: 'success' })
    else toast({ title: 'Draft not saved', description: res.error, tone: 'danger' })
  }

  const confirmSend = async () => {
    setSendError(null)
    const res = await reply.approveAndSend()
    if (!res.ok) {
      setSendError(res.error)
      return
    }
    setDialog(null)
    const hasNext = neighbours.nextId !== null
    toast({
      title: 'Reply approved',
      description: `Sending to ${email.from_address}${inbox ? ` from ${inbox}` : ''}.`,
      tone: 'success',
      action: hasNext ? { label: 'Next email', onClick: () => actions.current.goNext() } : undefined,
    })
  }

  const confirmDiscard = async () => {
    const res = await reply.discard()
    setDialog(null)
    if (res.ok) toast({ title: 'Draft discarded', description: 'Write your own reply, or restore the AI draft.' })
    else toast({ title: 'Draft not discarded', description: res.error, tone: 'danger' })
  }

  const restore = () => {
    if (reply.resetToAiDraft()) {
      toast({ title: 'AI draft restored', description: 'Not saved yet — save or send to keep it.' })
      textareaRef.current?.focus()
    }
  }

  /* ------------------------------------------------------------------ state */

  const approvedBy = [...(events ?? [])].reverse().find((e) => e.action === 'approved')?.actor ?? null
  const status = (reply.emailRecord.status || '').toLowerCase()
  const afterSend: AfterSend = {
    nextLabel: 'Next email',
    onNext: neighbours.nextId ? goNext : null,
    onBack: goBack,
    backLabel: `Back to ${viewLabel}`,
    endOfQueue: !neighbours.nextId && neighbours.known ? `That was the last email in ${viewLabel}.` : null,
  }
  return (
    <section aria-labelledby="email-subject" className={workspaceFrame}>
      <WorkspaceToolbar backLabel={viewLabel} onBack={goBack} nav={{ neighbours, onPrev: goPrev, onNext: goNext }} />

      <div className="fm-workspace-grid px-4 pb-8 pt-5 sm:px-6">
        <MessageHeader ref={headingRef} email={reply.emailRecord} urgency={triage.urgency} className="[grid-area:head] pb-5" />

        <div className="min-w-0 space-y-5 [grid-area:main] @min-[60rem]:pr-6">
          <TriageSummary triage={triage} />
          <article aria-label="Original email" className="border-t border-line pt-5">
            <MessageBody html={email.body_html} text={email.body_text} />
          </article>
        </div>

        <ReplyComposer
          className="fm-scroll mt-8 border-t border-line pt-5 [grid-area:reply] @min-[60rem]:sticky @min-[60rem]:top-(--fm-c-topbar-h) @min-[60rem]:mt-0 @min-[60rem]:max-h-[calc(100dvh-var(--fm-c-topbar-h))] @min-[60rem]:self-start @min-[60rem]:overflow-y-auto @min-[60rem]:border-l @min-[60rem]:border-t-0 @min-[60rem]:pl-6 @min-[60rem]:pt-0"
          reply={reply}
          to={to}
          fromInbox={inbox}
          approvedBy={approvedBy}
          awaitingDraft={!reply.draft && (status === 'new' || status === 'classified')}
          closedWithoutReply={status === 'discarded'}
          afterSend={afterSend}
          textareaRef={textareaRef}
          lockedRef={lockedRef}
          sendButtonRef={sendButtonRef}
          onSave={save}
          onRequestSend={() => {
            setSendError(null)
            setDialog('send')
          }}
          onRequestDiscard={() => setDialog('discard')}
          onRestore={restore}
        />

        <div className="mt-8 min-w-0 space-y-7 border-t border-line pt-5 [grid-area:context] @min-[60rem]:pr-6">
          <ThreadContext thread={thread} hrefFor={mail.hrefFor} />
          <EmailActivity events={events} />
        </div>
      </div>

      <SendDialog
        open={dialog === 'send'}
        onOpenChange={(open) => {
          // Never dismiss mid-send; the result must be seen.
          if (!open && reply.pendingAction === 'approve') return
          setDialog(open ? 'send' : null)
        }}
        to={to}
        fromInbox={inbox}
        subject={replySubject(email.subject)}
        provenance={provenanceOf(reply)}
        wordCount={reply.wordCount}
        text={reply.draftText}
        sending={reply.pendingAction === 'approve'}
        error={sendError}
        onConfirm={confirmSend}
        onCloseAutoFocus={(e) => {
          // Sent: the button that opened this is gone, so land on the result.
          // Cancelled: back to the button (the dialog has no Radix trigger to return to).
          const target = reply.isLocked ? lockedRef.current : sendButtonRef.current
          if (target) {
            e.preventDefault()
            target.focus()
          }
        }}
      />
      <DiscardDialog
        open={dialog === 'discard'}
        onOpenChange={(open) => {
          if (!open && reply.pendingAction === 'discard') return
          setDialog(open ? 'discard' : null)
        }}
        isAiDraft={Boolean(reply.draft?.ai_generated_text)}
        discarding={reply.pendingAction === 'discard'}
        onConfirm={confirmDiscard}
        onCloseAutoFocus={(e) => {
          if (textareaRef.current) {
            e.preventDefault()
            textareaRef.current.focus()
          }
        }}
      />
      <LeaveDialog open={guard.leaving} onOpenChange={(open) => !open && guard.cancelLeave()} onConfirm={guard.confirmLeave} />
    </section>
  )
}
