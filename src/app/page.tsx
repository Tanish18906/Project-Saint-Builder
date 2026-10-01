import { createClient } from '@/lib/supabase/server'
import { AppShell } from '@/components/shell'
import {
  HomeCommandCentreView,
  type EmailRecord,
  type AccountRecord,
  type DraftRecord,
  type AuditRecord,
} from '@/components/home'

export const dynamic = 'force-dynamic'

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>

async function fetchEmailsWithRetry(supabase: SupabaseServerClient) {
  let res = await supabase
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

  if (res.error) {
    // Retry once after 200ms on transient network / DNS glitches
    await new Promise((r) => setTimeout(r, 200))
    res = await supabase
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
  }

  return res
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

async function fetchPendingDraftsWithRetry(supabase: SupabaseServerClient) {
  let res = await supabase
    .from('drafts')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  if (res.error) {
    await new Promise((r) => setTimeout(r, 200))
    res = await supabase
      .from('drafts')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
  }

  return res
}

async function fetchRecentAuditWithRetry(supabase: SupabaseServerClient) {
  let res = await supabase
    .from('audit_log')
    .select(`
      *,
      emails (
        id,
        subject,
        from_name,
        from_address
      ),
      users (
        id,
        name,
        email,
        role
      )
    `)
    .order('created_at', { ascending: false })
    .limit(8)

  if (res.error) {
    await new Promise((r) => setTimeout(r, 200))
    res = await supabase
      .from('audit_log')
      .select(`
        *,
        emails (
          id,
          subject,
          from_name,
          from_address
        ),
        users (
          id,
          name,
          email,
          role
        )
      `)
      .order('created_at', { ascending: false })
      .limit(8)
  }

  return res
}

export default async function HomePage() {
  const supabase = await createClient()

  // Concurrently fetch user, emails, accounts, pending drafts, and recent audit in parallel
  const [
    { data: userData },
    { data: emailsData, error: emailsError },
    { data: accountsData, error: accountsError },
    { data: draftsData, error: draftsError },
    { data: auditData, error: auditError },
  ] = await Promise.all([
    supabase.auth.getUser(),
    fetchEmailsWithRetry(supabase),
    fetchAccountsWithRetry(supabase),
    fetchPendingDraftsWithRetry(supabase),
    fetchRecentAuditWithRetry(supabase),
  ])

  if (emailsError) {
    console.error(
      '[Home] Error fetching emails:',
      emailsError.message || emailsError.code || JSON.stringify(emailsError)
    )
  }

  if (accountsError) {
    console.error(
      '[Home] Error fetching accounts:',
      accountsError.message || accountsError.code || JSON.stringify(accountsError)
    )
  }

  if (draftsError) {
    console.error(
      '[Home] Error fetching pending drafts:',
      draftsError.message || draftsError.code || JSON.stringify(draftsError)
    )
  }

  if (auditError) {
    console.error(
      '[Home] Error fetching recent audit:',
      auditError.message || auditError.code || JSON.stringify(auditError)
    )
  }

  const user = userData?.user
  const emails = (emailsData as unknown as EmailRecord[]) || []
  const accounts = (accountsData as unknown as AccountRecord[]) || []
  const pendingDrafts = (draftsData as unknown as DraftRecord[]) || []
  const recentAudit = (auditData as unknown as AuditRecord[]) || []

  return (
    <AppShell userEmail={user?.email} currentPath="/">
      <HomeCommandCentreView
        initialEmails={emails}
        accounts={accounts}
        initialPendingDrafts={pendingDrafts}
        initialRecentAudit={recentAudit}
        userEmail={user?.email}
      />
    </AppShell>
  )
}
