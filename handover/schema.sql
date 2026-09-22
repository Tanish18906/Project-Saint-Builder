


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "extensions";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."notify_draft_approved_webhook"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
$$;


ALTER FUNCTION "public"."notify_draft_approved_webhook"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."notify_email_inserted_whatsapp_webhook"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
$$;


ALTER FUNCTION "public"."notify_email_inserted_whatsapp_webhook"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."accounts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "email_address" "text" NOT NULL,
    "display_name" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);

ALTER TABLE ONLY "public"."accounts" REPLICA IDENTITY FULL;


ALTER TABLE "public"."accounts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."audit_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "email_id" "uuid",
    "draft_id" "uuid",
    "user_id" "uuid",
    "action" "text" NOT NULL,
    "details" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);

ALTER TABLE ONLY "public"."audit_log" REPLICA IDENTITY FULL;


ALTER TABLE "public"."audit_log" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."drafts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "email_id" "uuid" NOT NULL,
    "ai_generated_text" "text",
    "edited_text" "text",
    "draft_type" "text" DEFAULT 'ai_generated'::"text" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "approved_by" "uuid",
    "approved_at" timestamp with time zone,
    "sent_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "check_draft_status" CHECK (("status" = ANY (ARRAY['pending'::"text", 'approved'::"text", 'discarded'::"text", 'sent'::"text"]))),
    CONSTRAINT "check_draft_type" CHECK (("draft_type" = ANY (ARRAY['ai_generated'::"text", 'ai_edited'::"text", 'manual'::"text"])))
);

ALTER TABLE ONLY "public"."drafts" REPLICA IDENTITY FULL;


ALTER TABLE "public"."drafts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."emails" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "account_id" "uuid" NOT NULL,
    "message_id" "text" NOT NULL,
    "thread_id" "text",
    "from_address" "text" NOT NULL,
    "from_name" "text",
    "subject" "text",
    "body_text" "text",
    "body_html" "text",
    "received_at" timestamp with time zone NOT NULL,
    "category" "text",
    "routed_role" "text",
    "status" "text" DEFAULT 'new'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "theme" "text",
    "urgency" "text",
    "routed_roles" "text"[],
    CONSTRAINT "check_email_category" CHECK ((("category" IS NULL) OR ("category" = ANY (ARRAY['urgent'::"text", 'priority'::"text", 'read_later'::"text", 'finance_accounts'::"text", 'contracts'::"text", 'nph_job_update'::"text", 'other'::"text"])))),
    CONSTRAINT "check_email_routed_role" CHECK ((("routed_role" IS NULL) OR ("routed_role" = ANY (ARRAY['director'::"text", 'senior_admin'::"text", 'progressor'::"text", 'accountant'::"text"])))),
    CONSTRAINT "check_email_status" CHECK (("status" = ANY (ARRAY['new'::"text", 'classified'::"text", 'drafted'::"text", 'sent'::"text", 'discarded'::"text"]))),
    CONSTRAINT "emails_theme_check" CHECK (("theme" = ANY (ARRAY['accounts'::"text", 'orders'::"text", 'finance'::"text", 'suppliers'::"text", 'promotions'::"text", 'nph_jobs'::"text", 'meetings_appointments'::"text", 'invoices'::"text", 'certificates'::"text"]))),
    CONSTRAINT "emails_urgency_check" CHECK (("urgency" = ANY (ARRAY['urgent'::"text", 'priority'::"text", 'normal'::"text"])))
);

ALTER TABLE ONLY "public"."emails" REPLICA IDENTITY FULL;


ALTER TABLE "public"."emails" OWNER TO "postgres";


COMMENT ON COLUMN "public"."emails"."category" IS 'DEPRECATED as of theme-routing migration. Superseded by emails.theme. Left in place for historical rows only — do not write to this column going forward.';



COMMENT ON COLUMN "public"."emails"."routed_role" IS 'DEPRECATED as of theme-routing migration. Superseded by emails.routed_roles (array). Left in place for historical rows only — do not write to this column going forward.';



CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "email" "text" NOT NULL,
    "role" "text" NOT NULL,
    "whatsapp_number" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "check_user_role" CHECK (("role" = ANY (ARRAY['director'::"text", 'senior_admin'::"text", 'progressor'::"text", 'accountant'::"text"])))
);


ALTER TABLE "public"."users" OWNER TO "postgres";


ALTER TABLE ONLY "public"."accounts"
    ADD CONSTRAINT "accounts_email_address_key" UNIQUE ("email_address");



ALTER TABLE ONLY "public"."accounts"
    ADD CONSTRAINT "accounts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."audit_log"
    ADD CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."drafts"
    ADD CONSTRAINT "drafts_email_id_key" UNIQUE ("email_id");



ALTER TABLE ONLY "public"."drafts"
    ADD CONSTRAINT "drafts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."emails"
    ADD CONSTRAINT "emails_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_emails_account_id" ON "public"."emails" USING "btree" ("account_id");



CREATE INDEX "idx_emails_category" ON "public"."emails" USING "btree" ("category");



CREATE INDEX "idx_emails_routed_roles" ON "public"."emails" USING "gin" ("routed_roles");



CREATE INDEX "idx_emails_status" ON "public"."emails" USING "btree" ("status");



CREATE INDEX "idx_emails_theme" ON "public"."emails" USING "btree" ("theme");



CREATE INDEX "idx_emails_urgency" ON "public"."emails" USING "btree" ("urgency");



CREATE OR REPLACE TRIGGER "tr_draft_approved_webhook" AFTER UPDATE ON "public"."drafts" FOR EACH ROW EXECUTE FUNCTION "public"."notify_draft_approved_webhook"();



CREATE OR REPLACE TRIGGER "tr_email_inserted_whatsapp_webhook" AFTER INSERT ON "public"."emails" FOR EACH ROW EXECUTE FUNCTION "public"."notify_email_inserted_whatsapp_webhook"();



CREATE OR REPLACE TRIGGER "update_drafts_updated_at" BEFORE UPDATE ON "public"."drafts" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."audit_log"
    ADD CONSTRAINT "audit_log_draft_id_fkey" FOREIGN KEY ("draft_id") REFERENCES "public"."drafts"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."audit_log"
    ADD CONSTRAINT "audit_log_email_id_fkey" FOREIGN KEY ("email_id") REFERENCES "public"."emails"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."audit_log"
    ADD CONSTRAINT "audit_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."drafts"
    ADD CONSTRAINT "drafts_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."drafts"
    ADD CONSTRAINT "drafts_email_id_fkey" FOREIGN KEY ("email_id") REFERENCES "public"."emails"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."emails"
    ADD CONSTRAINT "emails_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE CASCADE;



ALTER TABLE "public"."accounts" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "allow all for now - TIGHTEN LATER with real auth" ON "public"."accounts" USING (true) WITH CHECK (true);



CREATE POLICY "allow all for now - TIGHTEN LATER with real auth" ON "public"."audit_log" USING (true) WITH CHECK (true);



CREATE POLICY "allow all for now - TIGHTEN LATER with real auth" ON "public"."drafts" USING (true) WITH CHECK (true);



CREATE POLICY "allow all for now - TIGHTEN LATER with real auth" ON "public"."emails" USING (true) WITH CHECK (true);



CREATE POLICY "allow all for now - TIGHTEN LATER with real auth" ON "public"."users" USING (true) WITH CHECK (true);



ALTER TABLE "public"."audit_log" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."drafts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."emails" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."accounts";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."audit_log";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."drafts";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."emails";






GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";






















































































































































GRANT ALL ON FUNCTION "public"."notify_draft_approved_webhook"() TO "anon";
GRANT ALL ON FUNCTION "public"."notify_draft_approved_webhook"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_draft_approved_webhook"() TO "service_role";



GRANT ALL ON FUNCTION "public"."notify_email_inserted_whatsapp_webhook"() TO "anon";
GRANT ALL ON FUNCTION "public"."notify_email_inserted_whatsapp_webhook"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_email_inserted_whatsapp_webhook"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";


















GRANT ALL ON TABLE "public"."accounts" TO "anon";
GRANT ALL ON TABLE "public"."accounts" TO "authenticated";
GRANT ALL ON TABLE "public"."accounts" TO "service_role";



GRANT ALL ON TABLE "public"."audit_log" TO "anon";
GRANT ALL ON TABLE "public"."audit_log" TO "authenticated";
GRANT ALL ON TABLE "public"."audit_log" TO "service_role";



GRANT ALL ON TABLE "public"."drafts" TO "anon";
GRANT ALL ON TABLE "public"."drafts" TO "authenticated";
GRANT ALL ON TABLE "public"."drafts" TO "service_role";



GRANT ALL ON TABLE "public"."emails" TO "anon";
GRANT ALL ON TABLE "public"."emails" TO "authenticated";
GRANT ALL ON TABLE "public"."emails" TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































