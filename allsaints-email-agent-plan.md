# Allsaints Builders — AI Email Agent (Working Notes)

**Fiverr order — $1250 (paid)**
**Client email provider:** Titan (Hostinger)
**Status:** Planning done, starting build. Client slow to respond — building against test data first, will swap real credentials when client provides them.

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
3. n8n → OpenAI: classify (category + which role should handle it)
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

## 4. Database (Supabase) — high-level tables planned

Full schema to be finalized during development, but rough shape agreed:

- `users` — id, name, role (director/admin/progressor/accountant), email, whatsapp_number
- `accounts` — id, email_address (info@ / team@), imap/smtp config ref
- `emails` — id, account_id, from, subject, body, message_id (needed for threading!), received_at, category, routed_role, status
- `drafts` — id, email_id, ai_generated_text, edited_text, status (ai_generated/ai_edited/manual/approved/discarded/sent), approved_by, approved_at
- `audit_log` — id, email_id, user_id, action, timestamp

**Note:** Must capture original email's `Message-ID` during ingest — required for proper reply threading later.

---

## 5. Email Layer Details

- IMAP/SMTP fully handled via n8n nodes — no custom backend needed
- Client is reusing/refining an existing category-based n8n workflow from a past project
- Draft generation via OpenAI node in n8n (cost-effective choice over other options)
- Send-on-approval mechanism: Supabase DB Webhook → n8n Webhook trigger → SMTP Send node → status update back to Supabase

---

## 6. Testing Strategy (since client hasn't sent Titan credentials yet)

Everything downstream of "email comes in via IMAP" is credential-agnostic — build and test fully now, swap real creds in at the end.

- **Option A:** Use a throwaway Gmail/Outlook inbox connected to n8n's IMAP trigger for now — same node, just different host/port. Swap to Titan later = just changing credential fields.
- **Option B:** Skip IMAP entirely for early testing — feed dummy email JSON via webhook/manual trigger straight into the classify step. Fastest way to test AI logic + dashboard without any real inbox.
- Build a set of ~15-20 seed test emails covering every category (urgent, finance, contracts, NPH job updates, etc.) — reuse this set every time the classification prompt changes, to catch regressions.
- Real Titan quirks (auth, folder naming, deliverability/SPF/DKIM) can only be fully confirmed once real credentials are in hand — low risk, but worth a quick connection test before any client demo.
- **Swap-in day:** just create new n8n credential with real Titan host/user/pass, point IMAP Trigger + SMTP Send nodes at it. Nothing else in the system needs to change.

---

## 7. On Hold (revisit once core pipeline — ingest → classify → draft → dashboard approve → send — is working well)

- **WhatsApp integration** — notifications for urgent/priority emails. Decision pending: Twilio WhatsApp API vs Meta Cloud API.
- **Voice (TTS/STT)** — hear emails aloud, voice commands to edit/send. Likely simplified later to WhatsApp voice notes + Whisper transcription instead of live STT listening (much simpler to build than "always listening").
- **Roles & Permissions (detailed)** — Directors (full access both accounts), Senior Admin/Accountant (info@ specifics), Progressor/Ops Manager (team@ + NPH threads only). Conceptually mapped to Supabase Row Level Security, but not implemented yet. Client not responding — waiting on their input on exact user list/roles.
- **Hosting/Infra** — where n8n and dashboard actually get deployed (VPS, domain, etc.)
- **Tone customization** — AI writing style per role (formal for Directors, technical for Ops Manager) — will be prompt-template based, not a trained model. Not yet drafted.
- **Full Supabase schema** — rough shape agreed above, exact columns/types to be finalized while building.

---

## 8. Scope Reality Check

Full brief (voice control + WhatsApp + multi-account triage + tone-mimicking AI + role-based dashboard) is normally a $5-15k build. At $1250, MVP is being scoped tightly:
- Core pipeline (triage + draft + dashboard approve/send) is the priority — this is the real value.
- WhatsApp/Voice are "nice to have" layers added after core works.
- Tone customization = prompt templates, not fine-tuned models.
- Consider getting written client sign-off on locked MVP scope once they're responsive again, since the brief as written implies a much bigger product.
