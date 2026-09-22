# n8n Workflow 3 (WhatsApp) — Multi-Recipient Array Patch

**For: coding agent (via n8n MCP)**
**Context:** Workflow 3 (`Foreman WhatsApp`, canvas `udp2JRhk97k0PeNo`) currently assumes one recipient per email, looked up via the old single-value `routed_role` column. That column is deprecated — emails now carry `routed_roles` (array) and `urgency` (replacing `category` for the urgent/priority filter) as of the theme-routing v2 migration. This patch updates everything **upstream of the Twilio send node** to work correctly with the new schema and with multiple recipients per email. It does not fix the Twilio trial-plan send failure — that's explicitly out of scope, to be resolved later once the client's own Twilio account is configured. All recipients share a single voice link per email (same as current behavior) — do not build per-recipient tokens.

Do not modify Workflow 1 or Workflow 2. Do not attempt to fix the Twilio 400 trial-plan error.

---

## 1. Update the urgency filter node

Currently filters on `category IN ('urgent', 'priority')`. Change to filter on `urgency IN ('urgent', 'priority')`, reading from the `emails.urgency` column instead of the deprecated `category` column. Non-matching emails (`urgency = 'normal'`) continue to be dropped silently, same as before.

---

## 2. Replace the single-recipient lookup with a multi-recipient loop

This is the core of the patch. Current behavior: look up one `users` row matching the email's `routed_role`, produce one message.

New behavior:
- Read `routed_roles` (array) from the triggering `emails` row
- For each role in the array, look up matching `users` row(s) with `whatsapp_number` populated for that role
- Produce one outbound message per matched user — same email, same voice link, same formatted content, different `To` number each time

Use an n8n **Split Out** or **Loop Over Items** node to fan `routed_roles` out into one item per role before the Supabase user lookup, so the existing per-item message-formatting logic downstream doesn't need to be rewritten — it just now runs once per recipient instead of once per email.

**Edge cases to handle explicitly:**
- If `routed_roles` is null or empty (shouldn't happen given the classify prompt's fallback logic, but don't assume) → log to `audit_log` as `whatsapp_skipped_no_recipient` (reuse existing pattern) and stop, same as the current empty-state handling for a single missing recipient
- If a role in `routed_roles` has no matching user with a `whatsapp_number` (e.g. `director` role exists but no director has a WhatsApp number seeded yet — true today since `users` table is still mostly empty) → skip that specific recipient, log it individually as `whatsapp_skipped_no_recipient` with which role was missing, and **continue processing the other recipients in the array** rather than failing the whole email. A `suppliers` email with one matched recipient and one unmatched should still notify the one that matched.
- If the same person somehow holds two roles both present in `routed_roles` for a theme (not expected with current role data, but don't crash if it happens) → deduplicate by user id so they don't get the same message twice

---

## 3. Voice link — no change to token generation, but confirm it's per-email not per-recipient

The existing HMAC-SHA256 signed token generation (24h expiry, tied to `email_id`) stays exactly as-is. Confirm the loop structure from Section 2 generates the token/link **once per email**, not once per recipient — all recipients for a given email receive the identical voice link. Do not add a recipient identifier to the token or URL.

---

## 4. Message formatting node — no logic change, just confirm it runs per-recipient correctly

The existing formatting (E.164 phone normalization, category indicators, 150-char body truncation, voice link) doesn't need new logic — just verify it executes correctly once per item after the Section 2 loop, producing a distinct `To` number per message while everything else (subject, truncated body, link) stays identical across recipients for the same email.

**Category indicator update:** the emoji indicators (🔴/🟠) were keyed to the old `category` values (`urgent`/`priority`). Re-key them to the new `urgency` column — same two values, same emoji, just reading from the new field.

---

## 5. Audit log

Existing `whatsapp_notified` and `whatsapp_skipped_no_recipient` audit actions stay, but now may fire multiple times per email (once per recipient) instead of once. Make sure each audit log entry clearly identifies which recipient/role it refers to in its `details` jsonb, so the audit log doesn't just show three identical-looking `whatsapp_notified` rows with no way to tell who each one was for.

---

## 6. What NOT to do in this patch

- Do not touch the Twilio send node itself, its credentials, or attempt to work around the trial-plan `400` error — that's a separate, later task once the client's Twilio account is ready
- Do not build per-recipient voice tokens/links
- Do not modify Workflow 1 or Workflow 2
- Do not add new `users` rows or seed WhatsApp numbers — that's still client-provided data, not yet available
- Do not change the HMAC token expiry or signing logic

---

## 7. Testing

Since real Twilio sends will still fail on the trial plan (expected, out of scope), test everything **up to and including message formatting**, using the existing pattern of inspecting node output directly rather than confirming via an actual delivered WhatsApp message:

1. A single-role theme (e.g. `orders` → `['senior_admin']`, with at least one seeded `senior_admin` user with a `whatsapp_number`) → confirm exactly one formatted message is produced, matching current single-recipient behavior (regression check)
2. A multi-role theme (e.g. `suppliers` → `['director', 'senior_admin']`) with **both** roles having a seeded WhatsApp-enabled user → confirm exactly two formatted messages are produced, same email content, same voice link, two different `To` numbers
3. A multi-role theme where **only one** of the two roles has a seeded WhatsApp-enabled user → confirm one message is produced for the matched recipient, and one `whatsapp_skipped_no_recipient` audit log entry is written for the unmatched role, and the workflow doesn't error out
4. A multi-role theme where **neither** role has a seeded WhatsApp-enabled user (realistic today, given `users` is mostly empty) → confirm two `whatsapp_skipped_no_recipient` entries (one per role), zero messages attempted, no errors
5. Confirm the urgency filter correctly reads `urgency` and not `category` — pass a `urgency: 'normal'` email through and confirm it's still dropped, same as before

Show raw node output (the actual item list after the Section 2 loop, and the actual formatted message payloads) for at least the multi-role test cases — not just a summary claiming the loop worked.

## 8. Output expected

- Confirmation of exact nodes changed (filter, recipient lookup, loop structure, category-indicator re-keying, audit log detail structure)
- Raw output for all 5 test cases in Section 7
- Confirmation Twilio send node itself was not modified
- Progress tracker updated: Workflow 3 multi-recipient patch marked complete, Twilio trial-plan blocker explicitly left open and unchanged
