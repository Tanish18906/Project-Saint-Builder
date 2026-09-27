# Voice Page Redesign — Implementation Plan (Phased)

**For: coding agent**
**Context:** Execution order for `voice-page-ui-redesign-spec.md` and `voice-page-ux-redesign-spec.md`. Build in the phases below, IN ORDER. Stop at the end of each phase and report back — do not chain phases together in one uninterrupted run, same discipline as the dashboard's 6-phase redesign. Read both spec files fully before starting Phase 1.

**Hard constraint across all phases:** the voice page's functional core (audio capture, TTS, STT, command parsing, HMAC token auth, and the manual-tap-required send safety rule) is stable and out of scope. If any phase seems to require touching that logic, stop and flag it rather than proceeding — that's a signal the phase is being interpreted too broadly.

---

## Phase 0 — State audit (no visual or UX changes yet)

**Goal:** know exactly what currently exists before redesigning it — same principle as the dashboard alignment work's "audit before changing" step.

- Walk through the actual page states listed in the UX spec Section 2 (page load/TTS playing, awaiting input, listening, processing, command-executed, ready-to-send, sent-confirmation) plus the edge states in Section 5 (expired token, mic permission denied, no speech detected, command not understood, autoplay-blocked)
- For each state: does it currently have ANY distinct visual/informational treatment, or does it fall through to a generic/default appearance? Report this as a simple table.
- This audit becomes the shared reference point for both specs — don't guess which states need the most work, know it from this table

**Stop here. Report back:** the state audit table. Wait for confirmation before proceeding.

---

## Phase 1 — Visual hierarchy + card tier system (UI spec Sections 2, 3, 6)

**Goal:** fix the "everything has the same visual weight" problem first, since it affects how every subsequent phase's work will be perceived.

- Apply the 3-tier card weight system (context card / status-activity area / mic button as anchor)
- Restyle badges (theme/urgency/status/role) to match dashboard badge language
- Restyle voice command chips away from form-input appearance toward example-phrase appearance
- Address the dead-space gap structurally (don't fill it with real content yet — that's Phase 3 — but resolve the spacing/layout so it's ready to receive the activity indicator)

**Stop here. Report back:** before/after screenshots, confirm no functional files touched. Wait for confirmation before proceeding.

---

## Phase 2 — Mic button state system (UI spec Section 4, UX spec Section 2 states 2-4)

**Goal:** the centerpiece component — idle/listening/processing states, visually distinct, isolated from everything else so it can be tested on its own.

- Implement the 3+ mic button visual states per UI spec Section 4
- Wire these states to the actual existing interaction logic (holding = listening, released = processing) — connecting existing state to new visuals, not creating new state logic
- This phase directly addresses UX spec's flagged priority: states 2 ("awaiting input"), 3 ("listening"), 4 ("processing") currently have no distinct treatment

**Stop here. Report back:** recordings or screenshots of all mic button states in sequence (idle → listening → processing), confirm the underlying press/release logic was not modified, only visually hooked into. Wait for confirmation before proceeding.

---

## Phase 3 — Activity indicator + status area (UI spec Section 6, UX spec Section 3)

**Goal:** fill the dead space with the waveform/activity indicator that distinguishes "app is talking" from "app is listening," resolving the biggest single legibility gap identified in the UX spec.

- Build the activity indicator component
- Two distinct visual modes: TTS-playing vs. user-listening
- Integrate into the Tier 2 status area established in Phase 1

**Stop here. Report back:** screenshots/recording showing both modes of the activity indicator. Wait for confirmation before proceeding.

---

## Phase 4 — Command-executed feedback + Show Text Instead (UX spec Sections 2 state 5, 6)

**Goal:** close the "silent update" gap — after a voice edit command, the user needs audible/visual confirmation, not a silently changed draft.

- Implement the confirmation-then-reread behavior recommended in UX spec Section 2, state 5 (flag this as a product-behavior decision in the report, since it changes what happens after every edit command)
- Resolve and implement the "Show Text Instead" purpose/prominence question per UX spec Section 6 — implement the verification-tool framing recommended, flag as needing client confirmation
- Restyle the Approve & Send button area and Show Text Instead control per UI spec Section 5

**Stop here. Report back:** confirm the state-5 behavior change (auto-confirm + reread after edits) works correctly and doesn't conflict with the manual-tap-to-send safety rule. Explicitly flag the Show Text Instead framing decision for the user to confirm with the client if desired. Wait for confirmation before proceeding.

---

## Phase 5 — Autoplay-blocked and error/edge states (UI + UX Sections 4-5)

**Goal:** the states most likely to currently be broken-looking or invisible — expired token, mic permission denied, no speech detected, command not understood, autoplay blocked.

- Design and implement each edge state per UX spec Section 5 and Section 4
- Each should visually match the established design language from Phases 1-3, not read as a raw error/browser-default message
- Test each state can actually be triggered and observed (may require temporarily forcing conditions — e.g. an expired token — rather than waiting for them to occur naturally)

**Stop here. Report back:** screenshot/confirmation of each edge state, and how each was triggered for testing (so the user can independently re-verify). Wait for confirmation before proceeding.

---

## Phase 6 — Mobile-first pass + final polish

**Goal:** confirm the full redesign holds up on real mobile viewport widths, since this page is primarily reached via WhatsApp on mobile devices.

- Test all states from Phases 1-5 at actual mobile viewport widths, not just responsive breakpoints in isolation
- Touch target sizing check on mic button and any newly interactive elements
- Confirm the voice command chips (Section 7 of UX spec — deferred context-awareness, static list expected) render cleanly at mobile width
- Final pass: remove any temporary/debug elements used for edge-state testing in Phase 5

**Stop here. Report back:** mobile screenshots of the full flow, confirmation of touch target sizes, confirmation debug/test scaffolding was removed.

---

## General rules across all phases

- Wait for explicit confirmation after every phase before starting the next — no exceptions, no chaining
- If a phase reveals the underlying functional logic needs a genuine change (not just a visual hook-in) to support the desired UX, stop and flag it explicitly rather than making the change — this is a deliberate boundary, not a suggestion
- Any product-level decision flagged in either spec (state-5 confirm-then-reread behavior, Show Text Instead framing) should be clearly called out in that phase's report as "implemented per spec recommendation, flagging for your/client confirmation" — not silently treated as final
- Do not modify the dashboard's 4 screens or any backend/n8n workflow as part of this work — voice page only
