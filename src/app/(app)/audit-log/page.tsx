import { createClient } from '@/lib/supabase/server'
import { AuditLogView } from '@/components/AuditLogView'

export const dynamic = 'force-dynamic'

async function fetchAuditLogsWithRetry(supabase: any) {
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

  const { data: auditLogsData, error } = await fetchAuditLogsWithRetry(supabase)

  if (error) {
    console.error('[AuditLog] Error fetching audit logs:', error.message || error.code || JSON.stringify(error))
  }

  const logs = auditLogsData || []

  // LEGACY SCREEN inside the new shell — replaced in the activity step.
  return (
    <div className="flex-1 bg-canvas">
      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
        <AuditLogView initialLogs={logs as any} />
      </div>
    </div>
  )
}
