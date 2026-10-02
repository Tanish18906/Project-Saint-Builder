import React from 'react'

export default function LoadingEmailDetail() {
  return (
    <div className="space-y-4 animate-pulse">
      {/* Top Bar Skeleton */}
      <div className="flex items-center justify-between bg-[var(--surface)] p-3.5 rounded-xl border border-[var(--border-subtle)]">
        <div className="h-4 w-28 bg-[var(--border-subtle)] rounded" />
        <div className="flex items-center gap-2">
          <div className="h-4 w-16 bg-[var(--border-subtle)] rounded" />
          <div className="h-4 w-20 bg-[var(--border-subtle)] rounded" />
        </div>
      </div>

      {/* Two-Column Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-[var(--surface)] rounded-xl border border-[var(--border-subtle)] p-5 space-y-4">
            <div className="h-6 w-3/4 bg-[var(--border-subtle)] rounded" />
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="h-4 w-32 bg-[var(--border-subtle)] rounded" />
              <div className="h-4 w-28 bg-[var(--border-subtle)] rounded" />
              <div className="h-4 w-24 bg-[var(--border-subtle)] rounded" />
              <div className="h-4 w-36 bg-[var(--border-subtle)] rounded" />
            </div>
            <div className="h-48 w-full bg-[var(--border-subtle)]/40 rounded mt-4" />
          </div>
        </div>

        {/* Right Column (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-[var(--surface)] rounded-xl border border-[var(--border-subtle)] p-4 space-y-3">
            <div className="h-4 w-36 bg-[var(--border-subtle)] rounded" />
            <div className="h-16 w-full bg-[var(--border-subtle)]/60 rounded" />
            <div className="grid grid-cols-2 gap-2">
              <div className="h-4 w-20 bg-[var(--border-subtle)] rounded" />
              <div className="h-4 w-20 bg-[var(--border-subtle)] rounded" />
            </div>
          </div>

          <div className="bg-[var(--surface)] rounded-xl border border-[var(--border-subtle)] p-4 space-y-3">
            <div className="h-4 w-32 bg-[var(--border-subtle)] rounded" />
            <div className="h-40 w-full bg-[var(--border-subtle)]/40 rounded" />
            <div className="h-9 w-full bg-[var(--border-subtle)] rounded" />
          </div>
        </div>
      </div>
    </div>
  )
}
