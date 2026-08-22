'use client'

import React, { useEffect } from 'react'
import { Navbar } from '@/components/Navbar'
import { AlertCircle, RotateCcw } from 'lucide-react'

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
    <div className="min-h-screen bg-[#f5f1e8] text-[#1c1a17]">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <div className="max-w-md mx-auto bg-white rounded-lg border border-[#e8e2d4] p-8 shadow-sm space-y-4">
          <div className="w-10 h-10 rounded-full bg-red-50 border border-red-200 text-red-700 flex items-center justify-center mx-auto">
            <AlertCircle className="w-5 h-5 text-red-600" />
          </div>

          <h1 className="text-lg font-bold text-[#1c1a17]">
            Something went wrong
          </h1>

          <p className="text-xs text-[#6b6559] leading-relaxed">
            {error?.message || 'An unexpected error occurred while loading this view.'}
          </p>

          <div className="pt-2 flex items-center justify-center gap-3">
            <button
              onClick={() => reset()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#1c1a17] hover:bg-[#2a2723] text-[#f5f1e8] text-xs font-semibold rounded transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Try again</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
