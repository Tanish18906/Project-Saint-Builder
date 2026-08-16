# Allsaints Builders — AI Email Agent (Working Notes)

**Fiverr order — $1250 (paid)**
**Client email provider:** Titan (Hostinger)
**Status:** Database schema & migrations deployed to Supabase; n8n Workflow 1 (Ingest, Classify & Draft) built and verified with simulated data; dashboard UI/build specs finalized. Client slow to respond on Titan credentials/user list — building against test data first, will swap real credentials when provided.

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
- **Dashboard** = vibe-coded (Next.js/React style), reads/writes Supabase directly. Never sends email itself — only flips status flags.

**Key principle:** Dashboard never touches SMTP directly. It only updates a `status` field in Supabase. n8n is the only thing that ever actually sends mail. Keeps one source of truth, easier to debug.

---

## 3. End-to-End Flow (locked)

1. Email lands in Titan inbox (info@ or team@)
2. n8n IMAP trigger detects it instantly
3. n8n → OpenAI: classify (category + which role should handle it + confidence + summary)
4. n8n → OpenAI: generate a suggested reply draft
5. n8n writes email + category + draft to Supabase
6. If urgent/priority → n8n fires WhatsApp notification immediately (later phase)
7. Assigned person opens dashboard, sees the draft
8. They can:
   - **Approve as-is** → tagged `ai_generated`
   - **Edit the draft, then approve** → tagged `ai_edited`
   - **Discard (clears the box), write their own reply, then send** → tagged `manual`
9. Approve action = update Supabase `status = approved` (nothing sent yet)
10. Supabase Database Webhook fires the instant status flips to `approved`
11. Webhook hits n8n → n8n sends via SMTP, threaded properly using `In-Reply-To` / `References` headers (so it nests under original email, not a new thread)
12. n8n updates Supabase `status = sent` → dashboard reflects it

**Discard logic detail:** Discard just clears the textarea in the same panel — not a separate compose screen. User types fresh reply in the same box, same Send button. Simpler to build, matches what client likely expects.

**Draft tagging logic (for audit log):**
- No edits, sent as-is → `ai_generated`
- Any edit to AI text before sending → `ai_edited`
- Discarded + written from scratch → `manual`
- Tracked via simple flags (`wasDiscarded`, `wasEdited`), not text diffing.

---

## 4. Database (Supabase) — Schema Built & Deployed

The schema has been implemented and deployed via migration (`20260812070800_setup_foreman_email_agent_schema.sql`) on Supabase project `allsaints-email-agent` (`clxqjxtmxswpjjvqunfx`):

- `accounts` — `id`, `email_address` (info@ / team@ seeded), `display_name`, `created_at`
- `users` — `id`, `name`, `email`, `role` (`director`, `senior_admin`, `progressor`, `accountant`), `whatsapp_number`, `created_at`
- `emails` — `id`, `account_id` (FK), `message_id` (stored for threading), `thread_id`, `from_address`, `from_name`, `subject`, `body_text`, `body_html`, `received_at`, `category`, `routed_role`, `status` (`new`, `classified`, `drafted`, `sent`, `discarded`), `created_at`. Indexed on `account_id`, `status`, `category`.
- `drafts` — `id`, `email_id` (FK, unique), `ai_generated_text`, `edited_text`, `draft_type` (`ai_generated`, `ai_edited`, `manual`), `status` (`pending`, `approved`, `discarded`, `sent`), `approved_by` (FK), `approved_at`, `sent_at`, `created_at`, `updated_at` (auto-managed via trigger).
- `audit_log` — `id`, `email_id` (FK), `draft_id` (FK), `user_id` (FK), `action`, `details` (jsonb), `created_at`.

Row Level Security is enabled on all tables with initial permissive policies ("allow all, tighten later with real auth").

---

## 5. Email Layer Details

- IMAP/SMTP fully handled via n8n nodes — no custom backend needed.
- Draft generation via OpenAI node in n8n (`gpt-4o`).
- Send-on-approval mechanism: PostgreSQL trigger (`tr_draft_approved_webhook`) on `drafts` executes `notify_draft_approved_webhook()` using `pg_net` (`net.http_post`) when `status = 'approved'` to trigger n8n send workflow.

---

## 6. Current State & Testing Strategy

Everything downstream of "email comes in via IMAP" is credential-agnostic — built and tested against test data.

- **Current State:**
  - Supabase database schema, RLS, seed accounts, and `pg_net` approval webhook trigger are fully deployed and verified.
  - n8n Workflow 1 ("Foreman: Ingest, Classify & Draft") is built and tested with simulated test payloads.
  - A dedicated JavaScript parsing node (`Parse Classification`) was built into n8n to handle OpenAI response format variations, strip markdown code fences, and enforce safe database fallbacks (`other` category, `senior_admin` role).
  - Test Set node pre-populated with NPH council job update test email (`test-msg-001@fake.local`).
  - Frontend specs prepared in `Prompts/Dashboard-UI/` (`foreman-dashboard-build-spec.md`, `Dashboard-UI_Design-spec.md`, `foreman-dashboard-implementation-plan.md`).
- **Testing Approach:**
  - Skip IMAP for early testing — feed dummy email JSON via manual trigger into classify/draft steps.
  - Verified NPH test case end-to-end; additional test cases (urgent, finance, contracts, read_later, priority) to be run across the pipeline.
- **Swap-in day:** Create new n8n credential with real Titan host/user/pass, point IMAP Trigger + SMTP Send nodes at it.

---

## 7. On the Horizon & Next Steps

1. **Dashboard Build (Phase 1-7)**: Scaffold Next.js frontend, connect `@supabase/supabase-js`, implement auth, build Inbox view, Email Detail & Draft review panel, and Audit log view.
2. **n8n Workflow 2 (Send on Approval)**: Webhook trigger node receiving approval payload, SMTP Send node with threading headers (`In-Reply-To`, `References`), and database status update back to `sent`.
3. **Comprehensive Category Testing**: Test simulated emails for urgent, finance, contracts, read_later, and priority to ensure prompts and placeholders behave as expected.

---

## 8. On Hold (revisit once core pipeline is working well)

- **WhatsApp integration** — notifications for urgent/priority emails. Decision pending: Twilio WhatsApp API vs Meta Cloud API.
- **Voice (TTS/STT)** — hear emails aloud, voice commands to edit/send. Likely simplified later to WhatsApp voice notes + Whisper transcription instead of live STT listening.
- **Roles & Permissions (detailed)** — Granular Supabase Auth and per-role RLS policies. Client not responding — waiting on their input for real user accounts.
- **Hosting/Infra** — where n8n and dashboard actually get deployed (VPS, domain, etc.).
- **Tone customization** — AI writing style per role (formal for Directors, technical for Ops Manager) — prompt-template based.

---

## 9. Scope Reality Check

Full brief (voice control + WhatsApp + multi-account triage + tone-mimicking AI + role-based dashboard) is normally a $5-15k build. At $1250, MVP is being scoped tightly:
- Core pipeline (triage + draft + dashboard approve/send) is the priority — this is the real value.
- WhatsApp/Voice are "nice to have" layers added after core works.
- Tone customization = prompt templates, not fine-tuned models.
- Consider getting written client sign-off on locked MVP scope once they're responsive again, since the brief as written implies a much bigger product.
