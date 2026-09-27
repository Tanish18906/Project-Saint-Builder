import React from 'react'
import Link from 'next/link'
import { FileQuestion, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-dvh bg-canvas">
      {/* LEGACY content — restyled in the login/error/loading/not-found step. */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto bg-surface-raised rounded-surface border border-border-hairline p-6 shadow-sm">
          <div className="flex items-start gap-3">
            <FileQuestion className="w-5 h-5 text-text-tertiary shrink-0 mt-0.5" />
            <div className="space-y-1.5">
              <h1 className="text-heading font-semibold text-text-primary">
                Page not found
              </h1>
              <p className="text-secondary text-text-secondary leading-relaxed">
                This email or page couldn’t be located. It may have been archived or removed.
              </p>
            </div>
          </div>
          <div className="pt-4 flex justify-end">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-surface-brand hover:bg-surface-brand-hover text-text-on-brand text-caption font-semibold rounded-control transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-brand focus-visible:ring-offset-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to inbox</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
