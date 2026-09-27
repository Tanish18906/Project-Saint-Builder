import React from 'react'
import { cn } from '@/lib/cn'

type PanelProps = React.HTMLAttributes<HTMLElement> & {
  as?: 'div' | 'section' | 'article' | 'aside'
  /** Padding is opt-in: lists and tables run edge to edge. */
  padded?: boolean
}

/**
 * The one raised surface. Border first, shadow barely there. Panels are never
 * nested inside panels — use a Separator or a PanelHeader instead.
 */
export function Panel({ as: Tag = 'div', padded = false, className, ...props }: PanelProps) {
  return (
    <Tag
      className={cn('rounded-lg border border-line-strong bg-panel shadow-xs', padded && 'p-4 sm:p-5', className)}
      {...props}
    />
  )
}

interface PanelHeaderProps {
  title: React.ReactNode
  /** Heading level — keep the document outline correct. */
  level?: 1 | 2 | 3
  description?: React.ReactNode
  actions?: React.ReactNode
  className?: string
}

export function PanelHeader({ title, level = 2, description, actions, className }: PanelHeaderProps) {
  const Heading = `h${level}` as 'h1' | 'h2' | 'h3'
  return (
    <div className={cn('flex items-start justify-between gap-3 border-b border-line px-4 py-3', className)}>
      <div className="min-w-0">
        <Heading className="text-lg font-semibold tracking-[-0.01em] text-fg">{title}</Heading>
        {description && <p className="mt-0.5 text-sm text-fg-muted">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  )
}

export function Separator({ className, vertical = false }: { className?: string; vertical?: boolean }) {
  return (
    <div
      role="separator"
      aria-orientation={vertical ? 'vertical' : 'horizontal'}
      className={cn(vertical ? 'w-px self-stretch bg-line' : 'h-px w-full bg-line', className)}
    />
  )
}
