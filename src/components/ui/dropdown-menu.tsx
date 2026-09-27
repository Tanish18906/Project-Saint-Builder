'use client'

import React from 'react'
import { DropdownMenu as RadixMenu } from 'radix-ui'
import { Check } from 'lucide-react'
import { cn } from '@/lib/cn'
import { Kbd } from './kbd'

export const DropdownMenu = RadixMenu.Root
export const DropdownMenuTrigger = RadixMenu.Trigger
export const DropdownMenuGroup = RadixMenu.Group
export const DropdownMenuRadioGroup = RadixMenu.RadioGroup

export function DropdownMenuContent({
  children,
  align = 'start',
  side = 'bottom',
  className,
}: {
  children: React.ReactNode
  align?: 'start' | 'center' | 'end'
  side?: 'top' | 'right' | 'bottom' | 'left'
  className?: string
}) {
  return (
    <RadixMenu.Portal>
      <RadixMenu.Content
        align={align}
        side={side}
        sideOffset={4}
        collisionPadding={8}
        className={cn(
          'z-50 min-w-48 overflow-hidden rounded-lg border border-line-strong bg-panel p-1 shadow-md',
          'data-[state=open]:animate-fm-pop-in data-[state=closed]:animate-fm-pop-out',
          className
        )}
      >
        {children}
      </RadixMenu.Content>
    </RadixMenu.Portal>
  )
}

const itemClass =
  'relative flex cursor-pointer select-none items-center gap-2 rounded-md px-2 py-1.5 text-base text-fg outline-none ' +
  'data-[highlighted]:bg-hover data-[disabled]:cursor-not-allowed data-[disabled]:text-fg-disabled ' +
  'pointer-coarse:min-h-(--fm-c-touch) [&_svg]:size-4 [&_svg]:text-fg-subtle'

interface ItemProps {
  onSelect?: () => void
  icon?: React.ReactNode
  shortcut?: string[]
  tone?: 'default' | 'danger'
  disabled?: boolean
  /** Layout/visibility only (e.g. 'pointer-coarse:hidden'). */
  className?: string
  children: React.ReactNode
}

export function DropdownMenuItem({ onSelect, icon, shortcut, tone = 'default', disabled, className, children }: ItemProps) {
  return (
    <RadixMenu.Item
      onSelect={onSelect}
      disabled={disabled}
      className={cn(itemClass, tone === 'danger' && 'text-danger-fg data-[highlighted]:bg-danger-subtle [&_svg]:text-danger-fg', className)}
    >
      {icon}
      <span className="flex-1">{children}</span>
      {shortcut && (
        <span className="flex gap-0.5">
          {shortcut.map((k) => (
            <Kbd key={k}>{k}</Kbd>
          ))}
        </span>
      )}
    </RadixMenu.Item>
  )
}

export function DropdownMenuRadioItem({ value, children }: { value: string; children: React.ReactNode }) {
  return (
    <RadixMenu.RadioItem value={value} className={cn(itemClass, 'pl-7')}>
      <RadixMenu.ItemIndicator className="absolute left-2 flex">
        <Check className="text-accent-fg!" />
      </RadixMenu.ItemIndicator>
      {children}
    </RadixMenu.RadioItem>
  )
}

export function DropdownMenuLabel({ children }: { children: React.ReactNode }) {
  return <RadixMenu.Label className="px-2 pb-1 pt-1.5 text-xs font-medium text-fg-subtle">{children}</RadixMenu.Label>
}

export function DropdownMenuSeparator() {
  return <RadixMenu.Separator className="-mx-1 my-1 h-px bg-line" />
}
