-- ============================================================
-- Row Level Security (RLS) Policies Dump
-- Project: allsaints-email-agent (clxqjxtmxswpjjvqunfx)
-- Generated at: 2026-09-09
-- ============================================================

-- ------------------------------------------------------------
-- Table: public.accounts
-- ------------------------------------------------------------
ALTER TABLE "public"."accounts" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow all for now - TIGHTEN LATER with real auth" ON "public"."accounts";
CREATE POLICY "allow all for now - TIGHTEN LATER with real auth"
  ON "public"."accounts"
  AS PERMISSIVE
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- ------------------------------------------------------------
-- Table: public.audit_log
-- ------------------------------------------------------------
ALTER TABLE "public"."audit_log" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow all for now - TIGHTEN LATER with real auth" ON "public"."audit_log";
CREATE POLICY "allow all for now - TIGHTEN LATER with real auth"
  ON "public"."audit_log"
  AS PERMISSIVE
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- ------------------------------------------------------------
-- Table: public.drafts
-- ------------------------------------------------------------
ALTER TABLE "public"."drafts" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow all for now - TIGHTEN LATER with real auth" ON "public"."drafts";
CREATE POLICY "allow all for now - TIGHTEN LATER with real auth"
  ON "public"."drafts"
  AS PERMISSIVE
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- ------------------------------------------------------------
-- Table: public.emails
-- ------------------------------------------------------------
ALTER TABLE "public"."emails" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow all for now - TIGHTEN LATER with real auth" ON "public"."emails";
CREATE POLICY "allow all for now - TIGHTEN LATER with real auth"
  ON "public"."emails"
  AS PERMISSIVE
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- ------------------------------------------------------------
-- Table: public.users
-- ------------------------------------------------------------
ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow all for now - TIGHTEN LATER with real auth" ON "public"."users";
CREATE POLICY "allow all for now - TIGHTEN LATER with real auth"
  ON "public"."users"
  AS PERMISSIVE
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);
