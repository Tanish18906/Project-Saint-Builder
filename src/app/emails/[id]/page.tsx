import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/Navbar'
import { EmailDetailView } from '@/components/EmailDetailView'

export const dynamic = 'force-dynamic'

interface EmailDetailPageProps {
  params: Promise<{ id: string }>
}

async function fetchEmailDetailWithRetry(supabase: any, id: string) {
  let res = await supabase
    .from('emails')
    .select(`
      *,
      accounts (
        id,
        email_address,
        display_name
      )
    `)
    .eq('id', id)
    .single()

  if (res.error) {
    await new Promise((r) => setTimeout(r, 200))
    res = await supabase
      .from('emails')
      .select(`
        *,
        accounts (
          id,
          email_address,
          display_name
        )
      `)
      .eq('id', id)
      .single()
  }

  return res
}

export default async function EmailDetailPage({ params }: EmailDetailPageProps) {
  const { id } = await params
  const supabase = await createClient()

  // Concurrently fetch user, email, draft, and classification audit log in parallel
  const [
    { data: userData },
    { data: email, error: emailError },
    { data: draft },
    { data: auditLogs },
  ] = await Promise.all([
    supabase.auth.getUser(),
    fetchEmailDetailWithRetry(supabase, id),
    supabase.from('drafts').select('*').eq('email_id', id).maybeSingle(),
    supabase
      .from('audit_log')
      .select('*')
      .eq('email_id', id)
      .eq('action', 'classified')
      .order('created_at', { ascending: false })
      .limit(1),
  ])

  if (emailError || !email) {
    if (emailError) {
      console.error('[EmailDetail] Error fetching email:', emailError.message || emailError.code || JSON.stringify(emailError))
    }
    notFound()
  }

  const user = userData?.user

  let classificationAudit: {
    theme?: string
    urgency?: string
    routed_roles?: string[]
    confidence?: number
    summary?: string
  } | null = null

  if (auditLogs && auditLogs.length > 0 && auditLogs[0].details) {
    const rawDetails = auditLogs[0].details
    if (typeof rawDetails === 'string') {
      try {
        classificationAudit = JSON.parse(rawDetails)
      } catch {
        classificationAudit = null
      }
    } else if (typeof rawDetails === 'object') {
      classificationAudit = rawDetails as any
    }
  }

  return (
    <div className="min-h-screen bg-[#f5f1e8] text-[#1c1a17]">
      <Navbar userEmail={user?.email} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6">
        <EmailDetailView
          email={email as any}
          draft={draft}
          classificationAudit={classificationAudit}
        />
      </main>
    </div>
  )
}
