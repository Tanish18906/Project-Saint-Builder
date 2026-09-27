import React from 'react'

// LEGACY PRESENTATION — replaced during the app-shell rebuild (DESIGN_SYSTEM.md).
// Filled dot when the Realtime channel is subscribed, hollow while connecting.
export function RealtimeIndicator({ live }: { live: boolean }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 text-caption text-text-tertiary whitespace-nowrap"
      title={live ? 'Receiving live updates' : 'Connecting to live updates…'}
      role="status"
    >
      <span
        aria-hidden="true"
        className={`w-1.5 h-1.5 rounded-full ${live ? 'bg-text-secondary' : 'border border-text-tertiary'}`}
      />
      {live ? 'Live' : 'Connecting…'}
    </span>
  )
}
