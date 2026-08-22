'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logout } from '@/app/login/actions'
import { Inbox, FileClock, LogOut, User, ShieldCheck } from 'lucide-react'

interface NavbarProps {
  userEmail?: string | null
}

export function Navbar({ userEmail }: NavbarProps) {
  const pathname = usePathname()

  const navItems = [
    { label: 'Inbox', href: '/', icon: Inbox, active: pathname === '/' || pathname.startsWith('/emails') },
    { label: 'Audit Log', href: '/audit-log', icon: FileClock, active: pathname === '/audit-log' },
  ]

  return (
    <header className="bg-[#1c1a17] text-[#f5f1e8] border-b border-[#2a2723] sticky top-0 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Wordmark */}
          <div className="flex items-center gap-8">
            <Link href="/" className="flex flex-col group">
              <div className="flex items-center gap-2">
                <span className="font-bold text-xl tracking-tight text-[#f5f1e8] group-hover:text-white transition-colors">
                  Foreman
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#2a2723] text-[#e8e2d4]/80">
                  AI Triage
                </span>
              </div>
              <span className="text-[11px] text-[#e8e2d4]/60 tracking-normal hidden sm:block">
                Allsaints Builders Email Assistant
              </span>
            </Link>

            {/* Navigation links */}
            <nav className="hidden md:flex items-center gap-4">
              {navItems.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 py-2 text-sm font-medium transition-colors border-b-2 ${
                      item.active
                        ? 'border-[#f5f1e8] text-[#f5f1e8]'
                        : 'border-transparent text-[#e8e2d4]/70 hover:text-[#f5f1e8]'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </nav>
          </div>

          {/* User profile & Sign Out */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded bg-[#2a2723]/60 border border-[#2a2723] text-xs text-[#e8e2d4]">
              <User className="w-3.5 h-3.5 text-[#e8e2d4]/70" />
              <span className="max-w-[200px] truncate">{userEmail || 'Staff member'}</span>
            </div>

            <form action={logout}>
              <button
                type="submit"
                title="Sign out of Foreman"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[#2a2723] hover:bg-[#3a3530] text-[#f5f1e8] rounded-md transition-colors border border-[#3a3530] cursor-pointer"
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
