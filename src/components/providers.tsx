'use client'

import React from 'react'
import { TooltipProvider } from '@/components/ui/tooltip'
import { ToastProvider } from '@/components/ui/toast'

/** App-wide client providers. Mounted once in the root layout. */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider>
      <ToastProvider>{children}</ToastProvider>
    </TooltipProvider>
  )
}
