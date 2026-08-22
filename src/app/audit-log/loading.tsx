import React from 'react'
import { Navbar } from '@/components/Navbar'

export default function LoadingAuditLog() {
  return (
    <div className="min-h-screen bg-[#f5f1e8] text-[#1c1a17]">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6">
        <div className="space-y-4 animate-pulse">
          {/* Top Filter Card Skeleton */}
          <div className="bg-white rounded-lg border border-[#e8e2d4] p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-[#e8e2d4] pb-2.5">
              <div className="flex items-center gap-4">
                <div className="h-4 w-20 bg-[#e8e2d4] rounded" />
                <div className="h-4 w-24 bg-[#e8e2d4] rounded hidden sm:block" />
                <div className="h-4 w-24 bg-[#e8e2d4] rounded hidden sm:block" />
              </div>
              <div className="h-4 w-20 bg-[#e8e2d4] rounded" />
            </div>
            <div className="h-8 w-64 bg-[#e8e2d4] rounded" />
          </div>

          {/* Table Header Skeleton */}
          <div className="flex items-center justify-between px-1">
            <div className="h-4 w-32 bg-[#e8e2d4] rounded" />
            <div className="h-3 w-28 bg-[#e8e2d4] rounded" />
          </div>

          {/* Table Rows Skeleton */}
          <div className="bg-white rounded-lg border border-[#e8e2d4] overflow-hidden">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="p-3.5 border-b border-[#e8e2d4] flex items-center justify-between gap-4"
              >
                <div className="h-4 w-24 bg-[#e8e2d4] rounded" />
                <div className="h-4 w-20 bg-[#e8e2d4] rounded" />
                <div className="h-4 w-48 bg-[#e8e2d4] rounded" />
                <div className="h-4 w-28 bg-[#e8e2d4] rounded" />
                <div className="h-4 w-40 bg-[#e8e2d4] rounded hidden md:block" />
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
