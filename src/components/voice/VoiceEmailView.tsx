'use client'

import React, { useState, useEffect, useRef, useTransition, useCallback } from 'react'
import { parseVoiceCommand } from '@/lib/voice-commands'
import type { VoiceAgentReply } from '@/app/api/voice/agent/route'
import {
  saveDraftAction,
  approveAndSendAction,
  discardDraftAction,
} from '@/app/emails/[id]/actions'
import { createClient } from '@/lib/supabase/client'
import type {
  VoiceEmailViewProps,
  VoiceDraftItem,
  VoiceUIState,
  VoiceFeedback,
} from './types'
import { VoiceHeader } from './VoiceHeader'
import { VoiceAudioControls } from './VoiceAudioControls'
import { VoiceDraftArtifact } from './VoiceDraftArtifact'
import { VoiceActionToolbar } from './VoiceActionToolbar'
import { VoiceApprovalModal, VoiceDiscardModal } from './VoiceConfirmationModals'


export function VoiceEmailView({
  email,
  draft: initialDraft,
  approverName,
  token,
}: VoiceEmailViewProps) {
  const [draft, setDraft] = useState<VoiceDraftItem | null>(initialDraft)
  const initialText = initialDraft?.edited_text || initialDraft?.ai_generated_text || ''
  const [draftText, setDraftText] = useState<string>(initialText)
  const [wasDiscarded, setWasDiscarded] = useState<boolean>(false)

  // Voice Interaction States
  const [uiState, setUiState] = useState<VoiceUIState>('idle')
  const [feedback, setFeedback] = useState<VoiceFeedback | null>(null)
  const [lastTranscript, setLastTranscript] = useState<string>('')
  const [autoplayBlocked, setAutoplayBlocked] = useState<boolean>(false)
  const [micPermissionDenied, setMicPermissionDenied] = useState<boolean>(false)

  // Modals state (Mobile bottom sheets)
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState<boolean>(false)
  const [isDiscardModalOpen, setIsDiscardModalOpen] = useState<boolean>(false)

  // Audio Playback & Recording References
  const activeAudioRef = useRef<HTMLAudioElement | null>(null)
  const activeBlobUrlRef = useRef<string | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const isRecordingRef = useRef<boolean>(false)
  const isStartingRecordingRef = useRef<boolean>(false)
  const speechUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null)
  const playbackSeqRef = useRef<number>(0)
  const draftTextRef = useRef<string>(draftText)
  const draftRef = useRef<VoiceDraftItem | null>(draft)

  // Keep refs synchronized for async voice handler access
  useEffect(() => {
    draftTextRef.current = draftText
    draftRef.current = draft
  }, [draftText, draft])

  // Unmount hardware & resource cleanup
  useEffect(() => {
    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop())
        mediaStreamRef.current = null
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try {
          mediaRecorderRef.current.stop()
        } catch {}
      }
      if (activeAudioRef.current) {
        activeAudioRef.current.pause()
        activeAudioRef.current.src = ''
        activeAudioRef.current = null
      }
      if (activeBlobUrlRef.current) {
        URL.revokeObjectURL(activeBlobUrlRef.current)
        activeBlobUrlRef.current = null
      }
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  const [isPending, startTransition] = useTransition()

  const isSent = draft?.status === 'sent' || email.status === 'sent'
  const isApproved = draft?.status === 'approved' || email.status === 'approved'
  const isLocked = isApproved || isSent
  const showMicBusy = uiState === 'processing' || (isPending && uiState !== 'listening' && uiState !== 'speaking')

  // Synchronize state if initialDraft updates from server
  const [prevInitialDraft, setPrevInitialDraft] = useState(initialDraft)
  if (initialDraft !== prevInitialDraft) {
    setPrevInitialDraft(initialDraft)
    setDraft(initialDraft)
    const text = initialDraft?.edited_text || initialDraft?.ai_generated_text || ''
    if (text) {
      setDraftText(text)
    }
  }

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
            const updated = payload.new as VoiceDraftItem
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
  const stopAudio = useCallback(() => {
    playbackSeqRef.current++

    if (activeAudioRef.current) {
      activeAudioRef.current.pause()
      activeAudioRef.current.currentTime = 0
      activeAudioRef.current = null
    }
    if (activeBlobUrlRef.current) {
      URL.revokeObjectURL(activeBlobUrlRef.current)
      activeBlobUrlRef.current = null
    }
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }
    speechUtteranceRef.current = null
    setUiState((prev) => (prev === 'speaking' ? 'idle' : prev))
  }, [])

  // Browser Speech Synthesis Fallback
  const playBrowserTTSFallback = useCallback((text: string, seq: number, onEnd?: () => void) => {
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
    } catch {
      if (playbackSeqRef.current === seq) setUiState('idle')
    }
  }, [])

  // 2. Play TTS Audio helper (strictly sequential, handles autoplay policies with timeouts)
  const playTTS = useCallback(async (textToSpeak: string, onEndCallback?: () => void) => {
    if (!textToSpeak.trim()) return
    if (isRecordingRef.current) return

    stopAudio()
    const currentSeq = ++playbackSeqRef.current

    try {
      const res = await fetch('/api/voice/tts', {
        method: 'POST',
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

      if (playbackSeqRef.current !== currentSeq) return
      if (isRecordingRef.current) return

      if (!res.ok) {
        throw new Error('TTS request failed')
      }

      const contentType = res.headers.get('content-type') || ''
      if (contentType.includes('audio/mpeg') || contentType.includes('audio/wav')) {
        const blob = await res.blob()
        if (playbackSeqRef.current !== currentSeq) return

        if (activeBlobUrlRef.current) {
          URL.revokeObjectURL(activeBlobUrlRef.current)
          activeBlobUrlRef.current = null
        }

        const audioUrl = URL.createObjectURL(blob)
        activeBlobUrlRef.current = audioUrl
        const audio = new Audio(audioUrl)
        activeAudioRef.current = audio

        setUiState('speaking')

        audio.onended = () => {
          if (activeBlobUrlRef.current) {
            URL.revokeObjectURL(activeBlobUrlRef.current)
            activeBlobUrlRef.current = null
          }
          if (playbackSeqRef.current === currentSeq) {
            setUiState('idle')
            activeAudioRef.current = null
            if (onEndCallback) onEndCallback()
          }
        }

        audio.onerror = () => {
          if (activeBlobUrlRef.current) {
            URL.revokeObjectURL(activeBlobUrlRef.current)
            activeBlobUrlRef.current = null
          }
          if (playbackSeqRef.current === currentSeq) {
            playBrowserTTSFallback(textToSpeak, currentSeq, onEndCallback)
          }
        }

        try {
          await audio.play()
          setAutoplayBlocked(false)
        } catch (playErr: unknown) {
          const isAutoplayError =
            playErr instanceof Error &&
            (playErr.name === 'NotAllowedError' || playErr.message.includes('user'))

          if (isAutoplayError) {
            setAutoplayBlocked(true)
            setUiState('idle')
            setFeedback({
              type: 'info',
              message: '🔊 Tap the button below to play email audio.',
            })
            return
          } else {
            playBrowserTTSFallback(textToSpeak, currentSeq, onEndCallback)
          }
        }
      } else {
        playBrowserTTSFallback(textToSpeak, currentSeq, onEndCallback)
      }
    } catch {
      if (playbackSeqRef.current === currentSeq) {
        playBrowserTTSFallback(textToSpeak, currentSeq, onEndCallback)
      }
    }
  }, [email.id, stopAudio, token, playBrowserTTSFallback])

  // Spoken version of the incoming email
  const buildEmailReadout = useCallback(() => {
    const fromDisplay = email.from_name || email.from_address
    const subjectText = email.subject || 'No subject'
    const bodyText = email.body_text ? email.body_text : 'No message text was included.'
    return `You've received an email from ${fromDisplay}, regarding: ${subjectText}. Here's the message: ${bodyText} That's the end of the email.`
  }, [email.from_name, email.from_address, email.subject, email.body_text])

  // Assistant-style intro script
  const buildIntroText = useCallback(() => {
    const hasDraft = Boolean(initialDraft && (initialDraft.edited_text || initialDraft.ai_generated_text))
    const hint = hasDraft
      ? `There's a draft reply ready. Ask me to read it, change it, or anything else about this email.`
      : `There's no draft yet. Hold the button and ask me to draft a reply.`
    return `${buildEmailReadout()} ${hint}`
  }, [buildEmailReadout, initialDraft])

  const handleIntroPlaybackEnd = useCallback(() => {
    setFeedback({
      type: 'info',
      message: 'Ready — hold the button below to speak a command or dictate your reply.',
    })
  }, [])

  // 3. Auto-play assistant-style intro ONCE per page load. Saving the draft
  // revalidates this route and hands us a new `initialDraft`, which re-runs this
  // effect — without the ref guard the whole email was read out after every command.
  const introPlayedRef = useRef<boolean>(false)
  useEffect(() => {
    if (isLocked || introPlayedRef.current) return

    const timer = setTimeout(() => {
      introPlayedRef.current = true
      setFeedback({
        type: 'info',
        message: 'Playing your email... Hold button below to speak a command or dictate reply.',
      })
      void playTTS(buildIntroText(), handleIntroPlaybackEnd)
    }, 400)

    return () => {
      clearTimeout(timer)
    }
  }, [buildIntroText, handleIntroPlaybackEnd, isLocked, playTTS])

  // 4. Tone rewrite handler (reusable by voice commands and touch chips)
  const handleRewriteTone = useCallback(
    async (instruction: 'formal' | 'shorter' | 'technical') => {
      const currentDraft = (draftTextRef.current || draftRef.current?.edited_text || draftRef.current?.ai_generated_text || '').trim()
      if (!currentDraft) {
        setFeedback({ type: 'warning', message: 'Cannot rewrite: No draft reply exists yet.' })
        void playTTS('No draft reply exists yet to rewrite. Speak to dictate your reply.')
        return
      }

      setUiState('processing')
      setFeedback({
        type: 'info',
        message: `Rewriting draft (${instruction} style)...`,
      })

      try {
        const rewriteRes = await fetch('/api/voice/rewrite', {
          method: 'POST',
          signal: AbortSignal.timeout(8500),
          headers: {
            'Content-Type': 'application/json',
            'x-voice-token': token,
          },
          body: JSON.stringify({
            currentDraft,
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

        if (!rewriteRes.ok) {
          throw new Error('Rewrite request failed')
        }

        const rewriteData = await rewriteRes.json()
        const newText = (rewriteData.rewrittenText as string) || currentDraft

        setDraftText(newText)
        setWasDiscarded(false)

        await saveDraftAction({
          emailId: email.id,
          draftId: draftRef.current?.id,
          editedText: newText,
          via: 'voice',
        })

        setFeedback({
          type: 'success',
          message: `Rewrote draft (${instruction}). Playing updated version back...`,
        })

        void playTTS(`Updated draft in ${instruction} style: ${newText}`)
      } catch {
        setUiState('idle')
        setFeedback({ type: 'error', message: 'Failed to rewrite draft. Please try again.' })
      }
    },
    [email.id, email.from_name, email.from_address, email.subject, email.theme, email.routed_roles, playTTS, token]
  )

  // 5. Execute Voice Action router
  const executeVoiceAction = useCallback(
    async (command: ReturnType<typeof parseVoiceCommand>) => {
      const { action, rawText } = command

      // A. Read Draft (Strictly Read-Only)
      if (action === 'read_draft') {
        const currentDraftToRead = (draftTextRef.current || draftRef.current?.edited_text || draftRef.current?.ai_generated_text || '').trim()
        if (!currentDraftToRead) {
          setFeedback({ type: 'info', message: 'No draft reply has been generated yet for this message.' })
          void playTTS('There is no draft reply generated yet for this email.')
          return
        }
        setFeedback({ type: 'info', message: `Reading draft reply: "${currentDraftToRead}"` })
        void playTTS(`Here is the draft reply: ${currentDraftToRead}`)
        return
      }

      // B. AI Tone Rewrite
      if (action === 'rewrite_formal' || action === 'rewrite_shorter' || action === 'rewrite_technical') {
        const tone =
          action === 'rewrite_formal'
            ? 'formal'
            : action === 'rewrite_shorter'
            ? 'shorter'
            : 'technical'
        await handleRewriteTone(tone)
        return
      }

      // C. Blocked Voice Send (Strict Safety Rule: Voice sending prohibited, confirmation required)
      if (action === 'voice_send_blocked') {
        setUiState('idle')
        setFeedback({
          type: 'warning',
          message: 'For safety, emails cannot be sent by voice. Please tap the button on screen to confirm.',
        })
        void playTTS('For safety, emails cannot be sent by voice. Please tap the button on screen to send.')
        // Open confirmation modal so user can tap to send!
        setIsApprovalModalOpen(true)
        return
      }

      // D. Discard
      if (action === 'discard') {
        setIsDiscardModalOpen(true)
        setUiState('idle')
        setFeedback({
          type: 'warning',
          message: 'Please tap Discard Draft on screen to confirm clearing the draft.',
        })
        void playTTS('Please tap Discard Draft on screen to confirm.')
        return
      }

      // E. Manual Direct Save
      if (action === 'dictation') {
        const textToSave = command.dictationText || draftTextRef.current
        startTransition(async () => {
          await saveDraftAction({
            emailId: email.id,
            draftId: draftRef.current?.id,
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

      // F. Unrecognized input
      if (action === 'unrecognized') {
        setUiState('idle')
        setFeedback({
          type: 'warning',
          message: "Didn't catch a command. Hold the button and try again — say a command or full instruction.",
        })
        void playTTS("Sorry, I didn't catch that. Please hold the button and try again.")
        return
      }

      // G. Apply Edit / Dictation
      const editInstruction = command.editInstruction || rawText
      if (editInstruction && editInstruction.trim()) {
        const currentDraft = (draftTextRef.current || draftRef.current?.edited_text || draftRef.current?.ai_generated_text || '').trim()

        setUiState('processing')
        setFeedback({
          type: 'info',
          message: `Applying edit: "${editInstruction}"...`,
        })

        try {
          // Fallback path only (agent unreachable): never paste a spoken command
          // into an empty draft as if it were the reply.
          if (!currentDraft) {
            setFeedback({ type: 'warning', message: "Couldn't reach the assistant to write a draft. Please try again." })
            void playTTS("Sorry, I couldn't reach the assistant to write a draft. Please try again in a moment.")
            return
          }

          const rewriteRes = await fetch('/api/voice/rewrite', {
            method: 'POST',
            signal: AbortSignal.timeout(8500),
            headers: {
              'Content-Type': 'application/json',
              'x-voice-token': token,
            },
            body: JSON.stringify({
              currentDraft,
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
          const newText = (rewriteData.rewrittenText as string) || currentDraft

          setDraftText(newText)
          setWasDiscarded(false)

          await saveDraftAction({
            emailId: email.id,
            draftId: draftRef.current?.id,
            editedText: newText,
            via: 'voice',
          })

          setFeedback({
            type: 'success',
            message: 'Updated draft reply. Playing updated version back...',
          })

          void playTTS(`Updated draft reply: ${newText}`)
        } catch {
          setUiState('idle')
          setFeedback({ type: 'error', message: 'Failed to apply edit to draft. Please try again.' })
        }
      }
    },
    [email.id, email.from_name, email.from_address, email.subject, email.theme, email.routed_roles, handleRewriteTone, playTTS, token]
  )

  // 5b. Voice agent turn: the LLM decides what to do with whatever was said.
  // Falls back to the deterministic command parser if the agent is unreachable.
  const historyRef = useRef<{ role: 'user' | 'assistant'; text: string }[]>([])
  const runAgent = useCallback(
    async (transcript: string) => {
      setUiState('processing')
      setFeedback({ type: 'info', message: 'Thinking...' })

      let reply: VoiceAgentReply
      try {
        const res = await fetch('/api/voice/agent', {
          method: 'POST',
          signal: AbortSignal.timeout(30000),
          headers: { 'Content-Type': 'application/json', 'x-voice-token': token },
          body: JSON.stringify({
            emailId: email.id,
            token,
            transcript,
            currentDraft: draftTextRef.current,
            history: historyRef.current,
          }),
        })
        if (!res.ok) throw new Error('agent unavailable')
        reply = await res.json()
      } catch {
        await executeVoiceAction(parseVoiceCommand(transcript))
        return
      }

      historyRef.current = [
        ...historyRef.current,
        { role: 'user' as const, text: transcript },
        { role: 'assistant' as const, text: reply.say },
      ].slice(-8)

      const say = reply.say || ''
      const currentDraft = draftTextRef.current.trim()

      switch (reply.action) {
        case 'read_email':
          setFeedback({ type: 'info', message: 'Reading the email...' })
          void playTTS(`${say} ${buildEmailReadout()}`)
          return

        case 'read_draft':
          if (!currentDraft) {
            setFeedback({ type: 'info', message: 'No draft yet.' })
            void playTTS("There's no draft yet. Ask me to draft a reply and I'll write one.")
            return
          }
          setFeedback({ type: 'info', message: 'Reading the draft...' })
          void playTTS(`${say} ${currentDraft}`)
          return

        case 'update_draft':
          setDraftText(reply.draft)
          setWasDiscarded(false)
          await saveDraftAction({
            emailId: email.id,
            draftId: draftRef.current?.id,
            editedText: reply.draft,
            via: 'voice',
          })
          setFeedback({ type: 'success', message: say || 'Draft updated.' })
          void playTTS(reply.read_back ? `${say} ${reply.draft}` : say)
          return

        case 'discard_draft':
          setIsDiscardModalOpen(true)
          setFeedback({ type: 'warning', message: 'Tap Discard Draft on screen to confirm.' })
          void playTTS(say || 'Please tap Discard Draft on screen to confirm.')
          return

        case 'send_requested':
          // Voice safety rule: never send by voice — only open the tap-to-confirm sheet.
          if (currentDraft) setIsApprovalModalOpen(true)
          setFeedback({ type: 'warning', message: 'Sending needs a tap on Approve & Send.' })
          void playTTS(say || 'For safety, emails cannot be sent by voice. Please tap Approve and Send on screen.')
          return

        default:
          setFeedback({ type: 'info', message: say || 'Okay.' })
          if (say) void playTTS(say)
          else setUiState('idle')
      }
    },
    [buildEmailReadout, email.id, executeVoiceAction, playTTS, token]
  )

  // 6. Speech Transcription
  const handleProcessAudioBlob = useCallback(
    async (blob: Blob) => {
      setUiState('processing')
      setFeedback({ type: 'info', message: 'Processing your voice...' })

      try {
        const formData = new FormData()
        formData.append('file', blob, 'voice.webm')
        formData.append('token', token)
        formData.append('email_id', email.id)

        const sttRes = await fetch('/api/voice/stt', {
          method: 'POST',
          signal: AbortSignal.timeout(9000),
          body: formData,
        })

        if (!sttRes.ok) {
          throw new Error('Speech recognition server error')
        }

        const sttData = await sttRes.json()
        const transcript = ((sttData.text as string) || '').trim()

        if (!transcript) {
          setUiState('idle')
          setFeedback({ type: 'warning', message: "Didn't catch anything. Hold the button and try again." })
          return
        }

        setLastTranscript(transcript)
        await runAgent(transcript)
      } catch {
        setUiState('idle')
        setFeedback({ type: 'error', message: 'Error processing voice. Please try again or edit text directly.' })
      }
    },
    [email.id, runAgent, token]
  )

  // 7. Push-to-Talk Recording Handlers
  const startRecording = useCallback(async () => {
    if (
      isLocked ||
      uiState === 'processing' ||
      uiState === 'listening' ||
      isRecordingRef.current ||
      isStartingRecordingRef.current
    ) {
      return
    }
    isStartingRecordingRef.current = true
    stopAudio()

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaStreamRef.current = stream
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
        if (mediaStreamRef.current === stream) {
          mediaStreamRef.current = null
        }
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        if (audioBlob.size > 1000) {
          await handleProcessAudioBlob(audioBlob)
        } else {
          setUiState('idle')
        }
      }

      mediaRecorder.start()
      isRecordingRef.current = true
      isStartingRecordingRef.current = false
      setUiState('listening')
      setMicPermissionDenied(false)
      setFeedback({ type: 'info', message: 'Listening... Release when finished.' })
    } catch {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop())
        mediaStreamRef.current = null
      }
      isStartingRecordingRef.current = false
      isRecordingRef.current = false
      setMicPermissionDenied(true)
      setUiState('idle')
      setFeedback({
        type: 'error',
        message: 'Microphone access was blocked. Please enable mic permissions or edit text directly.',
      })
    }
  }, [handleProcessAudioBlob, isLocked, stopAudio, uiState])

  const stopRecording = useCallback(() => {
    isStartingRecordingRef.current = false
    if (mediaRecorderRef.current && isRecordingRef.current) {
      isRecordingRef.current = false
      setUiState('processing')
      mediaRecorderRef.current.stop()
    }
  }, [])

  // 8. Manual Action Handlers
  const handleConfirmApproval = useCallback(() => {
    if (isLocked || !draftText.trim()) return

    stopAudio()
    setUiState('processing')
    setFeedback({ type: 'info', message: 'Approving draft and queueing automated dispatch...' })

    startTransition(async () => {
      const res = await approveAndSendAction({
        emailId: email.id,
        draftId: draft?.id,
        editedText: draftText,
        wasDiscarded,
        via: 'voice',
      })

      if (res.success) {
        setIsApprovalModalOpen(false)
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
        void playTTS('Approved. The email has been queued for dispatch.')
      } else {
        setUiState('idle')
        setFeedback({ type: 'error', message: res.error || 'Failed to approve draft.' })
      }
    })
  }, [draft, draftText, email.id, isLocked, playTTS, stopAudio, wasDiscarded])

  const handleConfirmDiscard = useCallback(() => {
    setDraftText('')
    setWasDiscarded(true)
    setIsDiscardModalOpen(false)

    startTransition(async () => {
      await discardDraftAction({
        emailId: email.id,
        draftId: draft?.id,
        via: 'voice',
      })

      setFeedback({
        type: 'success',
        message: 'Draft discarded. Hold the button to dictate your replacement reply.',
      })
      void playTTS('Draft cleared. Speak to dictate your reply.')
    })
  }, [draft?.id, email.id, playTTS])

  const handleManualSave = useCallback(() => {
    if (!draftText.trim()) return

    startTransition(async () => {
      await saveDraftAction({
        emailId: email.id,
        draftId: draft?.id,
        editedText: draftText,
        via: 'voice',
      })
      setFeedback({
        type: 'success',
        message: 'Draft changes saved.',
      })
    })
  }, [draft?.id, draftText, email.id])

  const handleResetToInitialAI = useCallback(() => {
    if (initialDraft?.ai_generated_text) {
      setDraftText(initialDraft.ai_generated_text)
      setWasDiscarded(false)
      setFeedback({
        type: 'info',
        message: 'Draft restored to original AI generation.',
      })
    }
  }, [initialDraft])

  const handleSelectSuggestedCommand = useCallback(
    (cmd: string) => {
      setLastTranscript(cmd)
      void runAgent(cmd)
    },
    [runAgent]
  )

  const handleScrollToDraft = useCallback(() => {
    const el = document.getElementById('voice-draft-editor')
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      el.focus()
    }
  }, [])

  const handleOpenApprovalModal = useCallback(() => setIsApprovalModalOpen(true), [])
  const handleCloseApprovalModal = useCallback(() => setIsApprovalModalOpen(false), [])
  const handleOpenDiscardModal = useCallback(() => setIsDiscardModalOpen(true), [])
  const handleCloseDiscardModal = useCallback(() => setIsDiscardModalOpen(false), [])
  const handleChangeDraftText = useCallback((newText: string) => {
    setDraftText(newText)
  }, [])
  const handleAutoplayResume = useCallback(() => {
    setAutoplayBlocked(false)
    void playTTS(buildIntroText(), handleIntroPlaybackEnd)
  }, [buildIntroText, handleIntroPlaybackEnd, playTTS])

  return (
    <div className="min-h-screen bg-[var(--app-bg)] text-[var(--text-primary)] flex flex-col items-center px-3 pt-3 sm:p-5 font-sans">
      {/* Container limited to mobile-first column */}
      <div className="w-full max-w-md space-y-3 pb-44 sm:pb-40">
        {/* Tier 1: Context Header & Collapsible */}
        <VoiceHeader email={email} draft={draft} isLocked={isLocked} />

        {/* Tier 2: Voice Hero Stage */}
        <VoiceAudioControls
          uiState={uiState}
          showMicBusy={showMicBusy}
          isLocked={isLocked}
          onPointerDown={startRecording}
          onPointerUp={stopRecording}
          onTouchStart={startRecording}
          onTouchEnd={stopRecording}
          feedback={feedback}
          autoplayBlocked={autoplayBlocked}
          onAutoplayResume={handleAutoplayResume}
          onStopAudio={stopAudio}
          micPermissionDenied={micPermissionDenied}
          onSwitchToTextMode={handleScrollToDraft}
          lastTranscript={lastTranscript}
          onSelectSuggestedCommand={handleSelectSuggestedCommand}
        />

        {/* Tier 3: AI Draft Artifact */}
        <div id="voice-draft-editor" tabIndex={-1} className="outline-none">
          <VoiceDraftArtifact
            draftText={draftText}
            onChangeDraftText={handleChangeDraftText}
            initialAIText={initialDraft?.ai_generated_text || null}
            isLocked={isLocked}
            isPending={isPending}
            onRewriteTone={handleRewriteTone}
            onResetToInitialAI={handleResetToInitialAI}
            draftStatus={draft?.status}
            approvedAt={draft?.approved_at}
            approverName={approverName}
            recipientEmail={email.from_address}
          />
        </div>
      </div>


      {/* Tier 5: Mobile Sticky Bottom Action Bar */}
      {!isLocked && (
        <VoiceActionToolbar
          onApproveClick={handleOpenApprovalModal}
          onSaveClick={handleManualSave}
          onDiscardClick={handleOpenDiscardModal}
          isPending={isPending}
          isLocked={isLocked}
          canApprove={Boolean(draftText.trim())}
          hasDraftText={Boolean(draftText.trim())}
        />
      )}

      {/* Confirmation Modals (conditionally mounted to prevent layout thrashing) */}
      {isApprovalModalOpen && (
        <VoiceApprovalModal
          isOpen={isApprovalModalOpen}
          onClose={handleCloseApprovalModal}
          onConfirm={handleConfirmApproval}
          isPending={isPending}
          recipient={`${email.from_name || 'Sender'} <${email.from_address}>`}
          subject={email.subject || '(No Subject)'}
          draftText={draftText}
        />
      )}

      {isDiscardModalOpen && (
        <VoiceDiscardModal
          isOpen={isDiscardModalOpen}
          onClose={handleCloseDiscardModal}
          onConfirm={handleConfirmDiscard}
          isPending={isPending}
        />
      )}
    </div>
  )
}
export default VoiceEmailView
