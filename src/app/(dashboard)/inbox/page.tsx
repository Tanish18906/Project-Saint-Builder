import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { InboxView } from '@/components/InboxView'

export const dynamic = 'force-dynamic'

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>

async function fetchEmails(supabase: SupabaseServerClient) {
  const { data, error } = await supabase
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
    .order('received_at', { ascending: false })
    .limit(50)

  if (error) {
    console.error('[Inbox] Error fetching emails:', error.message || error.code)
  }

  return data || []
}

async function fetchAccounts(supabase: SupabaseServerClient) {
  const { data, error } = await supabase
    .from('accounts')
    .select('id, email_address, display_name')
    .order('email_address', { ascending: true })

  if (error) {
    console.error('[Inbox] Error fetching accounts:', error.message || error.code)
  }

  return data || []
}

export default async function InboxPage() {
  const supabase = await createClient()

  const [emails, accounts] = await Promise.all([
    fetchEmails(supabase),
    fetchAccounts(supabase),
  ])

  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-[var(--text-tertiary)]">Loading inbox feed...</div>}>
      <InboxView initialEmails={emails} accounts={accounts} />
    </Suspense>
  )
}
