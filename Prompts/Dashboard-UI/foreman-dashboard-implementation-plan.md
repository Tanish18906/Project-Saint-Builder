# Foreman Dashboard — Implementation Plan (Phased)

**For: coding agent**
**Context:** This is the execution order for building the dashboard specified in `foreman-dashboard-build-spec.md` and `foreman-dashboard-ui-design-spec.md`. Build in the phases below, IN ORDER. Do not skip ahead to a later phase until the current phase is confirmed working. Stop at the end of each phase and report back what was built, so it can be manually tested before proceeding.

Read both spec files fully before starting Phase 1.

---

## Phase 1 — Project setup + Supabase connection (no UI yet)

**Goal:** confirm the app can actually talk to Supabase before any screen is built.

- Scaffold the Next.js app (App Router), install Tailwind, install `@supabase/supabase-js`
- Set up `.env.local` (with placeholders) and `.env.example`
- Create a Supabase client helper
- Build ONE temporary test page that just fetches and console.logs (or plainly renders as raw JSON) all rows from the `emails` table — no styling, no real UI, just proof the connection works
- Do not build login, do not build any real screens yet

**Stop here. Report back:** confirm the test page successfully pulls real data from Supabase. Wait for confirmation before proceeding to Phase 2.

---

## Phase 2 — Auth (Supabase Auth, login/logout, route protection)

**Goal:** login works and blocks unauthenticated access, before any real content exists behind it.

- Build the login screen (email + password, per Section 3 of the build spec)
- Wire up Supabase Auth (`signInWithPassword`, session handling)
- Add route protection (middleware) so unauthenticated users get redirected to login
- Add a basic logout action
- The "dashboard" behind login can still just be the raw test page from Phase 1 — do not build real screens yet

**Stop here. Report back:** confirm login works with a manually-created test user, confirm logged-out users get redirected, confirm logout works. Wait for confirmation before proceeding to Phase 3.

---

## Phase 3 — Inbox list screen (Screen 2)

**Goal:** the main list view, read-only, no actions yet.

- Build the real Inbox list screen per Section 5 of the build spec
- List emails, filters (account, category), urgent visual distinction
- No click-through to detail yet — this screen just needs to correctly list and filter
- Apply base layout styling (header/nav) from the UI design spec now, so the app has its real shell going forward

**Stop here. Report back:** confirm the list loads real data, filters work correctly. Wait for confirmation before proceeding to Phase 4.

---

## Phase 4 — Email detail + draft panel (Screen 3) — READ ONLY first

**Goal:** get the detail view correctly displaying data before wiring any write actions — this is the highest-risk screen, isolate the display logic from the business logic.

- Clicking an inbox row navigates to the detail screen
- Display original email content correctly
- Display the draft textarea, pre-filled correctly (`edited_text` falling back to `ai_generated_text`)
- Display classification metadata (category/routed_role/confidence/summary from audit_log) if present
- Do NOT wire up Approve/Discard/Save buttons yet — they can exist visually but do nothing, or be omitted for now

**Stop here. Report back:** confirm the detail screen correctly shows real email + draft data for a few different test rows. Wait for confirmation before proceeding to Phase 5.

---

## Phase 5 — Approve / Discard / Save actions (the business logic)

**Goal:** wire up the actual state-changing actions — this is the most important logic in the whole app, build and test it carefully, one button at a time.

1. Build **Save Draft** first (lowest risk — just updates `edited_text`, no status change). Test it alone before moving to the next button.
2. Build **Approve & Send** next — implement the `draft_type` determination logic (ai_generated / ai_edited / manual) exactly per Section 6 of the build spec. Test that approving an unedited draft, an edited draft, and a manually-written draft each produce the correct `draft_type` value in Supabase.
3. Build **Discard** last — clears textarea, sets the local flag used by the manual-tagging logic.
4. Wire up the corresponding `audit_log` inserts for each action.

**Do this one button at a time, not all three simultaneously** — after each button is built, stop and confirm its Supabase writes look correct before building the next one.

**Stop here. Report back:** for each of the three actions, confirm what got written to `drafts` and `audit_log` in Supabase, including a specific test of all three `draft_type` outcomes (unedited approve, edited approve, discard-then-manual approve). Wait for confirmation before proceeding to Phase 6.

---

## Phase 6 — Audit log screen (Screen 4)

**Goal:** read-only history view, lowest risk, build last since nothing else depends on it.

- Build per Section 5 of the build spec — table of audit_log rows, filterable by action, joined to email subject
- No write actions on this screen

**Stop here. Report back:** confirm the audit log correctly reflects the actions taken during Phase 5 testing.

---

## Phase 7 — Full UI/design pass

**Goal:** apply the complete visual design spec across all screens now that everything works functionally.

- Apply all color tokens, typography, layout principles from `foreman-dashboard-ui-design-spec.md` across all 4 real screens
- Do not change any functional behavior in this phase — this is styling only
- Remove the temporary raw-JSON test page from Phase 1 if it's still around

**Stop here. Report back:** a summary of what was styled, and confirmation that no functional behavior changed (spot check: Approve/Discard/Save still work correctly after styling changes).

---

## General rules across all phases

- After every phase, wait for explicit confirmation before starting the next one — do not chain phases together in one uninterrupted run
- If something in the spec is ambiguous, make the simplest reasonable choice and clearly flag it in your end-of-phase report — don't block progress on it, but don't silently decide either
- Do not modify the Supabase schema at any point
- Do not build WhatsApp, voice, or role-based filtering in any phase — out of scope per the build spec
