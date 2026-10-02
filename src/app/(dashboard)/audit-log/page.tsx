import { createClient } from '@/lib/supabase/server'
import { AuditLogView, type AuditLogItem } from '@/components/AuditLogView'

export const dynamic = 'force-dynamic'

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>

async function fetchAuditLogs(supabase: SupabaseServerClient) {
  const { data, error } = await supabase
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
    .limit(50)

  if (error) {
    console.error('[AuditLog] Error fetching audit logs:', error.message || error.code)
  }

  return (data || []) as unknown as AuditLogItem[]
}

export default async function AuditLogPage() {
  const supabase = await createClient()
  const logs = await fetchAuditLogs(supabase)

  return <AuditLogView initialLogs={logs} />
}
