# Allsaints Builders — AI Email Agent (Working Notes)

**Fiverr order — $1250 (paid)**  
**Client email provider:** Titan (Hostinger)  
**Status:** Core pipeline, WhatsApp notifications (Workflow 3), and Voice review route complete and verified end-to-end (Supabase schema/triggers, n8n Workflow 1 ingest/classify/draft, n8n Workflow 2 send-on-approval logic, n8n Workflow 3 WhatsApp notifications with HMAC-SHA256 tokens, Next.js Realtime dashboard with post-approval lockdown, and mobile voice route with OpenAI TTS/Whisper). Real SMTP/IMAP sending remains blocked on client providing Titan credentials, and real WhatsApp delivery is blocked on upgrading Twilio off its trial plan (Content Template approval required for business-initiated messages).

---

## 1. Project Objective (from client brief)

Automated AI agent managing two inboxes:
- `info@allsaintsbuilders.com` — Directors, Senior Admin, Accounts
- `team@allsaintsbuilders.com` — Progressor, Ops Manager (NPH / Northampton Council jobs)

Core asks: triage/categorize emails, draft replies, voice control, WhatsApp notifications, role-based access.

---

## 2. Architecture Decision (locked)

```
Titan inbox (IMAP) → n8n (classify, draft, send) → Supabase (shared DB) → Dashboard (approve/edit/discard) + Mobile Voice Route
```

- **n8n** = the engine. Handles IMAP/SMTP, calls OpenAI for classification + drafting, triggers WhatsApp alerts on urgent/priority emails, generates signed voice tokens, and sends approved emails.
- **Supabase** = the single source of truth. Both n8n and dashboard read/write here. Chosen over plain MySQL because of built-in Auth + Row Level Security (maps directly to role-based access requirement) + realtime + easy integration with vibe-coding tools.
- **Dashboard & Voice Portal** = Next.js (App Router) + Tailwind CSS + Supabase Realtime. Reads/writes Supabase directly. Never touches SMTP directly — only manages draft approval status flags.
- **WhatsApp Integration** = n8n Workflow 3 listening to Supabase `AFTER INSERT` webhook on `emails`, filtering `urgent`/`priority`, looking up staff `whatsapp_number` by `routed_role`, generating signed tokens, and dispatching via Twilio.

**Key principle:** Dashboard and Voice routes never touch SMTP directly. They only update a `status` field in Supabase. n8n is the only system that executes mail dispatch. Keeps one source of truth and simplifies debugging.

---

## 3. End-to-End Flow (locked & verified)

1. Email lands in Titan inbox (info@ or team@)
2. n8n IMAP trigger detects it instantly
3. n8n → OpenAI: classify (category + which role should handle it + confidence + summary)
4. n8n → OpenAI: generate a suggested reply draft with `[CONFIRM ...]` placeholders for missing facts
5. n8n writes email + category + draft to Supabase, logging the event in `audit_log`
6. If `urgent` or `priority` → Supabase `AFTER INSERT` webhook fires n8n Workflow 3, looks up staff phone by `routed_role`, signs HMAC-SHA256 voice token, and sends WhatsApp notification via Twilio with review link (`http://localhost:3000/voice/{{email_id}}?token={{voice_token}}` — temporarily hardcoded for local dev; will be updated to the real production domain once deployed)
7. Assigned staff reviews triage and draft reply on Dashboard or mobile Voice route (`/voice/[email_id]`)
8. Reviewer actions:
   - **Approve as-is** → tagged `ai_generated`
   - **Edit the draft, then approve** → tagged `ai_edited`
   - **Discard (clears the box), write custom reply, then send** → tagged `manual`
   - **Save Draft** → saves work in progress without altering approval status
   - **Voice commands** → "Read the draft", "Make it more formal/shorter/technical", "Approve and send"
9. Approve action sets Supabase `drafts.status = 'approved'`
10. Supabase Database Webhook trigger (`notify_draft_approved_webhook` via `pg_net`) fires instantly
11. Webhook hits n8n Workflow 2 → n8n extracts send fields, fetches parent email & inbox metadata, constructs RFC 2822 `In-Reply-To` and `References` headers for threading, and dispatches the email
12. n8n updates Supabase `drafts.status = 'sent'`, `emails.status = 'sent'`, and records `audit_log` entry
13. Supabase Realtime updates Dashboard in 0ms; Email Detail screen and Voice page immediately lock down into read-only mode

---

## 4. Database (Supabase) — Schema Built & Deployed

Deployed on Supabase project `allsaints-email-agent` (`clxqjxtmxswpjjvqunfx`, `eu-west-2`):

- `accounts` — `id`, `email_address` (info@ / team@ seeded), `display_name`, `created_at`
- `users` — `id`, `name`, `email`, `role` (`director`, `senior_admin`, `progressor`, `accountant`), `whatsapp_number`, `created_at`
- `emails` — `id`, `account_id` (FK), `message_id` (stored for threading), `thread_id`, `from_address`, `from_name`, `subject`, `body_text`, `body_html`, `received_at`, `category`, `routed_role`, `status` (`new`, `classified`, `drafted`, `sent`, `discarded`), `created_at`.
- `drafts` — `id`, `email_id` (FK, unique), `ai_generated_text`, `edited_text`, `draft_type` (`ai_generated`, `ai_edited`, `manual`), `status` (`pending`, `approved`, `discarded`, `sent`), `approved_by` (FK), `approved_at`, `sent_at`, `created_at`, `updated_at` (managed via trigger).
- `audit_log` — `id`, `email_id` (FK), `draft_id` (FK), `user_id` (FK), `action`, `details` (jsonb), `created_at`.

Row Level Security and Realtime publication (`supabase_realtime`) are active across all 4 tables with `REPLICA IDENTITY FULL`.

---

## 5. Current State & Verification

The full core pipeline, WhatsApp integration, and Voice portal have been built, connected, and verified end-to-end:

- **n8n Workflows**:
  - **Workflow 1 (Ingest, Classify & Draft)**: OpenAI classification (GPT-4o) and draft generation with `[CONFIRM ...]` placeholder extraction verified across categories.
  - **Workflow 2 (Send on Approval)**: Webhook listener `/webhook/foreman-send-on-approval` verified executing on database approval events in <500ms with RFC 2822 headers.
  - **Workflow 3 (WhatsApp Notifications)**: Dedicated active canvas (`udp2JRhk97k0PeNo`), database webhook trigger on `emails` insert, role recipient lookup with fallback handling, signed HMAC-SHA256 voice token generation, native Twilio WhatsApp node dispatch, and audit logging. Pipeline verified live end-to-end through message composition; actual Twilio delivery currently fails (`trial accounts have limited parameter access`) until the Twilio account is upgraded off its trial plan.
- **Dashboard UI & Voice Review Route**:
  - Live Supabase connection with zero hardcoded/mock data.
  - Inbox View, Email Detail View with draft management, and Audit Log View fully built with Realtime WebSocket subscriptions.
  - Standalone mobile-first Voice Portal (`/voice/[email_id]`) with OpenAI TTS, Whisper STT, AI rewrites, and push-to-talk commands.
  - Post-approval lockdown active across both Dashboard and Voice routes.
- **Caveat on SMTP Sending**:
  - The send step in Workflow 2 is currently executing as a Code node generating the formatted delivery payload with RFC 2822 threading headers. Zero real SMTP credentials are configured in n8n. Live email delivery is pending client provision of Titan IMAP/SMTP credentials.

---

## 6. On Hold (revisit once client responds with credentials/user list)

- **Titan IMAP/SMTP Credential Swap** — swap live credentials into n8n nodes once received.
- **Twilio Production Account** — upgrade off trial plan + get WhatsApp Content Template approved for business-initiated messages.
- **Granular Roles & Permissions** — production RLS tightening once client confirms staff user list.
- **Production Hosting/Infra** — final custom domain setup and hosting deployment; Vercel/Supabase/n8n account migration to client ownership.
