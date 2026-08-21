'use client'

import React, { useEffect } from 'react'
import Link from 'next/link'
import { AlertCircle, RotateCcw, ArrowRight } from 'lucide-react'

export default function VoiceErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[VoiceErrorBoundary] Caught error:', error)
  }, [error])

  return (
    <div className="min-h-screen bg-[#f5f1e8] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl border border-[#e8e2d4] p-6 shadow-sm text-center space-y-4">
        <div className="w-14 h-14 bg-red-100 text-red-700 rounded-full mx-auto flex items-center justify-center">
          <AlertCircle className="w-7 h-7" />
        </div>
        <div className="space-y-1">
          <h1 className="text-lg font-bold text-[#1c1a17]">Unable to Load Voice Page</h1>
          <p className="text-xs text-[#6b6559] leading-relaxed">
            An unexpected error occurred while loading this email for voice review. Please tap retry below or open the dashboard directly.
          </p>
        </div>
        <div className="pt-2 space-y-2">
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-[#1c1a17] hover:bg-[#2a2723] text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Try Again</span>
          </button>
          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-white hover:bg-[#f5f1e8] border border-[#e8e2d4] text-[#1c1a17] text-xs font-semibold rounded-xl transition-colors cursor-pointer"
          >
            <span>Open Dashboard</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  )
}
