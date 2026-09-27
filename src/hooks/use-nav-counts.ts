'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { fetchNavCounts, type NavCounts } from '@/lib/nav-counts'

/**
 * Live sidebar counts. Starts from the server-rendered values, then re-counts
 * (debounced) whenever emails or drafts change. The channel is removed on unmount.
 */
export function useNavCounts(initial: NavCounts): NavCounts {
  const [counts, setCounts] = useState<NavCounts>(initial)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const supabase = createClient()

    const refresh = () => {
      if (timer.current) clearTimeout(timer.current)
      timer.current = setTimeout(async () => {
        setCounts(await fetchNavCounts(supabase))
      }, 400)
    }

    const channel = supabase
      .channel('shell-nav-counts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'emails' }, refresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'drafts' }, refresh)
      .subscribe()

    return () => {
      if (timer.current) clearTimeout(timer.current)
      supabase.removeChannel(channel)
    }
  }, [])

  return counts
}
