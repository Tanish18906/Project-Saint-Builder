import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { Showcase } from './showcase'

export const metadata: Metadata = {
  title: 'Design system — Foreman',
}

/**
 * Living reference for DESIGN_SYSTEM.md: every token and primitive, in every
 * state. Development only — returns 404 in production builds. Still behind the
 * dashboard login like every non-voice route.
 */
export default function DesignSystemPage() {
  if (process.env.NODE_ENV === 'production') notFound()
  return <Showcase />
}
