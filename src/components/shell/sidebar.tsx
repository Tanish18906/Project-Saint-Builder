'use client'

import React from 'react'
import Link from 'next/link'
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { cn } from '@/lib/cn'
import type { NavCounts } from '@/lib/nav-counts'
import { IconButton } from '@/components/ui/icon-button'
import { Tooltip } from '@/components/ui/tooltip'
import { NAV_GROUPS, NAV_ITEMS, navAriaLabel, type NavId, type NavItem } from './nav'
import { UserMenu, type ShellUser } from './user-menu'

/* ------------------------------------------------------------ brand */

/** The product mark: a quiet monogram tile. Not the client's logo. */
export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'flex size-6 shrink-0 items-center justify-center rounded-[5px] bg-inverse text-xs font-semibold text-fg-inverse',
        className
      )}
    >
      F
    </span>
  )
}

/* ------------------------------------------------------------ counts */

function CountLabel({ item, counts, active }: { item: NavItem; counts: NavCounts; active: boolean }) {
  if (!item.count) return null
  const n = counts[item.count]
  if (n === null || n === 0) return null
  const isUrgent = item.count === 'urgent'
  return (
    <span
      aria-hidden="true"
      className={cn(
        'ml-auto text-xs tabular-nums',
        isUrgent ? 'font-medium text-danger-fg' : active ? 'font-medium text-accent-fg' : 'text-fg-subtle'
      )}
    >
      {n > 999 ? '999+' : n}
    </span>
  )
}

/* ------------------------------------------------------------ full sidebar */

const itemBase =
  'group relative flex items-center rounded-md outline-none ' +
  'transition-colors duration-(--fm-duration-fast) ' +
  'focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus'

interface SidebarProps {
  active: NavId | null
  counts: NavCounts
  user: ShellUser
  onCollapse: () => void
  onShowShortcuts: () => void
  className?: string
}

/** Desktop sidebar: part of the window chrome, not a card. */
export function Sidebar({ active, counts, user, onCollapse, onShowShortcuts, className }: SidebarProps) {
  return (
    <aside
      aria-label="Sidebar"
      className={cn(
        'sticky top-0 h-dvh w-(--fm-c-sidebar-w) shrink-0 flex-col border-r border-line-strong bg-canvas',
        className
      )}
    >
      <div className="flex h-(--fm-c-topbar-h) shrink-0 items-center gap-2.5 pl-4 pr-2">
        <Link
          href="/"
          className="flex min-w-0 flex-1 items-center gap-2.5 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-focus"
        >
          <BrandMark />
          <span className="min-w-0 leading-tight">
            <span className="block truncate text-base font-semibold text-fg">Foreman</span>
            <span className="block truncate text-xs text-fg-subtle">Allsaints Builders</span>
          </span>
        </Link>
        <IconButton label="Hide sidebar" shortcut={['[']} icon={<PanelLeftClose />} size="sm" onClick={onCollapse} />
      </div>

      <nav aria-label="Primary" className="min-h-0 flex-1 overflow-y-auto px-2 pb-3 pt-1">
        {NAV_GROUPS.map((group, gi) => (
          <div key={group.label ?? gi} className={cn(gi > 0 && 'mt-4')}>
            {group.label && <p className="px-2 pb-1 text-xs font-medium text-fg-subtle">{group.label}</p>}
            <ul className="space-y-px">
              {group.items.map((item) => {
                const isActive = active === item.id
                const Icon = item.icon
                return (
                  <li key={item.id}>
                    <Link
                      href={item.href}
                      aria-current={isActive ? 'page' : undefined}
                      aria-label={navAriaLabel(item, counts)}
                      className={cn(
                        itemBase,
                        'h-8 gap-2.5 px-2 text-base pointer-coarse:min-h-(--fm-c-touch)',
                        isActive ? 'bg-selected font-medium text-accent-fg' : 'text-fg hover:bg-hover'
                      )}
                    >
                      <Icon
                        aria-hidden="true"
                        className={cn('size-4 shrink-0', isActive ? 'text-accent' : 'text-fg-subtle group-hover:text-fg-muted')}
                      />
                      <span className="truncate">{item.label}</span>
                      <CountLabel item={item} counts={counts} active={isActive} />
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="shrink-0 border-t border-line p-2">
        <UserMenu user={user} variant="full" onShowShortcuts={onShowShortcuts} />
      </div>
    </aside>
  )
}

/* ------------------------------------------------------------ rail */

interface RailProps {
  active: NavId | null
  counts: NavCounts
  user: ShellUser
  /** Present only where a full sidebar is available (desktop). */
  onExpand?: () => void
  onShowShortcuts: () => void
  className?: string
}

/**
 * Icon rail: tablets, and desktop when the sidebar is hidden. Labels live in
 * tooltips and accessible names; urgent work keeps a small marker.
 */
export function SidebarRail({ active, counts, user, onExpand, onShowShortcuts, className }: RailProps) {
  return (
    <aside
      aria-label="Sidebar"
      className={cn('sticky top-0 h-dvh w-14 shrink-0 flex-col items-center border-r border-line-strong bg-canvas', className)}
    >
      <div className="flex h-(--fm-c-topbar-h) shrink-0 items-center">
        <Tooltip content="Foreman · Review" side="right">
          <Link href="/" aria-label="Foreman home" className="rounded-md outline-none focus-visible:ring-2 focus-visible:ring-focus">
            <BrandMark />
          </Link>
        </Tooltip>
      </div>

      <nav aria-label="Primary" className="flex min-h-0 flex-1 flex-col items-center gap-px overflow-y-auto pb-3 pt-1">
        {NAV_ITEMS.map((item, i) => {
          const isActive = active === item.id
          const Icon = item.icon
          const n = item.count ? counts[item.count] : null
          const startsGroup = i > 0 && NAV_GROUPS.some((g) => g.items[0].id === item.id)
          return (
            <React.Fragment key={item.id}>
              {startsGroup && <span aria-hidden="true" className="my-2 h-px w-6 bg-line" />}
              <Tooltip content={n ? `${item.label} · ${n}` : item.label} side="right" shortcut={['G', item.shortcut]}>
                <Link
                  href={item.href}
                  aria-current={isActive ? 'page' : undefined}
                  aria-label={navAriaLabel(item, counts)}
                  className={cn(
                    itemBase,
                    'size-10 justify-center pointer-coarse:size-(--fm-c-touch)',
                    isActive ? 'bg-selected text-accent' : 'text-fg-subtle hover:bg-hover hover:text-fg-muted'
                  )}
                >
                  <Icon aria-hidden="true" className="size-[18px]" />
                  {item.count === 'urgent' && n ? (
                    <span aria-hidden="true" className="absolute right-2 top-2 size-1.5 rounded-full bg-danger-mark ring-2 ring-canvas" />
                  ) : null}
                </Link>
              </Tooltip>
            </React.Fragment>
          )
        })}
      </nav>

      <div className="flex shrink-0 flex-col items-center gap-1 border-t border-line py-2">
        {onExpand && (
          // Only desktop has a full sidebar to return to.
          <span className="hidden xl:block">
            <IconButton label="Show sidebar" shortcut={['[']} icon={<PanelLeftOpen />} onClick={onExpand} />
          </span>
        )}
        <UserMenu user={user} variant="compact" side="right" align="end" onShowShortcuts={onShowShortcuts} />
      </div>
    </aside>
  )
}
