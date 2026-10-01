'use client'

import * as React from 'react'
import {
  Mail,
  Lock,
  RotateCcw,
  Copy,
  Check,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
} from 'lucide-react'
import { Card, Badge, Button } from '@/components/ui'
import { DraftRecord, extractPlaceholders } from '@/components/email-detail/types'
import { PlaceholderAlert } from './PlaceholderAlert'

export interface DraftEditorCardProps {
  draft: DraftRecord | null
  draftText: string
  onDraftTextChange: (text: string) => void
  isLocked: boolean
  isSent: boolean
  isApproved: boolean
  fromAddress: string
  feedback: { type: 'success' | 'error'; message: string } | null
  isPending: boolean
  onResetToOriginal: () => void
  className?: string
  children?: React.ReactNode
}

function formatTimestamp(isoString: string | null | undefined): string {
  if (!isoString) return ''
  try {
    const d = new Date(isoString)
    if (isNaN(d.getTime())) return ''
    return ` on ${d.toLocaleString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })}`
  } catch {
    return ''
  }
}

function getProvenance(
  draft: DraftRecord | null,
  draftText: string
): { label: 'AI-generated' | 'AI-edited' | 'Manual'; variant: 'brand' | 'neutral' } {
  const type = draft?.draft_type?.toLowerCase()

  if (type === 'manual') {
    return { label: 'Manual', variant: 'neutral' }
  }

  if (type === 'ai_edited' || type === 'ai-edited') {
    return { label: 'AI-edited', variant: 'neutral' }
  }

  if (type === 'ai_generated' || type === 'ai-generated') {
    if (draft?.ai_generated_text && draftText.trim() !== draft.ai_generated_text.trim()) {
      return { label: 'AI-edited', variant: 'neutral' }
    }
    return { label: 'AI-generated', variant: 'brand' }
  }

  if (!draft) {
    return { label: 'Manual', variant: 'neutral' }
  }

  return { label: 'Manual', variant: 'neutral' }
}

export function DraftEditorCard({
  draft,
  draftText,
  onDraftTextChange,
  isLocked,
  isSent,
  isApproved,
  fromAddress,
  feedback,
  isPending,
  onResetToOriginal,
  className = '',
  children,
}: DraftEditorCardProps) {
  const [copied, setCopied] = React.useState(false)

  // Detect unresolved placeholders like [CONFIRM ...], [INSERT ...]
  const placeholders = React.useMemo(() => extractPlaceholders(draftText), [draftText])

  // Word and character statistics
  const charCount = draftText.length
  const wordCount = draftText.trim() ? draftText.trim().split(/\s+/).length : 0

  // Comparison state against original AI draft
  const isModifiedFromAI =
    Boolean(draft?.ai_generated_text) && draftText !== draft?.ai_generated_text

  // Provenance determination
  const provenance = getProvenance(draft, draftText)

  // Copy handler with feedback state
  const handleCopyText = React.useCallback(async () => {
    if (!draftText) return
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(draftText)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }
    } catch (err) {
      console.error('Failed to copy draft text:', err)
    }
  }, [draftText])

  const renderStatusBadge = () => {
    if (isSent || draft?.status === 'sent') {
      return (
        <Badge
          size="sm"
          className="bg-[var(--text-primary)] text-white border-[var(--text-primary)] font-medium"
        >
          Sent
        </Badge>
      )
    }
    if (isApproved || draft?.status === 'approved') {
      return (
        <Badge variant="success" size="sm">
          Approved
        </Badge>
      )
    }
    if (draft?.status === 'discarded') {
      return (
        <Badge variant="neutral" size="sm">
          Discarded
        </Badge>
      )
    }
    return (
      <Badge variant="warning" size="sm">
        Pending review
      </Badge>
    )
  }

  return (
    <Card
      variant="default"
      padding="none"
      className={`border border-[var(--border-subtle)] bg-[var(--surface)] rounded-xl shadow-xs overflow-hidden ${className}`}
    >
      {/* Card Header: Provenance & Status */}
      <div className="p-4 sm:p-5 border-b border-[var(--border-subtle)] flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-[var(--surface-subtle)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--text-primary)] shrink-0">
            <Mail className="w-4 h-4 text-[var(--text-secondary)]" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-[var(--text-primary)] leading-tight truncate">
              Review &amp; approve reply
            </h2>
            {fromAddress && (
              <p className="text-[11px] text-[var(--text-secondary)] truncate max-w-[220px] sm:max-w-xs mt-0.5">
                To: {fromAddress}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Badge variant={provenance.variant} size="sm">
            {provenance.label}
          </Badge>
          {renderStatusBadge()}
        </div>
      </div>

      <div className="p-4 sm:p-5 space-y-4">
        {/* Action Feedback Banner */}
        {feedback && (
          <div
            role="status"
            className={`p-3 rounded-lg text-xs flex items-start gap-2.5 border transition-all ${
              feedback.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-red-50 border-red-200 text-red-900'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2
                className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5"
                aria-hidden="true"
              />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" aria-hidden="true" />
            )}
            <div className="space-y-0.5 flex-1">
              <p className="font-semibold">
                {feedback.type === 'success' ? 'Action completed' : 'Action failed'}
              </p>
              <p className="leading-relaxed text-[11px] opacity-90">{feedback.message}</p>
            </div>
          </div>
        )}

        {/* Lockdown Banners */}
        {isSent ? (
          <div
            role="status"
            className="bg-[var(--text-primary)] text-white border border-[var(--text-primary)] rounded-lg p-3.5 text-xs flex items-start gap-2.5 shadow-xs"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" aria-hidden="true" />
            <div className="space-y-0.5">
              <p className="font-semibold text-white">Email Dispatched &amp; Sent</p>
              <p className="text-[11px] text-white/80 leading-relaxed">
                This reply was sent to <strong className="text-white font-medium">{fromAddress}</strong>
                {formatTimestamp(draft?.sent_at)}. The draft is locked and no further edits or re-sending
                are possible.
              </p>
            </div>
          </div>
        ) : isApproved ? (
          <div
            role="status"
            className="bg-emerald-50 border border-emerald-200 rounded-lg p-3.5 text-xs text-emerald-900 flex items-start gap-2.5"
          >
            <Clock className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" aria-hidden="true" />
            <div className="space-y-0.5">
              <p className="font-semibold text-emerald-950">Approved — Queued for Dispatch</p>
              <p className="text-[11px] text-emerald-800 leading-relaxed">
                This draft was approved{formatTimestamp(draft?.approved_at)} and automation was notified
                for dispatch to <strong className="text-emerald-950 font-medium">{fromAddress}</strong>.
                All further edits are locked.
              </p>
            </div>
          </div>
        ) : null}

        {/* Unresolved Placeholders Warning Banner */}
        <PlaceholderAlert placeholders={placeholders} />

        {/* Draft Textarea Area */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <label
              htmlFor="draft-reply-textarea"
              className="flex items-center gap-1.5 text-xs font-medium text-[var(--text-secondary)]"
            >
              {isLocked && (
                <Lock className="w-3.5 h-3.5 text-[var(--text-tertiary)]" aria-hidden="true" />
              )}
              <span>{isLocked ? 'Final reply content (locked)' : 'Reply draft content'}</span>
            </label>

            <div className="flex items-center gap-1">
              {!isLocked && isModifiedFromAI && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onResetToOriginal}
                  disabled={isPending}
                  leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                  className="h-7 px-2 text-[11px] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  title="Reset draft back to original AI generated text"
                >
                  <span>Reset to AI</span>
                </Button>
              )}

              {draftText && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyText}
                  leftIcon={
                    copied ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
                    )
                  }
                  className={`h-7 px-2 text-[11px] transition-colors ${
                    copied
                      ? 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 font-medium'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                  title={copied ? 'Draft text copied to clipboard' : 'Copy draft text to clipboard'}
                >
                  <span>{copied ? 'Copied!' : 'Copy text'}</span>
                </Button>
              )}
            </div>
          </div>

          <textarea
            id="draft-reply-textarea"
            name="draft-reply-textarea"
            rows={10}
            value={draftText}
            onChange={(e) => {
              if (!isLocked) {
                onDraftTextChange(e.target.value)
              }
            }}
            placeholder={isLocked ? 'No reply content' : 'Write or edit reply here...'}
            readOnly={isLocked}
            disabled={isPending}
            className={`w-full p-3.5 text-xs sm:text-sm rounded-lg font-sans leading-relaxed transition-colors ${
              isLocked
                ? 'bg-[var(--surface-subtle)] border border-[var(--border-subtle)] text-[var(--text-primary)] cursor-default select-text resize-none focus:outline-none'
                : 'bg-[var(--surface)] border border-[var(--border-subtle)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)] focus:outline-none disabled:opacity-60'
            }`}
          />

          {/* Textarea Footer: Counter & Comparison Status */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-[var(--text-secondary)] pt-1">
            <span className="tabular-nums font-mono text-[var(--text-tertiary)]">
              {wordCount} {wordCount === 1 ? 'word' : 'words'} &middot; {charCount}{' '}
              {charCount === 1 ? 'char' : 'chars'}
            </span>

            {isLocked ? (
              <span className="font-medium text-[var(--text-secondary)] flex items-center gap-1">
                <Lock className="w-3 h-3 text-[var(--text-tertiary)]" aria-hidden="true" />
                <span>Read-only</span>
              </span>
            ) : draft?.ai_generated_text ? (
              <span className="flex items-center gap-1.5">
                {draftText.trim() === draft.ai_generated_text.trim() ? (
                  <>
                    <Sparkles className="w-3 h-3 text-[var(--brand)] opacity-70" aria-hidden="true" />
                    <span className="text-[var(--text-tertiary)]">Matches original AI draft</span>
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-3 h-3 text-amber-600" aria-hidden="true" />
                    <span className="text-amber-800 font-medium">Modified from original AI draft</span>
                  </>
                )}
              </span>
            ) : (
              <span className="text-[var(--text-tertiary)]">Manual reply</span>
            )}
          </div>
        </div>

        {children && <div className="pt-2">{children}</div>}
      </div>
    </Card>
  )
}
