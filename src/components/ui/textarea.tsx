'use client'

import React, { useLayoutEffect, useRef } from 'react'
import { cn } from '@/lib/cn'
import { controlSkin } from './field'

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Grow with content between the CSS min/max heights. */
  autoGrow?: boolean
  invalid?: boolean
  /** Reading-size text (15px) for long-form content such as reply drafts. */
  reading?: boolean
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { autoGrow = false, invalid, reading = false, className, value, ...props },
  forwardedRef
) {
  const innerRef = useRef<HTMLTextAreaElement | null>(null)

  const setRefs = (el: HTMLTextAreaElement | null) => {
    innerRef.current = el
    if (typeof forwardedRef === 'function') forwardedRef(el)
    else if (forwardedRef) forwardedRef.current = el
  }

  useLayoutEffect(() => {
    const el = innerRef.current
    if (!autoGrow || !el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight + 2}px`
  }, [autoGrow, value])

  return (
    <textarea
      ref={setRefs}
      value={value}
      aria-invalid={invalid || undefined}
      className={cn(
        controlSkin,
        'block px-3 py-2.5 pointer-coarse:text-lg',
        reading ? 'text-md' : 'text-base',
        autoGrow ? 'resize-none overflow-y-auto' : 'resize-y',
        className
      )}
      {...props}
    />
  )
})
