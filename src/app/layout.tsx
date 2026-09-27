import type { Metadata, Viewport } from 'next'
import { IBM_Plex_Sans, IBM_Plex_Mono } from 'next/font/google'
import { Providers } from '@/components/providers'
import './globals.css'

// Self-hosted at build time by next/font — no runtime requests to Google.
const plexSans = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-plex-sans',
  display: 'swap',
})

const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-plex-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Foreman — Allsaints Builders Email Assistant',
  description: 'AI email triage, automated classification, draft reply review, and approval dashboard for Allsaints Builders.',
  icons: {
    icon: '/favicon.ico',
  },
}

export const viewport: Viewport = {
  themeColor: '#f7f7f5',
  // Lets sticky action bars use env(safe-area-inset-*) on notched phones.
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${plexSans.variable} ${plexMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-canvas font-sans text-fg">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
