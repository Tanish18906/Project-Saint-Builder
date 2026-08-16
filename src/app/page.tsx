import { createClient } from '@/lib/supabase/server'

export default async function Home() {
  const supabase = await createClient()

  const { data: emails, error: emailsError } = await supabase
    .from('emails')
    .select('*, accounts(email_address, display_name)')
    .order('received_at', { ascending: false })

  const { data: accounts, error: accountsError } = await supabase
    .from('accounts')
    .select('*')

  console.log('[Supabase Phase 1 Connection Test] Emails count:', emails?.length, 'Accounts count:', accounts?.length)
  if (emailsError) console.error('[Supabase Phase 1 Connection Test] Emails Error:', emailsError)
  if (accountsError) console.error('[Supabase Phase 1 Connection Test] Accounts Error:', accountsError)

  return (
    <div style={{ padding: '2rem', fontFamily: 'monospace', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>Foreman Dashboard — Phase 1 Connection Test</h1>
      <p style={{ color: '#16a34a', fontWeight: 'bold' }}>
        Status: {emailsError || accountsError ? 'Connection Error' : 'Connected to Supabase successfully'}
      </p>

      {emailsError && (
        <div style={{ color: 'red', marginTop: '1rem' }}>
          <strong>Emails Fetch Error:</strong> {emailsError.message}
        </div>
      )}

      {accountsError && (
        <div style={{ color: 'red', marginTop: '1rem' }}>
          <strong>Accounts Fetch Error:</strong> {accountsError.message}
        </div>
      )}

      <h2>Accounts ({accounts?.length || 0})</h2>
      <pre style={{ background: '#f4f4f5', padding: '1rem', borderRadius: '6px', overflowX: 'auto' }}>
        {JSON.stringify(accounts, null, 2)}
      </pre>

      <h2>Emails ({emails?.length || 0})</h2>
      <pre style={{ background: '#f4f4f5', padding: '1rem', borderRadius: '6px', overflowX: 'auto' }}>
        {JSON.stringify(emails, null, 2)}
      </pre>
    </div>
  )
}
