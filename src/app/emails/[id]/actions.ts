'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createVoiceClient } from '@/lib/supabase/voice'
import { verifyVoiceToken } from '@/lib/voice-token'

interface SaveDraftParams {
  emailId: string
  draftId?: string | null
  editedText: string
  via?: 'dashboard' | 'voice'
  voiceToken?: string
}

interface ApproveSendParams {
  emailId: string
  draftId?: string | null
  editedText: string
  wasDiscarded?: boolean
  via?: 'dashboard' | 'voice'
  voiceToken?: string
}

interface DiscardDraftParams {
  emailId: string
  draftId?: string | null
  via?: 'dashboard' | 'voice'
  voiceToken?: string
}

// Post-approval lockdown: drafts in these states can never be edited, re-approved or discarded.
const LOCKED_STATUSES = '(approved,sent)'
const LOCKED_ERROR = 'This draft has already been approved or sent and can no longer be changed.'

/**
 * Server actions are public POST endpoints, so every call must prove who it is:
 * a signed-in staff session (dashboard) or a valid voice token bound to this email (voice portal).
 */
async function authorize(emailId: string, voiceToken?: string) {
  if (voiceToken) {
    // emailId must be non-empty: verifyVoiceToken skips the email binding check when it is blank
    const verification = verifyVoiceToken(voiceToken, emailId)
    if (!emailId || !verification.valid) throw new Error('Unauthorized: invalid or expired voice link')
    return { supabase: await createVoiceClient(), userId: null }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized: please sign in again')
  return { supabase, userId: user.id }
}

/**
 * 1. Save Draft Action: Updates edited_text without changing status.
 */
export async function saveDraftAction({ emailId, draftId, editedText, via = 'dashboard', voiceToken }: SaveDraftParams) {
  try {
    const { supabase, userId } = await authorize(emailId, voiceToken)

    let activeDraftId = draftId

    if (activeDraftId) {
      // Update existing draft (conditional on email ownership + not locked, so it is race-safe)
      const { data: updated, error: updateError } = await supabase
        .from('drafts')
        .update({
          edited_text: editedText,
        })
        .eq('id', activeDraftId)
        .eq('email_id', emailId)
        .not('status', 'in', LOCKED_STATUSES)
        .select('id')

      if (updateError) throw updateError
      if (!updated?.length) throw new Error(LOCKED_ERROR)
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
      user_id: userId,
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
  } catch (err: unknown) {
    console.error('[Action: saveDraftAction Error]', err)
    return { success: false, error: (err instanceof Error && err.message) || 'Failed to save draft' }
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
  voiceToken,
}: ApproveSendParams) {
  try {
    if (!editedText.trim()) throw new Error('Cannot approve an empty reply.')

    const { supabase, userId } = await authorize(emailId, voiceToken)

    let activeDraftId = draftId
    let existingAiText: string | null = null

    if (activeDraftId) {
      const { data: currentDraft } = await supabase
        .from('drafts')
        .select('ai_generated_text')
        .eq('id', activeDraftId)
        .eq('email_id', emailId)
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
      // Conditional update: only one concurrent approval can win, and approved/sent drafts can't be
      // re-approved (re-approving a 'sent' draft would re-fire the SMTP webhook and resend the email).
      const { data: updated, error: updateDraftError } = await supabase
        .from('drafts')
        .update({
          edited_text: editedText,
          draft_type: draftType,
          status: 'approved',
          approved_at: nowIso,
          approved_by: userId,
        })
        .eq('id', activeDraftId)
        .eq('email_id', emailId)
        .not('status', 'in', LOCKED_STATUSES)
        .select('id')

      if (updateDraftError) throw updateDraftError
      if (!updated?.length) throw new Error(LOCKED_ERROR)
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
          approved_by: userId,
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
      user_id: userId,
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
  } catch (err: unknown) {
    console.error('[Action: approveAndSendAction Error]', err)
    return { success: false, error: (err instanceof Error && err.message) || 'Failed to approve draft' }
  }
}

/**
 * 3. Discard Draft Action: Clears draft state and logs discarded action.
 */
export async function discardDraftAction({ emailId, draftId, via = 'dashboard', voiceToken }: DiscardDraftParams) {
  try {
    const { supabase, userId } = await authorize(emailId, voiceToken)

    if (draftId) {
      const { data: updated, error: discardError } = await supabase
        .from('drafts')
        .update({
          status: 'discarded',
        })
        .eq('id', draftId)
        .eq('email_id', emailId)
        .not('status', 'in', LOCKED_STATUSES)
        .select('id')

      if (discardError) throw discardError
      if (!updated?.length) throw new Error(LOCKED_ERROR)
    }

    // Insert audit log record for discard
    await supabase.from('audit_log').insert({
      email_id: emailId,
      draft_id: draftId || null,
      user_id: userId,
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
  } catch (err: unknown) {
    console.error('[Action: discardDraftAction Error]', err)
    return { success: false, error: (err instanceof Error && err.message) || 'Failed to discard draft' }
  }
}
