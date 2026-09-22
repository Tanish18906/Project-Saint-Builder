# Database Webhooks Configuration

**Project:** allsaints-email-agent (`clxqjxtmxswpjjvqunfx`)  
**Generated:** 2026-09-09  

---

## 1. `tr_draft_approved_webhook`

- **Name:** `tr_draft_approved_webhook`
- **Table:** `public.drafts`
- **Event:** `AFTER UPDATE`
  - **Trigger Condition:** `NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved')`
- **Target URL:** `https://ridleyacademy.app.n8n.cloud/webhook/foreman-send-on-approval`
- **URL Status / Flag:** **REAL n8n URL** (Active cloud webhook on `ridleyacademy.app.n8n.cloud`, not a placeholder)
- **Execution Mechanism:** PostgreSQL Trigger function `public.notify_draft_approved_webhook()` using `net.http_post` (`pg_net` extension)
- **Payload Structure:**
  ```json
  {
    "type": "UPDATE",
    "table": "drafts",
    "schema": "public",
    "record": { ...NEW },
    "old_record": { ...OLD }
  }
  ```

---

## 2. `tr_email_inserted_whatsapp_webhook`

- **Name:** `tr_email_inserted_whatsapp_webhook`
- **Table:** `public.emails`
- **Event:** `AFTER INSERT`
- **Target URL:** `https://ridleyacademy.app.n8n.cloud/webhook/foreman-whatsapp-notifications`
- **URL Status / Flag:** **REAL n8n URL** (Active cloud webhook on `ridleyacademy.app.n8n.cloud`, updated for dedicated Foreman WhatsApp canvas)
- **Execution Mechanism:** PostgreSQL Trigger function `public.notify_email_inserted_whatsapp_webhook()` using `net.http_post` (`pg_net` extension)
- **Payload Structure:**
  ```json
  {
    "type": "INSERT",
    "table": "emails",
    "schema": "public",
    "record": { ...NEW }
  }
  ```

---

## Trigger & Function Definitions (SQL)

```sql
-- 1. Draft Approved Webhook
CREATE OR REPLACE FUNCTION public.notify_draft_approved_webhook()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
    
    -- Perform HTTP POST to real n8n webhook URL
    PERFORM net.http_post(
      url := 'https://ridleyacademy.app.n8n.cloud/webhook/foreman-send-on-approval',
      headers := '{"Content-Type": "application/json"}'::jsonb,
      body := payload
    );
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE TRIGGER "tr_draft_approved_webhook"
  AFTER UPDATE ON "public"."drafts"
  FOR EACH ROW
  EXECUTE FUNCTION "public"."notify_draft_approved_webhook"();

-- 2. Email Inserted WhatsApp Webhook
CREATE OR REPLACE FUNCTION public.notify_email_inserted_whatsapp_webhook()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$;

CREATE OR REPLACE TRIGGER "tr_email_inserted_whatsapp_webhook"
  AFTER INSERT ON "public"."emails"
  FOR EACH ROW
  EXECUTE FUNCTION "public"."notify_email_inserted_whatsapp_webhook"();
```
