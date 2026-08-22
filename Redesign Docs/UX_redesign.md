# Foreman Dashboard — UX Redesign Spec

**For: coding agent**
**Context:** Companion to `UI_redesign.md` — that file covers visual styling (color, type, spacing, component look). This file covers layout, structure, and interaction: what goes where on each screen, how it adapts between phone and laptop, and what happens during loading/empty/error states. Together they're the "polish" pass requested after core functionality was confirmed working (see `foreman-progress-tracker.md`, section 5).

**Hard constraint — same as UI_redesign.md:** Frontend/layout only. Do not touch Supabase queries, Realtime subscriptions, business logic (Approve/Discard/Save, draft_type tagging, post-approval lockdown), auth, or routing logic. Every handler keeps calling exactly what it currently calls. Restructuring layout (e.g. how the email detail screen arranges its two panels) is in scope; restructuring *what data loads or when a write happens* is not.

If ambiguous, pick the simpler option, note it in your summary — don't block on it.

---

## 0. Design principle for responsiveness

**One dashboard, two contexts — not two dashboards.** The goal is not a phone-specific redesign and a separate laptop redesign. It's the same structure, same components, same information, that reflows sensibly at different widths. If you find yourself wanting to hide entire features on mobile or build a fundamentally different navigation model per device, stop — that's over-engineering for a tool with 4 screens and a handful of users. Standard responsive reflow (stacking, collapsing filters into a drawer/sheet, adjusting touch targets) is enough.

Reference point: staff will likely use laptop for extended triage sessions (working through the inbox) and phone for quick checks/approvals (e.g. a Director glancing at an urgent email from a job site, or via the voice-page WhatsApp link already built). Both contexts need to fully work, not just "not be broken."

---

## 1. Breakpoint strategy

Use Tailwind's default breakpoints, no custom ones needed for a 4-screen internal tool:
- `< 768px` (mobile): single column, stacked layouts, touch-sized targets
- `768px – 1024px` (tablet): treat as a transitional width — closer to mobile behavior for anything with a two-column split, closer to desktop for lists/tables
- `> 1024px` (laptop/desktop): full layout as currently designed

Don't build bespoke behavior for every pixel range in between — three tiers is enough for this app's complexity.

---

## 2. Screen 1 — Login

No structural change needed. It's already a single centered form, which is inherently responsive. Just confirm:
- Form width caps sensibly on desktop (don't let it stretch full-width on a wide laptop screen — max-width around 400-420px, centered)
- Touch targets (email/password fields, submit button) are large enough on mobile — minimum 44px tap height, standard mobile accessibility baseline

---

## 3. Screen 2 — Inbox list

**Laptop:** current structure is fine — filter bar at top, list below. Apply the visual changes from UI_redesign.md Section 4/6, no layout restructure needed.

**Mobile:**
- Filter bar (Inboxes / Role Queue / Category / Status / Search) as currently built will not fit horizontally on a phone width and will wrap awkwardly or overflow. Collapse into a single "Filters" button that opens a bottom sheet or slide-over panel containing all filter controls stacked vertically. This is standard mobile pattern, not a new interaction concept to invent.
- Keep search as a persistent visible input above/near the filter button — search is the fastest path to a specific email and shouldn't be buried behind a sheet.
- List rows: stack subject/sender/category/timestamp vertically within the row instead of relying on horizontal space. Subject first (heaviest weight), sender + timestamp on one line beneath it, category tag/urgency accent visible without needing horizontal scroll.
- Urgent/priority left-border accent (from UI_redesign.md) must remain visible at mobile width — don't let it get clipped or shrunk to nothing.

---

## 4. Screen 3 — Email detail + draft panel

This is the highest-stakes layout change and the one most worth getting right, since it's also the screen mirrored by the voice page's mobile-first design (per progress tracker section 7 — the voice route already proves mobile-first patterns work for this exact content).

**Laptop:** keep the current two-column layout (email left/top, draft right/bottom) — it works, no change needed structurally. Apply UI_redesign.md visual changes only.

**Mobile — stacked, not tabbed:**
- Original email content on top, draft panel below, single vertical scroll. This is the default choice over a tab/toggle pattern for one concrete reason: the whole point of this screen is reading the email *then* acting on the draft — a linear top-to-bottom flow matches that task order exactly, and it requires zero new interaction state (no active-tab tracking, nothing to test beyond standard scroll). A tab pattern would hide the draft until tapped, adding a step to the single most common action in the app (review and approve).
- Add a **sticky action bar** at the bottom of the viewport on mobile once the user scrolls into the draft section — Approve & Send / Discard / Save Draft should not require scrolling all the way down to find them once the user is ready to act, especially relevant for one-handed phone use in the field. This is layout/CSS only (`position: sticky` or `fixed`), not a new interaction pattern.
- Metadata (category, routed_role, confidence, summary from audit_log) stays near the top, above the email body, on both breakpoints — don't bury it.
- Textarea for the draft should expand to a sensible height on mobile (not the fixed height that might work on laptop) — auto-grow or a generous min-height so editing doesn't feel cramped in a tiny box.

---

## 5. Screen 4 — Audit log

**Laptop:** table/list format as currently built, apply UI_redesign.md visual changes.

**Mobile:** a wide table with columns (created_at, action, subject, details) will not work at phone width without horizontal scrolling, which is a bad pattern for a list users will scan quickly. Convert each row into a stacked card format instead:
- Action + timestamp on one line (these are the scannable "what happened when" facts)
- Email subject below it
- Details (JSON metadata) collapsed by default, expandable on tap if the user wants to see it — don't dump raw/rendered JSON into every row by default on a small screen, it'll dominate the view

Filter (Action type) follows the same collapse-into-sheet pattern as Screen 2 on mobile.

---

## 6. Speed — perceived first, real second

Two different things, don't conflate them. Priority order below, based on this being a tool staff use continuously through the workday, where responsiveness to *their own actions* matters more right now than raw page-load milliseconds.

### 6a. Perceived speed (do this first)

- **Optimistic UI on Approve / Discard / Save.** Currently (per the build spec's own logic section) these actions update Supabase and presumably wait for confirmation before reflecting in the UI. Change the *client-side* behavior only: update local component state immediately on click (show the new status, disable the buttons, show a subtle "saving..." indicator) before the Supabase write resolves, then reconcile silently if the write fails (show an error and revert). The underlying Supabase call and business logic per `foreman-dashboard-build-spec.md` Section 6 stays byte-for-byte identical — this is purely about when the UI *reflects* the result, not what the result is.
- **Skeleton loaders, not spinners, for list content.** When the Inbox list or Audit Log is fetching, show gray placeholder rows matching the real row shape rather than a centered spinner — this reduces perceived wait time and avoids the jarring "blank screen then sudden content" pop-in. Standard pattern, low effort.
- **Button loading states.** Approve/Discard/Save buttons should show an inline loading indicator (not a full-page overlay) while their write is in flight, and be disabled during that window to prevent double-submits — this may already be partially true given the "post-approval lockdown" logic exists; verify it covers the in-flight window too, not just the post-success state.

### 6b. Actual load performance (second pass, lower urgency)

- Verify Realtime subscriptions are scoped per-screen (only subscribe to the tables/rows the current screen needs) rather than one global subscription firing re-renders across screens that aren't visible — check this against the existing Realtime implementation before assuming it's an issue; if it's already scoped correctly, note that and move on.
- Standard Next.js hygiene: confirm images (if any client logo per UI_redesign.md Section 5 gets added) are served via `next/image`, not raw `<img>`, for automatic sizing/lazy-loading.
- Not urgent for a 4-screen internal tool with a small user base: bundle-size micro-optimization, code-splitting beyond what Next.js does by default. Don't spend time here unless the app is measurably slow to load in practice — this is the "actual load time" work getting deprioritized on purpose, per the earlier discussion, not an oversight.

---

## 7. Loading, empty, and error states — behavior, not just look

UI_redesign.md covers what these should *look* like (smaller, quieter, less templated). This section covers what they should *do*:

- **Loading**: skeleton rows (Section 6a), never a blank white screen with no feedback.
- **Empty (no data yet)**: e.g. "No emails match your filters" — should be genuinely distinguishable from an error state, not the same generic message reused. If filters are active and producing zero results, that's different from the inbox being genuinely empty — consider whether the copy should differ (e.g. "No emails match these filters" with an implicit "try clearing them" vs. "Inbox is empty" with no filters active). Small detail, real usability difference.
- **Error** (Supabase call fails): every screen needs an actual visible error state distinct from the empty state — currently unspecified in the original build spec. At minimum: a plain message ("Couldn't load emails — try refreshing") without technical error text exposed to end users. Do not silently fail into an empty-state look, since that would tell a Director "there's nothing here" when the real problem is a connection failure — a meaningfully worse outcome for a tool people depend on all day.

---

## 8. Touch targets and mobile interaction hygiene

- Minimum 44x44px tappable area on all interactive elements at mobile width (buttons, filter chips, list rows) — standard mobile accessibility baseline, not optional polish.
- Ensure the sticky bottom action bar (Section 4) doesn't overlap system UI (browser chrome, iOS home indicator) — standard safe-area-inset handling in CSS.
- Confirm the existing voice-page work (already mobile-first per progress tracker section 7) isn't affected by any shared component changes — if the dashboard and voice page share any components (buttons, badges), verify changes here don't regress the voice page, which is already tested and working.

---

## 9. What NOT to do

- Do not build separate mobile-only or desktop-only component trees — one component, responsive styling, per Section 0.
- Do not add a hamburger-menu-style full navigation restructure — this app has 2 real destinations (Inbox, Audit Log) plus detail views reached by clicking a row; it doesn't need complex mobile nav patterns built for apps with 10+ sections.
- Do not touch the voice page route (`/voice/[email_id]`) — it's already built mobile-first and separately tested/verified per the progress tracker; this spec is for the main dashboard only.
- Do not change what data loads, when writes happen, or any Supabase/Realtime logic — perceived-speed changes in Section 6a are client-side state timing only, not new backend behavior.
- Do not over-invest in Section 6b (actual load performance) before confirming it's actually a problem in practice — this is explicitly lower priority.

---

## 10. Output expected from the coding agent

- Responsive layout changes applied across all 4 screens per Sections 2-5
- Optimistic UI implemented for Approve/Discard/Save per Section 6a, with confirmation that underlying business logic is unchanged
- Skeleton loading states added for list/table content
- Distinct error states added where previously unspecified (Section 7)
- Touch target and mobile interaction check per Section 8
- A short summary: what changed per screen, what was flagged as ambiguous and how it was resolved, confirmation that voice page and backend logic were not touched, and a spot-check that Approve/Discard/Save still produce correct `draft_type` and `audit_log` results after the changes (same test as Phase 5 of the original implementation plan — reuse it, don't invent a new test)
