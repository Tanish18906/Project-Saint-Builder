'use client'

import * as React from 'react'
import DOMPurify from 'dompurify'
import { Clock, User } from 'lucide-react'
import { Card } from '@/components/ui'
import { type EmailRecord, formatRoles } from '@/components/email-detail/types'

const subscribeNoop = () => () => {}

// <style> would restyle the whole dashboard (e.g. hide or cover Approve); forms could phish staff.
const SANITIZE_OPTIONS = {
  USE_PROFILES: { html: true },
  FORBID_TAGS: ['style', 'form', 'input', 'button', 'textarea', 'select'],
}

export interface OriginalEmailCardProps {
  email: EmailRecord
  className?: string
}

export function OriginalEmailCard({ email, className = '' }: OriginalEmailCardProps) {
  const urgency = (email.urgency || '').toLowerCase().trim()
  const isUrgentOrPriority = urgency === 'urgent' || urgency === 'priority'
  const hazardClasses = isUrgentOrPriority ? 'border-l-4 border-l-[var(--urgency-urgent)]' : ''

  const formattedDate = React.useMemo(() => {
    try {
      return new Date(email.received_at).toLocaleString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return email.received_at
    }
  }, [email.received_at])

  // DOMPurify needs a browser DOM, so sanitize only after hydration. Rendering '' on the server and
  // during hydration, then updating, avoids React's unpatched dangerouslySetInnerHTML mismatch.
  const isClient = React.useSyncExternalStore(subscribeNoop, () => true, () => false)
  const sanitizedHtml = React.useMemo(() => {
    if (!isClient || !email.body_html) return ''
    return DOMPurify.sanitize(email.body_html, SANITIZE_OPTIONS)
  }, [isClient, email.body_html])

  return (
    <Card
      padding="none"
      className={`overflow-hidden ${hazardClasses} ${className}`.trim()}
    >
      {/* Email Meta Header */}
      <div className="p-4 sm:p-5 border-b border-[var(--border-subtle)] space-y-3">
        <h1 className="text-lg sm:text-xl font-bold text-[var(--text-primary)] leading-snug">
          {email.subject || '(No Subject)'}
        </h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs pt-1">
          <div>
            <span className="text-[var(--text-secondary)] block text-[11px] font-medium">
              From
            </span>
            <p className="font-semibold text-[var(--text-primary)] mt-0.5">
              {email.from_name ? `${email.from_name} ` : ''}
              <span className="text-[var(--text-secondary)] font-normal">&lt;{email.from_address}&gt;</span>
            </p>
          </div>

          <div>
            <span className="text-[var(--text-secondary)] block text-[11px] font-medium">
              Received
            </span>
            <p className="font-medium text-[var(--text-primary)] mt-0.5 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[var(--text-tertiary)] shrink-0" />
              <span>{formattedDate}</span>
            </p>
          </div>

          <div>
            <span className="text-[var(--text-secondary)] block text-[11px] font-medium">
              Routed roles
            </span>
            <p className="font-semibold text-[var(--text-primary)] mt-0.5 capitalize flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-[var(--text-tertiary)] shrink-0" />
              <span>{formatRoles(email.routed_roles)}</span>
            </p>
          </div>

          <div>
            <span className="text-[var(--text-secondary)] block text-[11px] font-medium">
              Message-ID
            </span>
            <p
              className="font-mono text-[11px] text-[var(--text-secondary)] mt-0.5 truncate"
              title={email.message_id}
            >
              {email.message_id}
            </p>
          </div>
        </div>
      </div>

      {/* Message Body Content */}
      <div className="p-4 sm:p-5">
        <span className="text-[var(--text-secondary)] block text-[11px] font-medium mb-2.5">
          Message body
        </span>
        {email.body_html ? (
          <div
            // contain: paint traps position:fixed overlays from email inline styles inside this box
            className="prose prose-sm max-w-none text-[var(--text-primary)] leading-relaxed break-words relative overflow-hidden [contain:paint]"
            dangerouslySetInnerHTML={{
              __html: sanitizedHtml,
            }}
          />
        ) : email.body_text ? (
          <div className="text-sm text-[var(--text-primary)] leading-relaxed whitespace-pre-wrap font-sans bg-[var(--surface-subtle)] p-3.5 sm:p-4 rounded-lg border border-[var(--border-subtle)]">
            {email.body_text}
          </div>
        ) : (
          <div className="text-sm text-[var(--text-tertiary)] italic p-3.5 sm:p-4 rounded-lg bg-[var(--surface-subtle)] border border-[var(--border-subtle)]">
            (No text content available)
          </div>
        )}
      </div>
    </Card>
  )
}
