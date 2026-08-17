-- Webhook Trigger (email inserted -> n8n Workflow 3 WhatsApp notifications)
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
  
  -- Perform HTTP POST to n8n webhook URL for WhatsApp notifications
  PERFORM net.http_post(
    url := 'https://ridleyacademy.app.n8n.cloud/webhook/foreman-whatsapp-notifications',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := payload
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_email_inserted_whatsapp_webhook ON public.emails;
CREATE TRIGGER tr_email_inserted_whatsapp_webhook
  AFTER INSERT ON public.emails
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_email_inserted_whatsapp_webhook();
