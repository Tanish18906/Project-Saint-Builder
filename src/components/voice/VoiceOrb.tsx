'use client'

import React, { useState, useRef } from 'react'
import { Mic, MicOff, Square, Sparkles, Volume2 } from 'lucide-react'
import type { VoiceOrbProps } from './types'
export type { VoiceOrbProps }

const EQ_BAR_INDICES = [0, 1, 2, 3, 4] as const

export const VoiceOrb = React.memo(function VoiceOrb({
  uiState,
  showMicBusy,
  isLocked,
  onPointerDown,
  onPointerUp,
  onTouchStart,
  onTouchEnd,
  onClick,
  onStopAudio,
  micPermissionDenied,
  onSwitchToTextMode,
  lastTranscript,
  onSelectSuggestedCommand,
}: VoiceOrbProps) {
  // Field-friendly Tap-to-Talk detection:
  // Detect whether an interaction was a quick tap (< 280ms) vs a sustained hold (push-to-talk)
  const pressStartTimeRef = useRef<number>(0)
  const isHoldingRef = useRef<boolean>(false)
  const [isTapMode, setIsTapMode] = useState(false)
  const tapActive = isTapMode && uiState === 'listening'

  const handlePointerDown = (e: React.PointerEvent) => {
    if (isLocked || micPermissionDenied) return
    // Prevent synthetic mouse clicks and text selection
    e.preventDefault()
    pressStartTimeRef.current = Date.now()
    isHoldingRef.current = true
    onPointerDown()
  }

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isLocked || micPermissionDenied) return
    e.preventDefault()
    const duration = Date.now() - pressStartTimeRef.current
    isHoldingRef.current = false

    if (duration < 280) {
      // It was a quick tap! Toggle tap-to-talk mode
      if (tapActive) {
        // Stop recording
        setIsTapMode(false)
        onPointerUp()
      } else {
        // Start recording and keep it open
        setIsTapMode(true)
        onClick?.()
      }
    } else {
      // It was a sustained hold (push-to-talk)
      setIsTapMode(false)
      onPointerUp()
    }
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    if (isLocked || micPermissionDenied) return
    e.preventDefault()
    pressStartTimeRef.current = Date.now()
    isHoldingRef.current = true
    onTouchStart()
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (isLocked || micPermissionDenied) return
    e.preventDefault()
    const duration = Date.now() - pressStartTimeRef.current
    isHoldingRef.current = false

    if (duration < 280) {
      if (tapActive) {
        setIsTapMode(false)
        onTouchEnd()
      } else {
        setIsTapMode(true)
        onClick?.()
      }
    } else {
      setIsTapMode(false)
      onTouchEnd()
    }
  }


  // Aura styling by state
  const getAuraClass = () => {
    switch (uiState) {
      case 'listening':
        return 'bg-[#4D7480]/35 scale-110 opacity-90'
      case 'processing':
        return 'bg-[#5E6470]/30 scale-105 opacity-80'
      case 'speaking':
        return 'bg-amber-500/35 scale-110 opacity-90'
      case 'idle':
      default:
        return 'bg-[#1c1a17]/10 scale-95 opacity-60'
    }
  }

  // Core sphere animation class
  const getOrbAnimClass = () => {
    if (isLocked) return ''
    switch (uiState) {
      case 'listening':
        return 'animate-orb-listening'
      case 'processing':
        return 'animate-orb-thinking'
      case 'speaking':
        return 'animate-orb-speaking'
      case 'idle':
      default:
        return 'animate-orb-breathe'
    }
  }

  // State label and subtext
  const getStatusText = () => {
    if (isLocked) {
      return {
        title: 'Review Locked',
        sub: 'Draft has been finalized and signed',
      }
    }
    if (micPermissionDenied) {
      return {
        title: 'Microphone Offline',
        sub: 'Permission denied in browser',
      }
    }
    switch (uiState) {
      case 'listening':
        return {
          title: 'Listening...',
          sub: tapActive ? 'Tap orb when done speaking' : 'Release to process',
        }
      case 'processing':
        return {
          title: 'Thinking...',
          sub: 'Refining draft...',
        }
      case 'speaking':
        return {
          title: 'Foreman Speaking',
          sub: 'Tap orb to stop audio',
        }
      case 'idle':
      default:
        return {
          title: 'Ready',
          sub: 'Hold to speak or tap',
        }
    }
  }

  const status = getStatusText()

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-sm mx-auto select-none">
      {/* Central Orb Stage */}
      <div className="relative flex items-center justify-center w-36 h-36">
        {/* Layer 1: Blurred Ambient Aura */}
        <div
          className={`absolute inset-0 rounded-full blur-xl transition-all duration-700 ease-out pointer-events-none ${getAuraClass()}`}
          aria-hidden="true"
        />

        {/* Layer 2: Outer Resonance Ring (Visible when listening or speaking) */}
        {(uiState === 'listening' || uiState === 'speaking') && (
          <div
            className={`absolute -inset-2.5 rounded-full border border-dashed transition-opacity duration-300 pointer-events-none ${
              uiState === 'listening'
                ? 'border-[#4D7480]/50 animate-ping opacity-30'
                : 'border-amber-400/50 animate-pulse opacity-40'
            }`}
            aria-hidden="true"
          />
        )}

        {/* Layer 3: The Interactive Core Sphere (112px / w-28 h-28) */}
        <button
          type="button"
          disabled={isLocked || micPermissionDenied}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onContextMenu={(e) => e.preventDefault()}
          onClick={() => {
            if (uiState === 'speaking') {
              onStopAudio()
            }
          }}
          aria-label={
            uiState === 'speaking'
              ? 'Stop speaking'
              : uiState === 'listening'
              ? 'Release to finish speaking'
              : 'Hold to speak or tap'
          }
          className={`relative z-10 w-28 h-28 rounded-full flex flex-col items-center justify-center shadow-xl transition-transform duration-200 cursor-pointer touch-none outline-none focus-visible:ring-4 focus-visible:ring-stone-400/50 ${getOrbAnimClass()} ${
            isLocked ? 'cursor-not-allowed opacity-60' : 'active:scale-95'
          }`}
          style={{
            background:
              uiState === 'listening'
                ? 'radial-gradient(circle at 35% 35%, #3a5c66, #1e3238)'
                : uiState === 'speaking'
                ? 'radial-gradient(circle at 35% 35%, #b45309, #78350f)'
                : 'radial-gradient(circle at 35% 35%, #2a2723, #1c1a17)',
            boxShadow:
              uiState === 'listening'
                ? '0 0 28px rgba(77, 116, 128, 0.4), inset 0 2px 4px rgba(255, 255, 255, 0.2)'
                : uiState === 'speaking'
                ? '0 0 28px rgba(217, 119, 6, 0.4), inset 0 2px 4px rgba(255, 255, 255, 0.2)'
                : '0 8px 24px rgba(0, 0, 0, 0.25), inset 0 2px 4px rgba(255, 255, 255, 0.15)',
          }}
        >
          {/* Layer 4: Center State Glyph */}
          {uiState === 'speaking' ? (
            <div className="flex flex-col items-center gap-1">
              <Square className="w-6 h-6 text-amber-200 fill-amber-200" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-200/90">
                Stop
              </span>
            </div>
          ) : uiState === 'listening' ? (
            <div className="flex items-center gap-1">
              {EQ_BAR_INDICES.map((i) => (
                <span
                  key={i}
                  className="w-1 bg-teal-200 rounded-full animate-voice-eq"
                  style={{
                    height: '24px',
                    animationDelay: `${i * 120}ms`,
                    animationDuration: '750ms',
                  }}
                />
              ))}
            </div>
          ) : uiState === 'processing' || showMicBusy ? (
            <div className="relative w-8 h-8">
              <span className="absolute inset-0 rounded-full border-2 border-stone-400/30 border-t-stone-200 animate-spin" />
              <Sparkles className="w-4 h-4 text-stone-300 absolute inset-0 m-auto animate-pulse" />
            </div>
          ) : micPermissionDenied ? (
            <MicOff className="w-7 h-7 text-rose-300" />
          ) : (
            <div className="flex flex-col items-center">
              <Mic className="w-7 h-7 text-[#F5F1E8]" />
            </div>
          )}
        </button>
      </div>

      {/* State Typography */}
      <div className="mt-2.5 text-center">
        <h2 className="text-sm font-semibold text-stone-900 tracking-tight flex items-center justify-center gap-1.5">
          {uiState === 'speaking' && <Volume2 className="w-3.5 h-3.5 text-amber-600 animate-pulse" />}
          {status.title}
        </h2>
        <p className="text-xs text-stone-500 mt-0.5">{status.sub}</p>
      </div>

      {/* Spoken Transcript Bubble (Live Feedback) */}
      {lastTranscript && lastTranscript.trim() && (
        <div className="mt-2.5 px-3 py-1.5 rounded-xl bg-stone-100/90 border border-stone-200/80 text-xs text-stone-700 max-w-[90%] text-center italic shadow-2xs animate-fade-in truncate">
          &ldquo;{lastTranscript}&rdquo;
        </div>
      )}

      {/* Suggestion Chips (2-3 Contextual Hints) */}
      {!isLocked && !micPermissionDenied && uiState !== 'listening' && uiState !== 'processing' && (
        <div className="flex flex-wrap items-center justify-center gap-1.5 mt-2.5">
          <button
            type="button"
            onClick={() => onSelectSuggestedCommand?.('make it formal')}
            className="px-2.5 py-1 text-[11px] font-medium text-stone-600 bg-stone-100 hover:bg-stone-200/80 active:bg-stone-200 rounded-full border border-stone-200/60 transition-colors"
          >
            make it formal
          </button>
          <button
            type="button"
            onClick={() => onSelectSuggestedCommand?.('make it shorter')}
            className="px-2.5 py-1 text-[11px] font-medium text-stone-600 bg-stone-100 hover:bg-stone-200/80 active:bg-stone-200 rounded-full border border-stone-200/60 transition-colors"
          >
            make it shorter
          </button>
          <button
            type="button"
            onClick={() => onSelectSuggestedCommand?.('read the draft')}
            className="px-2.5 py-1 text-[11px] font-medium text-stone-600 bg-stone-100 hover:bg-stone-200/80 active:bg-stone-200 rounded-full border border-stone-200/60 transition-colors"
          >
            read draft
          </button>
        </div>
      )}

      {/* Permission Denied Recovery */}
      {micPermissionDenied && (
        <div className="mt-3 px-3 py-2 bg-rose-50 border border-rose-200 rounded-xl text-center text-xs text-rose-800">
          <p className="font-semibold">Microphone access needed</p>
          <p className="text-[11px] text-rose-600 mt-0.5">Please allow microphone in your browser settings.</p>
          <button
            type="button"
            onClick={onSwitchToTextMode}
            className="mt-2 px-3 py-1 bg-white border border-rose-300 text-rose-700 text-xs font-medium rounded-lg hover:bg-rose-50"
          >
            Switch to Text Mode
          </button>
        </div>
      )}
    </div>
  )
})
