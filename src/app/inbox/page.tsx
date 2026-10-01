import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { AppShell } from '@/components/shell'
import { InboxView } from '@/components/InboxView'

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

export default async function InboxPage() {
  const supabase = await createClient()

  // Concurrently fetch user, emails, and accounts in parallel with retry resilience
  const [
    { data: userData },
    { data: emailsData, error: emailsError },
    { data: accountsData, error: accountsError },
  ] = await Promise.all([
    supabase.auth.getUser(),
    fetchEmailsWithRetry(supabase),
    fetchAccountsWithRetry(supabase),
  ])

  if (emailsError) {
    console.error(
      '[Inbox] Error fetching emails:',
      emailsError.message || emailsError.code || JSON.stringify(emailsError)
    )
  }

  if (accountsError) {
    console.error(
      '[Inbox] Error fetching accounts:',
      accountsError.message || accountsError.code || JSON.stringify(accountsError)
    )
  }

  const user = userData?.user
  const emails = emailsData || []
  const accounts = accountsData || []

  return (
    <AppShell userEmail={user?.email} currentPath="/inbox">
      <Suspense fallback={<div className="p-8 text-center text-sm text-[var(--text-tertiary)]">Loading inbox feed...</div>}>
        <InboxView initialEmails={emails} accounts={accounts} />
      </Suspense>
    </AppShell>
  )
}
