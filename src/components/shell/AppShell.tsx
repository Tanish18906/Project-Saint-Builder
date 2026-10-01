'use client'

import React, { useState, useEffect, useSyncExternalStore } from 'react'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'

export interface AppShellProps {
  children: React.ReactNode
  userEmail?: string | null
  currentPath?: string
}

let listeners: Array<() => void> = []

function emitChange() {
  for (const listener of listeners) {
    listener()
  }
}

const sidebarStore = {
  subscribe(listener: () => void) {
    listeners.push(listener)
    return () => {
      listeners = listeners.filter((l) => l !== listener)
    }
  },
  getSnapshot() {
    try {
      return localStorage.getItem('foreman_sidebar_collapsed') === 'true'
    } catch {
      return false
    }
  },
  getServerSnapshot() {
    return false
  },
  toggle() {
    try {
      const current = localStorage.getItem('foreman_sidebar_collapsed') === 'true'
      localStorage.setItem('foreman_sidebar_collapsed', String(!current))
    } catch {
      // Ignore
    }
    emitChange()
  },
}

export function AppShell({ children, userEmail, currentPath }: AppShellProps) {
  const collapsed = useSyncExternalStore(
    sidebarStore.subscribe,
    sidebarStore.getSnapshot,
    sidebarStore.getServerSnapshot
  )
  const [mobileOpen, setMobileOpen] = useState(false)

  // Listen for keyboard shortcut (Cmd+B / Ctrl+B) to toggle sidebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault()
        sidebarStore.toggle()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleToggleCollapse = () => {
    sidebarStore.toggle()
  }

  return (
    <div className="min-h-screen bg-[var(--app-bg)] text-[var(--text-primary)] flex flex-col antialiased selection:bg-[var(--brand)] selection:text-white">
      {/* Shell Sidebar (Desktop + Mobile Drawer) */}
      <Sidebar
        userEmail={userEmail}
        collapsed={collapsed}
        onToggleCollapse={handleToggleCollapse}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
        currentPath={currentPath}
      />

      {/* Main Content Area Offset for Desktop Sidebar */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-[padding] duration-200 ease-in-out ${
          collapsed ? 'md:pl-16' : 'md:pl-60'
        }`}
      >
        <Topbar
          onOpenMobileMenu={() => setMobileOpen(true)}
          currentPath={currentPath}
        />
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6">
          {children}
        </main>
      </div>
    </div>
  )
}
