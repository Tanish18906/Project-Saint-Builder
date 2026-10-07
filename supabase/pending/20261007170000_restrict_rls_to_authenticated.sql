-- SECURITY FIX: replace the "allow all for now" policies (granted to PUBLIC, i.e. the anon key that
-- ships in the browser bundle) with signed-in-staff-only access.
--
-- Before this, anyone holding the public anon key could read every email / WhatsApp number and set
-- drafts.status = 'approved' on any draft, which fires tr_draft_approved_webhook -> n8n -> real SMTP send.
--
-- PREREQUISITES — move this file into supabase/migrations/ and apply ONLY after:
--   1. SUPABASE_SERVICE_ROLE_KEY is set in the deployed Next.js env (Vercel). The voice portal has no
--      Supabase session; after HMAC token verification it uses the service role (src/lib/supabase/voice.ts).
--   2. The n8n "Supabase account" credential holds the service_role secret (not the anon key).
-- Side effect: the voice portal's live Realtime updates (anon browser client) stop; the page still
-- loads fresh data on every visit and after every action.

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['accounts', 'users', 'emails', 'drafts', 'audit_log'] LOOP
    EXECUTE format('DROP POLICY IF EXISTS "allow all for now - TIGHTEN LATER with real auth" ON public.%I', t);
    EXECUTE format('DROP POLICY IF EXISTS "staff full access" ON public.%I', t);
    EXECUTE format(
      'CREATE POLICY "staff full access" ON public.%I FOR ALL TO authenticated USING (true) WITH CHECK (true)', t
    );
  END LOOP;
END $$;
