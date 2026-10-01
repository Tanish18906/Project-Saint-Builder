'use client'

import * as React from 'react'
import {
  RotateCcw,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Mail,
  Briefcase,
  Scissors,
  Cpu,
} from 'lucide-react'

export interface VoiceDraftReviewCardProps {
  draftText: string
  onChangeDraftText: (text: string) => void
  initialAIText: string | null
  isLocked: boolean
  isPending: boolean
  onRewriteTone: (tone: 'formal' | 'shorter' | 'technical') => void
  onResetToInitialAI: () => void
  draftStatus?: string
  approvedAt?: string | null
  approverName?: string | null
  recipientEmail: string
}

function formatApprovedDate(isoString: string | null | undefined): string {
  if (!isoString) return ''
  try {
    const d = new Date(isoString)
    if (isNaN(d.getTime())) return ''
    return d.toLocaleString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return ''
  }
}

/**
 * Mobile-first AI draft review card.
 * Features provenance detection badge, word/character counter, reset button,
 * placeholder detection alert, one-tap tone rewrite chips, large touch-friendly textarea,
 * and approved state banner.
 */
export function VoiceDraftReviewCard({
  draftText,
  onChangeDraftText,
  initialAIText,
  isLocked,
  isPending,
  onRewriteTone,
  onResetToInitialAI,
  draftStatus,
  approvedAt,
  approverName,
  recipientEmail,
}: VoiceDraftReviewCardProps) {
  // Provenance calculation
  const isUnmodifiedAI = Boolean(
    initialAIText && draftText.trim() === initialAIText.trim()
  )

  const isVoiceRewritten = Boolean(
    draftStatus &&
      (draftStatus.toLowerCase().includes('voice') ||
        draftStatus.toLowerCase().includes('tone') ||
        draftStatus.toLowerCase().includes('rewrite'))
  )

  let provenanceLabel = 'Staff-Edited'
  let provenanceBadgeClass =
    'bg-[var(--surface-subtle)] text-[var(--text-secondary)] border-[var(--border-subtle)]'

  if (isUnmodifiedAI) {
    provenanceLabel = 'AI-Generated Draft'
    provenanceBadgeClass =
      'bg-[var(--brand-subtle)] text-[var(--brand-text)] border-[var(--brand-subtle)]'
  } else if (isVoiceRewritten) {
    provenanceLabel = 'Voice-Rewritten'
    provenanceBadgeClass = 'bg-amber-50 text-amber-800 border-amber-200'
  } else if (!initialAIText || !initialAIText.trim()) {
    provenanceLabel = 'Staff-Edited'
    provenanceBadgeClass =
      'bg-[var(--surface-subtle)] text-[var(--text-secondary)] border-[var(--border-subtle)]'
  }

  // Word and character statistics
  const trimmed = draftText.trim()
  const wordCount = trimmed ? trimmed.split(/\s+/).length : 0
  const charCount = draftText.length

  const canReset =
    !isLocked &&
    Boolean(initialAIText) &&
    draftText.trim() !== initialAIText?.trim()

  // Placeholder detection (e.g. [CONFIRM ...], [... ...], [TODO ...], etc.)
  const detectedPlaceholders = React.useMemo(() => {
    if (!draftText) return []
    const regex =
      /\[(?:CONFIRM|INSERT|TODO|VERIFY|DATE|TIME|NAME|AMOUNT|PHONE|ADDRESS|\.\.\.)[^\]]*\]|\[\s*\.\.\.[^\]]*\]|\[[A-Z0-9_\s\-:]{3,}\]/gi
    const matches = draftText.match(regex)
    return matches ? Array.from(new Set(matches)) : []
  }, [draftText])

  const formattedApprovedAt = React.useMemo(
    () => formatApprovedDate(approvedAt),
    [approvedAt]
  )

  return (
    <div className="max-w-md mx-auto w-full bg-white rounded-2xl border border-[var(--border-subtle)] p-4 shadow-sm space-y-3">
      {/* Header Row: Provenance badge, Word count pill, Reset button */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Provenance Badge */}
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border select-none ${provenanceBadgeClass}`}
          >
            <Sparkles className="w-3 h-3 shrink-0" aria-hidden="true" />
            <span>{provenanceLabel}</span>
          </span>

          {/* Word & Character Count */}
          <span className="text-[11px] font-medium text-[var(--text-secondary)] bg-[var(--surface-subtle)] px-2.5 py-0.5 rounded-full border border-[var(--border-subtle)] tabular-nums select-none">
            {wordCount} words • {charCount} chars
          </span>
        </div>

        {/* Reset to initial AI draft button */}
        {canReset && (
          <button
            type="button"
            onClick={onResetToInitialAI}
            disabled={isPending || isLocked}
            aria-label="Reset draft to original AI generated text"
            className="min-h-[36px] px-2.5 py-1 text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-stone-100 active:bg-stone-200 rounded-lg border border-[var(--border-subtle)] inline-flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]"
          >
            <RotateCcw className="w-3 h-3 shrink-0" aria-hidden="true" />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* Recipient display */}
      <div className="text-xs text-[var(--text-secondary)] flex items-center gap-1.5 truncate bg-[var(--surface-subtle)]/60 px-3 py-1.5 rounded-lg border border-[var(--border-subtle)]/70">
        <Mail className="w-3.5 h-3.5 text-[var(--text-tertiary)] shrink-0" aria-hidden="true" />
        <span className="truncate">
          Responding to:{' '}
          <strong className="text-[var(--text-primary)] font-semibold">
            {recipientEmail}
          </strong>
        </span>
      </div>

      {/* Placeholder Detection Alert */}
      {detectedPlaceholders.length > 0 && (
        <div
          role="alert"
          aria-live="polite"
          className="bg-amber-50 border border-amber-200 rounded-xl p-3 sm:p-3.5 text-xs text-amber-900 flex items-start gap-2.5 shadow-xs"
        >
          <AlertTriangle
            className="w-4 h-4 text-amber-600 shrink-0 mt-0.5"
            aria-hidden="true"
          />
          <div className="space-y-1.5 flex-1 min-w-0">
            <p className="font-semibold text-amber-950 leading-snug">
              Action Required: Unresolved placeholder detected in draft.
            </p>
            <p className="text-amber-800 leading-relaxed">
              Dictate changes or edit directly before sending.
            </p>
            <div className="flex flex-wrap gap-1 pt-0.5">
              {detectedPlaceholders.map((ph) => (
                <span
                  key={ph}
                  className="inline-block px-1.5 py-0.5 rounded bg-amber-100/90 text-amber-900 font-mono text-[11px] font-semibold border border-amber-300"
                >
                  {ph}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Locked / Approved State Banner */}
      {isLocked && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 flex items-start gap-2.5 text-xs text-emerald-900 shadow-xs">
          <CheckCircle2
            className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5"
            aria-hidden="true"
          />
          <div className="space-y-0.5 min-w-0 flex-1">
            <p className="font-semibold text-emerald-950">Draft Approved</p>
            <p className="text-emerald-800 leading-relaxed">
              Approved for dispatch to{' '}
              <strong className="font-semibold">{recipientEmail}</strong>
              {formattedApprovedAt && <span> on {formattedApprovedAt}</span>}
              {approverName && <span> by {approverName}</span>}.
            </p>
          </div>
        </div>
      )}

      {/* Main Touch-Friendly Textarea */}
      <div className="space-y-1">
        <label
          htmlFor="voice-draft-textarea"
          className="text-[11px] uppercase tracking-wider font-bold text-[var(--text-secondary)] block"
        >
          Draft Response
        </label>
        <textarea
          id="voice-draft-textarea"
          rows={5}
          value={draftText}
          onChange={(e) => onChangeDraftText(e.target.value)}
          disabled={isLocked || isPending}
          readOnly={isLocked}
          placeholder="Draft response will appear here. Dictate changes or edit directly..."
          aria-label="Draft response content"
          className={`w-full p-3 text-base sm:text-[15px] leading-relaxed rounded-xl border font-sans transition-colors ${
            isLocked
              ? 'bg-[var(--surface-subtle)] border-[var(--border-subtle)] text-[var(--text-secondary)] cursor-not-allowed resize-none'
              : 'bg-white border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:border-transparent'
          }`}
        />
      </div>

      {/* One-tap Quick Tone Rewrite chips (hidden if locked) */}
      {!isLocked && (
        <div className="space-y-1.5 pt-0.5">
          <span className="text-[11px] uppercase tracking-wider font-bold text-[var(--text-secondary)] block">
            Quick Tone Rewrites
          </span>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => onRewriteTone('formal')}
              disabled={isPending || !draftText.trim()}
              aria-label="Rewrite draft with formal tone"
              className="min-h-[48px] px-2 py-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-subtle)] hover:bg-stone-100 active:scale-95 text-xs font-semibold text-[var(--text-primary)] flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 text-center cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]"
            >
              <Briefcase className="w-3.5 h-3.5 text-[var(--text-secondary)] shrink-0" aria-hidden="true" />
              <span>Tone: Formal</span>
            </button>

            <button
              type="button"
              onClick={() => onRewriteTone('shorter')}
              disabled={isPending || !draftText.trim()}
              aria-label="Rewrite draft to be shorter"
              className="min-h-[48px] px-2 py-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-subtle)] hover:bg-stone-100 active:scale-95 text-xs font-semibold text-[var(--text-primary)] flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 text-center cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]"
            >
              <Scissors className="w-3.5 h-3.5 text-[var(--text-secondary)] shrink-0" aria-hidden="true" />
              <span>Tone: Shorter</span>
            </button>

            <button
              type="button"
              onClick={() => onRewriteTone('technical')}
              disabled={isPending || !draftText.trim()}
              aria-label="Rewrite draft with technical tone"
              className="min-h-[48px] px-2 py-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-subtle)] hover:bg-stone-100 active:scale-95 text-xs font-semibold text-[var(--text-primary)] flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 text-center cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]"
            >
              <Cpu className="w-3.5 h-3.5 text-[var(--text-secondary)] shrink-0" aria-hidden="true" />
              <span>Tone: Technical</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
