# Foreman — Progress Tracker

Last updated: 2026-08-26  
*Update this file manually as work progresses — check items off as they're completed.*

## 1. Database (Supabase)
- [x] ✅ Supabase project created (`allsaints-email-agent` / `clxqjxtmxswpjjvqunfx`)
- [x] ✅ Schema built: `accounts`, `users`, `emails`, `drafts`, `audit_log`
- [x] ✅ RLS enabled with permissive initial policies
- [x] ✅ `accounts` table seeded with `info@allsaintsbuilders.com` and `team@allsaintsbuilders.com`
- [x] ✅ `updated_at` trigger on `drafts` (`update_drafts_updated_at`)
- [x] ✅ Approval webhook trigger (`tr_draft_approved_webhook`) built with `pg_net`
- [x] ✅ WhatsApp notification webhook trigger (`tr_email_inserted_whatsapp_webhook`) built with `pg_net`
- [x] ✅ Realtime publication (`supabase_realtime`) enabled on `accounts`, `emails`, `drafts`, `audit_log` with `REPLICA IDENTITY FULL`
- [x] ✅ Real n8n webhook URLs configured (`foreman-send-on-approval`, `foreman-whatsapp-notifications`)
- [x] ✅ Theme-based routing schema migration v2 (`supabase/migrations/20260826172500_theme_based_routing_schema_v2.sql`): added `theme`, `urgency`, `routed_roles` to `emails`, added check constraints (`emails_theme_check`, `emails_urgency_check`), created B-tree & GIN indexes (`idx_emails_theme`, `idx_emails_urgency`, `idx_emails_routed_roles`), and deprecated `category`/`routed_role` columns with table comments.


## 2. n8n — Workflow 1: Ingest, Classify & Draft
- [x] ✅ Manual Trigger + test Set node built (`TEST EMAIL — NPH Job Update`)
- [x] ✅ OpenAI classify node built (`OpenAI — Classify`, gpt-4o)
- [x] ✅ Classification parsing (`Parse Classification` Code node) built with multi-structure extraction & fallbacks
- [x] ✅ Classify prompt: category + routed_role + confidence + summary
- [x] ✅ Classify prompt: disambiguation rules (urgent vs priority, finance vs contracts, nph specificity)
- [x] ✅ Supabase insert into `emails` (with dynamic `account_id` lookup via `Supabase — Get Account`)
- [x] ✅ Supabase insert into `audit_log` (classified action with JSON metadata)
- [x] ✅ OpenAI draft reply node built (`OpenAI — Draft Reply`, gpt-4o)
- [x] ✅ Draft prompt: placeholder logic (`[CONFIRM ...]`) for unknown facts
- [x] ✅ Draft prompt: email context and body passed into user prompt
- [x] ✅ Supabase insert into `drafts` (with fallback output extraction)
- [x] ✅ Supabase insert into `audit_log` (drafted action)
- [x] ✅ Tested across email categories (nph_job_update, urgent, priority, general)
- [x] ✅ Tone customization: role-based draft tone (director: formal/concise; senior_admin: professional/neutral; progressor: technical/job-focused; accountant: figures-forward) implemented directly in the `OpenAI — Draft Reply` system prompt

## 3. n8n — Workflow 2: Send on Approval
- [x] ✅ Webhook trigger node built (`Webhook — Draft Approved` listening at `/webhook/foreman-send-on-approval`)
- [x] ✅ Sanity check node (`Sanity Check (Approved & Has Body)`: status = 'approved', body not empty)
- [x] ✅ Extract fields from payload (`Extract Send Fields` node)
- [x] ✅ Supabase lookups (`Supabase — Get Email` and `Supabase — Get Account1`)
- [x] ✅ RFC 2822 threading headers constructed (`In-Reply-To` and `References` using original `message_id`)
- [x] ✅ Supabase status update back to `sent` (`drafts` table with `sent_at` and `emails` table)
- [x] ✅ Supabase audit log insert (`action = 'sent'` with delivery metadata)
- [x] ✅ Tested end-to-end: Supabase approval trigger fires n8n webhook and completes full status update pipeline

## 4. Email Source & SMTP Sending
- [x] ✅ Dev testing via simulated email payloads
- [ ] ⚠️ **BLOCKED ON CLIENT**: Real Titan IMAP/SMTP credentials pending from client
- [ ] ⚠️ **EXPLICIT NOTE**: The send step in Workflow 2 is currently a Code node simulating dispatch with RFC 2822 headers. Zero real SMTP credentials are configured in n8n. All "sent" statuses to date are verified logical successes — no real email has been delivered to an external inbox yet.
- [ ] ⬜ Swap IMAP Trigger node into Workflow 1 once Titan credentials received
- [ ] ⬜ Swap real SMTP Send node with Titan credentials into Workflow 2
- [ ] ⬜ Confirm real inbox connection works end-to-end

## 5. Dashboard (Next.js + Tailwind + Supabase Realtime)
- [x] ✅ Project scaffolded with Next.js App Router and design system tokens
- [x] ✅ Auth & session management (Supabase Auth, route protection proxy/middleware, session logout)
- [x] ✅ Inbox list view (`/`): filter by category, monitored account, search, urgent accents, zero mock data
- [x] ✅ Email detail view (`/emails/[id]`): two-column layout, metadata, email body, AI triage summary
- [x] ✅ Draft review panel: editable textarea, word/char counts, copy to clipboard, reset to AI draft
- [x] ✅ Business logic — Approve action: updates draft to `approved`, triggers n8n dispatch
- [x] ✅ Business logic — Discard action: clears textarea, allows manual reply composition
- [x] ✅ Business logic — Save draft action: saves draft without changing approval status
- [x] ✅ Business logic — Draft type auto-tagging: `ai_generated`, `ai_edited`, and `manual` verified in DB
- [x] ✅ Post-approval lockdown: approved and sent drafts are strictly read-only, action buttons hidden, clear status banners rendered, zero re-edits or re-sends possible
- [x] ✅ Audit log view (`/audit-log`): chronological event stream with email/user relations and JSON metadata
- [x] ✅ Supabase Realtime WebSockets: instant UI updates across Inbox, Email Detail, and Audit Log without page refresh

## 6. WhatsApp Integration (Workflow 3 — Standalone Canvas: "Foreman WhatsApp")
- [x] ✅ Workflow migrated to dedicated standalone n8n canvas (`udp2JRhk97k0PeNo` / "Foreman WhatsApp"), separate from Workflows 1 & 2 (`iZxVrliRwHKuzmzX`), adhering to the one-workflow-per-trigger-event pattern
- [x] ✅ Database Webhook trigger (`tr_email_inserted_whatsapp_webhook`) on `emails` table INSERT
- [x] ✅ Webhook listener node in n8n (`Webhook — Email Inserted` at `/webhook/foreman-whatsapp-notifications`)
- [x] ✅ Filter node: routes only `urgent` and `priority` emails, drops all other categories silently
- [x] ✅ Message formatting with E.164 phone normalization, category indicators (`🔴`/`🟠`), body truncation (150 chars), and signed HMAC-SHA256 voice review link — base URL currently hardcoded to `http://localhost:3000/voice/{{email_id}}?token={{voice_token}}` for local dev/testing (`$env`-based dynamic base URL was attempted but n8n Cloud blocks `$env` access inside Code nodes, and the Environment Variables settings page is Enterprise-plan only on the current n8n plan) — needs updating to the real production domain once the dashboard is deployed
- [x] ✅ Native Twilio WhatsApp node (`n8n-nodes-base.twilio`, action: `send`, `toWhatsapp: true`) integrated and wired, replacing the earlier custom Code-node Twilio relay; real Twilio credentials attached and From/To/Message mapping live
- [ ] ⚠️ **NOT FULLY DONE**: Twilio account is on a **trial plan** — outbound WhatsApp sends currently fail (`400 - Invalid or disallowed parameters... trial accounts have limited parameter access`), confirmed via direct API testing. Needs: upgrade to a paid Twilio account + WhatsApp Content Template approval for business-initiated messages before real notifications can be delivered.
- [x] ✅ Masked phone number logging in Supabase `audit_log` (`whatsapp_notified`)
- [x] ✅ Graceful empty-state handling when no recipient user exists (`whatsapp_skipped_no_recipient`)
- [x] ✅ Verified workflow routing logic across all 5 test scenarios (urgent director, priority director, urgent progressor role-variety, missing role accountant, non-urgent read_later)
- [x] ✅ Verified live end-to-end: a real classified `urgent` email cascaded through the actual Supabase `AFTER INSERT` webhook into Workflow 3 with no manual intervention, correctly matched `routed_role` to a seeded WhatsApp-enabled recipient, and produced a correctly-structured `voice_url`

## 7. Voice Integration (Frontend Route: `/voice/[email_id]`)
- [x] ✅ Mobile-first, audio-first standalone route built (`app/voice/[email_id]/page.tsx` + `src/components/VoiceEmailView.tsx`)
- [x] ✅ Signed HMAC-SHA256 token verification (`src/lib/voice-token.ts`) with email ID matching, expiration checks, and friendly invalid/expired state
- [x] ✅ Middleware updated to bypass `/voice` and `/api/voice` from mandatory Supabase Auth sessions
- [x] ✅ Server-side TTS API route (`/api/voice/tts`) using OpenAI TTS (`gpt-4o-mini-tts`, falling back to `tts-1` if unprovisioned) with Web Speech API browser fallback
- [x] ✅ Server-side STT API route (`/api/voice/stt`) using OpenAI Whisper (`whisper-1`) with MediaRecorder client capture
- [x] ✅ Tone-aware AI rewrite API route (`/api/voice/rewrite`) supporting formal, shorter, and technical voice commands with placeholder preservation
- [x] ✅ Fixed command parser (`src/lib/voice-commands.ts`) for "read the draft", "make it more formal/shorter/technical", "approve and send", "discard", and free dictation
- [x] ✅ Reused existing `saveDraftAction`, `approveAndSendAction`, and `discardDraftAction` without duplicating database write logic
- [x] ✅ Post-approval lockdown enforced (disables push-to-talk, renders read-only status and approver metadata)
- [x] ✅ Fallback "Show text instead" drawer and microphone permission denied handling
- [x] ✅ **Signed Token Generation (n8n Workflow 3)**: Generated signed HMAC-SHA256 tokens with 24h expiration in n8n Workflow 3, closing the WhatsApp → Voice Page loop
- [x] ✅ **Bug fix — TTS double playback**: resolved overlapping/duplicate audio playback caused by concurrent TTS calls; introduced playback sequencing (`playbackSeqRef`) so only the most recently requested audio ever plays
- [x] ✅ **Bug fix — dictation overwriting the entire draft**: replaced blind whole-draft overwrite on free-form spoken dictation with a smart `apply_edit` rewrite that asks the AI to edit the existing draft in place rather than discard and replace it
- [x] ✅ **Bug fix — voice link pointing at an unreachable placeholder domain**: `voice_url` generated by Workflow 3 was hardcoded to `https://foreman.app`, a domain that has never been deployed and doesn't resolve, so tapping the WhatsApp link on a phone would hang; temporarily hardcoded to `http://localhost:3000` for local dev/testing (see item 6 above for why `$env` isn't currently usable)
- [x] ✅ **Bug fix — draft corrupted into a copy of the email body via audio feedback**: a global `window` click/touchstart/pointerdown "tap to unlock autoplay" listener shared the same gesture types as the push-to-talk button. Pressing the mic could simultaneously replay the email-body TTS through the speaker while the mic was recording — Whisper then transcribed the echoed audio back as if it were the user's dictated reply, and it was silently saved as the new draft (root-caused via direct Supabase data inspection and n8n execution history, confirming this was a voice-page bug, not an n8n Workflow 1 drafting bug). Fixed by removing the global listeners (replay now only via the explicit "Tap here to listen" button) and adding a recording-in-progress guard to `playTTS`
- [x] ✅ **Bug fix — auto-play audio quality (timeout)**: the auto-play-on-load TTS call (which always sends the longest text in the app — the full email body) was silently falling back to the lower-quality browser `speechSynthesis` voice because real OpenAI TTS synthesis at that length (measured 4.7–6.7s) routinely exceeded the 4.5s server-side / 6s client-side timeouts; raised to 12s server-side / 20s client-side, confirmed real `audio/mpeg` returned consistently across repeated test calls
- [x] ✅ **Restructure — assistant-style auto-play intro**: auto-play now composes a single structured intro (who it's from, subject, full message, an explicit "end of email" boundary, then a brief "draft is ready" mention only when a draft actually exists) instead of a flat recitation of the raw email body, via one shared `buildIntroText()` helper used by both the auto-play effect and the manual replay button
- [x] ✅ Two full end-to-end tests completed and verified — one email approved via the dashboard, one approved via the voice page — both confirmed correct across the `emails`, `drafts`, and `audit_log` tables

## 8. Downstream Work — Theme-Based Routing v2 (Sequenced Tasks)
- [x] ✅ **n8n Workflow 1 (Classify & Ingest)**: `OpenAI — Classify` system prompt replaced verbatim with the client's 9-theme/urgency/multi-role taxonomy; `Parse Classification` Code node rewritten to extract `theme`/`urgency`/`routed_roles` (array, with string→array coercion and theme-role-map fallback) instead of `category`/`routed_role`; `Supabase — Insert Email` and `Supabase — Audit Log (Classified)` mappings updated to match; `OpenAI — Draft Reply` tone-selection updated for multi-role themes (documented via sticky note on canvas). Verified live against gpt-4o across 4 test cases (NPH-as-finance vs NPH-as-job-update, Brewers-as-order vs Brewers-as-supplier) — all classified correctly, urgency extracted independently of theme, and `routed_roles` confirmed landing in Supabase as a real `text[]` (not a stringified array) for both single- and multi-role cases.
  - [x] ✅ **Follow-up fix (2026-08-26): tone tie-break was array-position, not seniority** — the original `routed_roles[0]` rule accidentally gave `meetings_appointments`/`certificates` (which list `senior_admin` first in the mapping table) the senior_admin tone instead of director's; `suppliers` (director-first) was unaffected. Replaced with an explicit seniority-priority expression (director > senior_admin > progressor > accountant) in the `OpenAI — Draft Reply` user message. Verified with real before/after draft text for `meetings_appointments` ("Hi Sarah,... Thank you for your email... Best regards" → "Sarah,... Please confirm if this suits.\n\nRegards,"), confirmed `certificates` now also gets director tone, and re-ran the `suppliers` case as a regression check (unchanged, still director tone).
  - [x] ✅ **20-case classification benchmark (2026-08-26)**: live `OpenAI — Classify` node tested against 20 pre-defined cases (9 clean themes, 4 regression/ambiguity cases, 2 urgency-independent-of-theme cases, 1 garbage/spam fallback case, 2 informational edge cases, 1 single-keyword-reliance case, 1 hard-deadline case) with the downstream Supabase/draft pipeline temporarily disconnected so no rows landed in production tables (confirmed via SQL, 0 `bench-%` rows). Result: 16/18 strict cases passed. Two failures: **#16** — spam/prize email classified as `promotions` (0.9 confidence) instead of falling back to `accounts` (low confidence), because the prompt's fallback only fired on "nothing fits," not on stylistic-but-unrelated matches. **#19** — `HASTINGS`-keyword-only finance email misclassified as `accounts`; flagged as possibly a test-construction issue (the test email leaned on "account query" phrasing) rather than a confirmed prompt defect, pending a cleaner re-test.
  - [x] ✅ **Follow-up fix (2026-08-26): promotions theme business-relationship override** — added a targeted disambiguation rule directly under the `promotions` theme definition in the classify prompt: `promotions` requires a genuine Allsaints business relationship (supplier/trade/industry contact), not just promotional tone/wording — generic spam, phishing, or prize content now falls back to `accounts` at low confidence regardless of how promotional the language sounds. No other theme definitions, urgency logic, or `routed_roles` mapping touched. Verified on the exact failing case: before fix → `{"theme":"promotions","confidence":0.9}`; after fix → `{"theme":"accounts","confidence":0.5,"summary":"...likely unrelated to Allsaints' business"}`. This was a targeted sanity check on case #16 only, not a full re-run of the 20-case benchmark — **a fuller rigorous retest (harder, human-written adversarial cases) is a separate follow-up task, not yet done.**
  - [x] ✅ **Follow-up fix (2026-08-26): finance/invoices theme keyword-narrowness** — Round 2 benchmark found a reproducible 3-for-3 failure: genuine financial/invoice emails that didn't use the specific example keywords listed under `finance`/`invoices` (e.g. "nphadfinance," "PAYMENT CERT," "Hastings," "NPH," "HIRE") fell through to the `accounts` catch-all even when unambiguously about money, because those two theme definitions were keyword-first with nothing conceptual to match against. Rewrote both to lead with a conceptual definition (finance: financial discrepancies/payment queries/statement errors/account balances/payment certification; invoices: any correspondence primarily about a specific invoice — query, dispute, copy/reissue request, or status check), keeping the client's original keywords as "including but not limited to" examples rather than the primary signal. Also added a one-time top-level note under `THEMES` that all keyword/sender lists across every theme are illustrative, not exhaustive — addressing the root cause once rather than needing to patch each theme individually if the same pattern recurs. No other theme definitions, the promotions override, urgency logic, or `routed_roles` mapping touched (confirmed via diff against the pre-change prompt). Verified live against gpt-4o on 3 reconstructed cases matching the Round 2 failure descriptions (originals not saved): wrong-figure-on-statement → `finance` (was falling through to `accounts`), named-invoice-dispute → `invoices` (was falling through to `accounts`), forwarded-financial-query → `finance` (was falling through to `accounts`); all 3/3 now correct, all confidence 1.0. This was a targeted 3-case sanity check only — **a smaller, targeted Round 3 retest (finance/invoices-adjacent cases only) is a separate follow-up task, not yet done.**
  - [x] ✅ **Round 3 targeted regression benchmark (2026-08-26): finance/invoices fixes confirmed solid on independently-designed hard cases** — 7 brand-new cases (not reused from Round 1/2 or the Fix 2 verification step), run live against gpt-4o with the downstream Supabase/draft pipeline disconnected (0 rows landed in production tables, confirmed via `lastNodeExecuted: "Parse Classification"` on every run). Cases 1–4 (keyword-free finance discrepancy in a casual email; director cc'd on a "figure that doesn't add up" chain with zero financial keywords; hard invoices dispute by invoice number; keyword-free invoice chase-up) all classified correctly — `finance`/`finance`/`invoices`/`invoices`, confidence 0.9–1.0. Case 5 (finance-vs-invoices borderline: "has invoice 7734 been paid?") returned `invoices` at 1.0 — a defensible read, informational only. Case 6 (general non-financial director correspondence — site hours/apprentices) correctly stayed `accounts` (0.8), confirming the broadened `finance` definition didn't overreach into generic business correspondence. **Case 7 (most important — fake-invoice phishing email, testing whether Fix 1's spam-override and Fix 2's broadened invoices definition would work against each other) held up**: classified `accounts` at 0.7, not misclassified as `invoices` — Fix 1's non-business-content rule caught it and Fix 2's broadening did not make it more exploitable. One non-regression deviation: case 7's urgency came back `urgent` instead of the expected `normal` — defensible given the email's own "24 hours / legal action" language matches the prompt's separate urgency rubric verbatim; unrelated to either fix, urgency logic untouched. 6/6 strict theme-match cases passed; verdict: both fixes confirmed solid, no further prompt changes needed at this time. Report-only task — prompt/node/mapping unchanged, confirmed via no diff to the classify node content.
  - [x] ✅ **Round 4 — final closing test (2026-08-26): coverage-gap benchmark + one true end-to-end run** — closes out classification testing. Part 1: one new hard case each for the 5 under-tested themes (`orders`, `suppliers`, `nph_jobs`, `meetings_appointments`, `certificates`), keyword-light/context-implied where specified, run with the pipeline disconnected. **5/5 passed** on both theme and `routed_roles`: orders→`['senior_admin']`, suppliers→`['director','senior_admin']`, nph_jobs→`['senior_admin']` (Northampton Council roof-leak case using zero NPH-specific keywords), meetings_appointments→`['senior_admin','director']` (scheduling buried inside an unrelated-sounding drawings email), certificates→`['senior_admin','director']` (certificate mentioned as a minor aside, not the main topic). No prompt fix needed, so no confirm-only re-test was triggered. Part 2: full pipeline reconnected for one clean end-to-end run (meetings_appointments, multi-role) — direct Supabase query confirmed: `emails` row had `theme`/`urgency`/`routed_roles` correct with `routed_roles` landing as a real `text[]` (`['senior_admin','director']`); `audit_log` "classified" row had the correct v2 jsonb shape (`{theme, urgency, routed_roles, confidence, summary}`); `drafts` row had `ai_generated_text`/`edited_text` populated and matching (`"Tuesday at 10am works for us."`), `draft_type: 'ai_generated'`, terse director-tone phrasing consistent with the seniority tie-break fix (no greeting/sign-off, as expected for a director-routed multi-role case). **One informational finding, not fixed**: the `audit_log` "drafted" row has `details: null` — its Supabase node (`Supabase — Audit Log (Drafted)`) only ever maps `email_id`/`draft_id`/`action`, never a `details` field; this is a pre-existing node-mapping gap unrelated to the v2 theme-routing migration or any of the three prompt fixes, so left unfixed and flagged for a separate decision (out of scope for a prompt-only round). All 5 test rows (email/draft/2×audit_log) deleted immediately after verification, confirmed zero rows remaining via direct count query. Pipeline disconnected again and `TEST EMAIL — NPH Job Update` restored to its prior fixture afterward, per this round's test-safe-default requirement. **Verdict: classification system, end to end, considered done for this phase** — no open items beyond the flagged `audit_log.details` null-mapping decision, which is a data-completeness nicety, not a classification correctness issue.
- [x] ✅ **n8n Workflow 3 (WhatsApp Notifications) — multi-recipient patch (2026-08-26)**: Urgency filter re-keyed from deprecated `category` to `urgency`. Single-recipient lookup replaced with: fetch all candidate users once → `Resolve Recipients & Skips` Code node matches `routed_roles` against candidates (dedup by user id) → `Route by Kind` IF node splits matched vs skipped. Category-indicator emoji re-keyed to `urgency`. Audit log details now carry `role`/`user_name` per entry so multiple notified/skipped rows per email are distinguishable. Twilio send node itself untouched.
  - Verified live (webhook-triggered executions, not pinned data) against the real `users` table: test 4 (neither role matched, run **before** seeding) → exactly 2 distinct `whatsapp_skipped_no_recipient` audit rows, 0 messages. Seeded one temporary `senior_admin` test user (`+447700900123`, Ofcom drama-reserved test range) to prove the matched path, since `users` had no senior_admin before. Test 1 (single-role regression) → exactly 1 correctly formatted message. Test 2 (multi-role, both matched: director+senior_admin) → exactly 2 messages, identical voice link/content, distinct `To` numbers. Test 5 (urgency filter) → `urgency: 'normal'` dropped cleanly, nothing downstream ran. Temp test user deleted after testing.
  - **Known limitation surfaced by testing, not fixed (Twilio node explicitly out of scope)**: test 3 (multi-role, one matched) confirmed the resolver itself splits matched/skipped correctly (1 matched + 1 skipped, verified in raw node output), but in a *single execution* where the matched sibling's Twilio call fails (current trial-plan 400), n8n aborts the whole execution before the unmatched sibling's skip audit-log write runs — confirmed by querying `audit_log` directly and finding the expected skip row absent. This is an n8n default-error-handling interaction, not a bug in the resolver logic; fixing it would mean adding `onError` handling to the Twilio node, which this patch was explicitly told not to touch. Will very likely stop mattering once real Twilio credentials replace the trial account (sends will succeed), but is a latent fan-out correctness gap worth a conscious decision, not a silent fix.
- [ ] ⬜ **Dashboard Inbox Filters**: Update UI filters to support 9 `theme` options, `urgency` filter, and role-based filtering using array containment (`routed_roles @> ARRAY['role']`).
- [ ] ⬜ **Dashboard Category Badges**: Design and implement badge treatment for the 9 operational themes in the UI/UX redesign.

## 9. Roles & Permissions (in scope, on hold — waiting on client for real user list)
- [ ] ⬜ Real user list/roles confirmed by client
- [ ] ⬜ Real RLS policies replacing permissive ones
- [ ] ⬜ Granular role-based access enforced end-to-end

## 10. Hosting / Infra (on hold)
- [ ] ⬜ n8n hosting decided (cloud vs self-hosted VPS)
- [ ] ⬜ Dashboard hosting decided (Vercel / Cloudflare)
- [ ] ⬜ Domain/subdomain setup
- [ ] ⬜ Vercel / Supabase / n8n account migration to client ownership (pending client setup)

## 11. Delivery

- [ ] ⬜ Full core pipeline demoed to client
- [ ] ⬜ Client sign-off on MVP scope
- [ ] ⬜ All paid-scope features delivered (WhatsApp, voice, roles)
- [ ] ⬜ Retainer conversation initiated (post-delivery, for ongoing maintenance)
