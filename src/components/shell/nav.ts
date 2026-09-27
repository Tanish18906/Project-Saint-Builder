'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import { resolveActiveNav, type NavId } from './nav-config'

export * from './nav-config'

export function useActiveNav(): NavId | null {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  return resolveActiveNav(pathname, searchParams.get('view'))
}
