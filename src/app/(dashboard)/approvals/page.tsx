import { createClient } from '@/lib/supabase/server'
import { ApprovalsView, type ApprovalItem } from '@/components/approvals'

export const dynamic = 'force-dynamic'

interface DraftRow {
  id: string
  email_id: string
  status: string
  draft_type: string
  ai_generated_text: string | null
  edited_text: string | null
  created_at: string | null
  updated_at: string | null
}

interface EmailRow {
  id: string
  account_id: string
  message_id: string
  thread_id: string | null
  from_address: string
  from_name: string | null
  subject: string | null
  body_text: string | null
  received_at: string
  theme: string | null
  urgency: string | null
  routed_roles: string[] | null
  status: string
  accounts?: {
    id?: string
    email_address: string
    display_name: string | null
  } | null
}

export default async function ApprovalsPage() {
  const supabase = await createClient()

  // Fetch ALL three in parallel (previously drafts → emails was sequential)
  const [
    { data: pendingDrafts, error: draftsError },
    { data: emailsData, error: emailsError },
    { data: accountsData },
  ] = await Promise.all([
    supabase
      .from('drafts')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false }),
    supabase
      .from('emails')
      .select(`
        id,
        account_id,
        message_id,
        thread_id,
        from_address,
        from_name,
        subject,
        body_text,
        received_at,
        theme,
        urgency,
        routed_roles,
        status,
        accounts (
          id,
          email_address,
          display_name
        )
      `)
      .in('status', ['drafted', 'pending'])
      .order('received_at', { ascending: false })
      .limit(50),
    supabase
      .from('accounts')
      .select('id, email_address, display_name')
      .order('email_address', { ascending: true }),
  ])

  if (draftsError) {
    console.error('[Approvals] Error fetching drafts:', draftsError.message)
  }
  if (emailsError) {
    console.error('[Approvals] Error fetching emails:', emailsError.message)
  }

  const drafts = (pendingDrafts as unknown as DraftRow[]) || []
  const emails = (emailsData as unknown as EmailRow[]) || []
  const accounts = accountsData || []

  // Map emails to approval items, enriching with draft data
  const pendingEmailIds = new Set(drafts.map((d) => d.email_id).filter(Boolean))

  const approvalItems: ApprovalItem[] = emails
    .filter((email) => {
      const s = (email.status || '').toLowerCase()
      if (s === 'approved' || s === 'sent' || s === 'discarded') return false
      // Include if email has a pending draft or matches status filter
      return pendingEmailIds.has(email.id) || s === 'drafted' || s === 'pending'
    })
    .map((email) => {
      const associatedDraft = drafts.find((d) => d.email_id === email.id)
      return {
        id: email.id,
        account_id: email.account_id,
        message_id: email.message_id,
        thread_id: email.thread_id,
        from_address: email.from_address,
        from_name: email.from_name,
        subject: email.subject,
        body_text: email.body_text,
        received_at: email.received_at,
        theme: email.theme,
        urgency: email.urgency,
        routed_roles: email.routed_roles,
        status: email.status,
        accounts: email.accounts,
        draft: associatedDraft
          ? {
              id: associatedDraft.id,
              status: associatedDraft.status,
              draft_type: associatedDraft.draft_type,
              ai_generated_text: associatedDraft.ai_generated_text,
              edited_text: associatedDraft.edited_text,
              created_at: associatedDraft.created_at,
              updated_at: associatedDraft.updated_at,
            }
          : null,
      }
    })

  return <ApprovalsView initialItems={approvalItems} accounts={accounts} />
}
