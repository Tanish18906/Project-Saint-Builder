'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export type LiveStatus = 'connecting' | 'live' | 'offline'

export interface ChangeSpec {
  table: string
  event?: '*' | 'INSERT' | 'UPDATE' | 'DELETE'
  /** Realtime row filter, e.g. `email_id=eq.<uuid>`. */
  filter?: string
}

/**
 * Calls `onChange` (debounced) whenever a matching row changes. Read-only: it
 * only tells the screen to re-read through its normal query. The channel is
 * removed on unmount.
 */
export function useRealtimeChanges(channelName: string, specs: ChangeSpec[], onChange: () => void, debounceMs = 500): LiveStatus {
  const [status, setStatus] = useState<LiveStatus>('connecting')
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const callback = useRef(onChange)
  useEffect(() => {
    callback.current = onChange
  })
  const specsKey = JSON.stringify(specs)

  useEffect(() => {
    const supabase = createClient()
    const fire = () => {
      if (timer.current) clearTimeout(timer.current)
      timer.current = setTimeout(() => callback.current(), debounceMs)
    }

    let channel = supabase.channel(channelName)
    for (const spec of JSON.parse(specsKey) as ChangeSpec[]) {
      channel = channel.on(
        'postgres_changes',
        { event: spec.event ?? '*', schema: 'public', table: spec.table, ...(spec.filter ? { filter: spec.filter } : {}) },
        fire
      )
    }
    channel.subscribe((s) => {
      if (s === 'SUBSCRIBED') setStatus('live')
      else if (s === 'CHANNEL_ERROR' || s === 'TIMED_OUT' || s === 'CLOSED') setStatus('offline')
    })

    return () => {
      if (timer.current) clearTimeout(timer.current)
      supabase.removeChannel(channel)
    }
  }, [channelName, specsKey, debounceMs])

  return status
}

/**
 * Keeps a server-rendered screen current: matching changes trigger a
 * router.refresh(), so the server re-runs the same query.
 */
export function useLiveRefresh(channelName: string, specs: ChangeSpec[]): LiveStatus {
  const router = useRouter()
  return useRealtimeChanges(channelName, specs, () => router.refresh())
}
