// Navigation model — plain data and pure functions, safe to import from Server
// and Client Components alike. The client-only hook lives in ./nav.ts.
import { CircleCheck, History, Inbox, Mails, TriangleAlert, type LucideIcon } from 'lucide-react'
import type { NavCounts } from '@/lib/nav-counts'

/** Cookie holding the desktop sidebar preference ('collapsed' | 'expanded'). */
export const SIDEBAR_COOKIE = 'fm-sidebar'

export type NavId = 'review' | 'urgent' | 'all' | 'handled' | 'activity'

export interface NavItem {
  id: NavId
  label: string
  href: string
  icon: LucideIcon
  /** Which live count to show beside the item, if any. */
  count?: keyof NavCounts
  /** Second key of the "G then …" navigation shortcut. */
  shortcut: string
}

export interface NavGroup {
  /** Visible group label; null for the primary group. */
  label: string | null
  items: NavItem[]
}

/**
 * Work-organised navigation (DESIGN_SYSTEM.md §12). Queue views are the `view`
 * search param on `/` (see lib/queue.ts); Review is the default, so it is `/`.
 */
export const NAV_GROUPS: NavGroup[] = [
  {
    label: null,
    items: [
      { id: 'review', label: 'Review', href: '/', icon: Inbox, count: 'review', shortcut: 'R' },
      { id: 'urgent', label: 'Urgent', href: '/?view=urgent', icon: TriangleAlert, count: 'urgent', shortcut: 'U' },
    ],
  },
  {
    label: 'Mail',
    items: [
      { id: 'all', label: 'All mail', href: '/?view=all', icon: Mails, shortcut: 'A' },
      { id: 'handled', label: 'Handled', href: '/?view=handled', icon: CircleCheck, shortcut: 'H' },
    ],
  },
  {
    label: 'Records',
    items: [{ id: 'activity', label: 'Activity', href: '/audit-log', icon: History, shortcut: 'L' }],
  },
]

export const NAV_ITEMS: NavItem[] = NAV_GROUPS.flatMap((g) => g.items)

const QUEUE_VIEWS: NavId[] = ['review', 'urgent', 'all', 'handled']

const asQueueView = (view: string | null): NavId | null =>
  view && QUEUE_VIEWS.includes(view as NavId) ? (view as NavId) : null

/** Pure mapping from location to the active destination. */
export function resolveActiveNav(pathname: string, view: string | null): NavId | null {
  if (pathname === '/') return asQueueView(view) ?? 'review'
  // An open email belongs to the view it was opened from (the queue links carry
  // ?view=…). A bare deep link highlights nothing rather than guessing.
  if (pathname.startsWith('/emails/')) return asQueueView(view)
  if (pathname.startsWith('/audit-log')) return 'activity'
  return null
}

/** Title for the mobile top bar. */
export function sectionTitle(pathname: string, active: NavId | null): string {
  if (pathname.startsWith('/emails/')) return 'Email'
  return NAV_ITEMS.find((i) => i.id === active)?.label ?? 'Foreman'
}

/** Accessible label that includes the count, e.g. "Review, 12 emails". */
export function navAriaLabel(item: NavItem, counts: NavCounts): string {
  const n = item.count ? counts[item.count] : null
  if (n === null || n === undefined || n === 0) return item.label
  return `${item.label}, ${n} ${n === 1 ? 'email' : 'emails'}`
}
