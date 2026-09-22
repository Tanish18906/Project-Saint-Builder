'use client'

import React, { useState, useEffect, useRef, useTransition } from 'react'
import {
  Mic,
  Volume2,
  VolumeX,
  Sparkles,
  CheckCircle2,
  AlertCircle,
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
import { ThemeBadge } from '@/components/ThemeBadge'
import { UrgencyBadge } from '@/components/UrgencyBadge'
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
    theme: string | null
    urgency: string | null
    routed_roles: string[] | null
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

// Tier 2 activity indicator: one component, recolored per mode, so "the app is
// talking" and "the app is listening to you" read as variations on the same
// live-activity language rather than two unrelated widgets.
function ActivityEqualizer({ mode }: { mode: 'speaking' | 'listening' }) {
  const barColor = mode === 'listening' ? 'bg-[var(--voice-listening-accent)]' : 'bg-amber-500'
  return (
    <span className="inline-flex items-end gap-0.5 h-4 shrink-0" aria-hidden="true">
      {[0, 1, 2, 3, 4].map((i) => (
        <span
          key={i}
          className={`w-1 h-full rounded-full origin-bottom animate-[voice-eq_0.9s_ease-in-out_infinite] ${barColor}`}
          style={{ animationDelay: `${i * 0.12}s` }}
        />
      ))}
    </span>
  )
}

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

  const isSent = draft?.status === 'sent' || email.status === 'sent'
  const isApproved = draft?.status === 'approved' || email.status === 'approved'
  const isLocked = isApproved || isSent
  // Some transitions (discard, manual save) set isPending without ever setting
  // uiState to 'processing', which left the mic button looking idle/interactive
  // while actually disabled. Broadens the *visual* busy check to match what the
  // button's disabled attribute already covers — no change to the disabled logic itself.
  const showMicBusy = uiState === 'processing' || (isPending && uiState !== 'listening' && uiState !== 'speaking')

  // Sync state if initial server props change
  useEffect(() => {
    if (initialDraft) {
      setDraft(initialDraft)
      const text = initialDraft.edited_text || initialDraft.ai_generated_text || ''
      if (text) {
        setDraftText(text)
      }
    }
  }, [initialDraft])

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
            const text = updated.edited_text || updated.ai_generated_text || ''
            if (text) {
              setDraftText(text)
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

  // 2. Play TTS Audio helper (strictly sequential, handles autoplay policies with timeouts)
  const playTTS = async (textToSpeak: string, onEndCallback?: () => void) => {
    if (!textToSpeak.trim()) return
    // Never start/resume playback while the mic is actively recording — doing so
    // lets the speaker's own audio (e.g. the original email being read aloud)
    // bleed into the recording and get transcribed back as if it were the user's
    // spoken reply, corrupting the draft with the email body.
    if (isRecordingRef.current) return

    stopAudio()
    const currentSeq = ++playbackSeqRef.current

    try {
      const res = await fetch('/api/voice/tts', {
        method: 'POST',
        // Must stay comfortably above the server's own per-attempt OpenAI timeout
        // (12s) plus a margin for a fast-fail-then-retry case, or this fetch aborts
        // and falls back to browser speech before the server ever gets a real answer.
        signal: AbortSignal.timeout(20000),
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
      // Recording may have started while this fetch was in flight — don't start
      // speaking into an active microphone capture.
      if (isRecordingRef.current) {
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

        setUiState('speaking')

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
            // Deliberately NOT using a window-wide click/touchstart/pointerdown listener here.
            // Those are the same gesture types the "Hold to Speak" button uses to start
            // recording — a global listener would fire from that same press and replay this
            // TTS (the original email body) through the speaker while the mic is actively
            // recording, causing Whisper to transcribe the email back into the draft.
            // The dedicated "Tap here to listen" banner button below is the only way to resume.
            setAutoplayBlocked(true)
            setUiState('idle')
            setFeedback({
              type: 'info',
              message: '🔊 Tap the button below to play email audio.',
            })
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

  // Assistant-style intro script: who it's from, the full message, a clear "end of
  // email" boundary, then a brief draft-ready mention (only if a draft actually
  // exists). Single shared builder so the auto-play effect and the manual
  // "tap to listen" retry button can never drift into two different scripts.
  const buildIntroText = () => {
    const fromDisplay = email.from_name || email.from_address
    const subjectText = email.subject || 'No subject'
    const bodyText = email.body_text ? email.body_text : 'No message text was included.'
    const hasDraft = Boolean(initialDraft && (initialDraft.edited_text || initialDraft.ai_generated_text))

    const parts = [
      `You've received an email from ${fromDisplay}, regarding: ${subjectText}.`,
      `Here's the message: ${bodyText}`,
      `That's the end of the email.`,
    ]

    if (hasDraft) {
      parts.push(`There's a draft reply ready — say "read the draft" to hear it, or you can start dictating changes now.`)
    }

    return parts.join(' ')
  }

  // Marks the "TTS finished, awaiting input" state explicitly instead of leaving
  // the stale "Playing your email..." banner text up once playback has actually
  // ended (Phase 0 audit finding: this state previously had zero distinct treatment).
  const handleIntroPlaybackEnd = () => {
    setFeedback({
      type: 'info',
      message: 'Ready — hold the button below to speak a command or dictate your reply.',
    })
  }

  // 3. Auto-play assistant-style intro on load
  useEffect(() => {
    if (isLocked) return

    const timer = setTimeout(() => {
      setFeedback({
        type: 'info',
        message: 'Playing your email... Hold button below to speak a command or dictate reply.',
      })
      playTTS(buildIntroText(), handleIntroPlaybackEnd)
    }, 400)

    return () => {
      clearTimeout(timer)
    }
  }, [email.id, isLocked])

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
        signal: AbortSignal.timeout(8500),
        body: formData,
      })

      if (!sttRes.ok) {
        throw new Error('Speech recognition server error')
      }

      const sttData = await sttRes.json()
      const transcript = (sttData.text || '').trim()

      if (!transcript) {
        setUiState('idle')
        setFeedback({ type: 'warning', message: "Didn't catch anything. Hold the button and try again." })
        return
      }

      setLastTranscript(transcript)

      // Parse Command vs Dictation with intent matching
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

    // A. Read Draft (STRICTLY READ-ONLY: ZERO writes to database)
    if (action === 'read_draft') {
      const currentDraftToRead = (draftText || draft?.edited_text || draft?.ai_generated_text || '').trim()
      if (!currentDraftToRead) {
        setFeedback({ type: 'info', message: 'No draft reply has been generated yet for this message.' })
        await playTTS('There is no draft reply generated yet for this email.')
        return
      }
      setFeedback({ type: 'info', message: `Reading draft reply: "${currentDraftToRead}"` })
      await playTTS(`Here is the draft reply: ${currentDraftToRead}`)
      return
    }

    // B. AI Tone Rewrite (Formal / Shorter / Technical)
    if (action === 'rewrite_formal' || action === 'rewrite_shorter' || action === 'rewrite_technical') {
      const currentDraft = (draftText || draft?.edited_text || draft?.ai_generated_text || '').trim()
      if (!currentDraft) {
        setFeedback({ type: 'warning', message: 'Cannot rewrite: No draft reply exists yet.' })
        await playTTS('No draft reply exists yet to rewrite. Speak to dictate your reply.')
        return
      }

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
          signal: AbortSignal.timeout(7500),
          headers: {
            'Content-Type': 'application/json',
            'x-voice-token': token,
          },
          body: JSON.stringify({
            currentDraft: currentDraft,
            instruction,
            routedRoles: email.routed_roles,
            emailContext: {
              from_name: email.from_name,
              from_address: email.from_address,
              subject: email.subject,
              theme: email.theme,
              routed_roles: email.routed_roles,
            },
            token,
            emailId: email.id,
          }),
        })

        const rewriteData = await rewriteRes.json()
        const newText = rewriteData.rewrittenText || currentDraft

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

    // C. Blocked Voice Send (Safety Rule: Voice sending disabled, manual button click required)
    if (action === 'voice_send_blocked') {
      setUiState('idle')
      setFeedback({
        type: 'warning',
        message: '⚠️ For safety, emails cannot be sent by voice. Please tap the Approve & Send button on screen.',
      })
      await playTTS('For safety, emails cannot be sent by voice. Please tap the Approve & Send button on screen to send.')
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
          message: 'Draft discarded. Hold button to speak your custom replacement reply.',
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

    // F. Unrecognized / low-confidence input (Phase 5 exception to the no-logic-
    // change rule: parseVoiceCommand now rejects single-word/empty transcripts
    // instead of silently applying them as a draft edit — this just surfaces
    // that rejection as a distinct, audible state rather than a no-op)
    if (action === 'unrecognized') {
      setUiState('idle')
      setFeedback({
        type: 'warning',
        message: "Didn't catch a command. Hold the button and try again — say a command or a full instruction.",
      })
      await playTTS("Sorry, I didn't catch that. Please hold the button and try again.")
      return
    }

    // G. Apply Edit (Spoken instruction / dictation incorporated contextually into draft)
    const editInstruction = command.editInstruction || rawText
    if (editInstruction && editInstruction.trim()) {
      const currentDraft = (draftText || draft?.edited_text || draft?.ai_generated_text || '').trim()

      setUiState('processing')
      setFeedback({
        type: 'info',
        message: `Applying edit: "${editInstruction}"...`,
      })

      try {
        if (!currentDraft) {
          // If no draft existed, spoken instruction becomes the initial draft text
          setDraftText(editInstruction)
          setWasDiscarded(false)

          await saveDraftAction({
            emailId: email.id,
            draftId: draft?.id,
            editedText: editInstruction,
            via: 'voice',
          })

          setFeedback({
            type: 'success',
            message: 'Saved dictated reply. Playing back...',
          })

          await playTTS(`Draft reply created: ${editInstruction}`)
          return
        }

        const rewriteRes = await fetch('/api/voice/rewrite', {
          method: 'POST',
          signal: AbortSignal.timeout(7500),
          headers: {
            'Content-Type': 'application/json',
            'x-voice-token': token,
          },
          body: JSON.stringify({
            currentDraft: currentDraft, // STRICTLY DRAFT TEXT — NEVER EMAIL BODY!
            instruction: 'apply_edit',
            spokenInstruction: editInstruction,
            routedRoles: email.routed_roles,
            emailContext: {
              from_name: email.from_name,
              from_address: email.from_address,
              subject: email.subject,
              theme: email.theme,
              routed_roles: email.routed_roles,
            },
            token,
            emailId: email.id,
          }),
        })

        const rewriteData = await rewriteRes.json()
        const newText = rewriteData.rewrittenText || currentDraft

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

  // 7. Manual button-only approval & sending (Strict Safety Rule)
  const handleApproveAndSend = () => {
    if (isLocked || !draftText.trim()) return

    stopAudio()
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
  }

  // Format Received Date
  const formattedDate = new Date(email.received_at).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div className="min-h-screen bg-[var(--foreman-cream)] text-[var(--foreman-text-primary)] flex flex-col items-center p-4 sm:p-6 gap-5 font-sans">
      {/* Tier 1 — Context card: recessive reference info, sits behind the interaction area */}
      <header className="w-full max-w-md bg-[var(--foreman-cream-dim)]/40 rounded-2xl border border-[var(--foreman-cream-dim)] p-4 space-y-2">
        <div className="flex items-center justify-between gap-2 border-b border-[var(--foreman-cream-dim)] pb-2.5">
          <div className="flex items-center gap-2 flex-wrap">
            <ThemeBadge theme={email.theme} />
            <UrgencyBadge urgency={email.urgency} />
            <StatusBadge status={isApproved ? 'approved' : draft?.status || email.status} />
          </div>

          <div className="flex items-center gap-1 text-[11px] font-semibold text-[var(--foreman-text-primary)] bg-white px-2.5 py-0.5 rounded-full border border-[var(--foreman-cream-dim)] shrink-0">
            <User className="w-3 h-3 text-[var(--foreman-text-secondary)]" />
            <span className="capitalize">
              {email.routed_roles && email.routed_roles.length > 0
                ? email.routed_roles.map((r) => r.replace(/_/g, ' ')).join(', ')
                : 'Admin'}
            </span>
          </div>
        </div>

        <div>
          <h1 className="text-base font-bold text-[var(--foreman-text-primary)] leading-snug line-clamp-2">
            {email.subject || '(No Subject)'}
          </h1>
          <p className="text-xs text-[var(--foreman-text-secondary)] mt-0.5 truncate">
            From: <strong className="text-[var(--foreman-text-primary)]">{email.from_name || 'Sender'}</strong> &lt;{email.from_address}&gt;
          </p>
        </div>
      </header>

      {/* Center Push-To-Talk Audio Experience */}
      <main className="w-full max-w-md flex-1 flex flex-col items-center justify-center gap-6 text-center py-1">
        {/* Tier 2 — Status/activity area: the "live, happening now" zone. Given more
            visual presence (shadow) than the recessed Tier 1 context card above it.
            The leading glyph becomes the ActivityEqualizer while audio is actually
            playing or being captured, and falls back to a static status icon otherwise. */}
        {/* Suppressed while autoplayBlocked or micPermissionDenied: both get their
            own dedicated, more actionable banner elsewhere on the page — showing
            this generic one too just duplicated the same message twice. */}
        {feedback && !autoplayBlocked && !micPermissionDenied && (
          <div
            className={`w-full p-3.5 rounded-xl text-xs flex items-center justify-center gap-2 text-center shadow-sm transition-all ${
              feedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : feedback.type === 'error'
                ? 'bg-red-50 text-red-800 border border-red-200'
                : feedback.type === 'warning'
                ? 'bg-amber-50 text-amber-800 border border-amber-200'
                : 'bg-stone-100 text-stone-800 border border-stone-200'
            }`}
          >
            {uiState === 'speaking' || uiState === 'listening' ? (
              <ActivityEqualizer mode={uiState} />
            ) : feedback.type === 'success' ? (
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
              playTTS(buildIntroText(), handleIntroPlaybackEnd)
            }}
            className="w-full py-3.5 px-4 bg-[var(--foreman-charcoal)] hover:bg-[var(--foreman-charcoal-light)] text-[var(--foreman-cream)] rounded-xl shadow-md flex items-center justify-center gap-2.5 text-xs font-semibold animate-pulse cursor-pointer border border-[var(--foreman-cream-dim)]"
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
              {/* Idle: slow ambient "ready and waiting" breathing glow */}
              {uiState === 'idle' && !showMicBusy && (
                <div className="absolute w-40 h-40 rounded-full bg-[var(--foreman-charcoal)]/10 animate-pulse" />
              )}
              {/* Listening: expanding capture ring in the dedicated listening accent (not urgency-red, not speaking-amber) */}
              {uiState === 'listening' && (
                <div className="absolute w-44 h-44 rounded-full bg-[var(--voice-listening-accent)]/25 animate-ping" />
              )}
              {/* Processing / busy: neutral ring so "still working" is visible beyond the small spinner icon */}
              {showMicBusy && (
                <div className="absolute w-40 h-40 rounded-full bg-stone-400/20 animate-pulse" />
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
                className={`relative w-36 h-36 rounded-full flex flex-col items-center justify-center shadow-lg transition-all transform active:scale-95 select-none focus:outline-none ${
                  uiState === 'listening'
                    ? 'bg-[var(--foreman-charcoal)] text-[var(--foreman-cream)] ring-8 ring-[var(--voice-listening-accent)]/50 cursor-pointer'
                    : showMicBusy
                    ? 'bg-stone-400 text-white ring-8 ring-stone-200 cursor-wait'
                    : uiState === 'speaking'
                    ? 'bg-amber-600 text-white ring-8 ring-amber-200 cursor-pointer'
                    : 'bg-[var(--foreman-charcoal)] text-[var(--foreman-cream)] hover:bg-[var(--foreman-charcoal-light)] ring-4 ring-[var(--foreman-cream-dim)] cursor-pointer'
                }`}
                title="Hold to Speak"
              >
                {showMicBusy ? (
                  <Loader2 className="w-10 h-10 animate-spin" />
                ) : uiState === 'speaking' ? (
                  <Volume2 className="w-10 h-10 animate-bounce" />
                ) : (
                  <Mic className="w-10 h-10" />
                )}

                <span className="text-xs font-bold uppercase tracking-wider mt-2">
                  {uiState === 'listening'
                    ? 'Listening...'
                    : showMicBusy
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

            {/* Mic permission denied — actionable recovery path (UX spec §5): a real
                button into text mode, not just prose telling the user to scroll for it. */}
            {micPermissionDenied && (
              <div className="w-full p-3.5 rounded-xl text-xs text-center bg-red-50 text-red-800 border border-red-200 shadow-sm space-y-2">
                <p className="font-semibold">Microphone access is blocked</p>
                <p className="leading-relaxed">Enable mic permissions in your browser settings, or continue without voice.</p>
                <button
                  type="button"
                  onClick={() => setShowTextFallback(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-red-200 text-red-800 font-semibold hover:bg-red-100 cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Switch to text mode</span>
                </button>
              </div>
            )}

            {/* Spoken Transcript Preview */}
            {lastTranscript && (
              <div className="bg-white px-4 py-2 rounded-xl border border-[#e8e2d4] text-xs text-[#6b6559] max-w-xs shadow-sm">
                <span className="font-semibold text-[#1c1a17]">You said:</span> &ldquo;{lastTranscript}&rdquo;
              </div>
            )}

            {/* Example spoken phrases — reference only, not tappable controls */}
            <div className="space-y-2 pt-2">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-[var(--foreman-text-secondary)]">
                Try saying
              </span>
              <div className="flex flex-wrap justify-center gap-2 max-w-sm">
                {['read the draft', 'make it more formal', 'make it shorter', 'make it more technical', 'discard'].map(
                  (cmd) => (
                    <span
                      key={cmd}
                      className="text-[11px] italic bg-[var(--foreman-cream-dim)]/50 px-2.5 py-1 rounded-full text-[var(--foreman-text-primary)]"
                    >
                      <span className="not-italic text-[var(--foreman-text-secondary)]/60">&ldquo;</span>
                      {cmd}
                      <span className="not-italic text-[var(--foreman-text-secondary)]/60">&rdquo;</span>
                    </span>
                  )
                )}
              </div>
            </div>

            {/* Verification tool, reachable right at the send decision — resolves the
                UX spec §6 framing question. PRODUCT DECISION, flagging for client
                confirmation: this reframes "Show Text Instead" from an accessibility-
                fallback control into a pre-send verification step, per the spec's
                recommendation. Deliberately lower visual weight than Approve & Send
                (plain text row, no card chrome) per UI spec §5, but positioned
                immediately above it rather than in a distant footer, since that's
                the moment a user is most likely to want to check the actual text. */}
            <div className="w-full max-w-sm pt-1">
              <button
                type="button"
                onClick={() => setShowTextFallback(!showTextFallback)}
                className="w-full py-2 px-3 text-[11px] font-medium text-[var(--foreman-text-secondary)] hover:text-[var(--foreman-text-primary)] flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>{showTextFallback ? 'Hide text preview' : 'Preview text before sending'}</span>
                {showTextFallback ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              {showTextFallback && (
                <div className="bg-white rounded-2xl border border-[var(--foreman-cream-dim)] p-4 shadow-sm space-y-4 transition-all mt-1">
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
                        onClick={handleApproveAndSend}
                        disabled={isPending || !draftText.trim()}
                        className="flex-1 py-2 px-3 bg-[#1c1a17] hover:bg-[#2a2723] text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5 text-emerald-400" />}
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
            </div>

            {/* Prominent Approve & Send Button (Strict Safety Rule: Button click required) */}
            <div className="w-full max-w-sm pt-2">
              <button
                type="button"
                onClick={handleApproveAndSend}
                disabled={isPending || !draftText.trim()}
                className="w-full py-3.5 px-4 bg-[#1c1a17] hover:bg-[#2a2723] text-[#f5f1e8] text-xs font-bold uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-[0.98]"
              >
                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 text-emerald-400" />}
                <span>Approve &amp; Send Reply</span>
              </button>
              <p className="text-[10px] text-[var(--foreman-text-secondary)] mt-2.5 flex items-center justify-center gap-1">
                <Lock className="w-3 h-3 shrink-0" />
                <span>Button click required to send — voice sending disabled for safety</span>
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
