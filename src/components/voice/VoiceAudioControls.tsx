'use client'

import * as React from 'react'
import { Volume2, AlertCircle, CheckCircle2, AlertTriangle } from 'lucide-react'
import { VoiceOrb } from './VoiceOrb'
import type { VoiceUIState, VoiceFeedback } from './types'

export interface VoiceAudioControlsProps {
  uiState: VoiceUIState
  showMicBusy: boolean
  isLocked: boolean
  onPointerDown: () => void
  onPointerUp: () => void
  onTouchStart: () => void
  onTouchEnd: () => void
  feedback: VoiceFeedback | null
  autoplayBlocked: boolean
  onAutoplayResume: () => void
  onStopAudio: () => void
  micPermissionDenied: boolean
  onSwitchToTextMode: () => void
  lastTranscript: string
  onSelectSuggestedCommand?: (cmd: string) => void
}

/**
 * Streamlined Voice Audio Controls (Tier 2 Stage Coordinator)
 * Integrates the VoiceOrb with browser autoplay banner and feedback alerts.
 */
export function VoiceAudioControls({
  uiState,
  showMicBusy,
  isLocked,
  onPointerDown,
  onPointerUp,
  onTouchStart,
  onTouchEnd,
  feedback,
  autoplayBlocked,
  onAutoplayResume,
  onStopAudio,
  micPermissionDenied,
  onSwitchToTextMode,
  lastTranscript,
  onSelectSuggestedCommand,
}: VoiceAudioControlsProps) {
  return (
    <div className="w-full max-w-md mx-auto flex flex-col items-center select-none space-y-2">
      {/* Autoplay Blocked Notice (Mobile Safari / Chrome Autoplay Policy) */}
      {!isLocked && autoplayBlocked && (
        <button
          type="button"
          onClick={onAutoplayResume}
          className="w-full min-h-[44px] py-2 px-3.5 bg-stone-900 text-stone-100 rounded-xl shadow-sm flex items-center justify-center gap-2 text-xs font-semibold animate-pulse cursor-pointer border border-stone-700 active:scale-[0.99] transition-transform"
        >
          <Volume2 className="w-4 h-4 text-amber-400 shrink-0" />
          <span>Tap here to listen to email audio</span>
        </button>
      )}

      {/* Non-intrusive feedback toast/banner (only shown when an explicit warning or error occurs) */}
      {feedback && feedback.type !== 'info' && !autoplayBlocked && !micPermissionDenied && (
        <div
          role="status"
          aria-live="polite"
          className={`w-full py-1.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 text-center transition-all ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : feedback.type === 'error'
              ? 'bg-rose-50 text-rose-800 border border-rose-200'
              : 'bg-amber-50 text-amber-800 border border-amber-200'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          ) : feedback.type === 'error' ? (
            <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          )}
          <span className="font-medium truncate">{feedback.message}</span>
        </div>
      )}

      {/* Hero Voice Orb Component */}
      <VoiceOrb
        uiState={uiState}
        showMicBusy={showMicBusy}
        isLocked={isLocked}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        onStopAudio={onStopAudio}
        micPermissionDenied={micPermissionDenied}
        onSwitchToTextMode={onSwitchToTextMode}
        lastTranscript={lastTranscript}
        onSelectSuggestedCommand={onSelectSuggestedCommand}
      />
    </div>
  )
}
