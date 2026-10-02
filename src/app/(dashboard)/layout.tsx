import { createClient } from '@/lib/supabase/server'
import { AppShell } from '@/components/shell'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()

  return (
    <AppShell userEmail={userData?.user?.email}>
      {children}
    </AppShell>
  )
}
