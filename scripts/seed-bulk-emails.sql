-- Local-only LARGE-VOLUME data for load/pagination testing.
-- Run: docker exec -i supabase_db_Project_SaintBuilder psql -U postgres -v n=5000 < scripts/seed-bulk-emails.sql
-- Triggers suppressed (session_replication_role = replica) so the pg_net webhooks
-- pointing at PRODUCTION n8n never fire. Re-runnable: clears previous bulk rows.
-- Remove bulk rows: DELETE FROM public.emails WHERE message_id LIKE '%@bulk.seed.foreman.local>';

\if :{?n}
\else
  \set n 5000
\endif

BEGIN;
SET LOCAL session_replication_role = replica;

DELETE FROM public.emails WHERE message_id LIKE '%@bulk.seed.foreman.local>';

CREATE TEMP TABLE bulk ON COMMIT DROP AS
SELECT g AS n,
       (ARRAY['info@allsaintsbuilders.com','team@allsaintsbuilders.com'])[1 + g % 2] AS inbox,
       (ARRAY['Sarah Jenkins','David Clarke','Priya Shah','Tom Walsh','Buildbase Accounts','Jewson Orders','NPH Site Team','Okafor Legal','GasSafe Inspections','Toolstation','Emma Hughes','Kwame Mensah'])[1 + g % 12] AS from_name,
       (ARRAY['sarah.jenkins@gmail.com','david.clarke@outlook.com','priya.shah@yahoo.co.uk','tom.walsh@btinternet.com','accounts@buildbase-supplies.co.uk','orders@jewson.co.uk','site@nphomes.co.uk','m.okafor@okaforlegal.co.uk','cert@gassafe-inspect.co.uk','news@toolstation.com','emma.hughes@gmail.com','k.mensah@hotmail.com'])[1 + g % 12] AS from_address,
       (ARRAY['nph_jobs','invoices','orders','suppliers','promotions','meetings_appointments','accounts','finance','certificates'])[1 + (g * 7) % 9] AS theme,
       -- ~8% urgent, ~22% priority, rest normal
       CASE WHEN g % 13 = 0 THEN 'urgent' WHEN g % 9 < 2 THEN 'priority' ELSE 'normal' END AS urgency,
       -- status mix: 55% drafted/pending, 25% sent, 8% discarded, 7% classified, 5% new
       CASE WHEN g % 20 < 11 THEN 'drafted' WHEN g % 20 < 16 THEN 'sent' WHEN g % 20 < 18 THEN 'discarded'
            WHEN g % 20 < 19 THEN 'classified' ELSE 'new' END AS status,
       (ARRAY['director','senior_admin','progressor','accountant'])[1 + g % 4] AS role,
       -- ~1 in 6 emails joins a thread of up to 4 messages
       CASE WHEN g % 6 = 0 THEN '<bulk-thread-' || (g / 24) || '@bulk.seed.foreman.local>' END AS thread
FROM generate_series(1, :n) g;

WITH ins AS (
  INSERT INTO public.emails (account_id, message_id, thread_id, from_address, from_name, subject, body_text, received_at,
                             category, routed_role, routed_roles, theme, urgency, status)
  SELECT a.id,
         '<bulk-' || b.n || '@bulk.seed.foreman.local>',
         coalesce(b.thread, '<bulk-' || b.n || '@bulk.seed.foreman.local>'),
         b.from_address, b.from_name,
         CASE b.theme
           WHEN 'nph_jobs' THEN 'Job update: Plot ' || (b.n % 90 + 1) || ' — ' || (ARRAY['first fix signed off','snagging list','handover booked','access issue'])[1 + b.n % 4]
           WHEN 'invoices' THEN 'Invoice INV-' || (20000 + b.n) || ' — £' || to_char((b.n * 37.13) % 9000 + 120, 'FM999990.00')
           WHEN 'orders' THEN 'Delivery confirmation — Order #J-' || (550000 + b.n)
           WHEN 'suppliers' THEN 'Price update from supplier (ref ' || b.n || ')'
           WHEN 'promotions' THEN (b.n % 40 + 5) || '% off this weekend'
           WHEN 'meetings_appointments' THEN 'Site visit request: ' || (ARRAY['loft conversion','kitchen extension','garage conversion','roof repair'])[1 + b.n % 4]
           WHEN 'accounts' THEN 'Contract query — project ' || b.n
           WHEN 'finance' THEN 'Payment schedule for stage ' || (b.n % 5 + 1)
           ELSE 'Certificate issued — ' || (b.n % 200 + 1) || ' Mill Street'
         END || CASE WHEN b.urgency = 'urgent' THEN ' [URGENT]' ELSE '' END,
         'Hello,' || E'\n\n' ||
           repeat('This is bulk test message ' || b.n || ' about ' || replace(b.theme, '_', ' ') || '. ', 1 + b.n % 15) ||
           E'\n\nRegards,\n' || b.from_name,
         now() - make_interval(mins => b.n * 7),
         CASE WHEN b.urgency = 'urgent' THEN 'urgent' WHEN b.urgency = 'priority' THEN 'priority' ELSE 'other' END,
         b.role, ARRAY[b.role], b.theme, b.urgency, b.status
  FROM bulk b JOIN public.accounts a ON a.email_address = b.inbox
  RETURNING id, status, received_at
)
INSERT INTO public.drafts (email_id, ai_generated_text, edited_text, draft_type, status, approved_by, approved_at, sent_at)
SELECT id,
       E'Hi,\n\nThank you for your email. We have noted this and will get back to you shortly.\n\nKind regards,\nAllsaints Builders',
       CASE WHEN status = 'sent' THEN E'Hi,\n\nThanks — all noted.\n\nKind regards,\nAllsaints Builders' END,
       CASE WHEN status = 'sent' THEN 'ai_edited' ELSE 'ai_generated' END,
       CASE status WHEN 'drafted' THEN 'pending' WHEN 'sent' THEN 'sent' ELSE 'discarded' END,
       CASE WHEN status = 'sent' THEN (SELECT id FROM public.users WHERE email = 'dev@foreman.local') END,
       CASE WHEN status = 'sent' THEN received_at + interval '2 hours' END,
       CASE WHEN status = 'sent' THEN received_at + interval '2 hours' END
FROM ins WHERE status IN ('drafted', 'sent', 'discarded');

COMMIT;

SELECT e.status, d.status AS draft, e.urgency, count(*)
FROM public.emails e LEFT JOIN public.drafts d ON d.email_id = e.id
GROUP BY 1, 2, 3 ORDER BY 1, 2, 3;
