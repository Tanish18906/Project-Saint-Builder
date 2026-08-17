'use client'

import React, { useState, useEffect, useRef, useTransition } from 'react'
import {
  Mic,
  Volume2,
  VolumeX,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
  Loader2,
  Lock,
  ChevronDown,
  ChevronUp,
  FileText,
  Send,
  Trash2,
  Save,
  RotateCcw,
  User,
  Clock,
  Building2,
  ExternalLink,
} from 'lucide-react'
import { CategoryBadge } from '@/components/CategoryBadge'
import { StatusBadge } from '@/components/StatusBadge'
import { parseVoiceCommand, VoiceActionType } from '@/lib/voice-commands'
import {
  saveDraftAction,
  approveAndSendAction,
  discardDraftAction,
} from '@/app/emails/[id]/actions'
import { createClient } from '@/lib/supabase/client'

export interface VoiceEmailViewProps {
  email: {
    id: string
    account_id: string
    message_id: string
    from_address: string
    from_name: string | null
    subject: string | null
    body_text: string | null
    body_html: string | null
    received_at: string
    category: string | null
    routed_role: string | null
    status: string
    accounts?: {
      email_address: string
      display_name: string | null
    } | null
  }
  draft: {
    id: string
    email_id: string
    ai_generated_text: string | null
    edited_text: string | null
    draft_type: string
    status: string
    approved_by: string | null
    approved_at: string | null
    sent_at: string | null
  } | null
  approverName?: string | null
  token: string
}

type VoiceUIState = 'idle' | 'listening' | 'processing' | 'speaking'

export function VoiceEmailView({
  email,
  draft: initialDraft,
  approverName,
  token,
}: VoiceEmailViewProps) {
  const [draft, setDraft] = useState(initialDraft)
  const initialText = draft?.edited_text || draft?.ai_generated_text || ''
  const [draftText, setDraftText] = useState<string>(initialText)
  const [wasDiscarded, setWasDiscarded] = useState<boolean>(false)

  // Voice States
  const [uiState, setUiState] = useState<VoiceUIState>('idle')
  const [feedback, setFeedback] = useState<{
    type: 'info' | 'success' | 'warning' | 'error'
    message: string
  } | null>(null)
  const [lastTranscript, setLastTranscript] = useState<string>('')
  const [showTextFallback, setShowTextFallback] = useState<boolean>(false)
  const [micPermissionDenied, setMicPermissionDenied] = useState<boolean>(false)

  // Audio elements & Playback Control
  const activeAudioRef = useRef<HTMLAudioElement | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const isRecordingRef = useRef<boolean>(false)
  const speechUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null)
  const playbackSeqRef = useRef<number>(0)
  const hasAutoPlayedRef = useRef<boolean>(false)
  const [autoplayBlocked, setAutoplayBlocked] = useState<boolean>(false)

  const [isPending, startTransition] = useTransition()

  const isUrgent = (email.category || '').toLowerCase() === 'urgent'
  const isSent = draft?.status === 'sent' || email.status === 'sent'
  const isApproved = draft?.status === 'approved' || email.status === 'approved'
  const isLocked = isApproved || isSent

  // 1. Supabase Realtime Subscription
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`realtime-voice-${email.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'drafts',
          filter: `email_id=eq.${email.id}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const updated = payload.new as any
            setDraft(updated)
            if (updated.edited_text || updated.ai_generated_text) {
              setDraftText(updated.edited_text || updated.ai_generated_text || '')
            }
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [email.id])

  // Stop any ongoing audio playback immediately
  const stopAudio = () => {
    // Invalidate in-flight TTS requests
    playbackSeqRef.current++

    if (activeAudioRef.current) {
      activeAudioRef.current.pause()
      activeAudioRef.current.currentTime = 0
      activeAudioRef.current = null
    }
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }
    speechUtteranceRef.current = null
    setUiState((prev) => (prev === 'speaking' ? 'idle' : prev))
  }

  // 2. Play TTS Audio helper (strictly sequential, handles autoplay policies)
  const playTTS = async (textToSpeak: string, onEndCallback?: () => void) => {
    if (!textToSpeak.trim()) return

    stopAudio()
    const currentSeq = ++playbackSeqRef.current
    setUiState('speaking')

    try {
      const res = await fetch('/api/voice/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-voice-token': token,
        },
        body: JSON.stringify({
          text: textToSpeak,
          token,
          emailId: email.id,
        }),
      })

      // If a newer playback or stop was requested while fetching, abort
      if (playbackSeqRef.current !== currentSeq) {
        return
      }

      if (!res.ok) {
        throw new Error('TTS request failed')
      }

      const contentType = res.headers.get('content-type') || ''
      if (contentType.includes('audio/mpeg') || contentType.includes('audio/wav')) {
        const blob = await res.blob()
        if (playbackSeqRef.current !== currentSeq) return

        const audioUrl = URL.createObjectURL(blob)
        const audio = new Audio(audioUrl)
        activeAudioRef.current = audio

        audio.onended = () => {
          if (playbackSeqRef.current === currentSeq) {
            setUiState('idle')
            activeAudioRef.current = null
            if (onEndCallback) onEndCallback()
          }
        }

        audio.onerror = () => {
          if (playbackSeqRef.current === currentSeq) {
            console.warn('[Audio play error, falling back to browser speech]')
            useBrowserTTSFallback(textToSpeak, currentSeq, onEndCallback)
          }
        }

        try {
          await audio.play()
          setAutoplayBlocked(false)
        } catch (playErr: any) {
          // Handle Browser Autoplay Policy restrictions
          if (playErr.name === 'NotAllowedError' || playErr.message?.includes('user')) {
            console.warn('[Autoplay prevented by browser security policy, awaiting user touch gesture]')
            setAutoplayBlocked(true)
            setUiState('idle')
            setFeedback({
              type: 'info',
              message: '🔊 Tap anywhere on the screen to play email audio.',
            })

            const unlockAudio = () => {
              window.removeEventListener('click', unlockAudio)
              window.removeEventListener('touchstart', unlockAudio)
              window.removeEventListener('pointerdown', unlockAudio)
              setAutoplayBlocked(false)
              if (activeAudioRef.current) {
                activeAudioRef.current
                  .play()
                  .then(() => setUiState('speaking'))
                  .catch(() => playTTS(textToSpeak, onEndCallback))
              } else {
                playTTS(textToSpeak, onEndCallback)
              }
            }

            window.addEventListener('click', unlockAudio, { once: true })
            window.addEventListener('touchstart', unlockAudio, { once: true })
            window.addEventListener('pointerdown', unlockAudio, { once: true })
            return
          } else {
            console.warn('[Audio play error, falling back to browser speech]', playErr)
            useBrowserTTSFallback(textToSpeak, currentSeq, onEndCallback)
          }
        }
      } else {
        // Explicit browser speech synthesis response
        useBrowserTTSFallback(textToSpeak, currentSeq, onEndCallback)
      }
    } catch (err) {
      if (playbackSeqRef.current === currentSeq) {
        console.warn('[TTS network error, falling back to browser speech]', err)
        useBrowserTTSFallback(textToSpeak, currentSeq, onEndCallback)
      }
    }
  }

  // Browser Speech Synthesis Fallback
  const useBrowserTTSFallback = (text: string, seq: number, onEnd?: () => void) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      if (playbackSeqRef.current === seq) setUiState('idle')
      return
    }

    if (playbackSeqRef.current !== seq) return

    try {
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = 'en-GB'
      utterance.rate = 1.0
      utterance.onend = () => {
        if (playbackSeqRef.current === seq) {
          setUiState('idle')
          if (onEnd) onEnd()
        }
      }
      utterance.onerror = () => {
        if (playbackSeqRef.current === seq) {
          setUiState('idle')
        }
      }
      speechUtteranceRef.current = utterance
      window.speechSynthesis.speak(utterance)
    } catch (e) {
      if (playbackSeqRef.current === seq) setUiState('idle')
    }
  }

  // 3. Auto-play original email body on load (guarded to run exactly once per page load)
  useEffect(() => {
    if (isLocked || hasAutoPlayedRef.current) return
    hasAutoPlayedRef.current = true

    const introText = email.body_text
      ? `Email from ${email.from_name || 'sender'}. Subject: ${email.subject || 'No subject'}. ${email.body_text}`
      : `Email from ${email.from_name || 'sender'}. Subject: ${email.subject || 'No subject'}. No text body provided.`

    // Small delay to allow page render
    const timer = setTimeout(() => {
      setFeedback({
        type: 'info',
        message: 'Playing original email... Hold button below to speak a command or dictate reply.',
      })
      playTTS(introText)
    }, 600)

    return () => {
      clearTimeout(timer)
      stopAudio()
    }
  }, [])

  // 4. Push-to-Talk Handlers
  const startRecording = async () => {
    if (isLocked || uiState === 'processing') return
    stopAudio()

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      audioChunksRef.current = []

      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop())
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        if (audioBlob.size > 1000) {
          await handleProcessAudioBlob(audioBlob)
        } else {
          setUiState('idle')
        }
      }

      mediaRecorder.start()
      isRecordingRef.current = true
      setUiState('listening')
      setMicPermissionDenied(false)
      setFeedback({ type: 'info', message: 'Listening... Release when finished.' })
    } catch (err: any) {
      console.warn('[Microphone permission error]', err)
      setMicPermissionDenied(true)
      setUiState('idle')
      setFeedback({
        type: 'error',
        message: 'Microphone access was blocked. Please enable mic permissions or use text mode.',
      })
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecordingRef.current) {
      isRecordingRef.current = false
      setUiState('processing')
      mediaRecorderRef.current.stop()
    }
  }

  // 5. Speech Transcription and Action Router
  const handleProcessAudioBlob = async (blob: Blob) => {
    setUiState('processing')
    setFeedback({ type: 'info', message: 'Processing your voice...' })

    try {
      const formData = new FormData()
      formData.append('file', blob, 'voice.webm')
      formData.append('token', token)
      formData.append('email_id', email.id)

      const sttRes = await fetch('/api/voice/stt', {
        method: 'POST',
        body: formData,
      })

      if (!sttRes.ok) {
        throw new Error('Speech recognition server error')
      }

      const sttData = await sttRes.json()
      const transcript = (sttData.text || '').trim()

      if (!transcript) {
        setUiState('idle')
        setFeedback({ type: 'warning', message: 'Could not hear any speech. Please try holding the button again.' })
        return
      }

      setLastTranscript(transcript)

      // Parse Command vs Dictation
      const command = parseVoiceCommand(transcript)
      await executeVoiceAction(command)
    } catch (err: any) {
      console.error('[Voice Processing Error]', err)
      setUiState('idle')
      setFeedback({ type: 'error', message: 'Error processing voice. Please try again or use text mode.' })
    }
  }

  // 6. Execute Voice Action
  const executeVoiceAction = async (command: ReturnType<typeof parseVoiceCommand>) => {
    const { action, dictationText, rawText } = command

    // A. Read Draft
    if (action === 'read_draft') {
      const currentDraftToRead = draftText || 'No reply draft has been created yet.'
      setFeedback({ type: 'info', message: `Reading draft reply: "${currentDraftToRead}"` })
      await playTTS(`Here is the current draft reply: ${currentDraftToRead}`)
      return
    }

    // B. AI Tone Rewrite (Formal / Shorter / Technical)
    if (action === 'rewrite_formal' || action === 'rewrite_shorter' || action === 'rewrite_technical') {
      const instruction =
        action === 'rewrite_formal'
          ? 'formal'
          : action === 'rewrite_shorter'
          ? 'shorter'
          : 'technical'

      setUiState('processing')
      setFeedback({
        type: 'info',
        message: `Rewriting draft (${instruction} style)...`,
      })

      try {
        const rewriteRes = await fetch('/api/voice/rewrite', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-voice-token': token,
          },
          body: JSON.stringify({
            currentDraft: draftText,
            instruction,
            routedRole: email.routed_role,
            emailContext: {
              from_name: email.from_name,
              from_address: email.from_address,
              subject: email.subject,
              category: email.category,
              routed_role: email.routed_role,
            },
            token,
            emailId: email.id,
          }),
        })

        const rewriteData = await rewriteRes.json()
        const newText = rewriteData.rewrittenText || draftText

        setDraftText(newText)
        setWasDiscarded(false)

        // Save updated draft to Supabase using shared action
        await saveDraftAction({
          emailId: email.id,
          draftId: draft?.id,
          editedText: newText,
          via: 'voice',
        })

        setFeedback({
          type: 'success',
          message: `Rewrote draft (${instruction}). Playing updated version back...`,
        })

        await playTTS(`Updated draft in ${instruction} style: ${newText}`)
      } catch (err: any) {
        setUiState('idle')
        setFeedback({ type: 'error', message: 'Failed to rewrite draft. Please try again.' })
      }
      return
    }

    // C. Approve & Send
    if (action === 'approve_send') {
      if (!draftText.trim()) {
        setUiState('idle')
        setFeedback({ type: 'warning', message: 'Draft is empty. Please dictate a reply before approving.' })
        await playTTS('The draft is empty. Please speak a reply before approving.')
        return
      }

      setUiState('processing')
      setFeedback({ type: 'info', message: 'Approving draft and triggering email dispatch...' })

      startTransition(async () => {
        const res = await approveAndSendAction({
          emailId: email.id,
          draftId: draft?.id,
          editedText: draftText,
          wasDiscarded,
          via: 'voice',
        })

        if (res.success) {
          if (draft) {
            setDraft({
              ...draft,
              status: 'approved',
              draft_type: res.draftType || 'ai_generated',
              edited_text: draftText,
              approved_at: new Date().toISOString(),
            })
          }
          setFeedback({
            type: 'success',
            message: '✅ Approved! Email has been queued for automated dispatch.',
          })
          await playTTS('Approved. The email has been queued for dispatch.')
        } else {
          setUiState('idle')
          setFeedback({ type: 'error', message: res.error || 'Failed to approve draft.' })
        }
      })
      return
    }

    // D. Discard
    if (action === 'discard') {
      setDraftText('')
      setWasDiscarded(true)

      startTransition(async () => {
        await discardDraftAction({
          emailId: email.id,
          draftId: draft?.id,
          via: 'voice',
        })

        setFeedback({
          type: 'success',
          message: 'Draft discarded. Hold button to dictate a custom replacement reply.',
        })
        await playTTS('Draft cleared. Speak to dictate your reply.')
      })
      return
    }

    // E. Manual Direct Save (from text fallback)
    if (action === 'dictation') {
      const textToSave = command.dictationText || draftText
      startTransition(async () => {
        await saveDraftAction({
          emailId: email.id,
          draftId: draft?.id,
          editedText: textToSave,
          via: 'voice',
        })
        setFeedback({
          type: 'success',
          message: 'Draft saved.',
        })
      })
      return
    }

    // F. Apply Edit (Spoken instruction / dictation incorporated contextually into draft)
    const editInstruction = command.editInstruction || rawText
    if (editInstruction && editInstruction.trim()) {
      setUiState('processing')
      setFeedback({
        type: 'info',
        message: `Applying edit: "${editInstruction}"...`,
      })

      try {
        const rewriteRes = await fetch('/api/voice/rewrite', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-voice-token': token,
          },
          body: JSON.stringify({
            currentDraft: draftText || email.body_text || '',
            instruction: 'apply_edit',
            spokenInstruction: editInstruction,
            routedRole: email.routed_role,
            emailContext: {
              from_name: email.from_name,
              from_address: email.from_address,
              subject: email.subject,
              category: email.category,
              routed_role: email.routed_role,
            },
            token,
            emailId: email.id,
          }),
        })

        const rewriteData = await rewriteRes.json()
        const newText = rewriteData.rewrittenText || draftText

        setDraftText(newText)
        setWasDiscarded(false)

        // Save updated draft to Supabase using shared action
        await saveDraftAction({
          emailId: email.id,
          draftId: draft?.id,
          editedText: newText,
          via: 'voice',
        })

        setFeedback({
          type: 'success',
          message: `Updated draft reply. Playing updated version back...`,
        })

        await playTTS(`Updated draft reply: ${newText}`)
      } catch (err: any) {
        console.error('[Apply Edit Error]', err)
        setUiState('idle')
        setFeedback({ type: 'error', message: 'Failed to apply edit to draft. Please try again.' })
      }
    }
  }

  // Format Received Date
  const formattedDate = new Date(email.received_at).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div className="min-h-screen bg-[#f5f1e8] text-[#1c1a17] flex flex-col items-center justify-between p-4 sm:p-6 font-sans">
      {/* Top Header Card */}
      <header className="w-full max-w-md bg-white rounded-2xl border border-[#e8e2d4] p-4 shadow-sm space-y-2">
        <div className="flex items-center justify-between gap-2 border-b border-[#e8e2d4] pb-2.5">
          <div className="flex items-center gap-2">
            {isUrgent && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-red-700 border border-red-200">
                <ShieldAlert className="w-3 h-3" />
                URGENT
              </span>
            )}
            <CategoryBadge category={email.category} />
            <StatusBadge status={isApproved ? 'approved' : draft?.status || email.status} />
          </div>

          <div className="flex items-center gap-1 text-[11px] font-medium text-[#6b6559] bg-[#f5f1e8] px-2 py-0.5 rounded border border-[#e8e2d4]">
            <User className="w-3 h-3" />
            <span className="capitalize">{email.routed_role ? email.routed_role.replace(/_/g, ' ') : 'Admin'}</span>
          </div>
        </div>

        <div>
          <h1 className="text-base font-bold text-[#1c1a17] leading-snug line-clamp-2">
            {email.subject || '(No Subject)'}
          </h1>
          <p className="text-xs text-[#6b6559] mt-0.5 truncate">
            From: <strong className="text-[#1c1a17]">{email.from_name || 'Sender'}</strong> &lt;{email.from_address}&gt;
          </p>
        </div>
      </header>

      {/* Center Push-To-Talk Audio Experience */}
      <main className="w-full max-w-md my-auto py-6 flex flex-col items-center justify-center space-y-6 text-center">
        {/* Status / Feedback Banner */}
        {feedback && (
          <div
            className={`w-full p-3.5 rounded-xl text-xs flex items-center justify-center gap-2 text-center transition-all ${
              feedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : feedback.type === 'error'
                ? 'bg-red-50 text-red-800 border border-red-200'
                : feedback.type === 'warning'
                ? 'bg-amber-50 text-amber-800 border border-amber-200'
                : 'bg-stone-100 text-stone-800 border border-stone-200'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : feedback.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            ) : (
              <Volume2 className="w-4 h-4 text-stone-600 shrink-0" />
            )}
            <p className="font-medium leading-snug">{feedback.message}</p>
          </div>
        )}

        {/* Browser Autoplay Blocked Prompt Banner */}
        {!isLocked && autoplayBlocked && (
          <button
            type="button"
            onClick={() => {
              setAutoplayBlocked(false)
              const introText = email.body_text
                ? `Email from ${email.from_name || 'sender'}. Subject: ${email.subject || 'No subject'}. ${email.body_text}`
                : `Email from ${email.from_name || 'sender'}. Subject: ${email.subject || 'No subject'}. No text body provided.`
              playTTS(introText)
            }}
            className="w-full py-3.5 px-4 bg-[#1c1a17] hover:bg-[#2a2723] text-[#f5f1e8] rounded-xl shadow-md flex items-center justify-center gap-2.5 text-xs font-semibold animate-pulse cursor-pointer border border-[#e8e2d4]"
          >
            <Volume2 className="w-4 h-4 text-amber-400 shrink-0" />
            <span>🔊 Tap here to listen to email</span>
          </button>
        )}

        {/* Locked Post-Approval State */}
        {isLocked ? (
          <div className="w-full bg-white rounded-2xl border border-[#e8e2d4] p-6 shadow-sm space-y-4">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full mx-auto flex items-center justify-center shadow-inner">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-[#1c1a17]">
                {isSent ? 'Email Dispatched & Sent' : 'Draft Approved'}
              </h2>
              <p className="text-xs text-[#6b6559] leading-relaxed">
                {isSent
                  ? `Sent to ${email.from_address}`
                  : `Approved and queued for automated dispatch to ${email.from_address}`}
                {draft?.approved_at && (
                  <span className="block mt-1">
                    on {new Date(draft.approved_at).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    {approverName ? ` by ${approverName}` : ''}
                  </span>
                )}
              </p>
            </div>
            <div className="pt-2">
              <div className="text-left bg-[#f5f1e8] p-3 rounded-lg border border-[#e8e2d4] text-xs text-[#1c1a17] whitespace-pre-wrap font-sans">
                <span className="text-[10px] uppercase font-bold text-[#6b6559] block mb-1">Approved Reply Body</span>
                {draftText || '(Empty message)'}
              </div>
            </div>
          </div>
        ) : (
          /* Active Voice Button & Interaction Area */
          <div className="flex flex-col items-center space-y-5">
            {/* Giant Push-to-Talk Button */}
            <div className="relative flex items-center justify-center">
              {/* Pulsing ring during listening */}
              {uiState === 'listening' && (
                <div className="absolute w-44 h-44 rounded-full bg-red-500/20 animate-ping" />
              )}
              {uiState === 'speaking' && (
                <div className="absolute w-44 h-44 rounded-full bg-amber-500/20 animate-pulse" />
              )}

              <button
                type="button"
                onPointerDown={startRecording}
                onPointerUp={stopRecording}
                onTouchStart={startRecording}
                onTouchEnd={stopRecording}
                onContextMenu={(e) => e.preventDefault()}
                disabled={isPending || uiState === 'processing'}
                className={`relative w-36 h-36 rounded-full flex flex-col items-center justify-center shadow-lg transition-all transform active:scale-95 select-none cursor-pointer focus:outline-none ${
                  uiState === 'listening'
                    ? 'bg-red-600 text-white ring-8 ring-red-200'
                    : uiState === 'processing'
                    ? 'bg-stone-400 text-white cursor-wait'
                    : uiState === 'speaking'
                    ? 'bg-amber-600 text-white ring-8 ring-amber-200'
                    : 'bg-[#1c1a17] text-[#f5f1e8] hover:bg-[#2a2723] ring-4 ring-[#e8e2d4]'
                }`}
                title="Hold to Speak"
              >
                {uiState === 'processing' ? (
                  <Loader2 className="w-10 h-10 animate-spin" />
                ) : uiState === 'speaking' ? (
                  <Volume2 className="w-10 h-10 animate-bounce" />
                ) : (
                  <Mic className="w-10 h-10" />
                )}

                <span className="text-xs font-bold uppercase tracking-wider mt-2">
                  {uiState === 'listening'
                    ? 'Listening...'
                    : uiState === 'processing'
                    ? 'Thinking...'
                    : uiState === 'speaking'
                    ? 'Playing...'
                    : 'Hold to Speak'}
                </span>
              </button>
            </div>

            {/* Speaking Stop Button */}
            {uiState === 'speaking' && (
              <button
                type="button"
                onClick={stopAudio}
                className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-stone-600 hover:text-stone-900 bg-white rounded-full border border-stone-300 shadow-sm cursor-pointer"
              >
                <VolumeX className="w-3.5 h-3.5" />
                <span>Stop Playing</span>
              </button>
            )}

            {/* Spoken Transcript Preview */}
            {lastTranscript && (
              <div className="bg-white px-4 py-2 rounded-xl border border-[#e8e2d4] text-xs text-[#6b6559] max-w-xs shadow-sm">
                <span className="font-semibold text-[#1c1a17]">You said:</span> &ldquo;{lastTranscript}&rdquo;
              </div>
            )}

            {/* Quick Command Guide Pills */}
            <div className="space-y-1.5 pt-2">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-[#6b6559]">
                Voice Commands (Hold &amp; Speak)
              </span>
              <div className="flex flex-wrap justify-center gap-1.5 max-w-sm">
                {['"read the draft"', '"make it more formal"', '"make it shorter"', '"approve and send"', '"discard"'].map(
                  (cmd) => (
                    <span
                      key={cmd}
                      className="text-[10px] font-mono bg-white/80 px-2 py-0.5 rounded border border-[#e8e2d4] text-[#1c1a17]"
                    >
                      {cmd}
                    </span>
                  )
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Fallback Text Toggle & Drawer */}
      <footer className="w-full max-w-md space-y-3">
        {micPermissionDenied && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 text-center">
            <p className="font-semibold">Microphone Permission Blocked</p>
            <p className="mt-0.5">Please enable mic access in your browser settings or use the text interface below.</p>
          </div>
        )}

        {/* Toggle Button */}
        <button
          type="button"
          onClick={() => setShowTextFallback(!showTextFallback)}
          className="w-full py-2.5 px-4 bg-white hover:bg-[#f5f1e8] text-xs font-semibold text-[#1c1a17] rounded-xl border border-[#e8e2d4] shadow-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
        >
          <FileText className="w-4 h-4 text-[#6b6559]" />
          <span>{showTextFallback ? 'Hide Text Fallback' : 'Show Text Instead'}</span>
          {showTextFallback ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {/* Fallback Drawer */}
        {showTextFallback && (
          <div className="bg-white rounded-2xl border border-[#e8e2d4] p-4 shadow-sm space-y-4 transition-all">
            {/* Original Email Body */}
            <div>
              <span className="text-[11px] uppercase tracking-wider font-bold text-[#6b6559] block mb-1">
                Original Message Body
              </span>
              <div className="text-xs text-[#1c1a17] bg-[#f5f1e8] p-3 rounded-lg border border-[#e8e2d4] leading-relaxed max-h-40 overflow-y-auto whitespace-pre-wrap">
                {email.body_text || '(No text body)'}
              </div>
            </div>

            {/* Editable Draft Text */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] uppercase tracking-wider font-bold text-[#6b6559]">
                  Draft Reply
                </span>
                {!isLocked && draft?.ai_generated_text && draftText !== draft.ai_generated_text && (
                  <button
                    type="button"
                    onClick={() => {
                      if (draft.ai_generated_text) {
                        setDraftText(draft.ai_generated_text)
                        setWasDiscarded(false)
                      }
                    }}
                    className="text-[11px] text-[#6b6559] hover:text-[#1c1a17] flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Reset
                  </button>
                )}
              </div>

              <textarea
                rows={4}
                value={draftText}
                onChange={(e) => !isLocked && setDraftText(e.target.value)}
                readOnly={isLocked}
                placeholder="Type or dictate reply here..."
                className={`w-full p-2.5 text-xs border rounded-lg focus:outline-none font-sans ${
                  isLocked
                    ? 'bg-[#f5f1e8] border-[#e8e2d4] text-[#6b6559]'
                    : 'bg-white border-[#e8e2d4] text-[#1c1a17] focus:ring-1 focus:ring-[#1c1a17]'
                }`}
              />
            </div>

            {/* Fallback Action Buttons */}
            {!isLocked && (
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => executeVoiceAction({ action: 'approve_send', rawText: '', normalizedText: '' })}
                  disabled={isPending || !draftText.trim()}
                  className="flex-1 py-2 px-3 bg-[#1c1a17] hover:bg-[#2a2723] text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  <span>Approve &amp; Send</span>
                </button>

                <button
                  type="button"
                  onClick={() => executeVoiceAction({ action: 'dictation', dictationText: draftText, rawText: draftText, normalizedText: '' })}
                  disabled={isPending || !draftText.trim()}
                  className="py-2 px-3 bg-white hover:bg-[#f5f1e8] text-[#1c1a17] border border-[#e8e2d4] text-xs font-medium rounded-lg flex items-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5 text-[#6b6559]" />
                  <span>Save</span>
                </button>

                <button
                  type="button"
                  onClick={() => executeVoiceAction({ action: 'discard', rawText: '', normalizedText: '' })}
                  disabled={isPending}
                  className="py-2 px-3 bg-white hover:bg-red-50 text-red-700 border border-red-200 text-xs font-medium rounded-lg flex items-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Discard</span>
                </button>
              </div>
            )}
          </div>
        )}
      </footer>
    </div>
  )
}
