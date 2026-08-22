import React from 'react'
import Link from 'next/link'
import { Navbar } from '@/components/Navbar'
import { FileQuestion, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#f5f1e8] text-[#1c1a17]">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <div className="max-w-md mx-auto bg-white rounded-lg border border-[#e8e2d4] p-8 shadow-sm space-y-4">
          <FileQuestion className="w-8 h-8 mx-auto text-[#6b6559] opacity-60" />
          <h1 className="text-lg font-bold text-[#1c1a17]">
            Page not found
          </h1>
          <p className="text-xs text-[#6b6559] leading-relaxed">
            The requested email or page could not be located. It may have been archived or removed.
          </p>
          <div className="pt-2">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#1c1a17] hover:bg-[#2a2723] text-[#f5f1e8] text-xs font-semibold rounded transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to inbox</span>
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
