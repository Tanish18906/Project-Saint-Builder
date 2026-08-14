# n8n Workflow Build Prompt — Foreman Ingest, Classify & Draft

**For: coding agent (via n8n MCP)**
**Context:** This is workflow #1 of the "Foreman" email agent for Allsaints Builders. IMAP is not connected yet (client hasn't provided Titan credentials) — this workflow uses fake test data instead of a real inbox, so the classification and drafting logic can be built and tested now. IMAP will be swapped in later without changing anything downstream.

Supabase project: `allsaints-email-agent` (already set up with `accounts`, `users`, `emails`, `drafts`, `audit_log` tables — see existing schema, do not modify it).

Build exactly what's specified below. Do not add IMAP, SMTP, WhatsApp, or approval/send logic — those are separate workflows built later.

---

## Workflow structure

```
Manual Trigger
  → Set node ("Fake Email — Test Case 1")
  → OpenAI node #1: Classify
  → Supabase node: Insert into `emails`
  → Supabase node: Insert into `audit_log` (action: "classified")
  → OpenAI node #2: Draft reply
  → Supabase node: Insert into `drafts`
  → Supabase node: Insert into `audit_log` (action: "drafted")
```

---

## 1. Manual Trigger + Set node (fake email data)

Create **one Set node** connected to the Manual Trigger, pre-filled with this test data:

```json
{
  "from_address": "councilofficer@northampton.gov.uk",
  "from_name": "J. Whitfield",
  "subject": "Update required on NPH job #4521",
  "body_text": "Hi team, could you confirm the completion date for the roofing works at 12 Elm Street? Council needs this for our records by Friday.",
  "message_id": "test-msg-001@fake.local",
  "received_at": "2026-08-12T09:00:00Z",
  "account_email": "team@allsaintsbuilders.com"
}
```

Name this node clearly (e.g. "TEST EMAIL — NPH Job Update") so it's obvious it's swappable test data. Leave a note/comment in the node that this will be replaced by a real IMAP Trigger node later — same downstream fields must be preserved when that swap happens.

---

## 2. OpenAI node #1 — Classify

Use the OpenAI node (chat completion). System prompt:

```
You are an email triage assistant for Allsaints Builders, a construction company.
Classify the email into exactly one category and one routed_role.

Categories:
- urgent: needs response within hours, time-critical
- priority: important but not same-day critical
- read_later: informational, no action needed soon
- finance_accounts: invoices, payments, financial queries
- contracts: contract terms, agreements, legal documents
- nph_job_update: job updates related to NPH/Northampton Council work
- other: doesn't fit above

Routed roles:
- director: confidential, high-value decisions, contracts, quotes
- senior_admin: general info@ admin matters
- progressor: NPH/Northampton Council job communications (team@ inbox)
- accountant: invoicing, payment, accounting-specific queries

Respond ONLY with valid JSON, no other text:
{"category": "...", "routed_role": "..."}
```

User message: pass through `subject` and `body_text` from the Set node.

Parse the JSON response into two usable fields (`category`, `routed_role`) for the next node — use a Set/Code node after the OpenAI node if needed to extract these cleanly from the response text.

Note in a comment: this prompt is a first draft and will be refined later based on real test results — don't over-engineer it now.

---

## 3. Supabase node — Insert into `emails`

Insert a row into the `emails` table using:
- `account_id` — look up the matching row in `accounts` by `email_address` = the Set node's `account_email` field (use a Supabase "Get" or filter step first to find the right `account_id`, then use it in the insert — do not hardcode a UUID)
- `message_id`, `from_address`, `from_name`, `subject`, `body_text`, `received_at` — from the Set node
- `category`, `routed_role` — from the OpenAI classify step
- `status` — set to `'classified'`

Capture the returned `id` (the new email row's UUID) — needed for the next steps.

---

## 4. Supabase node — Insert into `audit_log` (classified)

Insert a row into `audit_log`:
- `email_id` — the UUID from step 3
- `draft_id` — null
- `user_id` — null (system action, not a person)
- `action` — `"classified"`
- `details` — jsonb containing `{"category": "...", "routed_role": "..."}` (the values from the classify step)

---

## 5. OpenAI node #2 — Draft reply

Use the OpenAI node (chat completion). System prompt:

```
You are drafting a reply on behalf of Allsaints Builders, a construction company.
Write a professional, concise reply to the email below.
Keep the tone appropriate to a UK building company communicating with clients, council contacts, or internal team members.
Do not include a subject line — body text only.
Respond with the reply text only, no preamble or explanation.
```

User message: pass through `subject`, `body_text`, `category`, and `routed_role` for context.

Note in a comment: tone customization per role (formal for directors, technical for ops) is a future refinement — this is a generic first-pass prompt.

---

## 6. Supabase node — Insert into `drafts`

Insert a row into `drafts`:
- `email_id` — the UUID from step 3
- `ai_generated_text` — the OpenAI draft output
- `edited_text` — same value as `ai_generated_text` (starts identical, dashboard will update this later as user edits)
- `draft_type` — default `'ai_generated'`
- `status` — default `'pending'`

Capture the returned `id` (the new draft row's UUID) — needed for the next step.

---

## 7. Supabase node — Insert into `audit_log` (drafted)

Insert a row into `audit_log`:
- `email_id` — the UUID from step 3
- `draft_id` — the UUID from step 6
- `user_id` — null (system action)
- `action` — `"drafted"`
- `details` — null or jsonb with a short note if useful

---

## What NOT to build in this workflow

- No IMAP or SMTP nodes
- No WhatsApp nodes
- No approval/send-on-approval logic (separate workflow, built later)
- No changes to the Supabase schema itself
- No error-handling/retry logic yet — keep this version simple, error handling is a later pass once the happy path works

---

## Output expected from the coding agent

- Workflow built in n8n with all nodes above, connected correctly
- A short summary at the end: nodes created, any assumptions made, and confirmation that a manual test run was attempted (or instructions for how the user should run the first manual test)
