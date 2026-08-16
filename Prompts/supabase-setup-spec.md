# Supabase Setup Spec — "Foreman" Email Agent

> [!NOTE]
> **Implementation Confirmation (Executed 2026-08-12):**  
> This specification was successfully executed against Supabase project `allsaints-email-agent` (`clxqjxtmxswpjjvqunfx`) via migration `20260812070800_setup_foreman_email_agent_schema.sql`.
> - **Tables Created:** `accounts`, `users`, `emails`, `drafts`, `audit_log` with all defined check constraints and foreign keys.
> - **Indexes Created:** `idx_emails_account_id`, `idx_emails_status`, `idx_emails_category`.
> - **Seed Data:** `accounts` table seeded with `info@allsaintsbuilders.com` and `team@allsaintsbuilders.com`.
> - **Row Level Security (RLS):** Enabled on all 5 tables with permissive base policies ("allow all for now - TIGHTEN LATER with real auth").
> - **Triggers:** `update_drafts_updated_at` before update trigger configured.
> - **Differences from Spec:** The send-on-approval webhook was implemented as a PostgreSQL `pg_net` trigger (`tr_draft_approved_webhook` calling `notify_draft_approved_webhook()`) rather than a native Supabase Dashboard webhook (see Section 4 for details).

**For: coding agent (via Supabase MCP)**
**Context:** This is the database backend for an AI email triage/draft/approval system for a builders company. Two inboxes (info@ and team@) are monitored by n8n, which classifies emails and drafts replies. A dashboard lets staff review, edit, approve, or discard drafts. Supabase is the single shared data store between n8n and the dashboard — n8n writes incoming emails/drafts, the dashboard reads/updates them, and a Supabase webhook notifies n8n when something is approved so n8n can send it.

Build exactly what's specified below. Do not add extra tables, columns, or features not listed here. If something is ambiguous, choose the simplest working option and leave a comment in the migration explaining the choice — don't ask, just proceed and note it.

---

## 1. Tables

### `accounts`
Represents the two monitored inboxes.

| column | type | notes |
|---|---|---|
| id | uuid, primary key, default gen_random_uuid() | |
| email_address | text, unique, not null | e.g. info@allsaintsbuilders.com |
| display_name | text | e.g. "Info — Directors & Admin" |
| created_at | timestamptz, default now() | |

Seed this table with two rows:
- `info@allsaintsbuilders.com` / "Info — Directors & Admin"
- `team@allsaintsbuilders.com` / "Team — Progressor & Ops"

(Use placeholder domain `allsaintsbuilders.com` — real domain to be confirmed later, not a blocker.)

---

### `users`
Internal staff who use the dashboard.

| column | type | notes |
|---|---|---|
| id | uuid, primary key, default gen_random_uuid() | should match Supabase Auth user id once auth is wired — for now just a standalone table |
| name | text, not null | |
| email | text, unique, not null | |
| role | text, not null | one of: `director`, `senior_admin`, `progressor`, `accountant` — enforce with a check constraint |
| whatsapp_number | text | nullable, for future WhatsApp phase |
| created_at | timestamptz, default now() | |

No seed data needed — leave empty for now, real users added later.

---

### `emails`
Every incoming email captured by n8n.

| column | type | notes |
|---|---|---|
| id | uuid, primary key, default gen_random_uuid() | |
| account_id | uuid, not null, foreign key → accounts(id) | |
| message_id | text, not null | the email's original Message-ID header — required later for reply threading, must be stored exactly as received |
| thread_id | text | nullable — for grouping replies in the same thread if available |
| from_address | text, not null | |
| from_name | text | nullable |
| subject | text | |
| body_text | text | plain text body |
| body_html | text | nullable, raw html body if available |
| received_at | timestamptz, not null | |
| category | text | nullable until classified — one of: `urgent`, `priority`, `read_later`, `finance_accounts`, `contracts`, `nph_job_update`, `other` — enforce with check constraint, allow null |
| routed_role | text | nullable until classified — one of: `director`, `senior_admin`, `progressor`, `accountant` — check constraint, allow null |
| status | text, not null, default 'new' | one of: `new`, `classified`, `drafted`, `sent`, `discarded` — check constraint |
| created_at | timestamptz, default now() | |

Add an index on `account_id`, and on `status`, and on `category` — dashboard will filter by these constantly.

---

### `drafts`
AI-generated (or manually written) reply drafts, one per email.

| column | type | notes |
|---|---|---|
| id | uuid, primary key, default gen_random_uuid() | |
| email_id | uuid, not null, foreign key → emails(id), unique | one draft per email — enforce uniqueness |
| ai_generated_text | text | the original AI draft, never overwritten once set |
| edited_text | text | nullable — current working text shown in the dashboard textarea; starts equal to ai_generated_text, updated as user edits |
| draft_type | text, not null, default 'ai_generated' | one of: `ai_generated`, `ai_edited`, `manual` — check constraint. See section 3 for logic. |
| status | text, not null, default 'pending' | one of: `pending`, `approved`, `discarded`, `sent` — check constraint |
| approved_by | uuid, nullable, foreign key → users(id) | |
| approved_at | timestamptz, nullable | |
| sent_at | timestamptz, nullable | |
| created_at | timestamptz, default now() | |
| updated_at | timestamptz, default now() | should auto-update on row change — add a trigger for this |

---

### `audit_log`
Tracks every meaningful action for accountability (Directors will want to review this).

| column | type | notes |
|---|---|---|
| id | uuid, primary key, default gen_random_uuid() | |
| email_id | uuid, foreign key → emails(id) | |
| draft_id | uuid, nullable, foreign key → drafts(id) | |
| user_id | uuid, nullable, foreign key → users(id) | null if action was done by the system/n8n, not a person |
| action | text, not null | free text, e.g. `classified`, `drafted`, `edited`, `approved`, `discarded`, `sent`, `manual_reply_written` |
| details | jsonb | nullable, optional extra context (e.g. old/new values) |
| created_at | timestamptz, default now() | |

---

## 2. Row Level Security (RLS)

Enable RLS on all tables. For now, since Supabase Auth isn't wired into the dashboard yet, use **permissive policies that allow all reads/writes** — but write them so they're easy to tighten later once real auth + roles exist. Add a comment above each policy noting it needs to be restricted once auth is live.

```sql
-- Example pattern to follow for every table:
alter table emails enable row level security;

create policy "allow all for now - TIGHTEN LATER with real auth"
on emails for all
using (true)
with check (true);
```

Apply this same "allow all, TIGHTEN LATER" pattern to `accounts`, `users`, `emails`, `drafts`, `audit_log`.

Do not attempt to build real role-based RLS policies yet (e.g. "progressor only sees team@ rows") — that's explicitly on hold until the client confirms the real user list and roles. Just get the permissive version working so n8n and the dashboard can both read/write without errors.

---

## 3. Draft type logic (for reference — dashboard will implement this, not Supabase, but document it here for clarity)

- If a draft is approved with `edited_text` unchanged from `ai_generated_text` → `draft_type = 'ai_generated'`
- If `edited_text` differs from `ai_generated_text` at approval time → `draft_type = 'ai_edited'`
- If the user cleared the draft (discarded) and wrote fresh text before sending → `draft_type = 'manual'`

This is dashboard-side logic setting the `draft_type` column on update — no database trigger needed for this, just document the expected values.

---

## 4. Database Webhook (approval → n8n)

> [!IMPORTANT]
> **Actual Implementation Note (pg_net Trigger):**  
> Rather than configuring a UI-managed Supabase Database Webhook, this was implemented as a PostgreSQL PL/pgSQL function (`notify_draft_approved_webhook()`) and trigger (`tr_draft_approved_webhook`) using the `pg_net` extension (`net.http_post`).  
> **Why:** Encapsulating the webhook directly in the SQL migration (`20260812070800_setup_foreman_email_agent_schema.sql`) ensures that the webhook logic is version-controlled, automated, and portable across database environments without depending on manual Supabase dashboard UI configuration.  
> Currently configured to POST to `https://example.com/TODO_N8N_WEBHOOK_URL_PLACEHOLDER` when `status` transitions to `'approved'`.

Original specification requirements:

- **Table:** `drafts`
- **Events:** `UPDATE`
- **Condition:** fire when `status` changes to `approved` (if the webhook UI supports conditional filtering, filter on `status = 'approved'`; if not, fire on all updates to this table and let n8n's workflow check the status itself)
- **Type:** HTTP Request
- **URL:** `TODO_N8N_WEBHOOK_URL_PLACEHOLDER` — leave this as a literal placeholder string, not a working request, since the real n8n webhook URL doesn't exist yet. Add a comment: "Replace with real n8n webhook URL once the send-on-approval n8n workflow is built."
- **Method:** POST
- **Payload:** send the full row (default Supabase webhook payload format, which includes old and new row data) — n8n will extract what it needs (`email_id`, `edited_text`, recipient info via a join, etc.)

If the Supabase MCP/tooling can't create a webhook with a placeholder URL (some validate the URL is reachable), instead: create the webhook pointing at `https://example.com/placeholder` and add a clear comment/README note that this must be updated once n8n is ready. Do not skip creating the webhook structure — just note the URL needs replacing.

---

## 5. Triggers

- Add an `updated_at` auto-update trigger on `drafts` (and any other table with `updated_at`, if you add one elsewhere).
- No other triggers needed for now — do not build auto-audit-log-insertion triggers yet; audit log writes will be handled explicitly by n8n and the dashboard for now, not by database triggers. Keep it simple.

---

## 6. What NOT to build right now

- No real authentication wiring (Supabase Auth) — table structure supports it later, but don't set it up now
- No real RLS role restrictions — permissive policies only, as specified above
- No WhatsApp-related tables/columns
- No voice-related tables/columns
- No storage buckets
- No edge functions

If in doubt, build less, not more. This is v1 of the schema — it will be revisited as the dashboard and n8n workflows are built out.

---

## 7. Output expected from the coding agent

- All tables created as specified, with constraints
- RLS enabled with permissive "allow all, tighten later" policies
- `accounts` table seeded with the two rows listed above
- Database webhook created (or documented as needing manual creation) with placeholder URL
- A short summary at the end listing: tables created, seed data inserted, webhook status (created with placeholder / needs manual setup), and any assumptions made
