'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Stops unsaved reply text being lost by moving to another email or screen.
 * While `dirty`:
 *   • in-app link clicks to another page ask first (the queue, sidebar, thread links)
 *   • `navigate()` — used by next/previous, back and keyboard shortcuts — asks first
 *   • closing or reloading the tab triggers the browser's own warning
 * Changing only the query string (queue search/filters) is not a navigation
 * away and is never blocked.
 */
export function useUnsavedGuard(dirty: boolean) {
  const router = useRouter()
  const [pendingHref, setPendingHref] = useState<string | null>(null)
  const dirtyRef = useRef(dirty)
  useEffect(() => {
    dirtyRef.current = dirty
  })

  useEffect(() => {
    if (!dirty) return
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }
    // Capture on window: runs before React's own listeners on the document, so the
    // Link never starts navigating.
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      const anchor = (e.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null
      if (!anchor || (anchor.target && anchor.target !== '_self') || anchor.hasAttribute('download')) return
      const url = new URL(anchor.href, window.location.href)
      if (url.origin !== window.location.origin || url.pathname === window.location.pathname) return
      e.preventDefault()
      e.stopPropagation()
      setPendingHref(`${url.pathname}${url.search}${url.hash}`)
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    window.addEventListener('click', onClick, true)
    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload)
      window.removeEventListener('click', onClick, true)
    }
  }, [dirty])

  const navigate = useCallback(
    (href: string) => {
      const leaving = new URL(href, window.location.href).pathname !== window.location.pathname
      if (dirtyRef.current && leaving) setPendingHref(href)
      else router.push(href)
    },
    [router]
  )

  const confirmLeave = useCallback(() => {
    const href = pendingHref
    setPendingHref(null)
    if (href) router.push(href)
  }, [pendingHref, router])

  const cancelLeave = useCallback(() => setPendingHref(null), [])

  return { navigate, leaving: pendingHref !== null, confirmLeave, cancelLeave }
}
