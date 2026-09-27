'use client'

import React from 'react'
import { ListFilter, X } from 'lucide-react'
import { cn } from '@/lib/cn'
import { ROLE_OPTIONS, THEME_OPTIONS, URGENCY_OPTIONS, type AccountRecord } from '@/lib/domain'
import { FILTER_KEYS, type QueueFilterKey, type QueueParams } from '@/lib/queue'
import { themeLabel, formatRole } from '@/lib/format'
import { Button, focusRing } from '@/components/ui/button'
import { IconButton } from '@/components/ui/icon-button'
import { Tooltip } from '@/components/ui/tooltip'
import { Field } from '@/components/ui/field'
import { Select } from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Sheet, SheetClose, SheetContent, SheetTrigger } from '@/components/ui/sheet'

interface FilterProps {
  params: QueueParams
  accounts: AccountRecord[]
  onChange: (patch: Partial<QueueParams>) => void
}

const LABELS: Record<QueueFilterKey, string> = {
  inbox: 'Inbox',
  urgency: 'Urgency',
  theme: 'Theme',
  role: 'Routed to',
}

function optionsFor(key: QueueFilterKey, accounts: AccountRecord[]) {
  switch (key) {
    case 'inbox':
      return [
        { value: 'all', label: 'All inboxes' },
        ...accounts.map((a) => {
          const handle = a.email_address.split('@')[0].toLowerCase()
          return { value: handle, label: `${handle}@${a.display_name ? ` · ${a.display_name}` : ''}` }
        }),
      ]
    case 'urgency':
      return URGENCY_OPTIONS
    case 'theme':
      return THEME_OPTIONS
    case 'role':
      return ROLE_OPTIONS.map((o) => (o.value === 'all' ? { ...o, label: 'Anyone' } : o))
  }
}

/** Human value for a chip, e.g. "info@", "Invoices", "Director". */
function valueLabel(key: QueueFilterKey, value: string): string {
  if (key === 'inbox') return `${value}@`
  if (key === 'theme') return themeLabel(value)
  if (key === 'role') return formatRole(value)
  return value.charAt(0).toUpperCase() + value.slice(1)
}

function FilterFields({ params, accounts, onChange, touch = false }: FilterProps & { touch?: boolean }) {
  return (
    <div className="grid gap-3">
      {FILTER_KEYS.map((key) => (
        <Field key={key} label={LABELS[key]}>
          {({ id }) => (
            <Select
              id={id}
              size={touch ? 'lg' : 'sm'}
              className="w-full"
              value={params[key] ?? 'all'}
              onChange={(e) => onChange({ [key]: e.target.value === 'all' ? null : e.target.value })}
            >
              {optionsFor(key, accounts).map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
          )}
        </Field>
      ))}
    </div>
  )
}

const clearAll = { inbox: null, urgency: null, theme: null, role: null } satisfies Partial<QueueParams>

/** The one filter control: a popover on tablet/desktop, a bottom sheet on phones. */
export function FilterControl({ params, accounts, onChange, activeCount }: FilterProps & { activeCount: number }) {
  const label = activeCount ? `Filter · ${activeCount} active` : 'Filter'
  // Styled active when filters apply; not a toggle, so no aria-pressed (the trigger reports aria-expanded).
  const trigger = (
    <IconButton label={label} icon={<ListFilter />} size="sm" active={activeCount > 0} aria-pressed={undefined} showTooltip={false} />
  )

  return (
    <>
      <span className="hidden sm:inline-flex">
        <Popover>
          <Tooltip content={label}>
            <PopoverTrigger asChild>{trigger}</PopoverTrigger>
          </Tooltip>
          <PopoverContent label="Filter emails" align="end">
            <FilterFields params={params} accounts={accounts} onChange={onChange} />
            {activeCount > 0 && (
              <div className="mt-3 flex justify-end border-t border-line pt-3">
                <Button size="sm" variant="ghost" onClick={() => onChange(clearAll)}>
                  Clear filters
                </Button>
              </div>
            )}
          </PopoverContent>
        </Popover>
      </span>

      <span className="inline-flex sm:hidden">
        <Sheet>
          <SheetTrigger asChild>{trigger}</SheetTrigger>
          <SheetContent
            title="Filter emails"
            footer={
              <>
                <Button className="flex-1" disabled={activeCount === 0} onClick={() => onChange(clearAll)}>
                  Clear
                </Button>
                <SheetClose asChild>
                  <Button variant="primary" className="flex-1">
                    Done
                  </Button>
                </SheetClose>
              </>
            }
          >
            <FilterFields params={params} accounts={accounts} onChange={onChange} touch />
          </SheetContent>
        </Sheet>
      </span>
    </>
  )
}

/** Active filters, each removable. Nothing renders when no filter is set. */
export function ActiveFilters({ params, onChange }: Pick<FilterProps, 'params' | 'onChange'>) {
  const active = FILTER_KEYS.filter((k) => params[k])
  if (active.length === 0) return null
  return (
    <ul aria-label="Active filters" className="flex flex-wrap items-center gap-1.5">
      {active.map((key) => (
        <li key={key}>
          <button
            type="button"
            onClick={() => onChange({ [key]: null })}
            aria-label={`Remove filter: ${LABELS[key]} ${valueLabel(key, params[key]!)}`}
            className={cn(
              'inline-flex h-6 cursor-pointer items-center gap-1 rounded-sm border border-line-strong bg-panel pl-1.5 pr-1 text-xs text-fg-muted',
              'transition-colors duration-(--fm-duration-fast) hover:bg-hover hover:text-fg pointer-coarse:min-h-(--fm-c-touch)',
              focusRing
            )}
          >
            <span className="text-fg-subtle">{LABELS[key]}:</span>
            <span className="font-medium text-fg">{valueLabel(key, params[key]!)}</span>
            <X aria-hidden="true" className="size-3 text-fg-subtle" />
          </button>
        </li>
      ))}
    </ul>
  )
}
