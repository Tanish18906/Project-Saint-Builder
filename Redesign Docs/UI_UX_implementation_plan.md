# Foreman Dashboard — UI/UX Redesign: Implementation Plan (Phased)

**For: coding agent**
**Context:** Execution order for applying `UI_redesign.md` and `UX_redesign.md` to the existing, working dashboard. The dashboard is functionally complete and verified (see `foreman-progress-tracker.md`, section 5) — this plan exists specifically so a coding agent does NOT one-shot the whole redesign in a single pass. Build in the phases below, in order. Stop at the end of each phase and report back for manual testing before proceeding to the next.

Read `UI_redesign.md` and `UX_redesign.md` fully before starting Phase 0.

---

## 0. Branching — do this before any other work

**Do not work on `main`.** All work in every phase of this plan happens on a dedicated branch.

```
git checkout -b ui-ux-redesign
```

- All phases below are commits on this one branch — do not create a new branch per phase, that's unnecessary overhead for this scope. One branch, one commit (or a few) per phase, clear commit messages per phase (e.g. `phase-1: design tokens and typography`).
- `main` stays untouched and deployable at all times during this entire redesign. If anything goes wrong mid-phase, `main` is unaffected and the branch can be reset or abandoned without consequence.
- Do not merge `ui-ux-redesign` back into `main` until every phase below is complete AND the user has explicitly confirmed final sign-off. Merging early, or merging automatically at the end without asking, is not acceptable — the user decides when this goes live.
- If the coding agent's workflow (Antigravity) has its own checkpoint/restore mechanism separate from git, use both — git branch as the source of truth, agent checkpoints as an additional safety net.

---

## 1. Phase 0 — Design foundation via Stitch MCP (tokens + reference screens only)

**Goal:** generate a concrete design reference to build against, using Stitch MCP — but constrained by the specs already written, not a free-form Stitch prompt that reinvents the design.

**Important — how to use Stitch here, read carefully:** Stitch is a generation tool; if given a vague prompt it will generate a plausible-looking generic dashboard, which is the exact problem this whole redesign is trying to fix. Do not prompt Stitch with something like "design a UI for an email dashboard." Instead:

- Feed Stitch the specifics already locked in `UI_redesign.md`: the exact color tokens (Section 2), the typography direction (Section 3), the filter pattern decision (Section 4), and the reference framing from Section 1 (calm/restrained/trade-credential brand, not generic SaaS).
- Use Stitch to produce reference screens / extract a "Design DNA" (per Stitch's documented workflow with Antigravity) for the 4 existing screens — Inbox, Email Detail, Audit Log, Login — as a visual reference and starting point for design tokens (spacing scale, component shapes), not as a replacement for the specs.
- Treat Stitch's output as a **visual reference and design-token source**, not as code to paste in wholesale. The existing component structure and all business logic stay as they are — Stitch informs the styling layer only.
- If Stitch's generated result drifts from `UI_redesign.md` (e.g. reintroduces multi-hue category badges, all-caps labels, or generic card-and-icon empty states), the spec wins — don't adopt parts of the Stitch output that contradict what was already decided.

**Output of this phase:** extracted design tokens (spacing, radii, shadows if any) that complement the already-fixed color/type tokens, and reference screens saved/exported for use as a visual guide in later phases. No application code changes yet.

**Stop here. Report back:** show the reference screens/tokens pulled from Stitch, flag anything that contradicts `UI_redesign.md` and how it was resolved. Wait for confirmation before proceeding to Phase 1.

---

## 2. Phase 1 — Design tokens, color, typography (foundation layer)

**Goal:** get the base visual system in place before touching any specific screen's layout — every later phase depends on these being correct first.

- Apply the color token changes from `UI_redesign.md` Section 2 (keep charcoal/cream, replace the multi-hue category/status system with the two-tier urgency system)
- Apply typography changes from Section 3 (sentence case, hierarchy on list rows, base size)
- Do NOT touch filters, layout structure, or any component logic yet — this phase is tokens and type only, applied globally via CSS variables / Tailwind config
- Do NOT touch responsiveness/breakpoints yet — that's Phase 4

**Stop here. Report back:** screenshots of all 4 screens with new tokens applied (existing layout, new colors/type only). Confirm nothing else changed. Wait for confirmation before proceeding to Phase 2.

---

## 3. Phase 2 — Header, filters, buttons (shared components)

**Goal:** fix the shared components that appear across multiple screens, once, rather than fixing filters separately on Inbox and Audit Log.

- Header: apply Section 5 of `UI_redesign.md` — flag the logo-vs-wordmark decision point to the user explicitly, do not decide it silently, default to keeping the text wordmark unless told otherwise
- Filters: restructure per Section 4 — move from pill-row pattern to underline/segment + consolidated dropdown pattern, applied to both Inbox (Inboxes, Role Queue) and Audit Log (Action) filter bars
- Buttons: confirm visual hierarchy per Section 8 (Approve heavier weight than Discard, filter controls lighter weight than both)
- Empty states: apply Section 7's de-templatized, smaller version
- Still desktop-only at this point — no responsive/mobile work yet

**Stop here. Report back:** screenshots of Inbox and Audit Log filter bars, header, and an empty state, all at desktop width. Wait for confirmation before proceeding to Phase 3.

---

## 4. Phase 3 — Per-screen layout structure (desktop, still no responsiveness)

**Goal:** apply spacing/density changes and any screen-specific structural adjustment from `UI_redesign.md`, still at desktop width only, before introducing responsive breakpoints.

- Apply density/spacing tightening from Section 6 across all 4 screens
- Verify list row typographic hierarchy (subject/sender/timestamp weight) renders correctly with real or representative test data, not just empty states
- Confirm Email Detail two-column layout (unchanged structurally at desktop per `UX_redesign.md` Section 4) picks up the new tokens/spacing correctly

**Stop here. Report back:** screenshots of all 4 screens at desktop width with real/representative data loaded (use existing test data from the n8n workflow's test cases if available, not just empty states — the empty-state screenshots so far haven't shown how populated rows will actually look). Wait for confirmation before proceeding to Phase 4.

---

## 5. Phase 4 — Responsiveness (mobile + tablet)

**Goal:** the actual phone/laptop balance work — this is the highest-complexity phase, build one screen at a time, not all four simultaneously.

Build and test in this order, stopping between each:

1. **Screen 2 (Inbox list)** — filter-into-sheet collapse, stacked row content, per `UX_redesign.md` Section 3
2. **Screen 4 (Audit log)** — table-to-card conversion, collapsible details, per Section 5
3. **Screen 3 (Email detail)** — stacked layout, sticky bottom action bar, textarea sizing, per Section 4. This is the highest-risk screen (it contains all the write actions) — take extra care that stacking the layout doesn't change which button calls which handler
4. **Screen 1 (Login)** — quick check per Section 2, lowest risk, do last

Verify at all three breakpoint tiers per `UX_redesign.md` Section 1 (mobile / tablet / desktop) — don't just check phone-width and desktop-width and assume tablet is fine.

**Stop here. Report back:** screenshots or screen recording at mobile width for all 4 screens, confirm touch targets meet the 44px minimum (Section 8), confirm the sticky action bar on Email Detail doesn't overlap system UI. Wait for confirmation before proceeding to Phase 5.

---

## 6. Phase 5 — Perceived speed (optimistic UI, skeletons, loading/error states)

**Goal:** the highest-risk-to-business-logic phase — do this only after the visual/layout shell is fully stable and confirmed, and build one action at a time, mirroring how the original Approve/Discard/Save logic itself was built incrementally per `foreman-dashboard-implementation-plan.md` Phase 5.

1. **Skeleton loaders** first (lowest risk — purely additive, no interaction with existing write logic) for Inbox list and Audit Log
2. **Optimistic UI on Save Draft** next (lowest risk of the three actions — no status change involved)
3. **Optimistic UI on Approve & Send** next — verify the `draft_type` determination logic (`ai_generated`/`ai_edited`/`manual`) still produces byte-identical results to before; the optimistic update is about *when* the UI reflects the change, not what the change is
4. **Optimistic UI on Discard** last
5. **Error states** per `UX_redesign.md` Section 7 — add distinct error messaging for failed Supabase calls, distinguishable from empty states

**Do this one item at a time, not all five simultaneously** — same discipline as the original build's Phase 5, for the same reason: this touches the most important logic in the app.

**Stop here. Report back:** for each of the 5 items, confirm behavior with a real test (e.g. simulate a slow network / throttle in devtools to actually see the optimistic update fire before the real response). Explicitly re-run the same three `draft_type` test cases from the original implementation plan (unedited approve, edited approve, discard-then-manual approve) and confirm identical results to pre-redesign behavior. Wait for confirmation before proceeding to Phase 6.

---

## 7. Phase 6 — Full review pass + merge decision

**Goal:** final check before anything touches `main`.

- Full walkthrough of all 4 screens at all 3 breakpoints
- Confirm every business-logic path still produces correct database writes (reuse the same test matrix from `foreman-dashboard-implementation-plan.md` Phase 5 and the two end-to-end voice/dashboard tests referenced in `foreman-progress-tracker.md` section 7)
- Confirm the voice page (`/voice/[email_id]`) was not affected by any shared component changes, per `UX_redesign.md` Section 8
- Diff review: confirm no Supabase schema, query, Realtime subscription, or auth logic changed anywhere in the branch — this should be verifiable by scanning the diff for changes outside styling/layout files and component markup

**Stop here. Report back:** a full summary of every phase's changes, explicit confirmation that backend/business logic is untouched, and screenshots/recording of the finished result across breakpoints. **Do not merge to `main` at this point** — present the summary and wait for the user's explicit go-ahead before merging.

---

## 8. General rules across all phases

- After every phase, wait for explicit confirmation before starting the next one — do not chain phases together in one uninterrupted run, same discipline as the original dashboard build
- Never work directly on `main` at any point in this plan
- If something is ambiguous, make the simplest reasonable choice, flag it clearly in the phase report — don't block progress on it, but don't silently decide either (same rule as both redesign specs)
- Do not modify the Supabase schema, queries, Realtime subscriptions, or auth logic at any point
- Do not touch the `/voice/[email_id]` route — out of scope per `UX_redesign.md`
- Stitch MCP usage is scoped to Phase 0 only — do not re-invoke it mid-redesign to "regenerate" a screen; once Phase 0's reference is established, later phases implement against the written specs and that reference, not fresh Stitch prompts
