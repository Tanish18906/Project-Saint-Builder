'use client'

import React from 'react'
import { ToggleGroup } from 'radix-ui'
import { cn } from '@/lib/cn'

export interface SegmentOption<T extends string> {
  value: T
  label: React.ReactNode
  count?: number
}

interface SegmentedControlProps<T extends string> {
  /** Accessible name for the group. */
  label: string
  value: T
  onValueChange: (value: T) => void
  options: SegmentOption<T>[]
  size?: 'sm' | 'md'
  className?: string
}

/**
 * Single-choice switch between a few views (≤5). Arrow keys move between
 * options (roving focus via Radix ToggleGroup). One option is always selected.
 */
export function SegmentedControl<T extends string>({
  label,
  value,
  onValueChange,
  options,
  size = 'md',
  className,
}: SegmentedControlProps<T>) {
  return (
    <ToggleGroup.Root
      type="single"
      aria-label={label}
      value={value}
      // Radix emits '' when the active item is clicked again — keep a selection.
      onValueChange={(next) => next && onValueChange(next as T)}
      className={cn('inline-flex rounded-md bg-sunken p-0.5', className)}
    >
      {options.map((opt) => (
        <ToggleGroup.Item
          key={opt.value}
          value={opt.value}
          className={cn(
            'inline-flex cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-[5px] px-2.5 font-medium text-fg-muted outline-none',
            'transition-[background-color,color,box-shadow] duration-(--fm-duration-fast) ease-standard',
            'hover:text-fg focus-visible:ring-2 focus-visible:ring-focus',
            'data-[state=on]:bg-panel data-[state=on]:text-fg data-[state=on]:shadow-sm',
            'pointer-coarse:min-h-(--fm-c-touch)',
            size === 'sm' ? 'h-6 text-sm' : 'h-7 text-base'
          )}
        >
          {opt.label}
          {opt.count !== undefined && <span className="text-xs tabular-nums text-fg-subtle">{opt.count}</span>}
        </ToggleGroup.Item>
      ))}
    </ToggleGroup.Root>
  )
}
