// Local load test for the queue/nav read paths. Run with the dev server up:
//   node --env-file=.env.local scripts/load-test-queue.mjs
// Compares what the app reports against ground-truth counts from the DB.
import { createClient } from '@supabase/supabase-js'

const APP = process.env.APP_URL ?? 'http://localhost:3000'
const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const service = process.env.SUPABASE_SERVICE_ROLE_KEY
const email = process.env.TEST_EMAIL ?? 'dev@foreman.local'
const password = process.env.TEST_PASSWORD ?? 'foreman-dev-123'

const auth = createClient(url, anon, { auth: { persistSession: false } })
const { data: login, error } = await auth.auth.signInWithPassword({ email, password })
if (error) throw error

// @supabase/ssr cookie: sb-<ref>-auth-token = "base64-" + base64url(session), chunked.
const ref = new URL(url).hostname.split('.')[0]
const value = 'base64-' + Buffer.from(JSON.stringify(login.session)).toString('base64url')
const CHUNK = 3180
const cookie =
  value.length <= CHUNK
    ? `sb-${ref}-auth-token=${value}`
    : Array.from({ length: Math.ceil(value.length / CHUNK) }, (_, i) => `sb-${ref}-auth-token.${i}=${value.slice(i * CHUNK, (i + 1) * CHUNK)}`).join('; ')

// Ground truth straight from Postgres via service role, paging past max_rows.
const admin = createClient(url, service, { auth: { persistSession: false } })
async function all() {
  const rows = []
  for (let from = 0; ; from += 1000) {
    const { data, error } = await admin.from('emails').select('id, status, urgency, drafts(status)').order('received_at', { ascending: false }).order('id').range(from, from + 999)
    if (error) throw error
    rows.push(...data)
    if (data.length < 1000) return rows
  }
}
const rows = await all()
const truth = { all: rows.length, review: 0, urgent: 0, handled: 0 }
for (const r of rows) {
  const d = Array.isArray(r.drafts) ? r.drafts[0]?.status : r.drafts?.status
  const handled = r.status === 'sent' || r.status === 'discarded' || d === 'approved' || d === 'sent'
  if (handled) truth.handled++
  if (!handled && (d === 'pending' || d === 'discarded')) truth.review++
  if (!handled && r.urgency === 'urgent') truth.urgent++
}

async function timed(path, opts = {}) {
  const t = performance.now()
  const res = await fetch(APP + path, { headers: { cookie, accept: 'application/json' }, redirect: 'manual', ...opts })
  const body = res.headers.get('content-type')?.includes('json') ? await res.json() : await res.text()
  return { status: res.status, ms: Math.round(performance.now() - t), body }
}

// Warm up (first hit compiles the route in dev).
await timed('/api/queue?view=all')

const results = []
for (const view of ['all', 'review', 'urgent', 'handled']) {
  const r = await timed(`/api/queue?view=${view}`)
  results.push({ check: `queue view=${view}`, http: r.status, ms: r.ms, appTotal: r.body.total, truth: truth[view], items: r.body.items?.length, ok: r.body.total === truth[view] })
}
for (const [label, qs] of [['search "Plot 7"', 'view=all&q=Plot%207'], ['inbox=team', 'view=all&inbox=team'], ['limit=200', 'view=all&limit=200'], ['theme=invoices', 'view=all&theme=invoices']]) {
  const r = await timed(`/api/queue?${qs}`)
  results.push({ check: label, http: r.status, ms: r.ms, appTotal: r.body.total, items: r.body.items?.length })
}

// Pages (SSR, includes sidebar nav counts).
const first = (await timed('/api/queue?view=all')).body.items[0]
for (const p of ['/', `/emails/${first.id}`, '/audit-log']) {
  const r = await timed(p, { headers: { cookie, accept: 'text/html' } })
  results.push({ check: `page ${p.length > 20 ? '/emails/[id]' : p}`, http: r.status, ms: r.ms })
}

// Concurrency: 20 simultaneous queue requests.
const t = performance.now()
const burst = await Promise.all(Array.from({ length: 20 }, () => timed('/api/queue?view=review')))
results.push({ check: '20 concurrent review', http: [...new Set(burst.map((b) => b.status))].join(','), ms: Math.round(performance.now() - t), appTotal: burst[0].body.total, truth: truth.review, ok: burst.every((b) => b.body.total === truth.review) })

// Sidebar counts: same queries as lib/nav-counts.ts, as the signed-in user.
const user = createClient(url, anon, { auth: { persistSession: false } })
await user.auth.setSession(login.session)
for (const [flag, key] of [['needs_review', 'review'], ['is_urgent_open', 'urgent']]) {
  const { count } = await user.from('email_queue').select('id', { count: 'exact', head: true }).eq(flag, true)
  results.push({ check: `nav count ${key}`, appTotal: count, truth: truth[key], ok: count === truth[key] })
}

// Every open urgent email (including the oldest) must be reachable in the urgent view.
const urgentAll = await timed('/api/queue?view=urgent&limit=500')
const urgentIds = new Set(urgentAll.body.items.map((i) => i.id))
const oldestUrgent = rows.filter((r) => r.urgency === 'urgent' && r.status !== 'sent' && r.status !== 'discarded' && !['approved', 'sent'].includes(r.drafts?.status)).at(-1)
results.push({ check: 'urgent view reaches oldest', appTotal: urgentAll.body.items.length, truth: truth.urgent, ok: urgentAll.body.items.length === truth.urgent && (!oldestUrgent || urgentIds.has(oldestUrgent.id)) })

// Review view order: urgency rank asc, then newest first.
const rank = (u) => (u === 'urgent' ? 0 : u === 'priority' ? 1 : 2)
const rev = (await timed('/api/queue?view=review&limit=500')).body.items
const sorted = rev.every((a, i) => i === 0 || rank(rev[i - 1].urgency) < rank(a.urgency) || (rank(rev[i - 1].urgency) === rank(a.urgency) && rev[i - 1].receivedAt >= a.receivedAt))
results.push({ check: 'review view ordering', appTotal: rev.length, ok: sorted && rev.every((i) => i.needsReview) })

console.log('Ground truth:', truth)
console.table(results)
