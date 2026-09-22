-- Migration: Update Webhook URLs to Allsaints Builders n8n Cloud and Harden Security
-- Functions:
--   - public.notify_draft_approved_webhook()
--   - public.notify_email_inserted_whatsapp_webhook()
-- Target: Dedicated Allsaints Builders n8n Cloud instance (https://allsaintsbuilders.app.n8n.cloud)

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
    PERFORM net.http_post(
      url := 'https://allsaintsbuilders.app.n8n.cloud/webhook/foreman-send-on-approval',
      headers := '{"Content-Type": "application/json"}'::jsonb,
      body := payload
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.notify_email_inserted_whatsapp_webhook()
RETURNS TRIGGER AS $$
DECLARE
  payload jsonb;
BEGIN
  payload := jsonb_build_object(
    'type', 'INSERT',
    'table', 'emails',
    'schema', 'public',
    'record', row_to_json(NEW)::jsonb
  );
  PERFORM net.http_post(
    url := 'https://allsaintsbuilders.app.n8n.cloud/webhook/foreman-whatsapp-notifications',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := payload
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Security hardening: revoke execution from anon and public, grant to service roles
REVOKE EXECUTE ON FUNCTION public.notify_draft_approved_webhook() FROM anon, public;
GRANT EXECUTE ON FUNCTION public.notify_draft_approved_webhook() TO postgres, service_role;

REVOKE EXECUTE ON FUNCTION public.notify_email_inserted_whatsapp_webhook() FROM anon, public;
GRANT EXECUTE ON FUNCTION public.notify_email_inserted_whatsapp_webhook() TO postgres, service_role;
