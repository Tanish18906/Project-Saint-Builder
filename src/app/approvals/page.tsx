import { createClient } from '@/lib/supabase/server'
import { AppShell } from '@/components/shell'
import { ApprovalsView, type ApprovalItem } from '@/components/approvals'

export const dynamic = 'force-dynamic'

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>

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

async function fetchAccountsWithRetry(supabase: SupabaseServerClient) {
  let res = await supabase
    .from('accounts')
    .select('id, email_address, display_name')
    .order('email_address', { ascending: true })

  if (res.error) {
    await new Promise((r) => setTimeout(r, 200))
    res = await supabase
      .from('accounts')
      .select('id, email_address, display_name')
      .order('email_address', { ascending: true })
  }

  return res
}

async function fetchPendingApprovals(supabase: SupabaseServerClient) {
  try {
    // 1. Fetch pending drafts
    const { data: pendingDrafts, error: draftsError } = await supabase
      .from('drafts')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    if (draftsError) {
      console.error('[Approvals] Error fetching pending drafts:', draftsError)
    }

    const drafts = (pendingDrafts as unknown as DraftRow[]) || []
    const pendingEmailIds: string[] = drafts
      .map((d) => d.email_id)
      .filter(Boolean)

    // 2. Fetch associated emails
    let emailsQuery = supabase
      .from('emails')
      .select(`
        *,
        accounts (
          id,
          email_address,
          display_name
        )
      `)
      .order('received_at', { ascending: false })

    if (pendingEmailIds.length > 0) {
      emailsQuery = emailsQuery.or(
        `id.in.(${pendingEmailIds.join(',')}),status.in.(drafted,pending)`
      )
    } else {
      emailsQuery = emailsQuery.in('status', ['drafted', 'pending'])
    }

    const { data: emailsData, error: emailsError } = await emailsQuery

    if (emailsError) {
      console.error('[Approvals] Error fetching emails for approvals:', emailsError)
    }

    const emails = (emailsData as unknown as EmailRow[]) || []

    // 3. Map email records to ApprovalItems
    const approvalItems: ApprovalItem[] = emails
      .filter((email) => {
        // Exclude emails already approved, sent, or discarded
        const s = (email.status || '').toLowerCase()
        return s !== 'approved' && s !== 'sent' && s !== 'discarded'
      })
      .map((email) => {
        const associatedDraft = drafts.find(
          (d) => d.email_id === email.id
        )

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

    return approvalItems
  } catch (err) {
    console.error('[Approvals] Failed to fetch approvals:', err)
    return []
  }
}

export default async function ApprovalsPage() {
  const supabase = await createClient()

  const [
    { data: userData },
    approvalItems,
    { data: accountsData },
  ] = await Promise.all([
    supabase.auth.getUser(),
    fetchPendingApprovals(supabase),
    fetchAccountsWithRetry(supabase),
  ])

  const user = userData?.user
  const accounts = accountsData || []

  return (
    <AppShell userEmail={user?.email} currentPath="/approvals">
      <ApprovalsView initialItems={approvalItems} accounts={accounts} />
    </AppShell>
  )
}
