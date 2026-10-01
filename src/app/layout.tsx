import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Foreman — Allsaints Builders Email Assistant',
  description: 'AI email triage, automated classification, draft reply review, and approval dashboard for Allsaints Builders.',
  icons: {
    icon: '/favicon.ico',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full bg-[var(--app-bg)] text-[var(--text-primary)] antialiased">
      <body className="min-h-full flex flex-col font-sans bg-[var(--app-bg)] text-[var(--text-primary)] antialiased selection:bg-[var(--brand)] selection:text-white">
        {children}
      </body>
    </html>
  )
}
