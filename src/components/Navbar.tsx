'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logout } from '@/app/login/actions'
import { Inbox, FileClock, LogOut, User } from 'lucide-react'

export interface NavbarProps {
  userEmail?: string | null
}

export function Navbar({ userEmail }: NavbarProps) {
  const pathname = usePathname()

  const navItems = [
    {
      label: 'Inbox',
      href: '/',
      icon: Inbox,
      active: pathname === '/' || pathname.startsWith('/emails'),
    },
    {
      label: 'Audit Log',
      href: '/audit-log',
      icon: FileClock,
      active: pathname === '/audit-log',
    },
  ]

  return (
    <header className="bg-[var(--surface)] text-[var(--text-primary)] border-b border-[var(--border-subtle)] sticky top-0 z-30 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Brand Logo & Wordmark */}
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-7 h-7 rounded-lg bg-[var(--brand)] text-white flex items-center justify-center font-bold text-xs tracking-tight shadow-xs group-hover:bg-[var(--brand-light)] transition-colors">
                F
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-sm tracking-tight text-[var(--text-primary)]">
                    Foreman
                  </span>
                  <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.2 rounded bg-[var(--brand-subtle)] text-[var(--brand-text)] border border-[var(--brand-subtle)]">
                    Triage
                  </span>
                </div>
                <span className="text-[11px] text-[var(--text-secondary)] tracking-normal hidden sm:block">
                  Allsaints Builders
                </span>
              </div>
            </Link>

            {/* Navigation links */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors select-none ${
                      item.active
                        ? 'bg-[var(--brand-subtle)] text-[var(--brand-text)] font-semibold shadow-2xs'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-subtle)]'
                    }`}
                  >
                    <Icon
                      className={`w-3.5 h-3.5 ${
                        item.active ? 'text-[var(--brand)]' : 'text-[var(--text-secondary)]'
                      }`}
                    />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </nav>
          </div>

          {/* User profile & Sign Out */}
          <div className="flex items-center gap-2.5">
            <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-[var(--surface-subtle)] border border-[var(--border-subtle)] text-xs text-[var(--text-secondary)]">
              <User className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
              <span className="max-w-[200px] truncate">{userEmail || 'Staff member'}</span>
            </div>

            <form action={logout}>
              <button
                type="submit"
                title="Sign out of Foreman"
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium bg-[var(--surface-subtle)] hover:bg-red-50 hover:text-red-700 hover:border-red-200 text-[var(--text-secondary)] rounded-lg transition-colors border border-[var(--border-subtle)] cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign out</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </header>
  )
}
