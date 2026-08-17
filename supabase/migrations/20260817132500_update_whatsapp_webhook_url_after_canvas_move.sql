-- Migration: Update WhatsApp Webhook URL after Canvas Move
-- Function: public.notify_email_inserted_whatsapp_webhook()
-- Trigger: tr_email_inserted_whatsapp_webhook (persists on public.emails AFTER INSERT)
-- Target: Dedicated Foreman Whatsapp workflow (https://ridleyacademy.app.n8n.cloud/webhook/foreman-whatsapp-notifications)

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
  
  -- Perform HTTP POST to n8n webhook URL on dedicated Foreman WhatsApp canvas
  PERFORM net.http_post(
    url := 'https://ridleyacademy.app.n8n.cloud/webhook/foreman-whatsapp-notifications',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := payload
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
