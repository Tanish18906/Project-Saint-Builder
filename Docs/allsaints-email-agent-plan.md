# Allsaints Builders — AI Email Agent (Working Notes)

**Fiverr order — $1250 (paid)**  
**Client email provider:** Titan (Hostinger)  
**Status:** Core pipeline complete and verified end-to-end (Supabase schema/triggers, n8n Workflow 1 ingest/classify/draft, n8n Workflow 2 send-on-approval logic, and Next.js Realtime dashboard with post-approval lockdown). Real SMTP/IMAP sending remains blocked on client providing Titan credentials.

---

## 1. Project Objective (from client brief)

Automated AI agent managing two inboxes:
- `info@allsaintsbuilders.com` — Directors, Senior Admin, Accounts
- `team@allsaintsbuilders.com` — Progressor, Ops Manager (NPH / Northampton Council jobs)

Core asks: triage/categorize emails, draft replies, voice control, WhatsApp notifications, role-based access.

---

## 2. Architecture Decision (locked)

```
Titan inbox (IMAP) → n8n (classify, draft, send) → Supabase (shared DB) → Dashboard (approve/edit/discard)
```

- **n8n** = the engine. Handles IMAP/SMTP, calls OpenAI for classification + drafting, sends approved emails.
- **Supabase** = the single source of truth. Both n8n and dashboard read/write here. Chosen over plain MySQL because of built-in Auth + Row Level Security (maps directly to role-based access requirement) + realtime + easy integration with vibe-coding tools.
- **Dashboard** = Next.js (App Router) + Tailwind CSS + Supabase Realtime. Reads/writes Supabase directly. Never touches SMTP directly — only manages draft approval status flags.

**Key principle:** Dashboard never touches SMTP directly. It only updates a `status` field in Supabase. n8n is the only system that executes mail dispatch. Keeps one source of truth and simplifies debugging.

---

## 3. End-to-End Flow (locked & verified)

1. Email lands in Titan inbox (info@ or team@)
2. n8n IMAP trigger detects it instantly
3. n8n → OpenAI: classify (category + which role should handle it + confidence + summary)
4. n8n → OpenAI: generate a suggested reply draft with `[CONFIRM ...]` placeholders for missing facts
5. n8n writes email + category + draft to Supabase, logging the event in `audit_log`
6. If urgent/priority → n8n fires WhatsApp notification immediately (later phase)
7. Assigned staff opens dashboard, reviews triage and draft reply
8. Reviewer actions:
   - **Approve as-is** → tagged `ai_generated`
   - **Edit the draft, then approve** → tagged `ai_edited`
   - **Discard (clears the box), write custom reply, then send** → tagged `manual`
   - **Save Draft** → saves work in progress without altering approval status
9. Approve action sets Supabase `drafts.status = 'approved'`
10. Supabase Database Webhook trigger (`notify_draft_approved_webhook` via `pg_net`) fires instantly
11. Webhook hits n8n Workflow 2 → n8n extracts send fields, fetches parent email & inbox metadata, constructs RFC 2822 `In-Reply-To` and `References` headers for threading, and dispatches the email
12. n8n updates Supabase `drafts.status = 'sent'`, `emails.status = 'sent'`, and records `audit_log` entry
13. Supabase Realtime updates Dashboard in 0ms; Email Detail screen immediately locks down into read-only mode

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

The full core pipeline has been built, connected, and verified end-to-end:

- **n8n Agent Workflow (`Foreman Agent` / `iZxVrliRwHKuzmzX`)**:
  - Workflow 1 (Ingest, Classify & Draft) and Workflow 2 (Send on Approval) are unified and active on n8n Cloud with clear sticky note documentation.
  - OpenAI classification (GPT-4o) and draft generation with `[CONFIRM ...]` placeholder extraction verified across categories.
  - Webhook listener `/webhook/foreman-send-on-approval` verified executing on database approval events in <500ms.
  - RFC 2822 `In-Reply-To` and `References` threading headers verified in payload generation.
- **Dashboard UI**:
  - Live Supabase connection with zero hardcoded/mock data.
  - Inbox View, Email Detail View with draft management, and Audit Log View fully built with Realtime WebSocket subscriptions.
  - Post-approval lockdown active: approved and sent drafts render read-only with clear destination/timestamp banners.
- **Caveat on SMTP Sending**:
  - The send step in Workflow 2 is currently executing as a Code node generating the formatted delivery payload with RFC 2822 threading headers. Zero real SMTP credentials are configured in n8n. Live email delivery is pending client provision of Titan IMAP/SMTP credentials.

---

## 6. On Hold (revisit once client responds with credentials/user list)

- **Titan IMAP/SMTP Credential Swap** — swap live credentials into n8n nodes once received.
- **WhatsApp integration** — notifications for urgent/priority emails (Twilio vs Meta Cloud API).
- **Voice (TTS/STT)** — hear emails aloud / WhatsApp voice notes + Whisper transcription.
- **Granular Roles & Permissions** — production RLS tightening once client confirms staff user list.
- **Production Hosting/Infra** — final custom domain setup and hosting deployment.
