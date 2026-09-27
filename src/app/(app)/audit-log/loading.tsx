import React from 'react'

export default function LoadingAuditLog() {
  return (
    <div className="flex-1 bg-canvas">
      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-6 lg:px-8" aria-busy="true">
        <span className="sr-only">Loading audit log…</span>
        <div
          className="bg-surface-raised rounded-surface border border-border-hairline shadow-sm overflow-hidden animate-pulse"
          aria-hidden="true"
        >
          <div className="px-4 pt-3.5 pb-3 space-y-2">
            <div className="h-4 w-24 bg-surface-sunken rounded-control" />
            <div className="h-3 w-32 bg-surface-sunken rounded-control" />
          </div>
          <div className="px-4 pb-3 flex items-center gap-3">
            <div className="h-8 w-[28rem] max-w-full bg-surface-sunken rounded-control" />
            <div className="h-8 w-64 bg-surface-sunken/70 rounded-control ml-auto hidden lg:block" />
          </div>
          <div className="border-t border-border-hairline divide-y divide-border-hairline">
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
              <div key={i} className="px-4 py-3 flex items-center justify-between gap-4">
                <div className="h-3.5 w-28 bg-surface-sunken rounded-control" />
                <div className="h-3.5 w-20 bg-surface-sunken rounded-control hidden sm:block" />
                <div className="h-3.5 w-48 bg-surface-sunken rounded-control" />
                <div className="h-3.5 w-28 bg-surface-sunken rounded-control hidden lg:block" />
                <div className="h-3.5 w-40 bg-surface-sunken rounded-control hidden lg:block" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
