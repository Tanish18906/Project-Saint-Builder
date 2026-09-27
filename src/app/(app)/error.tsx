'use client'

import React, { useEffect } from 'react'
import { AlertCircle, RotateCcw } from 'lucide-react'
import { toUserMessage } from '@/lib/user-facing-error'

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[Application Error]:', error)
  }, [error])

  return (
    <div className="flex-1 bg-canvas">
      {/* LEGACY content — restyled in the login/error/loading/not-found step. */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div role="alert" className="max-w-md mx-auto bg-surface-raised rounded-surface border border-border-hairline p-6 shadow-sm">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-signal-urgent shrink-0 mt-0.5" />
            <div className="space-y-1.5">
              <h1 className="text-heading font-semibold text-text-primary">
                This view couldn’t be loaded
              </h1>
              <p className="text-secondary text-text-secondary leading-relaxed">
                {toUserMessage(error?.message, 'Something went wrong while loading. Try again, or refresh the page.')}
              </p>
              {error?.digest && (
                <p className="text-caption text-text-tertiary">
                  Reference <span className="font-mono">{error.digest}</span>
                </p>
              )}
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              onClick={() => reset()}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-surface-brand hover:bg-surface-brand-hover text-text-on-brand text-caption font-semibold rounded-control transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-brand focus-visible:ring-offset-2"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Try again</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
