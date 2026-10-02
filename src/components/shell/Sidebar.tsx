'use client'

import React from 'react'
import Link, { useLinkStatus } from 'next/link'
import { usePathname } from 'next/navigation'
import { logout } from '@/app/login/actions'
import {
  LayoutDashboard,
  Inbox,
  FileClock,
  CheckCircle2,
  Building2,
  ChevronLeft,
  ChevronRight,
  LogOut,
  User,
  X,
} from 'lucide-react'

export interface SidebarProps {
  userEmail?: string | null
  collapsed: boolean
  onToggleCollapse: () => void
  mobileOpen: boolean
  onMobileClose: () => void
  currentPath?: string
}

// Shown while a click on this nav link is still waiting on the server.
// Always rendered at a fixed size (opacity toggle) so it never shifts layout.
function NavPendingHint() {
  const { pending } = useLinkStatus()
  return (
    <span
      aria-hidden
      className={`absolute right-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[var(--brand)] transition-opacity ${
        pending ? 'opacity-100 animate-pulse' : 'opacity-0'
      }`}
    />
  )
}

export function Sidebar({
  userEmail,
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onMobileClose,
  currentPath,
}: SidebarProps) {
  const pathname = usePathname() || currentPath || '/'

  const isHomeActive = pathname === '/'
  const isInboxActive = pathname === '/inbox' || pathname.startsWith('/emails')
  const isApprovalsActive = pathname.startsWith('/approvals')
  const isAuditActive = pathname === '/audit-log'

  const navLinks = [
    {
      label: 'Home',
      href: '/',
      icon: LayoutDashboard,
      active: isHomeActive,
    },
    {
      label: 'Inbox',
      href: '/inbox',
      icon: Inbox,
      active: isInboxActive,
    },
    {
      label: 'Approvals',
      href: '/approvals',
      icon: CheckCircle2,
      active: isApprovalsActive,
    },
    {
      label: 'Audit Log',
      href: '/audit-log',
      icon: FileClock,
      active: isAuditActive,
    },
  ]

  const upcomingLinks = [
    {
      label: 'Operations',
      icon: Building2,
      badge: 'Soon',
    },
  ]

  const renderContent = (isMobile = false) => {
    const isIconOnly = !isMobile && collapsed

    return (
      <div className="flex flex-col h-full justify-between">
        {/* Top Header & Navigation */}
        <div className="flex flex-col">
          {/* Header */}
          <div
            className={`h-14 flex items-center border-b border-[var(--border-subtle)] px-3.5 ${
              isIconOnly ? 'justify-center' : 'justify-between'
            }`}
          >
            {isIconOnly ? (
              <Link
                href="/"
                className="w-8 h-8 rounded-lg bg-[var(--brand)] text-white flex items-center justify-center font-bold text-sm tracking-tight shadow-xs hover:bg-[var(--brand-light)] transition-colors"
                title="Foreman — Allsaints Builders"
              >
                F
              </Link>
            ) : (
              <Link href="/" className="flex items-center gap-2.5 group">
                <div className="w-8 h-8 rounded-lg bg-[var(--brand)] text-white flex items-center justify-center font-bold text-sm tracking-tight shrink-0 shadow-xs group-hover:bg-[var(--brand-light)] transition-colors">
                  F
                </div>
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-sm tracking-tight text-[var(--text-primary)] truncate">
                      Foreman
                    </span>
                    <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[var(--brand-subtle)] text-[var(--brand-text)] border border-[var(--brand-subtle)] shrink-0">
                      Triage
                    </span>
                  </div>
                  <span className="text-[11px] text-[var(--text-secondary)] truncate">
                    Allsaints Builders
                  </span>
                </div>
              </Link>
            )}

            {isMobile && (
              <button
                type="button"
                onClick={onMobileClose}
                className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-subtle)] transition-colors cursor-pointer"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Nav Items */}
          <nav className="p-2 space-y-1">
            {!isIconOnly && (
              <div className="px-2.5 pt-3 pb-1 text-[11px] font-medium uppercase tracking-wider text-[var(--text-tertiary)] select-none">
                Navigation
              </div>
            )}
            {navLinks.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={isMobile ? onMobileClose : undefined}
                  title={isIconOnly ? item.label : undefined}
                  className={`relative flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors select-none ${
                    isIconOnly ? 'justify-center' : ''
                  } ${
                    item.active
                      ? 'bg-[var(--brand-subtle)] text-[var(--brand-text)] font-semibold shadow-2xs'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-subtle)]'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      item.active ? 'text-[var(--brand)]' : 'text-[var(--text-secondary)]'
                    }`}
                  />
                  {!isIconOnly && <span className="truncate">{item.label}</span>}
                  <NavPendingHint />
                </Link>
              )
            })}

            {/* Upcoming Features (PRD Section 5) */}
            <div className="pt-3">
              {!isIconOnly && (
                <div className="px-2.5 pb-1 text-[11px] font-medium uppercase tracking-wider text-[var(--text-tertiary)] select-none">
                  Upcoming
                </div>
              )}
              {upcomingLinks.map((item) => {
                const Icon = item.icon
                return (
                  <div
                    key={item.label}
                    title={isIconOnly ? `${item.label} (${item.badge})` : undefined}
                    aria-disabled="true"
                    className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs text-[var(--text-tertiary)] opacity-60 cursor-not-allowed select-none ${
                      isIconOnly ? 'justify-center' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="w-4 h-4 shrink-0 text-[var(--text-tertiary)]" />
                      {!isIconOnly && <span>{item.label}</span>}
                    </div>
                    {!isIconOnly && (
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-[var(--surface-subtle)] text-[var(--text-tertiary)] border border-[var(--border-subtle)]">
                        {item.badge}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          </nav>
        </div>

        {/* Footer Area: User Profile, Sign-Out & Collapse Toggle */}
        <div className="p-2 border-t border-[var(--border-subtle)] space-y-2">
          {/* User Account */}
          {isIconOnly ? (
            <div
              className="flex justify-center p-1.5 rounded-lg hover:bg-[var(--surface-subtle)] transition-colors"
              title={userEmail || 'Staff member'}
            >
              <div className="w-7 h-7 rounded-full bg-[var(--surface-subtle)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--text-secondary)] text-xs font-semibold">
                {userEmail ? (
                  userEmail.charAt(0).toUpperCase()
                ) : (
                  <User className="w-3.5 h-3.5" />
                )}
              </div>
            </div>
          ) : (
            <div className="px-2.5 py-2 flex items-center gap-2.5 rounded-lg bg-[var(--surface-subtle)] border border-[var(--border-subtle)]">
              <div className="w-7 h-7 rounded-full bg-[var(--surface)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--text-secondary)] shrink-0 text-xs font-semibold">
                {userEmail ? (
                  userEmail.charAt(0).toUpperCase()
                ) : (
                  <User className="w-3.5 h-3.5" />
                )}
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <span
                  className="text-xs font-medium text-[var(--text-primary)] truncate"
                  title={userEmail || 'Staff member'}
                >
                  {userEmail || 'Staff member'}
                </span>
                <span className="text-[10px] text-[var(--text-tertiary)] truncate">
                  Authorized Staff
                </span>
              </div>
            </div>
          )}

          {/* Sign Out Button */}
          <form action={logout} className="w-full">
            <button
              type="submit"
              title="Sign out of Foreman"
              className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer ${
                isIconOnly ? 'justify-center' : ''
              }`}
            >
              <LogOut className="w-4 h-4 shrink-0" />
              {!isIconOnly && <span>Sign out</span>}
            </button>
          </form>

          {/* Desktop Collapse Toggle */}
          {!isMobile && (
            <button
              type="button"
              onClick={onToggleCollapse}
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              className={`hidden md:flex items-center gap-2 w-full px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-subtle)] rounded-lg transition-colors cursor-pointer border border-transparent hover:border-[var(--border-subtle)] ${
                isIconOnly ? 'justify-center' : 'justify-between'
              }`}
            >
              <div className="flex items-center gap-2">
                {collapsed ? (
                  <ChevronRight className="w-4 h-4 shrink-0" />
                ) : (
                  <>
                    <ChevronLeft className="w-4 h-4 shrink-0" />
                    <span>Collapse</span>
                  </>
                )}
              </div>
              {!isIconOnly && (
                <span className="text-[10px] text-[var(--text-tertiary)]">⌘B</span>
              )}
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden md:flex flex-col fixed inset-y-0 left-0 z-30 bg-[var(--surface)] border-r border-[var(--border-subtle)] transition-[width] duration-200 ease-in-out ${
          collapsed ? 'w-16' : 'w-60'
        }`}
      >
        {renderContent(false)}
      </aside>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 backdrop-blur-xs md:hidden animate-fade-in"
          onClick={onMobileClose}
          aria-hidden="true"
        />
      )}

      {/* Mobile Drawer Panel */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 flex flex-col bg-[var(--surface)] border-r border-[var(--border-subtle)] shadow-xl transform transition-transform duration-200 ease-in-out md:hidden ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {renderContent(true)}
      </aside>
    </>
  )
}
