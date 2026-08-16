'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

interface SaveDraftParams {
  emailId: string
  draftId?: string | null
  editedText: string
}

interface ApproveSendParams {
  emailId: string
  draftId?: string | null
  editedText: string
  wasDiscarded?: boolean
}

interface DiscardDraftParams {
  emailId: string
  draftId?: string | null
}

/**
 * 1. Save Draft Action: Updates edited_text without changing status.
 */
export async function saveDraftAction({ emailId, draftId, editedText }: SaveDraftParams) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    let activeDraftId = draftId

    if (activeDraftId) {
      // Update existing draft
      const { error: updateError } = await supabase
        .from('drafts')
        .update({
          edited_text: editedText,
        })
        .eq('id', activeDraftId)

      if (updateError) throw updateError
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
      },
    })

    revalidatePath(`/emails/${emailId}`)
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
      const { error: updateDraftError } = await supabase
        .from('drafts')
        .update({
          edited_text: editedText,
          draft_type: draftType,
          status: 'approved',
          approved_at: nowIso,
          approved_by: user?.id || null,
        })
        .eq('id', activeDraftId)

      if (updateDraftError) throw updateDraftError
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
      },
    })

    revalidatePath(`/emails/${emailId}`)
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
export async function discardDraftAction({ emailId, draftId }: DiscardDraftParams) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (draftId) {
      await supabase
        .from('drafts')
        .update({
          status: 'discarded',
        })
        .eq('id', draftId)
    }

    // Insert audit log record for discard
    await supabase.from('audit_log').insert({
      email_id: emailId,
      draft_id: draftId || null,
      user_id: user?.id || null,
      action: 'discarded',
      details: {
        discarded_at: new Date().toISOString(),
      },
    })

    revalidatePath(`/emails/${emailId}`)
    revalidatePath('/')
    return { success: true }
  } catch (err: any) {
    console.error('[Action: discardDraftAction Error]', err)
    return { success: false, error: err.message || 'Failed to discard draft' }
  }
}
