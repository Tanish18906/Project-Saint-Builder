import React from 'react'
import { cn } from '@/lib/cn'

interface PageHeaderProps {
  title: string
  /** Quiet trailing detail, e.g. "12 emails". */
  meta?: React.ReactNode
  actions?: React.ReactNode
  className?: string
}

/**
 * Toolbar row at the top of a content pane. Same height as the sidebar header
 * (--fm-c-topbar-h) so the two read as one line across the window. Hidden on
 * phones, where the top bar already names the section — screens that add
 * actions here must also expose them on phones.
 */
export function PageHeader({ title, meta, actions, className }: PageHeaderProps) {
  return (
    <header
      className={cn(
        'sticky top-0 z-20 hidden h-(--fm-c-topbar-h) shrink-0 items-center gap-3 border-b border-line bg-panel px-6 sm:flex',
        className
      )}
    >
      <h1 className="truncate text-lg font-semibold tracking-[-0.01em] text-fg">{title}</h1>
      {meta && <span className="truncate text-sm tabular-nums text-fg-subtle">{meta}</span>}
      {actions && <div className="ml-auto flex shrink-0 items-center gap-2">{actions}</div>}
    </header>
  )
}
