import React from 'react'
import { Mic } from 'lucide-react'

export default function VoiceLoading() {
  return (
    <div className="min-h-screen bg-[#f5f1e8] text-[#1c1a17] flex flex-col items-center justify-between p-4 sm:p-6 font-sans">
      {/* Top Header Card Skeleton */}
      <header className="w-full max-w-md bg-white rounded-2xl border border-[#e8e2d4] p-4 shadow-sm space-y-3 animate-pulse">
        <div className="flex items-center justify-between gap-2 border-b border-[#e8e2d4] pb-2.5">
          <div className="flex items-center gap-2">
            <div className="h-5 w-16 bg-stone-200 rounded-full" />
            <div className="h-5 w-20 bg-stone-200 rounded-full" />
          </div>
          <div className="h-5 w-20 bg-stone-100 rounded" />
        </div>

        <div className="space-y-1.5 pt-1">
          <div className="h-5 w-3/4 bg-stone-200 rounded" />
          <div className="h-3 w-1/2 bg-stone-100 rounded" />
        </div>
      </header>

      {/* Center Push-To-Talk Button Skeleton */}
      <main className="w-full max-w-md my-auto py-6 flex flex-col items-center justify-center space-y-6 text-center">
        <div className="w-full max-w-xs h-8 bg-stone-200/70 rounded-xl animate-pulse" />

        <div className="relative flex items-center justify-center">
          <div className="w-36 h-36 rounded-full bg-[#1c1a17]/10 flex flex-col items-center justify-center animate-pulse ring-4 ring-[#e8e2d4]">
            <Mic className="w-10 h-10 text-[#1c1a17]/40" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#1c1a17]/40 mt-2">
              Loading Voice...
            </span>
          </div>
        </div>

        <div className="w-full max-w-sm h-12 bg-stone-200/80 rounded-xl animate-pulse" />
      </main>

      {/* Footer Drawer Button Skeleton */}
      <footer className="w-full max-w-md">
        <div className="w-full h-10 bg-white rounded-xl border border-[#e8e2d4] animate-pulse" />
      </footer>
    </div>
  )
}
