> **Design authority notice (2026-09-27):** Visual and layout guidance in this document (colors, tokens, typography, badge styling, layout, component appearance) is **superseded** by [`DESIGN_SYSTEM.md`](../../DESIGN_SYSTEM.md). Functional requirements, data rules, safety rules and business logic described here remain valid.

# Foreman Dashboard — Build Spec (Frontend)

**For: coding agent**
**Context:** This is the dashboard for "Foreman," an AI email triage system for Allsaints Builders (a UK construction company). The backend (Supabase database + n8n workflows for email classification/drafting) is already built. Your job is ONLY the dashboard — it reads and writes to an existing Supabase database. Do not modify the database schema. Do not build any email-sending logic — that is handled entirely by n8n, outside this dashboard.

Build exactly what's specified below. If something is ambiguous, choose the simplest working option and leave a comment explaining the choice — don't block on it, just proceed and note it.

---

## 1. Stack

- **Framework:** Next.js (App Router)
- **Database client:** `@supabase/supabase-js`
- **Styling:** Tailwind CSS
- **Deployment target:** not decided yet — build so it can run locally first (`npm run dev`), deployment is a later step

---

## 2. Supabase connection

You will be given (separately, not in this doc — ask before starting):
- Supabase project URL
- Supabase **anon/public key** (NOT the service_role key — the dashboard must only ever use the restricted anon key, since it runs in the browser)

Store these as environment variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`), never hardcoded.

**Important:** Row Level Security is currently set to "allow all" on every table (temporary, will be tightened later once real auth/roles are built). This means the anon key can currently read/write everything. Do not treat this as permission to skip basic access control in the app itself — see Section 3 (simple password gate) below.

---

## 3. Access control — Supabase Auth (real, per-person login)

This dashboard is for internal company staff. Build real authentication using **Supabase Auth** (email + password), not a shared password gate.

- Use `@supabase/supabase-js` Auth methods (`signInWithPassword`, `signOut`, session handling via `onAuthStateChange` or Next.js middleware)
- Login screen: email + password fields, error message on failure, redirect to Inbox on success
- Protect all dashboard routes — unauthenticated users must be redirected to login (use Next.js middleware to check session on every request)
- **The `users` table is currently empty — real staff accounts (Directors, Senior Admin, Progressor, Accountant) have not been created yet.** The client hasn't confirmed the real user list. Build the login/auth flow fully functional, but note that no real accounts exist to log in with yet.
- For your own testing during development, create one test user manually in the Supabase Auth dashboard (Authentication → Users → Add user) and use that to verify the login flow works end-to-end. Do not seed fake users via code/migration — auth users are created through Supabase directly, not the `users` table.
- Do not build role-based route/data restrictions yet (e.g. "progressor only sees team@") — that depends on the `users.role` field being populated with real data, which comes later. For now, once logged in, any authenticated user sees the full dashboard (all accounts, all categories). Leave a comment: "TODO — add role-based filtering once real users/roles are confirmed by client. See project plan."
- Note: Row Level Security in Supabase is currently set to "allow all" on every table (temporary — will be tightened to real per-role policies later once the user list is confirmed). This means auth controls *who can open the dashboard*, but the database itself doesn't yet restrict *what a logged-in user can see*. That's expected for now — flagged here so it's not mistaken for a bug.

---

## 4. Database schema (existing — read only, do not modify)

You are connecting to these existing tables. Do not add, remove, or alter columns.

### `accounts`
| column | type | notes |
|---|---|---|
| id | uuid | |
| email_address | text | e.g. info@allsaintsbuilders.com |
| display_name | text | e.g. "Info — Directors & Admin" |
| created_at | timestamptz | |

### `users`
| column | type | notes |
|---|---|---|
| id | uuid | |
| name | text | |
| email | text | |
| role | text | director / senior_admin / progressor / accountant |
| whatsapp_number | text | nullable, not used yet |
| created_at | timestamptz | |

Note: this table is currently empty (no real users seeded yet). Do not build UI that depends on this table having data yet — role filtering by user is a future phase.

### `emails`
| column | type | notes |
|---|---|---|
| id | uuid | |
| account_id | uuid | FK → accounts |
| message_id | text | |
| thread_id | text | nullable |
| from_address | text | |
| from_name | text | nullable |
| subject | text | |
| body_text | text | |
| body_html | text | nullable |
| received_at | timestamptz | |
| category | text | nullable — urgent / priority / read_later / finance_accounts / contracts / nph_job_update / other |
| routed_role | text | nullable — director / senior_admin / progressor / accountant |
| status | text | new / classified / drafted / sent / discarded |
| created_at | timestamptz | |

### `drafts`
| column | type | notes |
|---|---|---|
| id | uuid | |
| email_id | uuid | FK → emails, one draft per email |
| ai_generated_text | text | original AI draft — never overwritten, for reference/audit only |
| edited_text | text | the live text shown in the dashboard textarea — this is what gets edited and sent |
| draft_type | text | ai_generated / ai_edited / manual — see Section 6 for logic |
| status | text | pending / approved / discarded / sent |
| approved_by | uuid | nullable, FK → users |
| approved_at | timestamptz | nullable |
| sent_at | timestamptz | nullable |
| created_at | timestamptz | |
| updated_at | timestamptz | auto-updated by a database trigger, don't set manually |

### `audit_log`
| column | type | notes |
|---|---|---|
| id | uuid | |
| email_id | uuid | FK → emails |
| draft_id | uuid | nullable, FK → drafts |
| user_id | uuid | nullable — null means system/n8n action |
| action | text | e.g. classified, drafted, edited, approved, discarded, sent |
| details | jsonb | nullable — may contain category/routed_role/confidence/summary from classification, or other context |
| created_at | timestamptz | |

---

## 5. Screens to build

### Screen 1 — Login (Supabase Auth)
Email + password fields, submit button, error message on invalid credentials. Redirects to Inbox on success. No sign-up screen needed — accounts are created manually via Supabase dashboard for now, not self-service.

### Screen 2 — Inbox list (main screen)
- Lists rows from `emails`, ordered by `received_at` descending (newest first)
- Show for each row: subject, from_name/from_address, category (as a colored badge/tag), status, received_at (relative time, e.g. "2 hours ago")
- Filters at the top: by `account_id` (info@ vs team@ — pull display names from `accounts` table) and by `category`
- Clicking a row opens Screen 3 (email detail)
- Visually distinguish `urgent` category rows (e.g. red accent) so they stand out at a glance

### Screen 3 — Email detail + draft panel
Two-column layout (or stacked on mobile):
- **Left/top:** original email — from, subject, received_at, full body_text (render body_html if present, otherwise body_text)
- **Right/bottom:** draft panel:
  - A single editable `<textarea>` pre-filled with `drafts.edited_text` (falling back to `ai_generated_text` if `edited_text` is null)
  - Three buttons: **Approve & Send**, **Discard**, **Save Draft** (save without sending — just updates `edited_text` in Supabase without changing status)
  - Show `drafts.status` as a badge (pending / approved / discarded / sent)
  - If category/routed_role/confidence/summary exist (from the linked `audit_log` entry with action='classified'), show them as small metadata near the top — useful context for the reviewer

### Screen 4 — Audit log view
- Simple table listing `audit_log` rows, newest first
- Columns: created_at, action, email subject (join via email_id → emails.subject), details (rendered readably, not raw JSON if avoidable)
- Filter by action type
- No editing here — this is a read-only history view

---

## 6. Critical business logic — Approve / Discard / Edit behavior

This is the most important part of the spec — get this exactly right.

**The dashboard never sends email directly.** It only ever updates rows in Supabase. A database-level trigger (already built, not your concern) watches for `drafts.status` changing to `'approved'` and automatically notifies the backend to actually send the email via n8n. You do not need to call any external API to "send" — you only update the Supabase row.

### Approve & Send button behavior:
1. Determine `draft_type` based on whether the textarea content was edited from the original AI draft:
   - If `edited_text` (current textarea value) === `ai_generated_text` (unchanged) → `draft_type = 'ai_generated'`
   - If `edited_text` differs from `ai_generated_text` → `draft_type = 'ai_edited'`
   - If the draft was discarded first (see below) and the user wrote fresh text → `draft_type = 'manual'`
2. Update the `drafts` row: set `edited_text` to current textarea value, `draft_type` as determined above, `status = 'approved'`, `approved_at = now()`
3. Insert a row into `audit_log`: `action = 'approved'`, referencing the `email_id` and `draft_id`
4. That's it — do not call n8n directly, do not attempt to send email yourself. The database trigger handles notifying the backend.

### Discard button behavior:
1. Clear the textarea (empty string) — do NOT delete the `ai_generated_text` from the database, that stays as historical reference
2. Set a local flag (e.g. `wasDiscarded = true` in component state) so if the user then writes something new and clicks Approve & Send, it's correctly tagged `manual` per the logic above
3. Optionally: update `drafts.status = 'discarded'` at this point, or wait until they actually send something — simplest option: only update status when they actually click Approve & Send afterward (clicking Discard alone doesn't need its own Supabase write unless the user then closes without sending — use your judgment here, note your choice in a comment)

### Save Draft button behavior:
- Updates `drafts.edited_text` in Supabase with current textarea content, does NOT change `status`
- Useful for staff who want to save progress on an edit without sending yet
- Insert `audit_log` row with `action = 'edited'`

---

## 7. What NOT to build

- No email sending logic (SMTP, API calls to send) — n8n handles this entirely, outside this dashboard
- No IMAP connection — not relevant to the dashboard
- No self-service sign-up — auth accounts are created manually in Supabase for now
- No role-based filtering by logged-in user yet (the `users` table is empty, this comes later)
- No real RLS role restrictions at the database level yet — permissive policies only, tightened later
- No WhatsApp integration
- No voice features
- No changes to the Supabase schema — if something seems missing, flag it rather than adding a column yourself

---

## 8. Notes

- Backend (Supabase schema, n8n workflows) is already built separately — do not modify anything outside the dashboard's own code/folder
- If something is needed from the backend that doesn't exist yet (e.g. a new field), do not add it directly — flag it instead

---

## 9. Output expected

- Working Next.js app, runs locally with `npm run dev`
- All 4 screens built and functional against the real Supabase data
- Environment variables documented in a `.env.example` file (with placeholder values, not real keys)
- A short summary at the end: what was built, any assumptions made, anything flagged as needing backend input
