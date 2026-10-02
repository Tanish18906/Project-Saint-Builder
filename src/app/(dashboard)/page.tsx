import { createClient } from '@/lib/supabase/server'
import {
  HomeCommandCentreView,
  type EmailRecord,
  type AccountRecord,
  type DraftRecord,
  type AuditRecord,
} from '@/components/home'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const supabase = await createClient()

  // All 4 queries in parallel — no sequential blocking
  const [
    { data: emailsData, error: emailsError },
    { data: accountsData },
    { data: draftsData },
    { data: auditData },
  ] = await Promise.all([
    supabase
      .from('emails')
      .select(`
        id,
        account_id,
        message_id,
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
      .limit(20),
    supabase
      .from('accounts')
      .select('id, email_address, display_name')
      .order('email_address', { ascending: true }),
    supabase
      .from('drafts')
      .select('id, email_id, status, draft_type, ai_generated_text, edited_text, created_at, updated_at')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(10),
    supabase
      .from('audit_log')
      .select(`
        id,
        action,
        email_id,
        user_id,
        details,
        created_at,
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
      .limit(8),
  ])

  if (emailsError) {
    console.error('[Home] Error fetching emails:', emailsError.message || emailsError.code)
  }

  const emails = (emailsData as unknown as EmailRecord[]) || []
  const accounts = (accountsData as unknown as AccountRecord[]) || []
  const pendingDrafts = (draftsData as unknown as DraftRecord[]) || []
  const recentAudit = (auditData as unknown as AuditRecord[]) || []

  return (
    <HomeCommandCentreView
      initialEmails={emails}
      accounts={accounts}
      initialPendingDrafts={pendingDrafts}
      initialRecentAudit={recentAudit}
    />
  )
}
