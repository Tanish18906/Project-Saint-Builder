import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getQueuePage, parseQueueParams } from '@/lib/queue'

export const dynamic = 'force-dynamic'

/**
 * Read-only queue data for the persistent queue pane (it stays mounted beside
 * the review workspace, so it fetches instead of re-rendering with the page).
 * Same read path and canonical classification as before (lib/queue.ts).
 * The middleware already requires a session here; the explicit check keeps the
 * handler safe on its own.
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Not signed in' }, { status: 401, headers: { 'Cache-Control': 'no-store' } })
  }

  const result = await getQueuePage(supabase, parseQueueParams(request.nextUrl.searchParams))
  return NextResponse.json(result, { headers: { 'Cache-Control': 'no-store' } })
}
