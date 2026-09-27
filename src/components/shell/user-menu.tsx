'use client'

import React, { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronsUpDown, Keyboard, LogOut, Palette } from 'lucide-react'
import { logout } from '@/app/login/actions'
import { formatRole } from '@/lib/format'
import { cn } from '@/lib/cn'
import { focusRing } from '@/components/ui/button'
import { Tooltip } from '@/components/ui/tooltip'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export interface ShellUser {
  email: string | null
  name: string | null
  role: string | null
}

export function displayName(user: ShellUser): string {
  return user.name || user.email?.split('@')[0] || 'Signed in'
}

function initials(user: ShellUser): string {
  const source = user.name || user.email?.split('@')[0] || '?'
  const parts = source.trim().split(/[\s._-]+/).filter(Boolean)
  return ((parts[0]?.[0] ?? '?') + (parts[1]?.[0] ?? '')).toUpperCase()
}

export function Avatar({ user, size = 'md' }: { user: ShellUser; size?: 'sm' | 'md' }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'flex shrink-0 select-none items-center justify-center rounded-full border border-line-strong bg-sunken font-medium text-fg-muted',
        size === 'sm' ? 'size-7 text-2xs' : 'size-8 text-xs'
      )}
    >
      {initials(user)}
    </span>
  )
}

interface UserMenuProps {
  user: ShellUser
  /** full: avatar + name + role (sidebar). compact: avatar only (rail, mobile top bar). */
  variant: 'full' | 'compact'
  onShowShortcuts: () => void
  side?: 'top' | 'right' | 'bottom'
  align?: 'start' | 'end'
}

/** Identity plus secondary account actions. Deliberately quieter than the navigation. */
export function UserMenu({ user, variant, onShowShortcuts, side = 'top', align = 'start' }: UserMenuProps) {
  const router = useRouter()
  const [signingOut, startSignOut] = useTransition()
  const name = displayName(user)
  const role = user.role ? formatRole(user.role) : null

  const trigger =
    variant === 'full' ? (
      <button
        type="button"
        className={cn(
          'flex w-full cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-left',
          'transition-colors duration-(--fm-duration-fast) hover:bg-hover data-[state=open]:bg-hover',
          'pointer-coarse:min-h-(--fm-c-touch)',
          focusRing,
          'focus-visible:ring-offset-canvas'
        )}
      >
        <Avatar user={user} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium text-fg">{name}</span>
          {role && <span className="block truncate text-xs text-fg-subtle">{role}</span>}
        </span>
        <ChevronsUpDown className="size-3.5 shrink-0 text-fg-subtle" aria-hidden="true" />
      </button>
    ) : (
      <button
        type="button"
        aria-label={`Account: ${name}`}
        className={cn(
          'flex size-10 cursor-pointer items-center justify-center rounded-md',
          'transition-colors duration-(--fm-duration-fast) hover:bg-hover data-[state=open]:bg-hover',
          'pointer-coarse:size-(--fm-c-touch)',
          focusRing,
          'focus-visible:ring-offset-canvas'
        )}
      >
        <Avatar user={user} size="sm" />
      </button>
    )

  return (
    <DropdownMenu>
      {variant === 'compact' ? (
        <Tooltip content={name} side={side === 'bottom' ? 'bottom' : 'right'}>
          <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
        </Tooltip>
      ) : (
        <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      )}
      <DropdownMenuContent side={side} align={align} className="w-60">
        <div className="px-2 pb-2 pt-1.5">
          <p className="truncate text-base font-medium text-fg">{name}</p>
          {user.email && <p className="truncate text-sm text-fg-muted">{user.email}</p>}
          {role && <p className="mt-0.5 text-xs text-fg-subtle">{role}</p>}
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem icon={<Keyboard />} shortcut={['?']} onSelect={onShowShortcuts} className="pointer-coarse:hidden">
          Keyboard shortcuts
        </DropdownMenuItem>
        {process.env.NODE_ENV !== 'production' && (
          <DropdownMenuItem icon={<Palette />} onSelect={() => router.push('/design-system')}>
            Design system
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          icon={<LogOut />}
          disabled={signingOut}
          onSelect={() => startSignOut(() => logout())}
        >
          {signingOut ? 'Signing out…' : 'Sign out'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
