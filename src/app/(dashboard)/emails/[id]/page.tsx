import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { EmailDetailView, type EmailRecord } from '@/components/EmailDetailView'

export const dynamic = 'force-dynamic'

interface EmailDetailPageProps {
  params: Promise<{ id: string }>
}

type ServerSupabaseClient = Awaited<ReturnType<typeof createClient>>

async function fetchEmailDetail(supabase: ServerSupabaseClient, id: string) {
  const { data, error } = await supabase
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

  return { data, error }
}

export default async function EmailDetailPage({ params }: EmailDetailPageProps) {
  const { id } = await params
  const supabase = await createClient()

  // All 3 queries in parallel
  const [
    { data: email, error: emailError },
    { data: draft },
    { data: auditLogs },
  ] = await Promise.all([
    fetchEmailDetail(supabase, id),
    supabase.from('drafts').select('*').eq('email_id', id).maybeSingle(),
    supabase
      .from('audit_log')
      .select('details')
      .eq('email_id', id)
      .eq('action', 'classified')
      .order('created_at', { ascending: false })
      .limit(1),
  ])

  if (emailError || !email) {
    if (emailError) {
      console.error('[EmailDetail] Error fetching email:', emailError.message || emailError.code)
    }
    notFound()
  }

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
      classificationAudit = rawDetails as unknown as typeof classificationAudit
    }
  }

  return (
    <EmailDetailView
      email={email as unknown as EmailRecord}
      draft={draft}
      classificationAudit={classificationAudit}
    />
  )
}
