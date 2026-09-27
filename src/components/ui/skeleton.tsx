import React from 'react'
import { cn } from '@/lib/cn'

/**
 * Placeholder block. Skeletons mirror the real layout's shape so content lands
 * without a jump. Pulsing is the one permitted loop while data loads; reduced
 * motion turns it into a static block.
 */
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn('animate-pulse rounded-sm bg-sunken', className)} />
}

/** Wraps a skeleton region so assistive tech hears one "Loading…" instead of nothing. */
export function SkeletonRegion({ label, className, children }: { label: string; className?: string; children: React.ReactNode }) {
  return (
    <div role="status" aria-busy="true" className={className}>
      <span className="sr-only">{label}</span>
      {children}
    </div>
  )
}
