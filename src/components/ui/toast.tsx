'use client'

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react'
import { cn } from '@/lib/cn'

/**
 * Toasts are for transient results of the user's own action ("Draft saved").
 * Anything the user must still see after it happens (locked state, a failed
 * load) belongs inline, not in a toast.
 */
export type ToastTone = 'neutral' | 'success' | 'danger'

export interface ToastOptions {
  title: string
  description?: string
  tone?: ToastTone
  /** ms; errors default to staying until dismissed. */
  duration?: number
  action?: { label: string; onClick: () => void }
}

interface ToastItem extends Required<Pick<ToastOptions, 'title' | 'tone'>> {
  id: number
  description?: string
  duration: number
  action?: ToastOptions['action']
}

const ToastContext = createContext<((opts: ToastOptions) => void) | null>(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>')
  return ctx
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])
  const nextId = useRef(1)

  const dismiss = useCallback((id: number) => setItems((prev) => prev.filter((t) => t.id !== id)), [])

  const push = useCallback((opts: ToastOptions) => {
    const tone = opts.tone ?? 'neutral'
    const item: ToastItem = {
      id: nextId.current++,
      title: opts.title,
      description: opts.description,
      tone,
      action: opts.action,
      duration: opts.duration ?? (tone === 'danger' ? Infinity : 4000),
    }
    // Keep at most three on screen; oldest leave first.
    setItems((prev) => [...prev.slice(-2), item])
  }, [])

  const value = useMemo(() => push, [push])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <section
        aria-label="Notifications"
        className="pointer-events-none fixed inset-x-0 bottom-[var(--fm-bottom-offset,0px)] z-60 flex flex-col items-center gap-2 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:bottom-[calc(0.5rem+var(--fm-toast-lift,0px))] sm:right-2 sm:left-auto sm:items-end"
      >
        {items.map((t) => (
          <ToastCard key={t.id} item={t} dismiss={dismiss} />
        ))}
      </section>
    </ToastContext.Provider>
  )
}

const toneIcon: Record<ToastTone, React.ReactNode> = {
  neutral: <Info className="size-4 text-fg-inverse-muted" aria-hidden="true" />,
  success: <CheckCircle2 className="size-4 text-success-mark" aria-hidden="true" />,
  danger: <AlertCircle className="size-4 text-danger-mark" aria-hidden="true" />,
}

function ToastCard({ item, dismiss }: { item: ToastItem; dismiss: (id: number) => void }) {
  // Stable callback so re-renders of the provider do not restart the timer.
  const onDismiss = useCallback(() => dismiss(item.id), [dismiss, item.id])
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (paused || !Number.isFinite(item.duration)) return
    const timer = setTimeout(onDismiss, item.duration)
    return () => clearTimeout(timer)
  }, [paused, item.duration, onDismiss])

  return (
    <div
      role={item.tone === 'danger' ? 'alert' : 'status'}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className={cn(
        'pointer-events-auto flex w-full max-w-sm items-start gap-2.5 rounded-lg bg-inverse px-3.5 py-3 text-fg-inverse shadow-lg',
        'animate-fm-pop-in'
      )}
    >
      <span className="mt-0.5 flex">{toneIcon[item.tone]}</span>
      <div className="min-w-0 flex-1">
        <p className="text-base font-medium">{item.title}</p>
        {item.description && <p className="mt-0.5 text-sm text-fg-inverse-muted">{item.description}</p>}
      </div>
      {item.action && (
        <button
          type="button"
          onClick={() => {
            item.action?.onClick()
            onDismiss()
          }}
          className="-my-0.5 h-7 shrink-0 cursor-pointer rounded-md px-2 text-sm font-medium text-fg-inverse underline-offset-2 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-fg-inverse"
        >
          {item.action.label}
        </button>
      )}
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss notification"
        className="-m-1 flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-md text-fg-inverse-muted outline-none hover:text-fg-inverse focus-visible:ring-2 focus-visible:ring-fg-inverse pointer-coarse:size-(--fm-c-touch)"
      >
        <X className="size-4" aria-hidden="true" />
      </button>
    </div>
  )
}
