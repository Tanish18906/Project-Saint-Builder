# Foreman — Progress Tracker

Last updated: 2026-08-14  
*Update this file manually as work progresses — check items off as they're completed.*

## 1. Database (Supabase)
- [x] ✅ Supabase project created
- [x] ✅ Schema built: `accounts`, `users`, `emails`, `drafts`, `audit_log`
- [x] ✅ RLS enabled (permissive "allow all, tighten later" policies)
- [x] ✅ `accounts` table seeded with info@ and team@
- [x] ✅ `updated_at` trigger on `drafts`
- [x] ✅ Approval webhook trigger (`tr_draft_approved_webhook`) built (pg_net based)
- [ ] ⬜ Real n8n webhook URL added (currently placeholder)

## 2. n8n — Workflow 1: Ingest, Classify & Draft
- [x] ✅ Manual Trigger + test Set node built (fake email data, IMAP not connected yet)
- [x] ✅ OpenAI classify node built
- [x] ✅ Classification parsing (Code node) built with fallback handling
- [x] ✅ Classify prompt: category + routed_role
- [x] ✅ Classify prompt: confidence score added
- [x] ✅ Classify prompt: summary field added
- [x] ✅ Classify prompt: category disambiguation rules added (urgent vs priority, finance vs contracts, nph specificity)
- [x] ✅ Supabase insert into `emails` (with dynamic account_id lookup)
- [x] ✅ Supabase insert into `audit_log` (classified action)
- [x] ✅ OpenAI draft reply node built
- [ ] ⬜ Draft prompt: addresses specific question/request in email (not generic filler)
- [ ] ⬜ Draft prompt: no hallucinated facts — uses [CONFIRM ...] placeholders for unknowns
- [ ] ⬜ Draft prompt: placeholder logic tested and confirmed working (not skipped by fluent phrasing)
- [x] ✅ Supabase insert into `drafts`
- [x] ✅ Supabase insert into `audit_log` (drafted action)
- [x] ✅ Tested: NPH job update category
- [ ] ⬜ Tested: urgent category
- [ ] ⬜ Tested: finance/accounts category
- [ ] ⬜ Tested: contracts category
- [ ] ⬜ Tested: read_later category
- [ ] ⬜ Tested: priority category
- [ ] ⬜ Decision made: should read_later emails get a drafted reply or skip drafting entirely

## 3. n8n — Workflow 2: Send on Approval
- [ ] ⬜ Webhook trigger node built (receiving Supabase webhook payload)
- [ ] ⬜ Extract fields from payload (email_id, edited_text, recipient info via join)
- [ ] ⬜ Sanity check step (status really = approved, body not empty)
- [ ] ⬜ SMTP Send node built
- [ ] ⬜ Reply threading implemented (In-Reply-To / References headers using stored message_id)
- [ ] ⬜ Supabase status update back to `sent` (emails + drafts tables)
- [ ] ⬜ Tested end-to-end with a fake approval

## 4. n8n — Email Source
- [x] ✅ Currently using fake/manual test data (not real IMAP)
- [ ] ⬜ Real Titan IMAP/SMTP credentials received from client
- [ ] ⬜ IMAP Trigger node swapped in, replacing test Set node
- [ ] ⬜ SMTP credentials swapped into Workflow 2
- [ ] ⬜ Confirmed real inbox connection works end-to-end

## 5. Dashboard
- [ ] ⬜ Project scaffolded (framework chosen, connected to Supabase)
- [ ] ⬜ Auth/login (basic, pre real role restrictions)
- [ ] ⬜ Inbox list view (filterable by category, account)
- [ ] ⬜ Email detail + draft edit panel
- [ ] ⬜ Approve action (updates Supabase status → approved)
- [ ] ⬜ Discard action (clears draft text, allows manual reply in same box)
- [ ] ⬜ Edit-before-send (auto-tracked: ai_generated / ai_edited / manual)
- [ ] ⬜ Draft type tagging logic implemented correctly
- [ ] ⬜ Role-based filtered views (Director / Senior Admin / Progressor / Accountant)
- [ ] ⬜ Audit log view (for Directors)
- [ ] ⬜ Company brand color theme applied (final pass)

## 6. WhatsApp Integration (in scope, on hold)
- [ ] ⬜ Provider decision (Twilio vs Meta Cloud API)
- [ ] ⬜ Notification trigger wired (urgent/priority emails)
- [ ] ⬜ Message includes summary or link to review

## 7. Voice Integration (in scope, on hold)
- [ ] ⬜ TTS for hearing email content
- [ ] ⬜ STT / voice command handling
- [ ] Approach decided (live listening vs WhatsApp voice note + Whisper)

## 8. Roles & Permissions (in scope, on hold — waiting on client for real user list)
- [ ] ⬜ Real user list/roles confirmed by client
- [ ] ⬜ Supabase Auth wired
- [ ] ⬜ Real RLS policies replacing permissive ones
- [ ] ⬜ Role-based access enforced end-to-end (dashboard + data level)

## 9. Hosting / Infra (on hold)
- [ ] ⬜ n8n hosting decided (cloud vs self-hosted VPS)
- [ ] ⬜ Dashboard hosting decided
- [ ] ⬜ Domain/subdomain setup
- [ ] ⬜ Supabase project ownership decision (stays on builder's account vs transferred to client org)

## 10. Delivery
- [ ] ⬜ Full core pipeline demoed to client
- [ ] ⬜ Client sign-off on MVP scope
- [ ] ⬜ All paid-scope features delivered (WhatsApp, voice, roles)
- [ ] ⬜ Retainer conversation initiated (post-delivery, for ongoing maintenance)
