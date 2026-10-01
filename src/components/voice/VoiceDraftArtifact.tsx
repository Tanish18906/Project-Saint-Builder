'use client'

import React, { useState, useMemo, useEffect, useRef } from 'react'
import { Sparkles, Edit3, Check, RotateCcw, AlertTriangle, ShieldCheck } from 'lucide-react'
import type { VoiceDraftArtifactProps } from './types'
export type { VoiceDraftArtifactProps }


export const PLACEHOLDER_REGEX = /\[(?:CONFIRM|INSERT|TODO|VERIFY|DATE|TIME|NAME|AMOUNT|PHONE|ADDRESS|\.\.\.)[^\]]*\]|\[\s*\.\.\.[^\]]*\]|\[[A-Z0-9_\s\-:]{3,}\]/gi

/**
 * Tokenize draft string into plain text fragments and interactive amber placeholder tokens
 */
export function renderDraftWithPlaceholders(
  text: string,
  onPlaceholderClick?: (ph: string) => void
) {
  if (!text) return null
  const parts: React.ReactNode[] = []
  let lastIndex = 0
  const matches = Array.from(text.matchAll(PLACEHOLDER_REGEX))

  if (matches.length === 0) {
    return text
  }

  matches.forEach((match, i) => {
    const matchIndex = match.index ?? 0
    if (matchIndex > lastIndex) {
      parts.push(text.slice(lastIndex, matchIndex))
    }
    const token = match[0]
    parts.push(
      <span
        key={`ph-${i}-${token}`}
        onClick={() => onPlaceholderClick?.(token)}
        className="inline-flex items-center gap-1 mx-0.5 px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-900 border border-amber-300 font-mono text-xs font-semibold select-all cursor-pointer hover:bg-amber-500/25 active:scale-95 transition-all"
        title="Unresolved placeholder — tap to edit or speak to resolve"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" aria-hidden="true" />
        <span>{token}</span>
      </span>
    )
    lastIndex = matchIndex + token.length
  })

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex))
  }

  return parts
}

/**
 * Executive AI Draft Work Artifact (Tier 3)
 * First-class visible document surface positioned directly beneath Voice Orb.
 */
export function VoiceDraftArtifact({
  draftText,
  onChangeDraftText,
  initialAIText,
  isLocked,
  isPending,
  onResetToInitialAI,
  draftStatus,
  approvedAt,
  approverName,
  recipientEmail,
  isDraftUpdated,
}: VoiceDraftArtifactProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [shimmer, setShimmer] = useState(false)
  const prevTextRef = useRef(draftText)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Trigger brief shimmer animation when draftText updates externally (e.g. via voice rewrite)
  useEffect(() => {
    if (prevTextRef.current !== draftText) {
      prevTextRef.current = draftText
      setShimmer(true)
      const timer = setTimeout(() => setShimmer(false), 1200)
      return () => clearTimeout(timer)
    }
  }, [draftText, isDraftUpdated])

  // Focus textarea when entering edit mode
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus()
      textareaRef.current.selectionStart = textareaRef.current.value.length
    }
  }, [isEditing])

  // Detect unresolved placeholders
  const detectedPlaceholders = useMemo(() => {
    if (!draftText) return []
    const matches = draftText.match(PLACEHOLDER_REGEX)
    return matches ? Array.from(new Set(matches)) : []
  }, [draftText])

  // Word and character counts
  const wordCount = useMemo(() => {
    if (!draftText || !draftText.trim()) return 0
    return draftText.trim().split(/\s+/).length
  }, [draftText])

  // Provenance label
  const provenance = useMemo(() => {
    if (!initialAIText) return 'AI Draft'
    if (draftText === initialAIText) return 'AI Draft'
    return 'Modified'
  }, [draftText, initialAIText])

  const isModifiedFromAI = initialAIText && draftText !== initialAIText

  return (
    <section
      aria-label="AI-generated email draft"
      className={`w-full max-w-md mx-auto bg-white rounded-2xl border transition-all duration-300 shadow-2xs overflow-hidden flex flex-col ${
        isEditing
          ? 'border-stone-400 ring-2 ring-stone-800/10'
          : 'border-[var(--border-subtle)]'
      } ${shimmer ? 'animate-draft-update ring-2 ring-emerald-500/30' : ''}`}
    >
      {/* Header Bar */}
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-stone-50/80 border-b border-stone-200/60">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-stone-700" />
          <span className="text-xs font-semibold text-stone-800 tracking-tight">
            {provenance}
          </span>
          <span className="text-[11px] text-stone-400">
            • {wordCount} {wordCount === 1 ? 'word' : 'words'}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Reset to AI Button */}
          {isModifiedFromAI && !isLocked && !isPending && (
            <button
              type="button"
              onClick={onResetToInitialAI}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-stone-500 hover:text-stone-800 px-2 py-1 rounded-md hover:bg-stone-200/60 transition-colors"
              title="Reset draft back to initial AI generation"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}

          {/* Edit / Done Toggle */}
          {!isLocked && (
            <button
              type="button"
              onClick={() => setIsEditing((prev) => !prev)}
              aria-label={isEditing ? 'Finish editing draft' : 'Edit draft manually'}
              className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-lg transition-colors min-h-[36px] cursor-pointer ${
                isEditing
                  ? 'bg-stone-900 text-stone-50 hover:bg-stone-800'
                  : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-100 shadow-2xs'
              }`}
            >
              {isEditing ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Done</span>
                </>
              ) : (
                <>
                  <Edit3 className="w-3.5 h-3.5 text-stone-500" />
                  <span>Edit</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Recipient Micro-line */}
      {recipientEmail && (
        <div className="px-3.5 pt-2 text-[11px] text-stone-500 truncate border-b border-stone-100 pb-1.5">
          <span className="text-stone-400">To: </span>
          <span className="font-mono text-stone-600 font-medium">{recipientEmail}</span>
        </div>
      )}

      {/* Draft Document Body */}
      <div className="p-3.5 sm:p-4 flex-1">
        {isEditing ? (
          <textarea
            ref={textareaRef}
            value={draftText}
            onChange={(e) => onChangeDraftText(e.target.value)}
            disabled={isLocked || isPending}
            rows={5}
            aria-label="Edit email draft"
            placeholder="Write or refine your reply here..."
            className="w-full text-[14px] sm:text-[15px] font-sans text-stone-900 leading-relaxed bg-white border border-stone-300 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-stone-900/30 resize-none selection:bg-stone-200"
          />
        ) : (
          <div
            tabIndex={0}
            role="region"
            aria-label="Email draft content"
            className="whitespace-pre-wrap font-sans text-[14px] sm:text-[15px] text-stone-800 leading-relaxed max-h-56 overflow-y-auto break-words select-text focus:outline-none"
          >
            {draftText ? (
              renderDraftWithPlaceholders(draftText, () => setIsEditing(true))
            ) : (
              <span className="text-stone-400 italic">No draft content yet. Speak to generate reply.</span>
            )}
          </div>
        )}
      </div>

      {/* Calm 1-Line Placeholder Helper Bar */}
      {detectedPlaceholders.length > 0 && (
        <div className="flex items-center justify-between px-3.5 py-2 bg-amber-50/90 border-t border-amber-200/80 text-xs text-amber-900">
          <div className="flex items-center gap-1.5 font-medium truncate">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>
              {detectedPlaceholders.length} item{detectedPlaceholders.length > 1 ? 's' : ''} need confirmation
            </span>
          </div>
          <span className="text-[11px] text-amber-800/80 italic shrink-0">
            Dictate or tap Edit
          </span>
        </div>
      )}

      {/* Approved State Banner */}
      {isLocked && (
        <div className="flex items-center gap-2 px-3.5 py-2 bg-emerald-50 border-t border-emerald-200 text-xs text-emerald-800">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <div className="truncate">
            <span className="font-semibold">{draftStatus === 'sent' ? 'Dispatched' : 'Approved'} by {approverName || 'Authorized Staff'}</span>
            {approvedAt && <span className="ml-1 text-emerald-700/80">• {approvedAt}</span>}
          </div>
        </div>
      )}

    </section>
  )
}
