'use client'

import { useState, useEffect, useRef, useTransition } from 'react'
import { parseVoiceCommand } from '@/lib/voice-commands'
import { saveDraftAction, approveAndSendAction, discardDraftAction } from '@/app/(app)/emails/[id]/actions'
import { createClient } from '@/lib/supabase/client'
import type { DraftRecord, EmailRecord } from '@/lib/domain'

export type VoiceUIState = 'idle' | 'listening' | 'processing' | 'speaking'

export type VoiceFeedback = {
  type: 'info' | 'success' | 'warning' | 'error'
  message: string
} | null

export interface UseVoiceReviewParams {
  email: Pick<
    EmailRecord,
    'id' | 'from_address' | 'from_name' | 'subject' | 'body_text' | 'theme' | 'routed_roles' | 'status'
  >
  draft: DraftRecord | null
  token: string
}

/**
 * Voice review session for one email: TTS playback, push-to-talk recording,
 * speech-to-text, command routing, draft edits and the button-only send.
 *
 * SAFETY-CRITICAL. This body was moved VERBATIM out of VoiceEmailView (only the
 * return statement is new). Do not "tidy" it during the redesign:
 *   • voice_send_blocked — sending can never be triggered by voice;
 *     handleApproveAndSend is only reachable from an on-screen button.
 *   • isRecordingRef guards — TTS never plays into an open microphone.
 *   • playbackSeqRef — stale TTS responses are dropped.
 *   • No window-wide gesture listener for autoplay unlock (see comment below).
 *   • Every API call carries the HMAC voice token; writes go through the shared
 *     server actions with via: 'voice'.
 */
export function useVoiceReview({ email, draft: initialDraft, token }: UseVoiceReviewParams) {
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

  return {
    // Draft
    draft,
    draftText,
    setDraftText,
    wasDiscarded,
    setWasDiscarded,
    isSent,
    isApproved,
    isLocked,
    isPending,
    // Voice session
    uiState,
    showMicBusy,
    feedback,
    lastTranscript,
    micPermissionDenied,
    autoplayBlocked,
    setAutoplayBlocked,
    showTextFallback,
    setShowTextFallback,
    // Commands
    stopAudio,
    playTTS,
    buildIntroText,
    handleIntroPlaybackEnd,
    startRecording,
    stopRecording,
    executeVoiceAction,
    handleApproveAndSend,
  }
}
