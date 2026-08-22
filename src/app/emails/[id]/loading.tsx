import React from 'react'
import { Navbar } from '@/components/Navbar'

export default function LoadingEmailDetail() {
  return (
    <div className="min-h-screen bg-[#f5f1e8] text-[#1c1a17]">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6">
        <div className="space-y-4 animate-pulse">
          {/* Top Bar Skeleton */}
          <div className="flex items-center justify-between bg-white p-3.5 rounded-lg border border-[#e8e2d4]">
            <div className="h-4 w-28 bg-[#e8e2d4] rounded" />
            <div className="flex items-center gap-2">
              <div className="h-4 w-16 bg-[#e8e2d4] rounded" />
              <div className="h-4 w-20 bg-[#e8e2d4] rounded" />
            </div>
          </div>

          {/* Two-Column Grid Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Left Column (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              <div className="bg-white rounded-lg border border-[#e8e2d4] p-5 space-y-4">
                <div className="h-6 w-3/4 bg-[#e8e2d4] rounded" />
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="h-4 w-32 bg-[#e8e2d4] rounded" />
                  <div className="h-4 w-28 bg-[#e8e2d4] rounded" />
                  <div className="h-4 w-24 bg-[#e8e2d4] rounded" />
                  <div className="h-4 w-36 bg-[#e8e2d4] rounded" />
                </div>
                <div className="h-32 w-full bg-[#e8e2d4]/50 rounded mt-4" />
              </div>
            </div>

            {/* Right Column (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-white rounded-lg border border-[#e8e2d4] p-4 space-y-3">
                <div className="h-4 w-36 bg-[#e8e2d4] rounded" />
                <div className="h-16 w-full bg-[#e8e2d4]/60 rounded" />
                <div className="grid grid-cols-2 gap-2">
                  <div className="h-4 w-20 bg-[#e8e2d4] rounded" />
                  <div className="h-4 w-20 bg-[#e8e2d4] rounded" />
                </div>
              </div>

              <div className="bg-white rounded-lg border border-[#e8e2d4] p-4 space-y-3">
                <div className="h-4 w-32 bg-[#e8e2d4] rounded" />
                <div className="h-40 w-full bg-[#e8e2d4]/40 rounded" />
                <div className="h-9 w-full bg-[#e8e2d4] rounded" />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
