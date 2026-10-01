'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, Search, ChevronRight } from 'lucide-react'

export interface TopbarProps {
  onOpenMobileMenu: () => void
  currentPath?: string
}

export function Topbar({ onOpenMobileMenu, currentPath }: TopbarProps) {
  const pathname = usePathname() || currentPath || '/'

  let title = 'Inbox'
  let breadcrumb = 'Inbox'
  let parentHref = '/'

  if (pathname === '/' || pathname === '') {
    title = 'Inbox'
    breadcrumb = 'Inbox'
  } else if (pathname.startsWith('/emails')) {
    title = 'Email Review'
    breadcrumb = 'Inbox'
    parentHref = '/'
  } else if (pathname === '/audit-log') {
    title = 'Audit Log'
    breadcrumb = 'Audit Log'
  }

  const isDetailPage = pathname.startsWith('/emails')

  return (
    <header className="sticky top-0 z-20 h-14 bg-[var(--surface)]/90 backdrop-blur-md border-b border-[var(--border-subtle)] flex items-center justify-between px-4 sm:px-6 lg:px-8">
      {/* Left: Hamburger & Contextual Title / Breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="md:hidden p-1.5 -ml-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-subtle)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] transition-colors cursor-pointer"
          aria-label="Open sidebar navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex flex-col">
          <nav
            aria-label="Breadcrumb"
            className="flex items-center gap-1 text-[11px] text-[var(--text-tertiary)] select-none"
          >
            <Link href="/" className="hover:text-[var(--text-secondary)] transition-colors">
              Foreman
            </Link>
            <ChevronRight className="w-3 h-3 text-[var(--border-strong)]" />
            {isDetailPage ? (
              <>
                <Link
                  href={parentHref}
                  className="hover:text-[var(--text-secondary)] transition-colors"
                >
                  {breadcrumb}
                </Link>
                <ChevronRight className="w-3 h-3 text-[var(--border-strong)]" />
                <span className="text-[var(--text-secondary)] font-medium truncate max-w-[120px] sm:max-w-none">
                  {title}
                </span>
              </>
            ) : (
              <span className="text-[var(--text-secondary)] font-medium">{breadcrumb}</span>
            )}
          </nav>
          <h1 className="text-sm font-semibold tracking-tight text-[var(--text-primary)] leading-none mt-0.5">
            {title}
          </h1>
        </div>
      </div>

      {/* Right: Live Status Pill & Quick Search */}
      <div className="flex items-center gap-3">
        {/* Quick Search placeholder affordance */}
        <div
          role="button"
          tabIndex={0}
          title="Search emails and logs (Upcoming)"
          className="hidden md:flex items-center gap-2 px-2.5 py-1.5 text-xs text-[var(--text-tertiary)] bg-[var(--surface-subtle)] border border-[var(--border-subtle)] rounded-lg cursor-not-allowed select-none transition-colors"
        >
          <Search className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
          <span>Quick search...</span>
          <kbd className="hidden lg:inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium text-[var(--text-tertiary)] bg-[var(--surface)] border border-[var(--border-subtle)] rounded shadow-2xs">
            ⌘K
          </kbd>
        </div>

        {/* Live Status Pill Indicator */}
        <div
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200 select-none shadow-2xs"
          title="Live triage updates active"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="hidden sm:inline">Live updates active</span>
          <span className="sm:hidden">Live</span>
        </div>
      </div>
    </header>
  )
}
