'use client'

import React, { useEffect, useRef, useState } from 'react'
import DOMPurify from 'dompurify'
import { cn } from '@/lib/cn'

/*
 * Reading styles for HTML email, written against the design tokens (CSS custom
 * properties inherit into the shadow root). The shadow root is the boundary in
 * both directions: an email's own <style> can't restyle the app, and the app's
 * utility classes can't flatten the email. Paint containment keeps
 * everything inside the email's own box — a `position: fixed` overlay can't
 * cover the app (or its Approve button). Replaces the old `prose` classes,
 * which never applied (the typography plugin isn't installed).
 */
const EMAIL_CSS = `
:host { display: block; contain: layout paint; position: relative; isolation: isolate; }
.fm-mail {
  color: var(--fm-fg);
  font-size: 0.9375rem;
  line-height: 1.6;
  overflow-wrap: break-word;
  overflow-x: auto;
  max-width: var(--fm-c-reading-max);
}
.fm-mail > :first-child { margin-top: 0; }
.fm-mail > :last-child { margin-bottom: 0; }
p, ul, ol, blockquote, pre, table, figure, dl { margin: 0 0 0.75em; }
h1, h2, h3, h4, h5, h6 { font-size: 1em; font-weight: 600; line-height: 1.4; margin: 1.25em 0 0.5em; }
h1 { font-size: 1.125em; }
strong, b { font-weight: 600; }
a { color: var(--fm-accent-fg); text-decoration: underline; text-underline-offset: 2px; }
a:hover { color: var(--fm-accent-hover); }
a:focus-visible { outline: 2px solid var(--fm-focus); outline-offset: 2px; border-radius: 2px; }
ul, ol { padding-left: 1.5em; }
li { margin: 0.25em 0; }
blockquote { margin-left: 0; padding-left: 0.875em; border-left: 2px solid var(--fm-line-strong); color: var(--fm-fg-muted); }
img { max-width: 100%; height: auto; }
table { border-collapse: collapse; max-width: 100%; }
td, th { padding: 0.25em 0.5em; vertical-align: top; text-align: left; }
pre, code, kbd, samp { font-family: var(--font-plex-mono), ui-monospace, monospace; font-size: 0.875em; }
pre { white-space: pre-wrap; background: var(--fm-sunken); padding: 0.75em; border-radius: 6px; }
hr { border: 0; border-top: 1px solid var(--fm-line); margin: 1.25em 0; }
`

interface MessageBodyProps {
  html: string | null
  text: string | null
  className?: string
}

/** The original email: sanitised HTML when present, otherwise the plain text. */
export function MessageBody({ html, text, className }: MessageBodyProps) {
  if (html) return <HtmlBody html={html} fallbackText={text} className={className} />
  if (text?.trim()) {
    return <div className={cn('max-w-(--fm-c-reading-max) whitespace-pre-wrap break-words text-md text-fg', className)}>{text}</div>
  }
  return <p className={cn('text-base italic text-fg-subtle', className)}>This email has no text.</p>
}

/**
 * DOMPurify needs a DOM, so HTML is sanitised and rendered after mount (the
 * server render shows the plain-text version, or a placeholder). Links open in
 * a new tab so following one never leaves the review.
 */
function HtmlBody({ html, fallbackText, className }: { html: string; fallbackText: string | null; className?: string }) {
  const hostRef = useRef<HTMLDivElement>(null)
  const [rendered, setRendered] = useState(false)

  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    const root = host.shadowRoot ?? host.attachShadow({ mode: 'open' })
    const clean = DOMPurify.sanitize(html, {
      USE_PROFILES: { html: true },
    })
    root.innerHTML = `<style>${EMAIL_CSS}</style><div class="fm-mail">${clean}</div>`
    root.querySelectorAll('a[href]').forEach((a) => {
      a.setAttribute('target', '_blank')
      a.setAttribute('rel', 'noopener noreferrer')
    })
    // Forms in email are never submitted from here (no phishing through the workspace).
    root.querySelectorAll('form').forEach((form) => form.addEventListener('submit', (e) => e.preventDefault()))
    // Rendering into the shadow root happens outside React; mark it done.
    setRendered(true)
  }, [html])

  return (
    <div ref={hostRef} className={className}>
      {/* Shown until the shadow root takes over (and never re-shown after). */}
      {!rendered &&
        (fallbackText?.trim() ? (
          <div className="max-w-(--fm-c-reading-max) whitespace-pre-wrap break-words text-md text-fg">{fallbackText}</div>
        ) : (
          <div className="h-24" aria-hidden="true" />
        ))}
    </div>
  )
}
