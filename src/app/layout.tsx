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
    <html lang="en" className="h-full bg-[#f5f1e8] text-[#1c1a17] antialiased">
      <body className="min-h-full flex flex-col font-sans selection:bg-[#1c1a17] selection:text-[#f5f1e8]">
        {children}
      </body>
    </html>
  )
}
