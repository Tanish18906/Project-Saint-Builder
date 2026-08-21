# Foreman — Progress Tracker

Last updated: 2026-08-21  
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

## 8. Roles & Permissions (in scope, on hold — waiting on client for real user list)
- [ ] ⬜ Real user list/roles confirmed by client
- [ ] ⬜ Real RLS policies replacing permissive ones
- [ ] ⬜ Granular role-based access enforced end-to-end

## 9. Hosting / Infra (on hold)
- [ ] ⬜ n8n hosting decided (cloud vs self-hosted VPS)
- [ ] ⬜ Dashboard hosting decided (Vercel / Cloudflare)
- [ ] ⬜ Domain/subdomain setup
- [ ] ⬜ Vercel / Supabase / n8n account migration to client ownership (pending client setup)

## 10. Delivery
- [ ] ⬜ Full core pipeline demoed to client
- [ ] ⬜ Client sign-off on MVP scope
- [ ] ⬜ All paid-scope features delivered (WhatsApp, voice, roles)
- [ ] ⬜ Retainer conversation initiated (post-delivery, for ongoing maintenance)
