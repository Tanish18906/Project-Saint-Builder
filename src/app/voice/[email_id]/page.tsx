import React from 'react'
import Link from 'next/link'
import { verifyVoiceToken } from '@/lib/voice-token'
import { createClient } from '@/lib/supabase/server'
import { VoiceEmailView } from '@/components/VoiceEmailView'
import { AlertCircle, ShieldAlert, ArrowRight } from 'lucide-react'

interface VoicePageProps {
  params: Promise<{
    email_id: string
  }>
  searchParams: Promise<{
    token?: string
  }>
}

export default async function VoicePage({ params, searchParams }: VoicePageProps) {
  const resolvedParams = await params
  const resolvedSearchParams = await searchParams

  const emailId = resolvedParams.email_id
  const token = resolvedSearchParams.token

  // 1. Verify Signed Token
  const verification = verifyVoiceToken(token, emailId)

  if (!verification.valid) {
    return (
      <div className="min-h-screen bg-[#f5f1e8] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl border border-[#e8e2d4] p-6 shadow-sm text-center space-y-4">
          <div className="w-14 h-14 bg-red-100 text-red-700 rounded-full mx-auto flex items-center justify-center">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h1 className="text-lg font-bold text-[#1c1a17]">Link Expired or Invalid</h1>
            <p className="text-xs text-[#6b6559] leading-relaxed">
              This voice link has expired or is invalid. For security reasons, please access and manage this email directly from the Foreman dashboard.
            </p>
          </div>
          <div className="pt-2">
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-[#1c1a17] hover:bg-[#2a2723] text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
            >
              <span>Go to Dashboard Login</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // 2. Fetch Email and Draft data from Supabase
  const supabase = await createClient()

  const { data: email, error: emailError } = await supabase
    .from('emails')
    .select('*, accounts(email_address, display_name)')
    .eq('id', emailId)
    .single()

  if (emailError || !email) {
    return (
      <div className="min-h-screen bg-[#f5f1e8] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl border border-[#e8e2d4] p-6 shadow-sm text-center space-y-4">
          <div className="w-14 h-14 bg-amber-100 text-amber-700 rounded-full mx-auto flex items-center justify-center">
            <AlertCircle className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h1 className="text-lg font-bold text-[#1c1a17]">Email Not Found</h1>
            <p className="text-xs text-[#6b6559] leading-relaxed">
              The email associated with this voice link could not be found in the database.
            </p>
          </div>
          <div className="pt-2">
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-[#1c1a17] hover:bg-[#2a2723] text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
            >
              <span>Go to Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Fetch linked draft
  const { data: draft } = await supabase
    .from('drafts')
    .select('*')
    .eq('email_id', emailId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  // Fetch approver name if approved_by exists
  let approverName: string | null = null
  if (draft?.approved_by) {
    const { data: approverUser } = await supabase
      .from('users')
      .select('name')
      .eq('id', draft.approved_by)
      .single()

    if (approverUser) {
      approverName = approverUser.name
    }
  }

  return (
    <VoiceEmailView
      email={email}
      draft={draft}
      approverName={approverName}
      token={token!}
    />
  )
}
