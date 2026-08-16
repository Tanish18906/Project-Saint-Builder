import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/Navbar'
import { InboxView } from '@/components/InboxView'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const supabase = await createClient()

  // Authenticated user check
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Fetch emails with joined account metadata
  const { data: emailsData, error: emailsError } = await supabase
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

  // Fetch monitored accounts
  const { data: accountsData, error: accountsError } = await supabase
    .from('accounts')
    .select('id, email_address, display_name')
    .order('email_address', { ascending: true })

  if (emailsError) {
    console.error('[Inbox] Error fetching emails:', emailsError)
  }

  if (accountsError) {
    console.error('[Inbox] Error fetching accounts:', accountsError)
  }

  const emails = emailsData || []
  const accounts = accountsData || []

  return (
    <div className="min-h-screen bg-[#f5f1e8] text-[#1c1a17]">
      {/* Shell Header */}
      <Navbar userEmail={user?.email} />

      {/* Main Inbox Screen */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <InboxView initialEmails={emails as any} accounts={accounts} />
      </main>
    </div>
  )
}
