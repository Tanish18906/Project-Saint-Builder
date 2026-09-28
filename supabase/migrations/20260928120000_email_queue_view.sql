-- Supabase Migration: email_queue view (queue classification in SQL)
-- Context: the dashboard queue and sidebar counts fetched every email and
-- classified them in the app. PostgREST caps responses at max_rows (1000), so
-- beyond 1000 emails older mail vanished from every view and all counts were
-- wrong. This view exposes the same classification as columns so the app can
-- filter, count (count=exact) and page (range) in Postgres instead.
--
-- KEEP IN SYNC with getQueueState() in src/lib/domain.ts:
--   is_handled     = email sent/discarded, or draft approved/sent
--   needs_review   = not handled and draft pending/discarded
--   is_urgent_open = not handled and urgency = 'urgent'
--   urgency_rank   = urgencyRank(): urgent 0, priority 1, else 2

CREATE OR REPLACE VIEW public.email_queue
WITH (security_invoker = true) AS
SELECT
  e.id,
  e.account_id,
  e.received_at,
  e.subject,
  e.from_name,
  e.from_address,
  e.body_text,
  e.theme,
  e.urgency,
  e.routed_roles,
  e.status,
  d.status AS draft_status,
  h.is_handled,
  (NOT h.is_handled AND coalesce(lower(d.status) IN ('pending', 'discarded'), false)) AS needs_review,
  (NOT h.is_handled AND lower(coalesce(e.urgency, '')) = 'urgent') AS is_urgent_open,
  CASE lower(coalesce(e.urgency, ''))
    WHEN 'urgent' THEN 0
    WHEN 'priority' THEN 1
    ELSE 2
  END AS urgency_rank
FROM public.emails e
LEFT JOIN public.drafts d ON d.email_id = e.id
CROSS JOIN LATERAL (
  SELECT (
    lower(e.status) IN ('sent', 'discarded')
    OR coalesce(lower(d.status) IN ('approved', 'sent'), false)
  ) AS is_handled
) h;

COMMENT ON VIEW public.email_queue IS
  'Queue classification per email; mirrors getQueueState() in src/lib/domain.ts. security_invoker: RLS of emails/drafts applies.';

-- Every queue view orders by received_at desc.
CREATE INDEX IF NOT EXISTS idx_emails_received_at ON public.emails (received_at DESC);
