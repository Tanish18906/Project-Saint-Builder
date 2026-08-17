# n8n Workflow Build Prompt — Foreman WhatsApp Notifications (Workflow 3)

**For: coding agent (via n8n MCP)**
**Context:** This is workflow #3 of the "Foreman" email agent for Allsaints Builders.
It fires a WhatsApp message via Twilio whenever a newly classified email is `urgent` or
`priority`, so staff get notified on their phone instead of having to watch the
dashboard. This workflow is self-contained and does NOT depend on real Titan
credentials — it triggers off the same Supabase `emails` insert that Workflow 1
already produces (currently from fake/test data, later from real IMAP — no change
needed here either way).

Supabase project: `allsaints-email-agent` (existing schema — do not modify).

Build exactly what's specified below. Do not build the voice page itself in this
workflow — the link in the WhatsApp message is a placeholder URL for now, until the
voice page (separate build) exists. Do not add STT/TTS logic here.

---

## 1. Trigger

Use a **Supabase Trigger** (via Database Webhook, same pattern as the existing
approval webhook) OR a **Postgres Trigger node in n8n listening on the `emails`
table INSERT** — whichever your Supabase MCP setup makes cleaner given the existing
`tr_draft_approved_webhook` pattern already built. Recommend mirroring that existing
pattern exactly: a new Supabase Database Webhook on `emails`, event `INSERT`,
pointing at a new n8n Webhook Trigger node.

- **Condition:** fire on every `emails` insert (Supabase webhook conditional filtering
  on category may not be reliable at insert time depending on when category gets set —
  confirm whether `category` is populated at insert or in a later UPDATE in your
  current Workflow 1. Based on the existing build, category IS set at insert time via
  the classify-before-insert order, so filtering `category IN ('urgent','priority')`
  at the webhook level should work — but if it doesn't, fall back to firing on all
  inserts and filtering in n8n immediately after the trigger, same fallback pattern
  used in Workflow 2's Sanity Check node.)

---

## 2. Filter node

Right after the trigger, add a **Filter/IF node**: continue only if
`category` is `urgent` OR `priority`. Everything else stops here — no WhatsApp
message for read_later, finance_accounts, contracts, nph_job_update, or other.

(Note: nph_job_update deliberately does NOT get a WhatsApp ping by default per this
rule, even though it's operationally important — it's not time-critical in the same
way as urgent/priority. Flag this to the client during demo in case they actually
want NPH updates included; easy one-line change later if so, just note the current
default here.)

---

## 3. Look up recipient

- Use the `routed_role` field from the email row to determine who should be notified.
- Query `users` table where `role = {{ routed_role }}` to get `whatsapp_number`.
- **Known issue, expected and OK for now:** the `users` table is currently empty (no
  real staff accounts seeded — waiting on client for real user list, per project
  status). This step will return no results until real users exist. Build the logic
  correctly regardless — it will work the moment real users are seeded. Do not
  hardcode a test phone number into this lookup step; instead see Section 6 for how
  to test without real users.
- If no matching user/whatsapp_number is found, stop gracefully (no error thrown,
  just no message sent) — log this via a no-op or a Supabase audit_log insert with
  action `"whatsapp_skipped_no_recipient"` so it's visible in the audit trail rather
  than silently vanishing.

---

## 4. Compose message

Build a short WhatsApp message text:

```
🔴 [URGENT/PRIORITY] New email — Allsaints Builders

From: {{ from_name }} ({{ from_address }})
Subject: {{ subject }}

{{ first ~150 chars of body_text, truncated with "..." if longer }}

Review & respond: {{ voice_link_placeholder }}
```

- Swap the emoji marker based on category — urgent gets a red circle, priority can use
  an orange circle or just text "[PRIORITY]" — keep it simple, this is a small visual
  cue not a design system.
- `{{ voice_link_placeholder }}` — **this is a literal placeholder for now**, e.g.
  `https://foreman.app/voice/{{ email_id }}` — the real signed-token version gets
  wired in once the voice page and token-signing logic exist (separate build). Leave
  a clear comment: "Replace with real signed URL once Workflow 4 (token generation)
  and the voice page are built."
- Keep the message short — WhatsApp previews truncate long messages awkwardly, and
  the point is a fast glance, not the full email.

---

## 5. Send via Twilio node

Use n8n's native **Twilio node**, WhatsApp message action.

- Credentials: Twilio Account SID + Auth Token, sandbox credentials for now (client
  hasn't approved production WhatsApp Business sender yet — that's a separate
  approval process through Twilio/Meta, out of scope for this build).
- From: Twilio sandbox WhatsApp number (confirm the exact number against your actual
  sandbox dashboard — Twilio provides a standard shared sandbox number, but always
  verify against the live console rather than assuming).
- To: `whatsapp:{{ user.whatsapp_number }}` — ensure the number is in E.164 format
  (+44... for UK numbers); add a normalization step if `whatsapp_number` isn't
  guaranteed to be stored in that format already.
- Body: the composed message from Section 4.

**Sandbox limitation to flag to the client/for your own testing:** anyone receiving
sandbox messages must first send the Twilio join code (e.g. "join xxx-xxx") to the
Twilio sandbox number once, and the sandbox connection expires after 3 days of
inactivity, requiring re-opt-in. This is normal Twilio sandbox behavior, not a bug —
document it so it's not mistaken for a broken integration during testing. Production
WhatsApp Business API (post-approval) does not have this limitation.

---

## 6. Testing without real users (since `users` table is empty)

To test this workflow before real staff accounts exist:
- Manually insert one test row into `users` with your own phone number and a role
  (e.g. `director`) — this is test data in an otherwise-empty table, safe to do and
  easy to delete later. Do NOT do this via a migration/seed script (same rule as the
  dashboard's test-user guidance) — just a manual insert for your own testing.
- Manually insert a test `emails` row (or re-run Workflow 1 with the test Set node)
  with `category = 'urgent'` and `routed_role` matching your test user's role.
- Confirm the WhatsApp message arrives on your phone (after sandbox join-code opt-in).
- Delete the test user row once real users are confirmed and seeded — leave a comment
  noting this is temporary test data.

---

## 7. Audit log

Insert an `audit_log` row after a successful send:
- `email_id` — the triggering email's id
- `draft_id` — null (no draft involved in a notification)
- `user_id` — the notified user's id (if found), null if skipped
- `action` — `"whatsapp_notified"` on success, `"whatsapp_skipped_no_recipient"` on skip
- `details` — jsonb with `{"category": "...", "routed_role": "...", "whatsapp_number": "..."}`
  (omit/mask the number if you prefer not to log it in plaintext — use your judgment,
  note the choice)

---

## What NOT to build in this workflow

- No voice page, no TTS, no STT — separate build
- No signed token generation — separate build (Workflow 4, or folded into voice page build)
- No production WhatsApp Business API approval/setup — sandbox only for now
- No NPH job update notifications by default — see Section 2 note
- No retry/backoff logic on Twilio send failures — keep this version simple, matching
  the "happy path first" approach used in Workflow 1

---

## Output expected from the coding agent

- Workflow built with trigger → filter → recipient lookup → compose → Twilio send → audit log
- A short summary at the end: nodes created, confirmation of a manual test send (using
  the manual test-user approach in Section 6), and any assumptions made
