import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/Navbar'
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
  const logs = auditLogsData || []

  return (
    <div className="min-h-screen bg-[#f5f1e8] text-[#1c1a17]">
      <Navbar userEmail={user?.email} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AuditLogView initialLogs={logs as any} />
      </main>
    </div>
  )
}
