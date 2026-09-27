'use client'

import React, { useMemo } from 'react'
import { diffWords } from '@/lib/diff'

/**
 * The AI draft against the current reply, word by word. Removed words are
 * struck through, added words underlined — never colour alone.
 */
export function DraftDiff({ aiText, text, id }: { aiText: string; text: string; id?: string }) {
  const parts = useMemo(() => diffWords(aiText, text), [aiText, text])

  return (
    <div id={id} className="rounded-md border border-line bg-canvas px-3 py-2.5">
      <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-fg-subtle">
        <span className="font-medium text-fg-muted">Changes from the AI draft</span>
        <span>
          <del className="text-danger-fg decoration-danger-mark">Removed</del>
        </span>
        <span>
          <ins className="rounded-xs bg-success-subtle text-success-fg underline decoration-success-mark underline-offset-2">Added</ins>
        </span>
      </p>
      {parts ? (
        <p className="mt-2 max-w-(--fm-c-reading-max) whitespace-pre-wrap break-words text-md text-fg">
          {parts.map((part, i) =>
            part.type === 'same' ? (
              <span key={i}>{part.text}</span>
            ) : part.type === 'removed' ? (
              <del key={i} className="text-danger-fg decoration-danger-mark">
                <span className="sr-only">[removed: </span>
                {part.text}
                <span className="sr-only">]</span>
              </del>
            ) : (
              <ins key={i} className="rounded-xs bg-success-subtle text-success-fg underline decoration-success-mark underline-offset-2">
                <span className="sr-only">[added: </span>
                {part.text}
                <span className="sr-only">]</span>
              </ins>
            )
          )}
        </p>
      ) : (
        <p className="mt-2 text-sm text-fg-muted">These texts are too long to compare here.</p>
      )}
    </div>
  )
}
