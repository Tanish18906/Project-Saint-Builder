'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import { MailProvider } from './mail-context'
import { QueueView } from './queue-view'

const isMailRoute = (pathname: string) => pathname === '/' || pathname.startsWith('/emails/')

/**
 * The mail screens' split view: queue pane + whatever the route renders
 * (the empty pane on `/`, the review workspace on `/emails/[id]`).
 *   ≥1280  queue and workspace side by side
 *   <1280  one at a time: the queue on `/`, the workspace full-screen on an email
 * Other routes (Activity) render their page alone.
 */
export function MailFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  if (!isMailRoute(pathname)) return <>{children}</>

  const emailOpen = pathname.startsWith('/emails/')
  return (
    <MailProvider>
      <div className="flex min-w-0 flex-1">
        {/* Stays mounted (hidden) under 1280 so the workspace can still walk the queue. */}
        <QueueView className={emailOpen ? 'max-xl:hidden' : undefined} />
        {children}
      </div>
    </MailProvider>
  )
}
