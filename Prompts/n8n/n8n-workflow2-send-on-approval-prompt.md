# n8n Workflow Build Prompt — Foreman Send on Approval

**For: coding agent (via n8n MCP)**
**Context:** This is workflow #2 of the "Foreman" email agent for Allsaints Builders. It is a **separate workflow** from Workflow 1 (Ingest, Classify & Draft) — do not add these nodes into Workflow 1, and do not modify Workflow 1 in any way while building this.

Workflow 1 ends once a draft is written to Supabase. This workflow picks up from there: it is triggered when a draft is approved in the dashboard, and its only job is to send the email and update Supabase to reflect that it was sent.

Supabase project: `allsaints-email-agent` (already set up with `accounts`, `users`, `emails`, `drafts`, `audit_log` tables — see existing schema, do not modify it). A database webhook already exists on the `drafts` table (fires on UPDATE) but currently points at a placeholder URL — it will be updated to point at this workflow's webhook URL once this workflow exists. You do not need to touch that Supabase webhook config; that's a manual step done afterward, outside this workflow.

Build exactly what's specified below. Do not add IMAP, WhatsApp, or classification/drafting logic — those belong to Workflow 1 and are out of scope here.

---

## Workflow structure

```
Webhook Trigger (receives Supabase payload)
  → IF node: sanity check (status really = 'approved', body not empty)
  → Set/Edit Fields node: extract fields needed for sending
  → Supabase node: look up email details (to address, subject, message_id) via email_id
  → Email Send (SMTP) node — with In-Reply-To / References headers for threading
  → Supabase node: update `drafts` (status = 'sent', sent_at = now())
  → Supabase node: update `emails` (status = 'sent')
  → Supabase node: insert into `audit_log` (action: "sent")
```

---

## 1. Webhook Trigger node

- Create a Webhook node (POST) — this is the entry point for this workflow
- Note in a comment: the URL n8n generates for this node needs to be copied into the Supabase `drafts` table webhook config afterward, replacing the current placeholder. That is a manual step for the user, not something this workflow does itself.
- The payload will arrive in Supabase's default DB webhook format, which includes `type`, `table`, `record` (the new row), and `old_record` (the previous row values). The relevant data is in `record`.

---

## 2. IF node — sanity check

Check two conditions before doing anything else:
- `record.status` (from the webhook payload) equals `"approved"` — since Supabase's webhook may fire on any UPDATE to the `drafts` table, not just approvals, this workflow must verify it itself rather than assume
- `record.edited_text` is not null and not an empty string

If either check fails, stop here (no error needed — this is an expected filter, not a failure case). Only continue to the next node if both checks pass.

---

## 3. Set/Edit Fields node — extract fields

From the webhook payload's `record` object, extract and pass forward:
- `draft_id` = `record.id`
- `email_id` = `record.email_id`
- `body_to_send` = `record.edited_text`

Note in a comment: `edited_text` is the field actually sent — never `ai_generated_text`, since that's the original unedited draft kept only for reference/audit.

---

## 4. Supabase node — look up email details

Using `email_id` from step 3, fetch the corresponding row from `emails` to get:
- `from_address` (this becomes the "to" address for the reply)
- `subject`
- `message_id` (the original email's Message-ID header — needed for threading in step 5)
- `account_id` (needed to look up which inbox/account to send *from*)

Then look up the matching row in `accounts` by `account_id` to get `email_address` (the sending address — info@ or team@, matching whichever inbox the original email came into).

---

## 5. Email Send (SMTP) node

- **From:** the account's `email_address` looked up in step 4 (info@ or team@ — whichever this email thread belongs to, not hardcoded)
- **To:** `from_address` from step 4 (replying to whoever sent the original email)
- **Subject:** `Re: ` + the original `subject` from step 4 (only prepend `Re: ` if the subject doesn't already start with it)
- **Body:** `body_to_send` from step 3
- **Headers — critical for threading:** set `In-Reply-To` and `References` headers to the original email's `message_id` value from step 4. Without this, the reply will show up as a brand new thread in the recipient's inbox instead of nesting under the original email. This is a hard requirement, not optional polish.
- **Credentials:** since real Titan SMTP credentials aren't available yet, use a placeholder/test SMTP credential (e.g. a throwaway Gmail/Outlook SMTP, same pattern already used for IMAP testing in Workflow 1). Leave a clear comment: "Swap to real Titan SMTP credentials once client provides them — no other change needed here."

---

## 6. Supabase node — update `drafts`

Update the row where `id = draft_id` (from step 3):
- `status` = `'sent'`
- `sent_at` = current timestamp

---

## 7. Supabase node — update `emails`

Update the row where `id = email_id` (from step 3):
- `status` = `'sent'`

---

## 8. Supabase node — insert into `audit_log`

Insert a row:
- `email_id` = `email_id` from step 3
- `draft_id` = `draft_id` from step 3
- `user_id` = null (system action — the actual approval was already logged with a user_id by the dashboard when the status flipped to `approved`; this log entry just records that the send itself completed)
- `action` = `"sent"`
- `details` = null, or jsonb with a short note if useful (e.g. `{"to": "..."}`)

---

## What NOT to build in this workflow

- No IMAP nodes — this workflow never reads incoming mail
- No classification or drafting logic — that's Workflow 1
- No WhatsApp notification node — that integration is on hold for a future phase; do not build it here, even as a stub, unless explicitly asked later
- No changes to the Supabase schema itself
- No changes to Workflow 1
- No retry/error-handling logic beyond the basic sanity-check IF node — keep this version simple, matching the same "happy path first" approach used for Workflow 1

---

## Output expected from the coding agent

- Workflow built in n8n with all nodes above, connected correctly, clearly named (e.g. "Foreman — Workflow 2: Send on Approval") so it's not confused with Workflow 1
- The generated Webhook Trigger URL surfaced clearly in the summary, so the user can copy it into the Supabase `drafts` webhook config
- A short summary at the end: nodes created, any assumptions made, confirmation of what test/placeholder SMTP credential was used, and instructions for how the user should run a first manual test (e.g. manually triggering the webhook with a sample payload, or approving a test draft in the dashboard and watching it flow through)
