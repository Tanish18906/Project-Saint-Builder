import { createClient } from '@/lib/supabase/server'
import { AppShell } from '@/components/shell'
import { AuditLogView, type AuditLogItem } from '@/components/AuditLogView'

export const dynamic = 'force-dynamic'

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>

async function fetchAuditLogsWithRetry(supabase: SupabaseServerClient) {
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
  }

  return res
}

export default async function AuditLogPage() {
  const supabase = await createClient()

  // Concurrently fetch user and audit logs in parallel
  const [
    { data: userData },
    { data: auditLogsData, error },
  ] = await Promise.all([
    supabase.auth.getUser(),
    fetchAuditLogsWithRetry(supabase),
  ])

  if (error) {
    console.error('[AuditLog] Error fetching audit logs:', error.message || error.code || JSON.stringify(error))
  }

  const user = userData?.user
  const logs = (auditLogsData || []) as unknown as AuditLogItem[]

  return (
    <AppShell userEmail={user?.email} currentPath="/audit-log">
      <AuditLogView initialLogs={logs} />
    </AppShell>
  )
}
