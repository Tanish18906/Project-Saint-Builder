import React from 'react'
import { Navbar } from '@/components/Navbar'

export default function LoadingInbox() {
  return (
    <div className="min-h-screen bg-[#f5f1e8] text-[#1c1a17]">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6">
        <div className="space-y-4 animate-pulse">
          {/* Top Filter Container Skeleton */}
          <div className="bg-white rounded-lg border border-[#e8e2d4] p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-[#e8e2d4] pb-2.5">
              <div className="flex items-center gap-4">
                <div className="h-4 w-36 bg-[#e8e2d4] rounded" />
                <div className="h-4 w-44 bg-[#e8e2d4] rounded hidden sm:block" />
              </div>
              <div className="h-4 w-24 bg-[#e8e2d4] rounded" />
            </div>

            <div className="flex items-center justify-between gap-3">
              <div className="h-8 w-64 bg-[#e8e2d4] rounded" />
              <div className="flex items-center gap-2">
                <div className="h-7 w-24 bg-[#e8e2d4] rounded" />
                <div className="h-7 w-24 bg-[#e8e2d4] rounded" />
              </div>
            </div>
          </div>

          {/* Section Header Skeleton */}
          <div className="flex items-center justify-between px-1">
            <div className="h-4 w-32 bg-[#e8e2d4] rounded" />
            <div className="h-3 w-28 bg-[#e8e2d4] rounded" />
          </div>

          {/* Email Card Skeletons */}
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="bg-white rounded-lg border border-[#e8e2d4] p-4 shadow-sm space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <div className="h-4 w-40 bg-[#e8e2d4] rounded" />
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-16 bg-[#e8e2d4] rounded" />
                    <div className="h-4 w-14 bg-[#e8e2d4] rounded" />
                  </div>
                </div>
                <div className="h-4 w-3/4 bg-[#e8e2d4] rounded" />
                <div className="h-3 w-full bg-[#e8e2d4]/70 rounded" />
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
