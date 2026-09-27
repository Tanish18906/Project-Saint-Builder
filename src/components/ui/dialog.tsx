'use client'

import React from 'react'
import { Dialog as RadixDialog, AlertDialog as RadixAlertDialog } from 'radix-ui'
import { X } from 'lucide-react'
import { cn } from '@/lib/cn'
import { Button, type ButtonVariant } from './button'
import { IconButton } from './icon-button'

const overlayClass =
  'fixed inset-0 z-50 bg-overlay data-[state=open]:animate-fm-fade-in data-[state=closed]:animate-fm-fade-out'

const contentClass =
  'fixed left-1/2 top-1/2 z-50 flex max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2 flex-col ' +
  'rounded-xl border border-line-strong bg-panel shadow-lg outline-none ' +
  'data-[state=open]:animate-fm-pop-in data-[state=closed]:animate-fm-pop-out'

const widths = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-xl' } as const

/* ---------------------------------------------------------------- Dialog */

export const Dialog = RadixDialog.Root
export const DialogTrigger = RadixDialog.Trigger
export const DialogClose = RadixDialog.Close

interface DialogContentProps {
  title: React.ReactNode
  /** Required for context; hide visually with hideDescription if the body says it. */
  description?: React.ReactNode
  size?: keyof typeof widths
  footer?: React.ReactNode
  children?: React.ReactNode
  className?: string
}

/** Modal for focused tasks. Escape and the close button dismiss it; focus is trapped and restored. */
export function DialogContent({ title, description, size = 'md', footer, children, className }: DialogContentProps) {
  return (
    <RadixDialog.Portal>
      <RadixDialog.Overlay className={overlayClass} />
      <RadixDialog.Content className={cn(contentClass, widths[size], className)}>
        <div className="flex items-start justify-between gap-3 px-5 pb-2 pt-4">
          <div className="min-w-0">
            <RadixDialog.Title className="text-lg font-semibold tracking-[-0.01em] text-fg">{title}</RadixDialog.Title>
            {description ? (
              <RadixDialog.Description className="mt-1 text-base text-fg-muted">{description}</RadixDialog.Description>
            ) : (
              <RadixDialog.Description className="sr-only">{title}</RadixDialog.Description>
            )}
          </div>
          <RadixDialog.Close asChild>
            <IconButton label="Close" icon={<X />} size="sm" className="-mr-1.5 -mt-0.5" showTooltip={false} />
          </RadixDialog.Close>
        </div>
        {children && <div className="min-h-0 flex-1 overflow-y-auto px-5 py-2">{children}</div>}
        {footer && <div className="flex flex-wrap items-center justify-end gap-2 border-t border-line px-5 py-3">{footer}</div>}
      </RadixDialog.Content>
    </RadixDialog.Portal>
  )
}

/* ---------------------------------------------------------- ConfirmDialog */

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: React.ReactNode
  description: React.ReactNode
  /** Extra detail, e.g. the recipient and sending inbox for a send. */
  children?: React.ReactNode
  confirmLabel: string
  cancelLabel?: string
  /** 'primary' for consequential-but-intended actions (send); 'danger' for destructive ones. */
  tone?: Extract<ButtonVariant, 'primary' | 'danger'>
  confirmIcon?: React.ReactNode
  loading?: boolean
  onConfirm: () => void
  /**
   * Where focus goes on close. By default it returns to the trigger; pass this
   * when the trigger no longer exists afterwards (e.g. controls replaced by a
   * locked state) — call `event.preventDefault()` and focus the new target.
   */
  onCloseAutoFocus?: (event: Event) => void
}

/**
 * Confirmation for consequential or irreversible actions (role="alertdialog").
 * Clicking the scrim does NOT dismiss it; focus starts on Cancel so Enter can't
 * fire the action by accident. The caller owns what happens on confirm.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  confirmLabel,
  cancelLabel = 'Cancel',
  tone = 'primary',
  confirmIcon,
  loading,
  onConfirm,
  onCloseAutoFocus,
}: ConfirmDialogProps) {
  return (
    <RadixAlertDialog.Root open={open} onOpenChange={onOpenChange}>
      <RadixAlertDialog.Portal>
        <RadixAlertDialog.Overlay className={overlayClass} />
        <RadixAlertDialog.Content className={cn(contentClass, widths.md)} onCloseAutoFocus={onCloseAutoFocus}>
          <div className="px-5 pb-2 pt-4">
            <RadixAlertDialog.Title className="text-lg font-semibold tracking-[-0.01em] text-fg">{title}</RadixAlertDialog.Title>
            <RadixAlertDialog.Description className="mt-1 text-base text-fg-muted">{description}</RadixAlertDialog.Description>
          </div>
          {children && <div className="px-5 py-2">{children}</div>}
          <div className="mt-2 flex flex-col-reverse gap-2 border-t border-line px-5 py-3 sm:flex-row sm:justify-end">
            <RadixAlertDialog.Cancel asChild>
              <Button variant="secondary" disabled={loading}>
                {cancelLabel}
              </Button>
            </RadixAlertDialog.Cancel>
            {/* Not wrapped in AlertDialog.Action: that would close the dialog before an async confirm resolves. */}
            <Button variant={tone} loading={loading} leadingIcon={confirmIcon} onClick={onConfirm}>
              {confirmLabel}
            </Button>
          </div>
        </RadixAlertDialog.Content>
      </RadixAlertDialog.Portal>
    </RadixAlertDialog.Root>
  )
}
