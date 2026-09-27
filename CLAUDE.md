# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Project

"Foreman" — an AI email triage, drafting, and human-in-the-loop approval dashboard for Allsaints Builders. Two Titan inboxes are polled by n8n, which classifies and drafts replies with OpenAI, writes to Supabase, and staff approve/edit/send from this Next.js dashboard or a mobile voice portal. Supabase is the single source of truth connecting the n8n automation engine and this UI — most business logic lives in Supabase triggers/webhooks and n8n workflows, not in this repo.

Full architecture, DB schema, and end-to-end workflow are documented in `README.md` — read it before making cross-cutting changes.

**Design authority: `DESIGN_SYSTEM.md`** (repo root) governs all visual and interaction decisions — tokens, type, spacing, components, states, motion, responsive layout, IA. Read it before any UI work. Earlier design specs are archived in `Docs/archive/superseded-design/` and must not be followed; where older docs in `Prompts/` or `New Docs ( scope )/` mention appearance, they carry a notice deferring to `DESIGN_SYSTEM.md`.

## Commands

```bash
npm run dev      # start Next.js dev server
npm run build    # production build (also type-checks)
npm run lint     # eslint (flat config, eslint-config-next)
node scripts/check-contrast.mjs   # WCAG contrast check of the colour tokens in globals.css
```

The living design-system reference is at `/design-system` (dev only; 404 in production).

There is no test runner configured (`package.json` has no `test` script). Ad-hoc verification scripts live in `scripts/` and are run directly with a TS runner, e.g.:

```bash
npx tsx scripts/verify-voice-bugs.ts
npx tsx scripts/get-voice-link.ts <email_id>
```

Supabase schema changes go through migrations in `supabase/migrations/` (applied via `supabase db push`), not through this app's code.

## Architecture

### Two auth zones, one middleware

`src/middleware.ts` → `src/lib/supabase/middleware.ts` enforces Supabase session auth on every route **except** `/voice/*` and `/api/voice/*`, which are intentionally public (they're reached via a signed link, not a login). When touching middleware, preserve this split — the voice portal must never be pulled behind the dashboard login.

### Voice portal auth: signed tokens, not sessions

`/voice/[email_id]?token=...` is authenticated by a custom HMAC-SHA256 token (`src/lib/voice-token.ts`), not Supabase Auth. Tokens are minted in two places that must stay in sync: n8n Workflow 3 (WhatsApp notifications) and `scripts/get-voice-link.ts` for manual testing. `VOICE_TOKEN_SECRET` must match between this app and n8n; there's a hardcoded dev fallback secret in `voice-token.ts` — never rely on it outside local dev.

### Server actions are the single write path

All draft/email state transitions (`src/app/(app)/emails/[id]/actions.ts`) go through three server actions — `saveDraftAction`, `approveAndSendAction`, `discardDraftAction` — each writing to `drafts` and `audit_log` and calling `revalidatePath` for `/emails/[id]`, `/voice/[email_id]`, and `/`. Client code reaches them only through hooks: `src/hooks/use-email-draft.ts` (dashboard reply state machine) and `src/hooks/use-voice-review.ts` (voice portal, passing `via: 'voice'`). Follow that pattern for any new mutation — presentation components never call actions or Supabase writes directly.

`approveAndSendAction` derives `draft_type` (`ai_generated` / `ai_edited` / `manual`) by diffing the edited text against the stored `ai_generated_text`. Setting `drafts.status = 'approved'` is what fires the Supabase `pg_net` webhook to n8n Workflow 2 for actual SMTP dispatch — the send itself happens outside this repo.

### Voice safety rule

Voice commands (`src/lib/voice-commands.ts`) can read, rewrite (formal/shorter/technical via `/api/voice/rewrite`), discard, or dictate edits — but "approve and send" by voice is deliberately intercepted and blocked (`voice_send_blocked`), requiring an explicit on-screen button tap. Don't route send actions through voice input. The recording/playback guards and command routing live verbatim in `src/hooks/use-voice-review.ts` — don't refactor that file as part of visual work.

### Post-approval lockdown

Once a draft is `approved` or `sent`, both the dashboard and voice portal must render read-only state — no re-edit, re-approve, or re-send. Use `getDraftLockState` (`src/lib/domain.ts`) before wiring any new mutation UI; the server guard (`EDITABLE_DRAFT_STATUSES` in `actions.ts`) remains the authority.

### Types are hand-maintained, not generated

`src/types/database.ts` mirrors the Supabase schema (`accounts`, `users`, `emails`, `drafts`, `audit_log`) by hand. After changing `supabase/migrations/`, update this file to match — there's no `supabase gen types` step wired in.

### n8n workflows live outside app code

`n8n/workflows/*.json` are exported canvases (ingest/classify/draft, SMTP dispatch, WhatsApp notifications) — edit them in n8n and re-export rather than hand-editing the JSON. Prompt/business logic changes to classification or drafting behavior happen there, not in this repo.

## Working conventions

- This is Next.js 16 App Router — per the AGENTS.md block above, check `node_modules/next/dist/docs/` before using any Next.js API you're not certain is unchanged from earlier versions.
- Default to Server Components; add `'use client'` only for state/handlers/browser APIs/Realtime subscriptions (see `.agents/skills/frontend-developer/` for the engineering playbook).
- Layering: primitives in `src/components/ui/` (Radix underneath Dialog/Sheet/Menu/Tooltip/ToggleGroup), stateful logic in `src/hooks/`, pure rules in `src/lib/domain.ts`, display formatting in `src/lib/format.ts`. Use semantic token utilities only (`bg-panel`, `text-fg-muted`…) — no raw hex or Tailwind default palette in new code.
- Files marked `LEGACY PRESENTATION` and the `LEGACY COMPATIBILITY LAYER` block in `globals.css` are temporary; they are replaced screen by screen per `DESIGN_SYSTEM.md` §12, never extended.
- Supabase Realtime channels (used for live Inbox/Email Detail/Audit Log updates) must be unsubscribed in the owning `useEffect` cleanup.
