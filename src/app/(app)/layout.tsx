import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { fetchNavCounts } from '@/lib/nav-counts'
import { AppShell } from '@/components/shell/app-shell'
import { MailFrame } from '@/components/queue/mail-frame'
import { SIDEBAR_COOKIE } from '@/components/shell/nav-config'
import type { ShellUser } from '@/components/shell/user-menu'

/**
 * Persistent frame for every signed-in dashboard route. Auth itself is still
 * enforced by the middleware; this layout only reads who is signed in.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const cookieStore = await cookies()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const [profileRes, counts] = await Promise.all([
    user
      ? supabase
          .from('users')
          .select('name, role')
          .or(`id.eq.${user.id}${user.email ? `,email.eq."${user.email}"` : ''}`)
          .limit(1)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    fetchNavCounts(supabase),
  ])

  const profile = profileRes.data as { name: string | null; role: string | null } | null
  const shellUser: ShellUser = {
    email: user?.email ?? null,
    name: profile?.name ?? null,
    role: profile?.role ?? null,
  }

  return (
    <AppShell
      user={shellUser}
      initialCounts={counts}
      defaultCollapsed={cookieStore.get(SIDEBAR_COOKIE)?.value === 'collapsed'}
    >
      <MailFrame>{children}</MailFrame>
    </AppShell>
  )
}
