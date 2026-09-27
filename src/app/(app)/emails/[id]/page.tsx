import { cache } from 'react'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { getWorkspaceData } from '@/lib/workspace'
import { ReviewWorkspace } from '@/components/workspace/review-workspace'
import { WorkspaceLoadError, WorkspaceUnavailable } from '@/components/workspace/workspace-states'

export const dynamic = 'force-dynamic'

interface EmailPageProps {
  params: Promise<{ id: string }>
}

// Shared by generateMetadata and the page within one request.
const loadWorkspace = cache(async (id: string) => getWorkspaceData(await createClient(), id))

export async function generateMetadata({ params }: EmailPageProps): Promise<Metadata> {
  const data = await loadWorkspace((await params).id)
  return { title: data.status === 'ok' ? `${data.email.subject || '(No subject)'} · Foreman` : 'Email · Foreman' }
}

/**
 * `/emails/[id]` — the review workspace. The canonical, deep-linkable URL for
 * an email (WhatsApp links land here). The queue pane beside it is rendered by
 * MailFrame in the layout; the queue context (view, search, filters) is in the
 * query string.
 */
export default async function EmailPage({ params }: EmailPageProps) {
  const { id } = await params
  const data = await loadWorkspace(id)

  if (data.status === 'not_found') return <WorkspaceUnavailable />
  if (data.status === 'error') return <WorkspaceLoadError />

  return <ReviewWorkspace email={data.email} draft={data.draft} triage={data.triage} events={data.events} thread={data.thread} />
}
