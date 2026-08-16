# Foreman — Progress Tracker

Last updated: 2026-08-16  
*Update this file manually as work progresses — check items off as they're completed.*

## 1. Database (Supabase)
- [x] ✅ Supabase project created (`allsaints-email-agent` / `clxqjxtmxswpjjvqunfx`)
- [x] ✅ Schema built: `accounts`, `users`, `emails`, `drafts`, `audit_log`
- [x] ✅ RLS enabled (permissive "allow all, tighten later" policies)
- [x] ✅ `accounts` table seeded with info@ and team@
- [x] ✅ `updated_at` trigger on `drafts` (`update_drafts_updated_at`)
- [x] ✅ Approval webhook trigger (`tr_draft_approved_webhook`) built (pg_net based)
- [ ] ⬜ Real n8n webhook URL added (currently placeholder `https://example.com/TODO_N8N_WEBHOOK_URL_PLACEHOLDER`)

## 2. n8n — Workflow 1: Ingest, Classify & Draft
- [x] ✅ Manual Trigger + test Set node built (`TEST EMAIL — NPH Job Update`, IMAP not connected yet)
- [x] ✅ OpenAI classify node built (`OpenAI — Classify`, gpt-4o)
- [x] ✅ Classification parsing (`Parse Classification` Code node) built with multi-structure JSON extraction, fence stripping & fallback handling
- [x] ✅ Classify prompt: category + routed_role
- [x] ✅ Classify prompt: confidence score added
- [x] ✅ Classify prompt: summary field added
- [x] ✅ Classify prompt: category disambiguation rules added (urgent vs priority, finance vs contracts, nph specificity)
- [x] ✅ Supabase insert into `emails` (with dynamic `account_id` lookup via `Supabase — Get Account`)
- [x] ✅ Supabase insert into `audit_log` (classified action with JSON details)
- [x] ✅ OpenAI draft reply node built (`OpenAI — Draft Reply`, gpt-4o)
- [x] ✅ Draft prompt: instructions added to address specific requests and mandate `[CONFIRM ...]` placeholders for unknowns
- [ ] ⬜ (needs verification) Draft prompt: verify email body text context is passed into user prompt and test with missing facts
- [ ] ⬜ (needs verification) Draft prompt: placeholder logic tested and confirmed working (not skipped by fluent phrasing)
- [x] ✅ Supabase insert into `drafts` (with fallback output extraction)
- [x] ✅ Supabase insert into `audit_log` (drafted action)
- [x] ✅ Tested: NPH job update category (verified in live runs 3482–3493)
- [ ] ⬜ (needs verification) Tested: urgent category
- [ ] ⬜ (needs verification) Tested: finance/accounts category
- [ ] ⬜ (needs verification) Tested: contracts category
- [ ] ⬜ (needs verification) Tested: read_later category
- [ ] ⬜ (needs verification) Tested: priority category
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
- [x] ✅ Specs, UI design guidelines & implementation plan prepared (`Prompts/Dashboard-UI/`)
- [x] ✅ Project scaffolded (Next.js App Router, Tailwind CSS, Supabase client connected)
- [x] ✅ Auth/login (Supabase Auth email/password, route protection middleware, session logout)
- [x] ✅ Inbox list view (filterable by category, account, search, urgent visual accents)
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
