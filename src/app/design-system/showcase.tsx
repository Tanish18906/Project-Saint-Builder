'use client'

import React, { useState } from 'react'
import {
  AlertTriangle,
  Archive,
  Check,
  Copy,
  Filter,
  Inbox,
  MoreHorizontal,
  RotateCcw,
  Search,
  Send,
  Settings2,
  Trash2,
  X,
} from 'lucide-react'
import {
  Badge,
  Button,
  ConfirmDialog,
  Dialog,
  DialogClose,
  DialogContent,
  DialogTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  EmptyState,
  ErrorState,
  Field,
  IconButton,
  InlineAlert,
  Input,
  Kbd,
  Panel,
  SegmentedControl,
  Select,
  Sheet,
  SheetContent,
  SheetTrigger,
  Skeleton,
  SkeletonRegion,
  Spinner,
  Textarea,
  Tooltip,
  useToast,
} from '@/components/ui'
import { cn } from '@/lib/cn'

/* ------------------------------------------------------------------ data */

const primitiveScales: { name: string; steps: string[] }[] = [
  { name: 'neutral', steps: ['0', '25', '50', '100', '150', '200', '300', '400', '500', '600', '700', '800', '900', '950'] },
  { name: 'ink', steps: ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900'] },
  { name: 'red', steps: ['50', '100', '200', '500', '600', '700'] },
  { name: 'amber', steps: ['50', '100', '200', '500', '600', '700'] },
  { name: 'green', steps: ['50', '100', '200', '500', '600', '700'] },
]

const semanticGroups: { title: string; tokens: string[] }[] = [
  { title: 'Backgrounds', tokens: ['canvas', 'panel', 'sunken', 'hover', 'pressed', 'selected', 'inverse'] },
  { title: 'Foreground', tokens: ['fg', 'fg-muted', 'fg-subtle', 'fg-disabled', 'fg-on-accent'] },
  { title: 'Lines & focus', tokens: ['line', 'line-strong', 'line-control', 'focus'] },
  { title: 'Accent', tokens: ['accent', 'accent-hover', 'accent-subtle', 'accent-line', 'accent-fg'] },
  {
    title: 'Status',
    tokens: [
      'danger', 'danger-subtle', 'danger-line', 'danger-fg', 'danger-mark',
      'warning-subtle', 'warning-line', 'warning-fg', 'warning-mark',
      'success-subtle', 'success-line', 'success-fg', 'success-mark',
    ],
  },
]

const typeScale = [
  { token: 'text-3xl', px: '28/36', use: 'Login wordmark only' },
  { token: 'text-2xl', px: '22/30', use: 'Workspace subject' },
  { token: 'text-xl', px: '18/26', use: 'Page titles' },
  { token: 'text-lg', px: '16/24', use: 'Section & dialog titles' },
  { token: 'text-md', px: '15/24', use: 'Reading: email body, reply draft' },
  { token: 'text-base', px: '14/22', use: 'Default UI, list rows, buttons' },
  { token: 'text-sm', px: '13/20', use: 'Secondary UI, descriptions' },
  { token: 'text-xs', px: '12/16', use: 'Metadata, timestamps, labels — floor for persistent text' },
  { token: 'text-2xs', px: '11/16', use: 'Badges and keyboard hints only' },
]

const spacing = [1, 1.5, 2, 3, 4, 5, 6, 8, 10, 12, 16]

/* ------------------------------------------------------------ primitives */

function Section({ id, title, description, children }: { id: string; title: string; description?: string; children: React.ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-6">
      <h2 id={`${id}-title`} className="text-xl font-semibold tracking-[-0.01em] text-fg">
        {title}
      </h2>
      {description && <p className="mt-1 max-w-2xl text-sm text-fg-muted">{description}</p>}
      <div className="mt-4">{children}</div>
    </section>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return <p className="mb-2 text-xs font-medium text-fg-subtle">{children}</p>
}

function Swatch({ name, cssVar }: { name: string; cssVar: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="size-8 shrink-0 rounded-md border border-line" style={{ background: `var(${cssVar})` }} />
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-fg">{name}</p>
        <p className="truncate font-mono text-xs text-fg-subtle">{cssVar}</p>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------- showcase */

export function Showcase() {
  const toast = useToast()
  const [view, setView] = useState<'review' | 'urgent' | 'all'>('review')
  const [sort, setSort] = useState('urgency')
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [sending, setSending] = useState(false)
  const [selectedRow, setSelectedRow] = useState(1)

  const simulateSend = () => {
    setSending(true)
    setTimeout(() => {
      setSending(false)
      setConfirmOpen(false)
      toast({ tone: 'success', title: 'Reply approved', description: 'Queued for sending from info@allsaintsbuilders.com.' })
    }, 1200)
  }

  const nav = [
    ['color', 'Colour'],
    ['type', 'Typography'],
    ['space', 'Space, radius, elevation'],
    ['buttons', 'Buttons'],
    ['badges', 'Badges'],
    ['forms', 'Form controls'],
    ['navigation', 'View switching'],
    ['rows', 'Row states'],
    ['feedback', 'Feedback & states'],
    ['overlays', 'Overlays'],
  ]

  return (
    <div className="mx-auto flex w-full max-w-6xl gap-10 px-4 py-8 sm:px-6">
      <nav aria-label="Design system sections" className="sticky top-8 hidden h-fit w-44 shrink-0 lg:block">
        <p className="mb-2 text-xs font-medium text-fg-subtle">Foreman design system</p>
        <ul className="space-y-0.5">
          {nav.map(([id, label]) => (
            <li key={id}>
              <a href={`#${id}`} className="block rounded-md px-2 py-1 text-sm text-fg-muted hover:bg-hover hover:text-fg">
                {label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <main className="min-w-0 flex-1 space-y-14">
        <header>
          <p className="text-sm font-medium text-accent-fg">Foundation · for review</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-[-0.015em] text-fg">Foreman design system</h1>
          <p className="mt-2 max-w-2xl text-md text-fg-muted">
            A calm, dense work tool for reviewing, editing, approving and sending replies. This page renders the real tokens
            and primitives from <code className="font-mono text-sm">src/components/ui</code>; the rules are in{' '}
            <code className="font-mono text-sm">DESIGN_SYSTEM.md</code>.
          </p>
        </header>

        {/* ------------------------------------------------------ colour */}
        <Section id="color" title="Colour" description="Primitives are raw values and never used directly. Components use semantic tokens, which are the only layer a dark theme would redefine.">
          <div className="space-y-8">
            <div>
              <Label>Semantic tokens</Label>
              <div className="grid gap-6 md:grid-cols-2">
                {semanticGroups.map((g) => (
                  <Panel key={g.title} padded>
                    <p className="mb-3 text-base font-medium text-fg">{g.title}</p>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {g.tokens.map((t) => (
                        <Swatch key={t} name={t} cssVar={`--fm-${t}`} />
                      ))}
                    </div>
                  </Panel>
                ))}
              </div>
            </div>
            <div>
              <Label>Primitive scales</Label>
              <div className="space-y-2">
                {primitiveScales.map((s) => (
                  <div key={s.name} className="flex items-center gap-3">
                    <span className="w-16 shrink-0 font-mono text-xs text-fg-subtle">{s.name}</span>
                    <div className="flex flex-1 overflow-hidden rounded-md border border-line">
                      {s.steps.map((step) => (
                        <div key={step} className="h-9 flex-1" style={{ background: `var(--p-${s.name}-${step})` }} title={`--p-${s.name}-${step}`} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Section>

        {/* ------------------------------------------------------ type */}
        <Section id="type" title="Typography" description="IBM Plex Sans for UI, IBM Plex Mono for identifiers. Weights 400 / 500 / 600 only. Numbers in data use tabular figures.">
          <Panel>
            <ul className="divide-y divide-line">
              {typeScale.map((t) => (
                <li key={t.token} className="grid grid-cols-[7rem_1fr] items-baseline gap-4 px-4 py-3 sm:grid-cols-[7rem_4rem_1fr]">
                  <span className="font-mono text-xs text-fg-subtle">{t.token}</span>
                  <span className="hidden font-mono text-xs text-fg-subtle sm:block">{t.px}</span>
                  <span className={cn(t.token, 'truncate text-fg')}>{t.use}</span>
                </li>
              ))}
            </ul>
          </Panel>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <Panel padded>
              <Label>Hierarchy in a list row</Label>
              <p className="text-base font-semibold text-fg">Damp survey — 14 Harrow Road access</p>
              <p className="text-sm text-fg-muted">Jane Walsh · Westminster Housing</p>
              <p className="mt-0.5 font-mono text-xs tabular-nums text-fg-subtle">09:42 · ref 3f9a21c0</p>
            </Panel>
            <Panel padded>
              <Label>Reading measure (text-md, 72ch)</Label>
              <p className="max-w-(--fm-c-reading-max) text-md text-fg">
                Could you confirm whether the contractor can attend on Thursday morning? The tenant has asked for access
                before 10am, and we need the certificate before the council inspection next week.
              </p>
            </Panel>
          </div>
        </Section>

        {/* ------------------------------------------------------ space */}
        <Section id="space" title="Space, radius, elevation" description="4px grid. Borders separate; shadows are reserved for things that float above the page.">
          <div className="grid gap-4 lg:grid-cols-3">
            <Panel padded>
              <Label>Spacing steps (×4px)</Label>
              <div className="space-y-1.5">
                {spacing.map((s) => (
                  <div key={s} className="flex items-center gap-3">
                    <span className="w-8 font-mono text-xs text-fg-subtle">{s}</span>
                    <span className="h-2 rounded-xs bg-accent-line" style={{ width: `${s * 4}px` }} />
                    <span className="font-mono text-xs text-fg-subtle">{s * 4}px</span>
                  </div>
                ))}
              </div>
            </Panel>
            <Panel padded>
              <Label>Radius</Label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  ['xs', '2'],
                  ['sm', '4'],
                  ['md', '6'],
                  ['lg', '8'],
                  ['xl', '12'],
                  ['full', '∞'],
                ].map(([r, px]) => (
                  <div key={r} className="text-center">
                    <div className={cn('mx-auto size-12 border border-line-control bg-sunken', `rounded-${r}`)} />
                    <p className="mt-1 font-mono text-xs text-fg-subtle">
                      {r} · {px}
                    </p>
                  </div>
                ))}
              </div>
            </Panel>
            <Panel padded>
              <Label>Elevation</Label>
              <div className="grid grid-cols-2 gap-4">
                {['shadow-xs', 'shadow-sm', 'shadow-md', 'shadow-lg'].map((s) => (
                  <div key={s} className={cn('flex h-14 items-center justify-center rounded-lg border border-line bg-panel', s)}>
                    <span className="font-mono text-xs text-fg-subtle">{s}</span>
                  </div>
                ))}
              </div>
            </Panel>
          </div>
        </Section>

        {/* ------------------------------------------------------ buttons */}
        <Section id="buttons" title="Buttons" description="One primary action per context. On touch devices every button grows to a 44px target automatically.">
          <Panel padded className="space-y-6">
            {(['primary', 'secondary', 'ghost', 'danger', 'danger-ghost'] as const).map((v) => (
              <div key={v}>
                <Label>{v}</Label>
                <div className="flex flex-wrap items-center gap-2">
                  <Button variant={v} size="sm">Small</Button>
                  <Button variant={v}>Default</Button>
                  <Button variant={v} size="lg">Large</Button>
                  <Button variant={v} leadingIcon={<Send />}>With icon</Button>
                  <Button variant={v} loading>Saving</Button>
                  <Button variant={v} disabled>Disabled</Button>
                </div>
              </div>
            ))}
            <div>
              <Label>Icon buttons (tooltip = accessible name)</Label>
              <div className="flex flex-wrap items-center gap-1">
                <IconButton label="Archive" icon={<Archive />} shortcut={['E']} />
                <IconButton label="Copy reply" icon={<Copy />} />
                <IconButton label="Filters" icon={<Filter />} active />
                <IconButton label="More actions" icon={<MoreHorizontal />} variant="secondary" />
                <IconButton label="Loading" icon={<RotateCcw />} loading />
                <IconButton label="Disabled" icon={<Trash2 />} disabled />
              </div>
            </div>
            <div>
              <Label>Action hierarchy in a composer footer</Label>
              <div className="flex flex-wrap items-center gap-2 rounded-md border border-line bg-canvas p-3">
                <Button variant="danger-ghost" leadingIcon={<Trash2 />} className="mr-auto">
                  Discard draft
                </Button>
                <Button variant="secondary">Save draft</Button>
                <Button variant="primary" leadingIcon={<Send />}>
                  Approve &amp; send…
                </Button>
              </div>
            </div>
          </Panel>
        </Section>

        {/* ------------------------------------------------------ badges */}
        <Section id="badges" title="Badges" description="The label always carries the meaning. Colour is reserved for urgency and outcome; categories stay neutral.">
          <Panel padded className="space-y-5">
            {(['subtle', 'outline', 'solid'] as const).map((variant) => (
              <div key={variant}>
                <Label>{variant}</Label>
                <div className="flex flex-wrap gap-2">
                  {(['neutral', 'accent', 'danger', 'warning', 'success'] as const).map((tone) => (
                    <Badge key={tone} tone={tone} variant={variant} dot>
                      {tone}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
            <div>
              <Label>Domain examples</Label>
              <div className="flex flex-wrap gap-2">
                <Badge tone="danger" variant="solid" icon={<AlertTriangle />}>Urgent</Badge>
                <Badge tone="warning" dot>Priority</Badge>
                <Badge>Invoices</Badge>
                <Badge>NPH jobs</Badge>
                <Badge tone="accent" variant="outline">Needs review</Badge>
                <Badge tone="neutral" variant="outline">AI draft · edited</Badge>
                <Badge tone="success" icon={<Check />}>Approved</Badge>
                <Badge tone="neutral" variant="solid">Sent</Badge>
              </div>
            </div>
          </Panel>
        </Section>

        {/* ------------------------------------------------------ forms */}
        <Section id="forms" title="Form controls" description="Control borders meet 3:1 against their background. Inputs switch to 16px text on touch devices to stop iOS zooming.">
          <Panel padded>
            <div className="grid gap-5 md:grid-cols-2">
              <Field label="Search" hideLabel>
                {(ids) => <Input id={ids.id} placeholder="Search sender, subject…" leadingIcon={<Search />} />}
              </Field>
              <Field label="Email address" hint="Your Allsaints Builders staff account.">
                {(ids) => <Input id={ids.id} aria-describedby={ids.describedBy} type="email" placeholder="name@allsaintsbuilders.com" />}
              </Field>
              <Field label="Password" error="That email and password combination wasn’t recognised.">
                {(ids) => <Input id={ids.id} aria-describedby={ids.describedBy} invalid={ids.invalid} type="password" defaultValue="hunter2" />}
              </Field>
              <Field label="Sending inbox" hint="Read-only once a reply is approved.">
                {(ids) => <Input id={ids.id} aria-describedby={ids.describedBy} readOnly value="info@allsaintsbuilders.com" />}
              </Field>
              <Field label="Theme">
                {(ids) => (
                  <Select id={ids.id} className="w-full">
                    <option>All themes</option>
                    <option>Invoices</option>
                    <option>NPH jobs</option>
                  </Select>
                )}
              </Field>
              <Field label="Disabled">
                {(ids) => <Input id={ids.id} disabled placeholder="Not available" />}
              </Field>
              <Field label="Reply draft" className="md:col-span-2">
                {(ids) => (
                  <Textarea
                    id={ids.id}
                    reading
                    autoGrow
                    className="min-h-32"
                    defaultValue={'Hi Jane,\n\nThanks for your email. Our contractor can attend on Thursday at 9:00am and will bring the certificate with them.\n\nKind regards,\nAllsaints Builders'}
                  />
                )}
              </Field>
            </div>
          </Panel>
        </Section>

        {/* ------------------------------------------------------ navigation */}
        <Section id="navigation" title="View switching" description="Segmented control for a few peer views (arrow keys move between them). Menus for actions and longer option lists.">
          <Panel padded className="flex flex-wrap items-center gap-4">
            <SegmentedControl
              label="Queue view"
              value={view}
              onValueChange={setView}
              options={[
                { value: 'review', label: 'Review', count: 12 },
                { value: 'urgent', label: 'Urgent', count: 3 },
                { value: 'all', label: 'All mail', count: 184 },
              ]}
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" size="sm" leadingIcon={<Settings2 />}>
                  Sort
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Sort queue by</DropdownMenuLabel>
                <DropdownMenuRadioGroup value={sort} onValueChange={setSort}>
                  <DropdownMenuRadioItem value="urgency">Urgency, then oldest</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="newest">Newest first</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="oldest">Oldest first</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <IconButton label="More actions" icon={<MoreHorizontal />} showTooltip={false} />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem icon={<Copy />} shortcut={['C']}>Copy reply</DropdownMenuItem>
                <DropdownMenuItem icon={<Inbox />}>Open original</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem icon={<Trash2 />} tone="danger">Discard draft</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <p className="text-sm text-fg-muted">
              Keyboard hints: <Kbd>J</Kbd> <Kbd>K</Kbd> move · <Kbd>↵</Kbd> open · <Kbd>E</Kbd> archive
            </p>
          </Panel>
        </Section>

        {/* ------------------------------------------------------ rows */}
        <Section id="rows" title="Row states" description="Rest, hover, selected and focus for list rows. Urgency is a left stripe plus a label — never colour alone. (Illustration of the tokens, not the final queue design.)">
          <Panel className="overflow-hidden">
            <ul role="listbox" aria-label="Example rows" className="divide-y divide-line">
              {[
                { id: 0, title: 'Invoice 4471 — payment overdue', who: 'Northgate Supplies', urgency: 'priority' },
                { id: 1, title: 'Leak reported at 3 Canal Street, tenant elderly', who: 'Camden Council', urgency: 'urgent' },
                { id: 2, title: 'Site meeting moved to Friday', who: 'R. Patel', urgency: 'normal' },
              ].map((row) => {
                const selected = selectedRow === row.id
                return (
                  <li key={row.id} role="option" aria-selected={selected}>
                    <button
                      type="button"
                      onClick={() => setSelectedRow(row.id)}
                      className={cn(
                        'flex w-full cursor-pointer items-center gap-3 px-4 py-2.5 text-left outline-none',
                        'transition-colors duration-(--fm-duration-fast) focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus',
                        selected ? 'bg-selected' : 'hover:bg-hover',
                        row.urgency === 'urgent' && 'shadow-[inset_3px_0_0_0_var(--fm-danger-mark)]',
                        row.urgency === 'priority' && 'shadow-[inset_3px_0_0_0_var(--fm-warning-mark)]'
                      )}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-base font-semibold text-fg">{row.title}</p>
                        <p className="truncate text-sm text-fg-muted">{row.who}</p>
                      </div>
                      {row.urgency === 'urgent' && <Badge tone="danger" variant="solid">Urgent</Badge>}
                      {row.urgency === 'priority' && <Badge tone="warning" dot>Priority</Badge>}
                      <span className="w-12 shrink-0 text-right font-mono text-xs tabular-nums text-fg-subtle">09:42</span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </Panel>
        </Section>

        {/* ------------------------------------------------------ feedback */}
        <Section id="feedback" title="Feedback & states" description="Transient results → toast. Persistent context → inline alert. Loading → skeleton shaped like the content. Empty and error are always visibly different.">
          <div className="grid gap-4 lg:grid-cols-2">
            <Panel padded className="space-y-3">
              <Label>Inline alerts</Label>
              <InlineAlert tone="info" title="Drafting in progress">The AI reply will appear here when it’s ready.</InlineAlert>
              <InlineAlert tone="success" title="Approved · queued for sending">Locked — this reply can no longer be edited or re-sent.</InlineAlert>
              <InlineAlert tone="warning" title="Edited after the AI draft">Check the changes before you send.</InlineAlert>
              <InlineAlert
                tone="danger"
                title="Couldn’t approve this reply"
                action={<Button size="sm" variant="secondary">Retry</Button>}
              >
                Nothing was sent. Check your connection and try again.
              </InlineAlert>
            </Panel>
            <Panel padded className="space-y-3">
              <Label>Toasts (transient)</Label>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" onClick={() => toast({ tone: 'success', title: 'Draft saved' })}>Success</Button>
                <Button size="sm" onClick={() => toast({ title: 'Copied to clipboard' })}>Neutral</Button>
                <Button
                  size="sm"
                  onClick={() => toast({ tone: 'danger', title: 'Couldn’t save the draft', description: 'Unable to connect. Please check your connection and try again.' })}
                >
                  Error (stays)
                </Button>
                <Button
                  size="sm"
                  onClick={() => toast({ tone: 'success', title: 'Reply approved', action: { label: 'Next email', onClick: () => undefined } })}
                >
                  With action
                </Button>
              </div>
              <Label>Spinner</Label>
              <div className="flex items-center gap-3 text-fg-muted">
                <Spinner size="sm" /> <Spinner /> <Spinner size="lg" label="Loading" />
              </div>
            </Panel>
            <Panel>
              <EmptyState icon={<Inbox />} title="You’re all caught up" description="New replies to review will appear here as soon as they’re drafted." />
            </Panel>
            <Panel>
              <EmptyState
                title="No emails match these filters"
                action={<Button size="sm" variant="secondary" leadingIcon={<X />}>Clear filters</Button>}
              />
            </Panel>
            <Panel>
              <ErrorState
                title="Couldn’t load emails"
                description="This is a connection problem, not an empty inbox. Try again in a moment."
                reference="a1b2c3d4"
                action={<Button size="sm" variant="secondary" leadingIcon={<RotateCcw />}>Try again</Button>}
              />
            </Panel>
            <Panel>
              <SkeletonRegion label="Loading emails…" className="divide-y divide-line">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="space-y-2 px-4 py-3">
                    <div className="flex justify-between gap-4">
                      <Skeleton className="h-3.5 w-3/5" />
                      <Skeleton className="h-3 w-10" />
                    </div>
                    <Skeleton className="h-3 w-2/5" />
                  </div>
                ))}
              </SkeletonRegion>
            </Panel>
          </div>
        </Section>

        {/* ------------------------------------------------------ overlays */}
        <Section id="overlays" title="Overlays" description="Radix primitives: focus is trapped and restored, Escape closes, background scroll locks. Confirmation dialogs start focus on Cancel and ignore scrim clicks.">
          <Panel padded className="flex flex-wrap gap-2">
            <Button variant="primary" leadingIcon={<Send />} onClick={() => setConfirmOpen(true)}>
              Approve &amp; send…
            </Button>
            <ConfirmDialog
              open={confirmOpen}
              onOpenChange={(o) => !sending && setConfirmOpen(o)}
              title="Send this reply?"
              description="It will be emailed to the sender immediately. This can’t be undone."
              confirmLabel="Approve & send"
              confirmIcon={<Send />}
              loading={sending}
              onConfirm={simulateSend}
            >
              <dl className="grid grid-cols-[4rem_1fr] gap-x-3 gap-y-1.5 rounded-md border border-line bg-canvas px-3 py-2.5 text-sm">
                <dt className="text-fg-muted">To</dt>
                <dd className="truncate text-fg">Jane Walsh &lt;jane.walsh@westminster.gov.uk&gt;</dd>
                <dt className="text-fg-muted">From</dt>
                <dd className="truncate font-mono text-xs leading-5 text-fg">info@allsaintsbuilders.com</dd>
                <dt className="text-fg-muted">Reply</dt>
                <dd className="text-fg">AI draft · edited · 64 words</dd>
              </dl>
            </ConfirmDialog>

            <Dialog>
              <DialogTrigger asChild>
                <Button>Open dialog</Button>
              </DialogTrigger>
              <DialogContent
                title="Keyboard shortcuts"
                description="Work through the queue without leaving the keyboard."
                footer={
                  <DialogClose asChild>
                    <Button>Done</Button>
                  </DialogClose>
                }
              >
                <ul className="divide-y divide-line text-base">
                  {[
                    ['Next / previous email', ['J', 'K']],
                    ['Open selected', ['↵']],
                    ['Approve & send', ['⌘', '↵']],
                    ['Focus search', ['/']],
                  ].map(([label, keys]) => (
                    <li key={label as string} className="flex items-center justify-between py-2">
                      <span className="text-fg">{label}</span>
                      <span className="flex gap-1">
                        {(keys as string[]).map((k) => (
                          <Kbd key={k}>{k}</Kbd>
                        ))}
                      </span>
                    </li>
                  ))}
                </ul>
              </DialogContent>
            </Dialog>

            <Sheet>
              <SheetTrigger asChild>
                <Button leadingIcon={<Filter />}>Filter sheet (mobile)</Button>
              </SheetTrigger>
              <SheetContent
                title="Filter emails"
                footer={
                  <>
                    <Button className="flex-1">Reset</Button>
                    <Button variant="primary" className="flex-1">Show 12 emails</Button>
                  </>
                }
              >
                <div className="space-y-4">
                  <Field label="Inbox">
                    {(ids) => (
                      <Select id={ids.id} className="w-full">
                        <option>All inboxes</option>
                        <option>info@</option>
                        <option>team@</option>
                      </Select>
                    )}
                  </Field>
                  <Field label="Theme">
                    {(ids) => (
                      <Select id={ids.id} className="w-full">
                        <option>All themes</option>
                      </Select>
                    )}
                  </Field>
                </div>
              </SheetContent>
            </Sheet>

            <Sheet>
              <SheetTrigger asChild>
                <Button>Side sheet</Button>
              </SheetTrigger>
              <SheetContent side="right" title="Activity for this email" description="Everything that happened, newest first.">
                <p className="text-sm text-fg-muted">Timeline content…</p>
              </SheetContent>
            </Sheet>

            <Tooltip content="Tooltips supplement — they never hold essential information" shortcut={['?']}>
              <Button variant="ghost">Hover or focus me</Button>
            </Tooltip>
          </Panel>
        </Section>
      </main>
    </div>
  )
}
