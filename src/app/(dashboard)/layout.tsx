import { createClient } from '@/lib/supabase/server'
import { AppShell } from '@/components/shell'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  // Proxy already validated the session; getClaims() verifies locally (no Auth round trip).
  const { data } = await supabase.auth.getClaims()

  return (
    <AppShell userEmail={data?.claims?.email}>
      {children}
    </AppShell>
  )
}
