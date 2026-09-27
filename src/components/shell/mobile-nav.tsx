'use client'

import React from 'react'
import Link from 'next/link'
import { cn } from '@/lib/cn'
import type { NavCounts } from '@/lib/nav-counts'
import { NAV_ITEMS, navAriaLabel, type NavId } from './nav'
import { BrandMark } from './sidebar'
import { UserMenu, type ShellUser } from './user-menu'

/** Phone top bar: where you are, and your account. Navigation lives in the tab bar. */
export function MobileTopBar({
  title,
  user,
  onShowShortcuts,
}: {
  title: string
  user: ShellUser
  onShowShortcuts: () => void
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-line-strong bg-canvas pt-[env(safe-area-inset-top)] sm:hidden">
      <div className="flex h-(--fm-c-topbar-h) items-center gap-2.5 pl-4 pr-1.5">
        <Link href="/" aria-label="Foreman home" className="rounded-md outline-none focus-visible:ring-2 focus-visible:ring-focus">
          <BrandMark />
        </Link>
        <p className="min-w-0 flex-1 truncate text-lg font-semibold tracking-[-0.01em] text-fg">{title}</p>
        <UserMenu user={user} variant="compact" side="bottom" align="end" onShowShortcuts={onShowShortcuts} />
      </div>
    </header>
  )
}

/**
 * Phone tab bar: the five destinations, always one tap away. Hidden while a
 * screen owns the bottom edge (the email workspace's action bar).
 */
export function MobileTabBar({ active, counts, hidden }: { active: NavId | null; counts: NavCounts; hidden: boolean }) {
  if (hidden) return null
  return (
    <nav
      aria-label="Primary"
      data-mobile-tabbar=""
      className="fixed inset-x-0 bottom-0 z-30 border-t border-line-strong bg-canvas pb-[env(safe-area-inset-bottom)] sm:hidden"
    >
      <ul className="grid grid-cols-5">
        {NAV_ITEMS.map((item) => {
          const isActive = active === item.id
          const Icon = item.icon
          const n = item.count ? counts[item.count] : null
          const isUrgent = item.count === 'urgent'
          return (
            <li key={item.id}>
              <Link
                href={item.href}
                aria-current={isActive ? 'page' : undefined}
                aria-label={navAriaLabel(item, counts)}
                className={cn(
                  'relative flex h-14 flex-col items-center justify-center gap-0.5 outline-none',
                  'focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus',
                  isActive ? 'text-accent-fg' : 'text-fg-muted active:bg-hover'
                )}
              >
                <span className="relative">
                  <Icon aria-hidden="true" className={cn('size-5', isActive ? 'text-accent' : 'text-fg-subtle')} />
                  {n ? (
                    <span
                      aria-hidden="true"
                      className={cn(
                        'absolute -right-2.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-2xs font-semibold tabular-nums text-fg-on-accent ring-2 ring-canvas',
                        isUrgent ? 'bg-danger' : 'bg-accent'
                      )}
                    >
                      {n > 99 ? '99+' : n}
                    </span>
                  ) : null}
                </span>
                <span className={cn('text-xs', isActive && 'font-medium')}>{item.label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
