-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- 2. TABLES

-- Accounts table
CREATE TABLE IF NOT EXISTS public.accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_address TEXT UNIQUE NOT NULL,
  display_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Users table
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CONSTRAINT check_user_role CHECK (role IN ('director', 'senior_admin', 'progressor', 'accountant')),
  whatsapp_number TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Emails table
CREATE TABLE IF NOT EXISTS public.emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  message_id TEXT NOT NULL,
  thread_id TEXT,
  from_address TEXT NOT NULL,
  from_name TEXT,
  subject TEXT,
  body_text TEXT,
  body_html TEXT,
  received_at TIMESTAMPTZ NOT NULL,
  category TEXT CONSTRAINT check_email_category CHECK (category IS NULL OR category IN ('urgent', 'priority', 'read_later', 'finance_accounts', 'contracts', 'nph_job_update', 'other')),
  routed_role TEXT CONSTRAINT check_email_routed_role CHECK (routed_role IS NULL OR routed_role IN ('director', 'senior_admin', 'progressor', 'accountant')),
  status TEXT NOT NULL DEFAULT 'new' CONSTRAINT check_email_status CHECK (status IN ('new', 'classified', 'drafted', 'sent', 'discarded')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for emails table
CREATE INDEX IF NOT EXISTS idx_emails_account_id ON public.emails(account_id);
CREATE INDEX IF NOT EXISTS idx_emails_status ON public.emails(status);
CREATE INDEX IF NOT EXISTS idx_emails_category ON public.emails(category);

-- Drafts table
CREATE TABLE IF NOT EXISTS public.drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_id UUID NOT NULL UNIQUE REFERENCES public.emails(id) ON DELETE CASCADE,
  ai_generated_text TEXT,
  edited_text TEXT,
  draft_type TEXT NOT NULL DEFAULT 'ai_generated' CONSTRAINT check_draft_type CHECK (draft_type IN ('ai_generated', 'ai_edited', 'manual')),
  status TEXT NOT NULL DEFAULT 'pending' CONSTRAINT check_draft_status CHECK (status IN ('pending', 'approved', 'discarded', 'sent')),
  approved_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Audit log table
CREATE TABLE IF NOT EXISTS public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_id UUID REFERENCES public.emails(id) ON DELETE SET NULL,
  draft_id UUID REFERENCES public.drafts(id) ON DELETE SET NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. SEED DATA FOR ACCOUNTS
INSERT INTO public.accounts (email_address, display_name)
VALUES 
  ('info@allsaintsbuilders.com', 'Info — Directors & Admin'),
  ('team@allsaintsbuilders.com', 'Team — Progressor & Ops')
ON CONFLICT (email_address) DO UPDATE 
SET display_name = EXCLUDED.display_name;

-- 4. ROW LEVEL SECURITY (RLS) & POLICIES

-- Accounts RLS
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow all for now - TIGHTEN LATER with real auth" ON public.accounts;
CREATE POLICY "allow all for now - TIGHTEN LATER with real auth"
ON public.accounts FOR ALL
USING (true)
WITH CHECK (true);

-- Users RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow all for now - TIGHTEN LATER with real auth" ON public.users;
CREATE POLICY "allow all for now - TIGHTEN LATER with real auth"
ON public.users FOR ALL
USING (true)
WITH CHECK (true);

-- Emails RLS
ALTER TABLE public.emails ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow all for now - TIGHTEN LATER with real auth" ON public.emails;
CREATE POLICY "allow all for now - TIGHTEN LATER with real auth"
ON public.emails FOR ALL
USING (true)
WITH CHECK (true);

-- Drafts RLS
ALTER TABLE public.drafts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow all for now - TIGHTEN LATER with real auth" ON public.drafts;
CREATE POLICY "allow all for now - TIGHTEN LATER with real auth"
ON public.drafts FOR ALL
USING (true)
WITH CHECK (true);

-- Audit log RLS
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow all for now - TIGHTEN LATER with real auth" ON public.audit_log;
CREATE POLICY "allow all for now - TIGHTEN LATER with real auth"
ON public.audit_log FOR ALL
USING (true)
WITH CHECK (true);

-- 5. TRIGGERS

-- Auto-update updated_at on drafts
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_drafts_updated_at ON public.drafts;
CREATE TRIGGER update_drafts_updated_at
  BEFORE UPDATE ON public.drafts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Webhook Trigger (approval -> n8n)
CREATE OR REPLACE FUNCTION public.notify_draft_approved_webhook()
RETURNS TRIGGER AS $$
DECLARE
  payload jsonb;
BEGIN
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    payload := jsonb_build_object(
      'type', 'UPDATE',
      'table', 'drafts',
      'schema', 'public',
      'record', row_to_json(NEW)::jsonb,
      'old_record', row_to_json(OLD)::jsonb
    );
    
    -- Perform HTTP POST to n8n webhook URL placeholder
    -- NOTE: Replace 'https://example.com/TODO_N8N_WEBHOOK_URL_PLACEHOLDER' with real n8n webhook URL once the send-on-approval n8n workflow is built.
    PERFORM net.http_post(
      url := 'https://example.com/TODO_N8N_WEBHOOK_URL_PLACEHOLDER',
      headers := '{"Content-Type": "application/json"}'::jsonb,
      body := payload
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_draft_approved_webhook ON public.drafts;
CREATE TRIGGER tr_draft_approved_webhook
  AFTER UPDATE ON public.drafts
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_draft_approved_webhook();
