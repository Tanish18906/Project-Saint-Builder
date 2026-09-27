'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

interface SaveDraftParams {
  emailId: string
  draftId?: string | null
  editedText: string
  via?: 'dashboard' | 'voice'
}

interface ApproveSendParams {
  emailId: string
  draftId?: string | null
  editedText: string
  wasDiscarded?: boolean
  via?: 'dashboard' | 'voice'
}

interface DiscardDraftParams {
  emailId: string
  draftId?: string | null
  via?: 'dashboard' | 'voice'
}

// Post-approval lockdown, enforced server-side: a draft may only change while pending or
// discarded. The approval trigger fires on any transition *into* 'approved', so without this a
// stale tab could re-approve (or discard then re-approve) a sent draft and dispatch it twice.
const EDITABLE_DRAFT_STATUSES = ['pending', 'discarded']
const DRAFT_LOCKED_ERROR = 'This reply has already been approved or sent, so it can no longer be changed.'

function revalidateEmail(emailId: string) {
  revalidatePath(`/emails/${emailId}`)
  revalidatePath(`/voice/${emailId}`)
  revalidatePath('/')
}

/**
 * 1. Save Draft Action: Updates edited_text without changing status.
 */
export async function saveDraftAction({ emailId, draftId, editedText, via = 'dashboard' }: SaveDraftParams) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    let activeDraftId = draftId

    if (activeDraftId) {
      // Update existing draft
      const { data: updatedRows, error: updateError } = await supabase
        .from('drafts')
        .update({
          edited_text: editedText,
        })
        .eq('id', activeDraftId)
        .in('status', EDITABLE_DRAFT_STATUSES)
        .select('id')

      if (updateError) throw updateError
      if (!updatedRows || updatedRows.length === 0) {
        revalidateEmail(emailId)
        return { success: false, error: DRAFT_LOCKED_ERROR }
      }
    } else {
      // Create new draft if none existed
      const { data: newDraft, error: insertError } = await supabase
        .from('drafts')
        .insert({
          email_id: emailId,
          edited_text: editedText,
          ai_generated_text: null,
          draft_type: 'manual',
          status: 'pending',
        })
        .select()
        .single()

      if (insertError) throw insertError
      activeDraftId = newDraft.id
    }

    // Insert audit log record for edit action
    await supabase.from('audit_log').insert({
      email_id: emailId,
      draft_id: activeDraftId,
      user_id: user?.id || null,
      action: 'edited',
      details: {
        text_length: editedText.length,
        saved_at: new Date().toISOString(),
        via,
      },
    })

    revalidatePath(`/emails/${emailId}`)
    revalidatePath(`/voice/${emailId}`)
    revalidatePath('/')
    return { success: true, draftId: activeDraftId }
  } catch (err: any) {
    console.error('[Action: saveDraftAction Error]', err)
    return { success: false, error: err.message || 'Failed to save draft' }
  }
}

/**
 * 2. Approve & Send Action: Determines draft_type, flips status to 'approved',
 * which fires the Supabase database webhook trigger to n8n.
 */
export async function approveAndSendAction({
  emailId,
  draftId,
  editedText,
  wasDiscarded = false,
  via = 'dashboard',
}: ApproveSendParams) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    let activeDraftId = draftId
    let existingAiText: string | null = null

    if (activeDraftId) {
      const { data: currentDraft } = await supabase
        .from('drafts')
        .select('ai_generated_text')
        .eq('id', activeDraftId)
        .single()

      existingAiText = currentDraft?.ai_generated_text || null
    }

    // Determine draft_type per Section 6 business logic
    let draftType: 'ai_generated' | 'ai_edited' | 'manual' = 'ai_generated'

    if (wasDiscarded) {
      draftType = 'manual'
    } else if (!existingAiText) {
      draftType = 'manual'
    } else if (editedText.trim() === existingAiText.trim()) {
      draftType = 'ai_generated'
    } else {
      draftType = 'ai_edited'
    }

    const nowIso = new Date().toISOString()

    if (activeDraftId) {
      const { data: approvedRows, error: updateDraftError } = await supabase
        .from('drafts')
        .update({
          edited_text: editedText,
          draft_type: draftType,
          status: 'approved',
          approved_at: nowIso,
          approved_by: user?.id || null,
        })
        .eq('id', activeDraftId)
        .in('status', EDITABLE_DRAFT_STATUSES)
        .select('id')

      if (updateDraftError) throw updateDraftError
      if (!approvedRows || approvedRows.length === 0) {
        revalidateEmail(emailId)
        return { success: false, error: DRAFT_LOCKED_ERROR }
      }
    } else {
      const { data: newDraft, error: insertDraftError } = await supabase
        .from('drafts')
        .insert({
          email_id: emailId,
          ai_generated_text: null,
          edited_text: editedText,
          draft_type: draftType,
          status: 'approved',
          approved_at: nowIso,
          approved_by: user?.id || null,
        })
        .select()
        .single()

      if (insertDraftError) throw insertDraftError
      activeDraftId = newDraft.id
    }

    // Insert audit log record for approval
    await supabase.from('audit_log').insert({
      email_id: emailId,
      draft_id: activeDraftId,
      user_id: user?.id || null,
      action: 'approved',
      details: {
        draft_type: draftType,
        was_discarded: wasDiscarded,
        approved_at: nowIso,
        via,
      },
    })

    revalidatePath(`/emails/${emailId}`)
    revalidatePath(`/voice/${emailId}`)
    revalidatePath('/')
    return { success: true, draftType, draftId: activeDraftId }
  } catch (err: any) {
    console.error('[Action: approveAndSendAction Error]', err)
    return { success: false, error: err.message || 'Failed to approve draft' }
  }
}

/**
 * 3. Discard Draft Action: Clears draft state and logs discarded action.
 */
export async function discardDraftAction({ emailId, draftId, via = 'dashboard' }: DiscardDraftParams) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (draftId) {
      const { data: discardedRows, error: discardError } = await supabase
        .from('drafts')
        .update({
          status: 'discarded',
        })
        .eq('id', draftId)
        .in('status', EDITABLE_DRAFT_STATUSES)
        .select('id')

      if (discardError) throw discardError
      if (!discardedRows || discardedRows.length === 0) {
        revalidateEmail(emailId)
        return { success: false, error: DRAFT_LOCKED_ERROR }
      }
    }

    // Insert audit log record for discard
    await supabase.from('audit_log').insert({
      email_id: emailId,
      draft_id: draftId || null,
      user_id: user?.id || null,
      action: 'discarded',
      details: {
        discarded_at: new Date().toISOString(),
        via,
      },
    })

    revalidatePath(`/emails/${emailId}`)
    revalidatePath(`/voice/${emailId}`)
    revalidatePath('/')
    return { success: true }
  } catch (err: any) {
    console.error('[Action: discardDraftAction Error]', err)
    return { success: false, error: err.message || 'Failed to discard draft' }
  }
}
