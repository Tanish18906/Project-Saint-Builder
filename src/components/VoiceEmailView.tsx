'use client'

import React from 'react'
import {
  Mic,
  Volume2,
  VolumeX,
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
} from 'lucide-react'
import { ThemeBadge } from '@/components/ThemeBadge'
import { UrgencyBadge } from '@/components/UrgencyBadge'
import { StatusBadge } from '@/components/StatusBadge'
import { useVoiceReview } from '@/hooks/use-voice-review'

// LEGACY PRESENTATION — scheduled for the voice rebuild (DESIGN_SYSTEM.md §12).
// All behaviour lives in useVoiceReview; this file is markup only.

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

// Live-audio meter shown while the app is speaking or listening.
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
  const {
    draft,
    draftText,
    setDraftText,
    setWasDiscarded,
    isSent,
    isApproved,
    isLocked,
    isPending,
    uiState,
    showMicBusy,
    feedback,
    lastTranscript,
    micPermissionDenied,
    autoplayBlocked,
    setAutoplayBlocked,
    showTextFallback,
    setShowTextFallback,
    stopAudio,
    playTTS,
    buildIntroText,
    handleIntroPlaybackEnd,
    startRecording,
    stopRecording,
    executeVoiceAction,
    handleApproveAndSend,
  } = useVoiceReview({ email, draft: initialDraft, token })

  // Format Received Date
  const formattedDate = new Date(email.received_at).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div className="min-h-screen bg-[var(--foreman-cream)] text-[var(--foreman-text-primary)] flex flex-col items-center p-4 sm:p-6 gap-5 font-sans">
      {/* Email context */}
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
        {/* Status line. The leading glyph becomes the ActivityEqualizer while audio is
            playing or being captured, and a static status icon otherwise. */}
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
              {/* Listening: expanding capture ring */}
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

            {/* Mic permission denied — recovery path into text mode. */}
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

            {/* Text preview / edit, placed right above the send button. The voice
                rebuild makes reviewing the final text a required step before Send. */}
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
