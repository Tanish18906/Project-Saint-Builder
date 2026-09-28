-- Local-only sample data for the Foreman dashboard.
-- Run: docker exec -i supabase_db_Project_SaintBuilder psql -U postgres < scripts/seed-sample-emails.sql
-- session_replication_role = replica suppresses triggers so the pg_net webhooks
-- (which point at the PRODUCTION n8n) do not fire WhatsApp alerts for seed rows.
-- Re-runnable: removes previous seed rows (message_id ending @seed.foreman.local).

BEGIN;
SET LOCAL session_replication_role = replica;

DELETE FROM public.emails WHERE message_id LIKE '%@seed.foreman.local>';

WITH info AS (SELECT id FROM public.accounts WHERE email_address = 'info@allsaintsbuilders.com'),
     team AS (SELECT id FROM public.accounts WHERE email_address = 'team@allsaintsbuilders.com'),
     seed(acct, n, from_address, from_name, subject, body_text, mins_ago, category, routed_role, routed_roles, theme, urgency, status, draft_text, draft_status) AS (VALUES
  ('info', 1, 'sarah.jenkins@gmail.com', 'Sarah Jenkins',
   'URGENT: Water leak from new bathroom ceiling',
   E'Hi,\n\nWater is dripping through the kitchen ceiling directly below the bathroom your team finished last week. It started this morning and is getting worse. Can someone come out today?\n\nSarah\n14 Elm Road',
   25, 'urgent', 'director', ARRAY['director','progressor'], 'nph_jobs', 'urgent', 'drafted',
   E'Hi Sarah,\n\nI''m sorry to hear about the leak. Please turn off the water supply to the bathroom at the isolation valve if you can safely do so. We are arranging for a plumber to attend today and will call you within the hour with an arrival time.\n\nKind regards,\nAllsaints Builders', 'pending'),
  ('info', 2, 'accounts@buildbase-supplies.co.uk', 'Buildbase Accounts',
   'Invoice INV-20931 overdue — £4,812.60',
   E'Dear Customer,\n\nOur records show invoice INV-20931 dated 12 August for £4,812.60 is now 17 days overdue. Please arrange payment or contact us if there is a query.\n\nRegards,\nCredit Control',
   90, 'finance_accounts', 'accountant', ARRAY['accountant'], 'invoices', 'priority', 'drafted',
   E'Dear Credit Control,\n\nThank you for the reminder. We are reviewing INV-20931 against our delivery notes and will confirm payment or raise any query by Friday.\n\nKind regards,\nAllsaints Builders Accounts', 'pending'),
  ('info', 3, 'm.okafor@okaforlegal.co.uk', 'Michael Okafor',
   'Revised JCT contract — 22 Hatfield Lane extension',
   E'Please find the revised JCT Minor Works contract attached with the amended retention clause (3%) and the updated completion date of 30 November. Could you confirm acceptance or send comments by Wednesday?\n\nMichael Okafor\nOkafor Legal',
   240, 'contracts', 'director', ARRAY['director','senior_admin'], 'accounts', 'priority', 'drafted',
   E'Dear Michael,\n\nThank you for the revised contract. Our director will review the retention clause and completion date and respond with any comments by Wednesday.\n\nKind regards,\nAllsaints Builders', 'pending'),
  ('team', 4, 'site@nphomes.co.uk', 'NPH Site Team',
   'Job update: Plot 7 — first fix electrics signed off',
   E'Plot 7 first fix electrics inspected and signed off today. Plasterers can start Monday. Please confirm your team is booked.\n\nNPH Site Team',
   45, 'nph_job_update', 'progressor', ARRAY['progressor'], 'nph_jobs', 'normal', 'drafted',
   E'Hi team,\n\nThanks for the update on Plot 7. Our plasterers are booked to start Monday at 8am.\n\nKind regards,\nAllsaints Builders', 'pending'),
  ('team', 5, 'orders@jewson.co.uk', 'Jewson Orders',
   'Delivery confirmation — Order #J-558210',
   E'Your order #J-558210 (40x plasterboard 12.5mm, 10x bags multi-finish) is scheduled for delivery Thursday AM to 22 Hatfield Lane.',
   180, 'priority', 'senior_admin', ARRAY['senior_admin','progressor'], 'orders', 'priority', 'drafted',
   E'Hi,\n\nThanks for confirming. Thursday morning delivery to 22 Hatfield Lane is fine — please call the site manager 30 minutes before arrival.\n\nKind regards,\nAllsaints Builders', 'pending'),
  ('info', 6, 'david.clarke@outlook.com', 'David Clarke',
   'Quote request: loft conversion',
   E'Hello,\n\nWe''re looking at a dormer loft conversion on a 1930s semi. Could someone visit to give us a quote? We''re free most weekday evenings.\n\nThanks,\nDavid',
   600, 'priority', 'director', ARRAY['director'], 'meetings_appointments', 'normal', 'sent',
   E'Hi David,\n\nThanks for getting in touch. We''d be happy to visit. Would Tuesday at 6pm work for you?\n\nKind regards,\nAllsaints Builders', 'sent'),
  ('info', 7, 'news@toolstation.com', 'Toolstation',
   '20% off power tools this weekend',
   E'Don''t miss our weekend sale — 20% off selected power tools in store and online.',
   1440, 'read_later', 'senior_admin', ARRAY['senior_admin'], 'promotions', 'normal', 'classified', NULL, NULL),
  ('team', 8, 'cert@gassafe-inspect.co.uk', 'GasSafe Inspections',
   'Gas safety certificate — 9 Mill Street',
   E'Please find attached the CP12 gas safety certificate for 9 Mill Street following today''s inspection. No defects found.',
   2880, 'other', 'progressor', ARRAY['progressor'], 'certificates', 'normal', 'new', NULL, NULL)
),
ins AS (
  INSERT INTO public.emails (account_id, message_id, thread_id, from_address, from_name, subject, body_text, received_at,
                             category, routed_role, routed_roles, theme, urgency, status)
  SELECT CASE s.acct WHEN 'info' THEN (SELECT id FROM info) ELSE (SELECT id FROM team) END,
         '<sample-' || s.n || '@seed.foreman.local>', '<sample-' || s.n || '@seed.foreman.local>',
         s.from_address, s.from_name, s.subject, s.body_text, now() - make_interval(mins => s.mins_ago),
         s.category, s.routed_role, s.routed_roles, s.theme, s.urgency, s.status
  FROM seed s
  RETURNING id, message_id
)
INSERT INTO public.drafts (email_id, ai_generated_text, edited_text, draft_type, status, approved_by, approved_at, sent_at)
SELECT ins.id, s.draft_text,
       CASE WHEN s.draft_status = 'sent' THEN s.draft_text END,
       'ai_generated', s.draft_status,
       CASE WHEN s.draft_status = 'sent' THEN (SELECT id FROM public.users WHERE email = 'dev@foreman.local') END,
       CASE WHEN s.draft_status = 'sent' THEN now() - interval '8 hours' END,
       CASE WHEN s.draft_status = 'sent' THEN now() - interval '8 hours' END
FROM ins JOIN seed s ON ins.message_id = '<sample-' || s.n || '@seed.foreman.local>'
WHERE s.draft_text IS NOT NULL;

COMMIT;

SELECT e.subject, e.urgency, e.status, d.status AS draft
FROM public.emails e LEFT JOIN public.drafts d ON d.email_id = e.id
WHERE e.message_id LIKE '%@seed.foreman.local>' ORDER BY e.received_at DESC;
