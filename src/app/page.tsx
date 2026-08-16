import { createClient } from '@/lib/supabase/server'
import { logout } from '@/app/login/actions'
import { LogOut, CheckCircle2, UserCircle } from 'lucide-react'

export default async function Home() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: emails, error: emailsError } = await supabase
    .from('emails')
    .select('*, accounts(email_address, display_name)')
    .order('received_at', { ascending: false })

  const { data: accounts, error: accountsError } = await supabase
    .from('accounts')
    .select('*')

  return (
    <div className="min-h-screen bg-[#f5f1e8] text-[#1c1a17]">
      {/* Header Bar */}
      <header className="bg-[#1c1a17] text-[#f5f1e8] px-6 py-4 flex items-center justify-between border-b border-[#2a2723]">
        <div className="flex items-center gap-3">
          <span className="font-bold text-lg tracking-tight">Foreman</span>
          <span className="text-xs uppercase tracking-wider text-[#e8e2d4]/70 px-2 py-0.5 rounded bg-[#2a2723]">
            Phase 2 Auth Verified
          </span>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1.5 text-[#e8e2d4]">
            <UserCircle className="w-4 h-4 text-[#e8e2d4]/70" />
            <span>{user?.email || 'Authenticated User'}</span>
          </div>
          <form action={logout}>
            <button
              type="submit"
              className="flex items-center gap-1.5 text-xs bg-[#2a2723] hover:bg-[#3a3530] text-[#f5f1e8] px-3 py-1.5 rounded transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          </form>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Auth status card */}
        <div className="bg-white p-5 rounded-lg border border-[#e8e2d4] shadow-sm flex items-start gap-3.5">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <h2 className="font-semibold text-base">Authentication & Route Protection Active</h2>
            <p className="text-xs text-[#6b6559] mt-0.5">
              Unauthenticated users are automatically redirected to <code className="bg-[#f5f1e8] px-1 py-0.5 rounded">/login</code> via Next.js middleware.
            </p>
          </div>
        </div>

        {/* Database state summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-5 rounded-lg border border-[#e8e2d4] shadow-sm">
            <h3 className="font-semibold text-sm uppercase tracking-wider text-[#6b6559] mb-3">
              Accounts in Database ({accounts?.length || 0})
            </h3>
            {accountsError ? (
              <p className="text-xs text-red-600">{accountsError.message}</p>
            ) : (
              <pre className="text-xs bg-[#f5f1e8] p-3 rounded overflow-x-auto max-h-60">
                {JSON.stringify(accounts, null, 2)}
              </pre>
            )}
          </div>

          <div className="bg-white p-5 rounded-lg border border-[#e8e2d4] shadow-sm">
            <h3 className="font-semibold text-sm uppercase tracking-wider text-[#6b6559] mb-3">
              Emails in Database ({emails?.length || 0})
            </h3>
            {emailsError ? (
              <p className="text-xs text-red-600">{emailsError.message}</p>
            ) : (
              <pre className="text-xs bg-[#f5f1e8] p-3 rounded overflow-x-auto max-h-60">
                {JSON.stringify(emails, null, 2)}
              </pre>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
