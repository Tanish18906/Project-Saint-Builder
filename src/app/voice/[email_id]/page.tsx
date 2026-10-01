import React from 'react'
import Link from 'next/link'
import { verifyVoiceToken } from '@/lib/voice-token'
import { createClient } from '@/lib/supabase/server'
import { VoiceEmailView } from '@/components/voice'
import { AlertCircle, ShieldAlert, ArrowRight, RotateCcw, Clock } from 'lucide-react'
import type { VoiceEmailItem, VoiceDraftItem } from '@/components/voice/types'

export const dynamic = 'force-dynamic'

interface VoicePageProps {
  params: Promise<{
    email_id: string
  }>
  searchParams: Promise<{
    token?: string
  }>
}

/**
 * Timeout helper to prevent hanging queries on slow connections
 */
function withTimeout<T>(promise: PromiseLike<T> | Promise<T>, timeoutMs = 12000): Promise<T> {
  return Promise.race([
    Promise.resolve(promise) as Promise<T>,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Database fetch timed out after ${timeoutMs}ms`)), timeoutMs)
    ),
  ])
}

async function fetchVoiceEmailData(
  supabase: Awaited<ReturnType<typeof createClient>>,
  emailId: string
): Promise<{
  email: VoiceEmailItem | null
  draft: VoiceDraftItem | null
  approverName: string | null
}> {
  // Concurrently fetch email and draft in parallel with timeout resilience
  const [emailRes, draftRes] = await Promise.all([
    withTimeout(
      supabase
        .from('emails')
        .select('*, accounts(id, email_address, display_name)')
        .eq('id', emailId)
        .maybeSingle(),
      12000
    ),
    withTimeout(
      supabase
        .from('drafts')
        .select('*')
        .eq('email_id', emailId)
        .order('created_at', { ascending: false })
        .limit(1),
      12000
    ),
  ])

  let email = (emailRes?.data as VoiceEmailItem) || null
  let draft = ((Array.isArray(draftRes?.data) ? draftRes.data[0] : draftRes?.data) as VoiceDraftItem) || null

  // If email was not found, retry once quickly (250ms) to guard against replication lag
  if (!email) {
    await new Promise((r) => setTimeout(r, 250))
    const retryEmailRes = await withTimeout(
      supabase
        .from('emails')
        .select('*, accounts(id, email_address, display_name)')
        .eq('id', emailId)
        .maybeSingle(),
      8000
    )
    email = (retryEmailRes?.data as VoiceEmailItem) || null
  }

  // If draft was not found (e.g. OpenAI drafting in Workflow 1 is finishing), retry after 400ms
  if (!draft) {
    await new Promise((r) => setTimeout(r, 400))
    const retryDraftRes = await withTimeout(
      supabase
        .from('drafts')
        .select('*')
        .eq('email_id', emailId)
        .order('created_at', { ascending: false })
        .limit(1),
      8000
    )
    draft = ((Array.isArray(retryDraftRes?.data) ? retryDraftRes.data[0] : retryDraftRes?.data) as VoiceDraftItem) || null
  }

  // Fetch approver name if approved_by exists on draft
  let approverName: string | null = null
  if (draft?.approved_by) {
    try {
      const { data: approverUser } = await withTimeout(
        supabase.from('users').select('name').eq('id', draft.approved_by).maybeSingle(),
        6000
      )
      if (approverUser?.name) {
        approverName = approverUser.name as string
      }
    } catch {
      approverName = null
    }
  }

  return { email, draft, approverName }
}

export default async function VoicePage({ params, searchParams }: VoicePageProps) {
  let emailId = ''
  let token: string | undefined = undefined

  try {
    const resolvedParams = await params
    const resolvedSearchParams = await searchParams

    emailId = (resolvedParams?.email_id || '').trim()
    token = resolvedSearchParams?.token
  } catch (err: unknown) {
    console.error('[VoicePage] Error resolving route parameters:', err)
  }

  // 1. Verify Signed Token with clean failure handling
  const verification = verifyVoiceToken(token, emailId)

  if (!verification.valid) {
    const isExpired = verification.error === 'expired'
    const isMismatch = verification.error === 'email_mismatch'

    return (
      <div className="min-h-screen bg-[var(--app-bg)] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl border border-[var(--border-subtle)] p-6 shadow-sm text-center space-y-4">
          <div className="w-14 h-14 bg-red-100 text-red-700 rounded-full mx-auto flex items-center justify-center shadow-inner">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <div className="space-y-1.5">
            <h1 className="text-lg font-bold text-[var(--text-primary)]">
              {isExpired ? 'Voice Link Expired' : 'Invalid Voice Link'}
            </h1>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              {isExpired
                ? 'This voice review link has expired (24h security validity period). Please access this message from the Foreman review dashboard or request a new alert.'
                : isMismatch
                ? 'This token does not match the requested email. Please use the direct link received in your alert notification.'
                : 'This voice link is invalid or missing required security credentials. For security, please log in to the Foreman review dashboard.'}
            </p>
            {verification.errorMessage && (
              <p className="text-[11px] text-[var(--text-tertiary)] font-mono pt-1">
                Reason: {verification.errorMessage}
              </p>
            )}
          </div>
          <div className="pt-2 space-y-2">
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-[var(--brand)] hover:bg-[var(--brand-light)] text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
            >
              <span>Go to Dashboard Login</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // 2. Fetch Email and Draft data with timeout and error fallback
  let emailData: {
    email: VoiceEmailItem | null
    draft: VoiceDraftItem | null
    approverName: string | null
  } | null = null
  let dbError = false

  try {
    const supabase = await createClient()
    emailData = await fetchVoiceEmailData(supabase, emailId)
  } catch (err: unknown) {
    console.error('[VoicePage] Database query exception:', err)
    dbError = true
  }

  if (dbError) {
    return (
      <div className="min-h-screen bg-[var(--app-bg)] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl border border-[var(--border-subtle)] p-6 shadow-sm text-center space-y-4">
          <div className="w-14 h-14 bg-amber-100 text-amber-700 rounded-full mx-auto flex items-center justify-center shadow-inner">
            <Clock className="w-7 h-7" />
          </div>
          <div className="space-y-1.5">
            <h1 className="text-lg font-bold text-[var(--text-primary)]">Connection Timeout</h1>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              We experienced a temporary delay retrieving this email. Please check your network connection and tap below to retry.
            </p>
          </div>
          <div className="pt-2 space-y-2">
            <Link
              href={`/voice/${emailId}?token=${encodeURIComponent(token || '')}`}
              className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-[var(--brand)] hover:bg-[var(--brand-light)] text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retry Loading Voice Page</span>
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-white hover:bg-[var(--surface-subtle)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-xs font-semibold rounded-xl transition-colors cursor-pointer"
            >
              <span>Go to Dashboard</span>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (!emailData?.email) {
    return (
      <div className="min-h-screen bg-[var(--app-bg)] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl border border-[var(--border-subtle)] p-6 shadow-sm text-center space-y-4">
          <div className="w-14 h-14 bg-amber-100 text-amber-700 rounded-full mx-auto flex items-center justify-center shadow-inner">
            <AlertCircle className="w-7 h-7" />
          </div>
          <div className="space-y-1.5">
            <h1 className="text-lg font-bold text-[var(--text-primary)]">Email Not Found</h1>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              The email associated with ID <span className="font-mono text-[var(--text-primary)]">{emailId.slice(0, 8)}...</span> could not be found in the database.
            </p>
          </div>
          <div className="pt-2">
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-[var(--brand)] hover:bg-[var(--brand-light)] text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
            >
              <span>Go to Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <VoiceEmailView
      email={emailData.email}
      draft={emailData.draft}
      approverName={emailData.approverName}
      token={token!}
    />
  )
}
