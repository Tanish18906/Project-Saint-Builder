'use client'

import React, { Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/cn'
import type { NavCounts } from '@/lib/nav-counts'
import { useNavCounts } from '@/hooks/use-nav-counts'
import { SIDEBAR_COOKIE, sectionTitle, useActiveNav, type NavId } from './nav'
import { Sidebar, SidebarRail } from './sidebar'
import { MobileTabBar, MobileTopBar } from './mobile-nav'
import { ShortcutsDialog, useShellShortcuts } from './shortcuts'
import type { ShellUser } from './user-menu'

interface AppShellProps {
  user: ShellUser
  initialCounts: NavCounts
  /** From the cookie, so the server renders the user's choice without a flash. */
  defaultCollapsed: boolean
  children: React.ReactNode
}

/**
 * The persistent application frame (DESIGN_SYSTEM.md §11–12).
 *   ≥1280  full sidebar (hideable → rail)
 *   640–1279  icon rail
 *   <640   top bar + bottom tab bar
 * Content scrolls with the document; screens that need independent panes
 * (queue + workspace) will size themselves to the viewport inside `children`.
 */
export function AppShell({ user, initialCounts, defaultCollapsed, children }: AppShellProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed)
  const [helpOpen, setHelpOpen] = useState(false)
  const counts = useNavCounts(initialCounts)

  const toggleSidebar = useCallback(() => setCollapsed((prev) => !prev), [])

  // Persist the preference after the state change (never inside the updater,
  // which React may run twice). Skips the initial render.
  const firstRender = useRef(true)
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false
      return
    }
    document.cookie = `${SIDEBAR_COOKIE}=${collapsed ? 'collapsed' : 'expanded'}; path=/; max-age=31536000; samesite=lax`
  }, [collapsed])
  const showHelp = useCallback(() => setHelpOpen(true), [])

  useShellShortcuts({ onToggleSidebar: toggleSidebar, onShowHelp: showHelp })

  const chrome = (active: NavId | null, title: string, hideTabBar: boolean) => (
    <>
      <Sidebar
        active={active}
        counts={counts}
        user={user}
        onCollapse={toggleSidebar}
        onShowShortcuts={showHelp}
        className={cn('hidden', !collapsed && 'xl:flex')}
      />
      <SidebarRail
        active={active}
        counts={counts}
        user={user}
        onExpand={toggleSidebar}
        onShowShortcuts={showHelp}
        className={cn('hidden sm:flex', !collapsed && 'xl:hidden')}
      />
      <MobileTopBar title={title} user={user} onShowShortcuts={showHelp} />
      <MobileTabBar active={active} counts={counts} hidden={hideTabBar} />
    </>
  )

  return (
    <div className="flex min-h-dvh w-full flex-col bg-panel sm:flex-row">
      <a
        href="#main"
        className="sr-only z-50 rounded-md bg-panel px-3 py-2 text-base font-medium text-fg shadow-md outline-none focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus-visible:ring-2 focus-visible:ring-focus"
      >
        Skip to content
      </a>

      {/* useSearchParams needs a Suspense boundary; the fallback is the same chrome with no active item. */}
      <Suspense fallback={chrome(null, 'Foreman', false)}>
        <ShellChrome render={chrome} />
      </Suspense>

      <main id="main" tabIndex={-1} className="flex min-w-0 flex-1 flex-col outline-none">
        <ShellContentPadding>{children}</ShellContentPadding>
      </main>

      <ShortcutsDialog open={helpOpen} onOpenChange={setHelpOpen} />
    </div>
  )
}

/** Isolates the search-param read so only the chrome suspends, never the page. */
function ShellChrome({ render }: { render: (active: NavId | null, title: string, hideTabBar: boolean) => React.ReactNode }) {
  const pathname = usePathname()
  const active = useActiveNav()
  return <>{render(active, sectionTitle(pathname, active), pathname.startsWith('/emails/'))}</>
}

/** Reserves space for the phone tab bar on screens that show it. */
function ShellContentPadding({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const hasTabBar = !pathname.startsWith('/emails/')
  return (
    <div className={cn('flex flex-1 flex-col', hasTabBar && 'max-sm:pb-[calc(3.5rem+env(safe-area-inset-bottom))]')}>{children}</div>
  )
}
