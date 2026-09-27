# Foreman Design System

**Status:** Authoritative · adopted 2026-09-27
**Supersedes:** everything in `Docs/archive/superseded-design/` and any visual guidance in older specs (those files carry a notice).
**Living reference:** `/design-system` (development only). It renders the real tokens and primitives.
**Tokens:** `src/app/globals.css` · **Primitives:** `src/components/ui/` · **Contrast check:** `node scripts/check-contrast.mjs`

If this document and older docs disagree about appearance, layout or interaction, this document wins. It does **not** override functional rules; see §15.

---

## 1. What we are building

Foreman is a work queue. Staff open it to review AI-drafted replies, adjust them, and send them. Some staff do this for hours at a desk; some do it on a phone on site. Every design decision serves that job.

**Principles**

1. **The job, not the database.** Organise screens around *what needs doing* (review, urgent, handled), not around tables.
2. **Calm density.** Show a lot, quietly. Tight rows, restrained colour, strong type hierarchy. Dense, never cramped.
3. **Hierarchy through type and space first**, colour last. When everything is coloured, nothing is.
4. **Consequence is visible.** Sending email is irreversible. The UI slows the user down exactly there and nowhere else.
5. **State is always legible.** Loading, empty, error, locked, sending and sent all look different, and none of them relies on colour alone.
6. **Keyboard-first on desktop, thumb-first on phones.** Same system, two input models.
7. **No decoration.** No gradients, glows, ambient pulsing, illustration, or emoji in UI copy. Motion only explains a change of state.
8. **Production quality.** Something you could show a paying client without caveats.

---

## 2. Architecture

```
src/app/globals.css          tokens: primitive → semantic → component; legacy block (temporary)
src/components/ui/           primitives. No data access, no domain knowledge.
src/components/<feature>/    feature components: shell/, queue/, workspace/ (built); activity/, voice/ next
src/hooks/                   stateful logic: realtime, draft state machine, filters, voice session
src/lib/domain.ts            record types, option lists, pure rules (lock state, parsing)
src/lib/format.ts            display formatting (dates, roles, themes, draft types)
src/lib/cn.ts                class joiner
```

**Rules**

- **Presentation never owns business logic.** Components render state and call handlers from hooks. Hooks call the shared server actions. Nothing else writes.
- **Primitives are the only place interaction styling lives** (focus, hover, disabled, sizes). Feature code composes them and passes `className` only for layout: margin, width, grid placement. Never recolour a primitive from outside. If you need a new look, add a variant.
- **Semantic tokens only.** Components use `bg-panel`, `text-fg-muted`, `border-line`, and so on. Never `--p-*` primitives, raw hex values, or Tailwind's default palette (`bg-stone-100`, `text-red-700`).
- **Radix for accessibility-heavy overlays** (Dialog, AlertDialog, Sheet, DropdownMenu, Tooltip, ToggleGroup). They provide focus trapping and restoration, Escape handling, scroll lock, roving focus and ARIA. Everything else is plain React and Tailwind. Don't add a styled component library.
- **Server Components by default;** `'use client'` only for state, handlers, browser APIs or Realtime.

---

## 3. Colour

### 3.1 Primitives (`--p-*`, never used directly)

| Scale | Character | Steps |
|---|---|---|
| `neutral` | graphite with a faint warm cast | 0, 25, 50, 100, 150, 200, 300, 400, 500, 600, 700, 800, 900, 950 |
| `ink` | the one accent: a deep, slightly cool blue | 50–900 |
| `red` | danger / urgent | 50, 100, 200, 500, 600, 700 |
| `amber` | warning / priority | 50, 100, 200, 500, 600, 700 |
| `green` | success / done | 50, 100, 200, 500, 600, 700 |

### 3.2 Semantic tokens (Tailwind utilities)

| Token | Use |
|---|---|
| `canvas` | App background behind panels |
| `panel` | Raised content: lists, workspace, cards, dialogs |
| `sunken` | Wells, read-only fields, skeleton base, neutral badges |
| `hover` / `pressed` | Row and ghost-control hover / active |
| `selected` | The current row or item (paired with a marker, not colour alone) |
| `overlay` | Modal scrim |
| `inverse` | Tooltips, toasts |
| `fg` | Primary text (16.1:1) |
| `fg-muted` | Secondary text (6.7:1) |
| `fg-subtle` | Tertiary text and metadata (5.4:1; 4.8:1 on `selected`) |
| `fg-disabled` | Disabled text only (exempt from contrast) |
| `fg-on-accent` | Text on `accent` / `danger` fills |
| `line` | Hairline separators (decorative) |
| `line-strong` | Panel outlines, table headers |
| `line-control` | Form control borders; meets 3:1 (WCAG 1.4.11) |
| `focus` | Focus ring (5.1:1 on panel) |
| `accent` (+`-hover`, `-pressed`) | The primary action, links, selection, info |
| `accent-subtle` / `accent-line` / `accent-fg` | Info surfaces, selected chips, accent text |
| `danger` (+`-hover`) | Destructive fills (rare) |
| `danger-subtle` / `-line` / `-fg` / `-mark` | Urgent and error surfaces, text, stripes and dots |
| `warning-subtle` / `-line` / `-fg` / `-mark` | Priority and caution |
| `success-subtle` / `-line` / `-fg` / `-mark` | Approved, sent, saved |

`-fg` tokens are for text (≥ 4.5:1). `-mark` tokens are for non-text signals such as stripes, dots and icons (≥ 3:1). `scripts/check-contrast.mjs` verifies every pair above; run it after touching any colour.

### 3.3 Colour budget

- **One accent.** Ink marks the primary action, links and selection. Nothing else is blue.
- **Status colour carries status only.** Red means urgent or error. Amber means priority or caution. Green means approved, sent or saved.
- **Categories (themes, roles, inboxes) are neutral.** The label carries the meaning, not a hue.
- **Never colour alone.** Every coloured signal also has text, an icon or a shape: urgent rows have a stripe *and* an "Urgent" label; errors have an icon *and* a message.
- **Dark theme:** the semantic layer is the only thing it would redefine. Not shipped; don't add one-off dark styles.

---

## 4. Typography

**Faces:** IBM Plex Sans (UI) and IBM Plex Mono (identifiers such as Message-IDs and references), self-hosted through `next/font`. Weights **400 / 500 / 600** only. Use `tabular-nums` for any number that sits in a column or changes live.

| Token | Size / line | Use |
|---|---|---|
| `text-3xl` | 28/36 | Login wordmark only |
| `text-2xl` | 22/30 | Reserved; not used by the workspace (the subject is `text-xl` — the client wants density over drama) |
| `text-xl` | 18/26 | Page titles; the workspace email subject |
| `text-lg` | 16/24 | Section and dialog titles; all input text on touch devices |
| `text-md` | 15/24 | **Reading**: email body, reply draft |
| `text-base` | 14/22 | Default UI: rows, buttons, menus |
| `text-sm` | 13/20 | Secondary UI, descriptions |
| `text-xs` | 12/16 | Metadata, timestamps, labels. **Floor for persistent text.** |
| `text-2xs` | 11/16 | Badges and keyboard hints only |

Tailwind's default type scale is cleared, so only these exist. Note that `text-sm` and `text-base` are **13px and 14px**, not Tailwind's defaults.

- Sentence case everywhere. No all-caps headings; small caps and tracking belong in badges at most.
- Headings at `text-lg` and above use `tracking-[-0.01em]`.
- Reading text is capped at `--fm-c-reading-max` (~72ch).
- Hierarchy inside a row: subject `base/600 fg` → sender `sm/400 fg-muted` → time `xs mono fg-subtle`.

---

## 5. Space, layout and density

- **4px grid.** Use Tailwind steps 1, 1.5, 2, 3, 4, 5, 6, 8, 10, 12, 16. Avoid odd steps except 0.5 for optical fixes.
- **Control heights:** 28 (`sm`), 32 (`md`, default), 40 (`lg`). Every control grows to **44px on coarse pointers** automatically (`pointer-coarse:`), so touch targets need no per-screen work.
- **Rows:** compact 40px (activity, tables) and comfortable ~68px (queue rows with a preview line).
- **Shell geometry tokens:** `--fm-c-topbar-h` 48, `--fm-c-sidebar-w` 232, `--fm-c-queue-w` 384, `--fm-c-reading-max` 44rem.
- **Gutters:** 16px on phones, 24px from `sm` up. Panels pad 16/20px, and lists run edge to edge inside panels.
- Panels are never nested inside panels. Separate regions with `Separator`, a `PanelHeader` border, or space.

---

## 6. Radius, borders and elevation

| Radius | px | Use |
|---|---|---|
| `rounded-xs` | 2 | kbd, tiny details |
| `rounded-sm` | 4 | badges |
| `rounded-md` | 6 | controls, menu items, inline alerts |
| `rounded-lg` | 8 | panels, popovers, toasts |
| `rounded-xl` | 12 | dialogs, sheets |

- **Borders do the structural work.** `line` for separators, `line-strong` for panel outlines, `line-control` for inputs.
- **Shadows only for elevation that means something:** `shadow-xs` resting panels and buttons, `shadow-sm` the active segment, `shadow-md` menus and tooltips, `shadow-lg` dialogs, sheets and toasts.

---

## 7. Interaction states

| State | Treatment |
|---|---|
| **Hover** | `bg-hover` on rows and ghost controls; border darkens on outlined controls; primary deepens to `accent-hover`. Never the only affordance. |
| **Pressed** | `bg-pressed` / `accent-pressed`. |
| **Focus** | 2px `focus` ring with a 2px offset (`focusRing`). Visible on keyboard focus only (`:focus-visible`). Inset rings inside lists. Never removed without a replacement. |
| **Selected** | `bg-selected` plus a structural marker (`aria-selected`, a stripe or a check). |
| **Disabled** | `fg-disabled` text, `sunken` fill, `cursor-not-allowed`. Explain *why* nearby when it isn't obvious (e.g. "Write a reply to enable sending"). |
| **Loading (action)** | The button keeps its colour and shows a spinner; it is `aria-busy` and ignores clicks. Its width doesn't change. |
| **Loading (content)** | A skeleton shaped like the content, inside `SkeletonRegion` so screen readers hear "Loading…". No full-page spinners. |
| **Empty** | `EmptyState`: one line saying what's absent, plus an optional next step. "No results for these filters" and "nothing here yet" use different copy. |
| **Error** | `ErrorState` (load failure) or a danger `InlineAlert` / toast (action failure). A plain-language cause and what to do. Never raw error text, and never disguised as empty. |
| **Read-only / locked** | Content stays selectable, controls disappear rather than just greying out, and a success `InlineAlert` says what happened, when, and that it's locked. |
| **Invalid** | `aria-invalid` gives a danger border plus an icon and a message linked through `aria-describedby`. |

---

## 8. Motion

- Durations: `--fm-duration-fast` 120ms (hover, press), `-base` 160ms (enter), `-slow` 220ms (sheets). Easing: `ease-standard` to enter, `ease-exit` to leave.
- Animate **state changes only**: overlays entering and leaving, toasts, row insertion and removal, and the pressed-to-busy transition.
- **Only three things may loop:** spinners, skeleton pulse, and the live-audio meter while audio is actually playing or recording. No idle pulsing, breathing or bouncing.
- `prefers-reduced-motion` removes all animation globally. Motion must never be the only carrier of meaning.

---

## 9. Primitives (`src/components/ui`)

| Primitive | Notes |
|---|---|
| `Button` | Variants `primary` (one per context), `secondary`, `ghost`, `danger`, `danger-ghost`. Sizes `sm`/`md`/`lg`. `loading`, `leadingIcon`, `asChild` (for `next/link`). |
| `IconButton` | `label` is required: it becomes the accessible name and the tooltip. `active` for toggles; `shortcut` hint. |
| `Badge` | `tone` × `variant` (`subtle`/`outline`/`solid`), optional `dot`/`icon`. `solid` only for terminal states (Sent) and Urgent. |
| `Field` | Label, hint and error with ids and `aria-describedby` wiring. Wraps any control through a render prop. |
| `Input`, `Textarea`, `Select` | Share `controlBase` + a colour set. `Input` `variant="quiet"` is the filled toolbar search field (no border at rest) — never for forms. `Textarea` has `autoGrow` and `reading` (15px). `Select` is native, for simple single-value choices. |
| `Popover` | Non-modal anchored panel (filters). Opens with focus on the panel, not the first field. On phones use a bottom `Sheet` with the same contents. |
| `SegmentedControl` | 2–5 peer views; arrow-key navigation (Radix ToggleGroup). |
| `Panel`, `PanelHeader`, `Separator` | The one raised surface. |
| `Skeleton`, `SkeletonRegion`, `Spinner` | Loading. |
| `EmptyState`, `ErrorState`, `InlineAlert` | Persistent states. `InlineAlert` tones: info, success, warning, danger. |
| `Tooltip` (+`TooltipProvider`) | Supplementary only; never essential information. Mounted once in `Providers`. |
| `Dialog` / `DialogContent` | Focused tasks. |
| `ConfirmDialog` | **Consequential or irreversible actions.** `role="alertdialog"`, ignores scrim clicks, initial focus on Cancel, confirm button shows loading. It's controlled (no Radix trigger), so pass `onCloseAutoFocus` to send focus back to the opening button — or to the result when that button no longer exists. |
| `Sheet` / `SheetContent` | `bottom` (phone panels, safe-area aware) or `right` (secondary details). |
| `DropdownMenu*` | Action menus and sort/radio choices. |
| `ToastProvider` / `useToast` | Transient results of the user's own actions. Errors persist until dismissed; at most three on screen. Toasts rise above any on-screen sticky action bar (`[data-composer-actions]` sets `--fm-toast-lift` / `--fm-bottom-offset`). |
| `Kbd` | Shortcut hints; hidden on touch-only devices. |

---

## 10. Patterns

**Feedback: where a message goes**
- A transient result of *my* action ("Draft saved", "Copied") → toast.
- State that must persist in context ("Approved · locked", "Drafting in progress", "Microphone blocked") → `InlineAlert`.
- A failure to load a region → `ErrorState` in that region.
- Never stack persistent success banners above the content.

**Consequential actions (sending)**
- "Approve & send…" (with the ellipsis; also ⌘/Ctrl+Enter in the reply) opens a `ConfirmDialog`: **To, From (the sending inbox), Subject (as n8n sends it: `Re: …`), reply provenance, word count, "plain text"**, and the reply text itself. The description says plainly that it sends now and can't be undone or recalled. Hierarchy and words carry the weight — the confirm button is the normal primary, not red.
- Cancel is the default focus; scrim clicks never dismiss; it can't be dismissed while the send is in flight. A failure keeps the dialog open with "Nothing was sent" and a **Try again** confirm; the optimistic lock is rolled back.
- After success: an inline locked state ("Approved — sending", then "Sent" when n8n reports it) with **Next email** / **Back to <view>** — or "That was the last email in <view>" — plus a toast offering **Next email**. Focus moves to the locked state.
- The backend is unchanged: confirming calls the same `approveAndSendAction`.

**Discard** clears the drafted text so a manual reply can be written; it does not close or archive the email. Because it writes to the audit log and changes the email's state in the queue, it confirms first (`ConfirmDialog`, danger tone) with copy that says exactly that. The AI draft stays restorable ("Restore AI draft") until a reply is approved.

**Review workspace** (`src/components/workspace/`, route `/emails/[id]`)
- Reading order is decision order: subject (`text-xl`) → sender, time, inbox, urgency → **Triage** (summary; routed to; theme; confidence as High ≥85% / Medium 60–84% / Low <60%, Low in warning text "— check the routing") → the original email → **Reply** → context (other messages in the thread, then Activity).
- A size container: when the pane is ≥ 60rem the reply moves into a sticky right column (24–28rem) beside the email; narrower panes stack it after the email. This follows the pane, not the window, so it responds to the sidebar too.
- **Reply header** says three things in words: provenance (the `draftTypeLabel` vocabulary — AI draft · unedited / AI draft · edited / Manual reply; display only, the server still derives `draft_type`), and a save state: **Saved · Saving… · Unsaved changes · Not saved · Locked**. No success banners; results are toasts.
- **Compare with AI draft** shows a real word diff (removed struck through, added underlined, with screen-reader "[removed: …]" text) when the text differs from the stored AI draft.
- The action bar (Discard draft · Save draft · Approve & send…) is `sticky bottom-0` inside the reply, so it follows you while the reply is on screen and never appears before you have reached it; safe-area padded on phones.
- **Original email:** HTML is sanitised by DOMPurify (config unchanged) in the browser and rendered in a **shadow root** with token-based reading styles — the email's own CSS can't restyle the app, the app's utilities can't flatten the email, paint containment keeps `position: fixed` content inside the email's box, links open in a new tab (`noopener`), and forms can't submit. Plain-text bodies render as pre-wrapped reading text.
- **Activity** for this email only: every `audit_log` row, oldest first, in plain words ("Reply approved · Dev User — AI draft · edited · By voice") with exact UK timestamps (seconds). Unknown actions are shown, never dropped; a failed read says so.
- **Keyboard:** J / K next / previous in the queue's order, Esc back to the queue (focus returns to that row), R to the reply, ⌘/Ctrl+S save, ⌘/Ctrl+Enter review and send. With an email open, J/K belong to the workspace; ↑/↓ still move within the list.
- **Unsaved changes are protected:** moving to another email or screen (links, J/K, back, close) asks "Leave without saving?"; closing the tab uses the browser's warning. Changing queue search/filters never navigates the email away.
- **States:** loading skeleton in the workspace's shape (queue stays put) · unavailable email · load failure with Try again · waiting for the suggested reply · manual reply · discarded (with restore) · locked approved / sent.

**Lists — the queue row** (`src/components/queue/queue-row.tsx`)
- Three lines: *sender · urgency · time* / *subject · reply state* / *context (theme · routed roles) — preview*. Sender `base`, subject `sm`, preview `sm fg-subtle`, time `xs` tabular.
- **Needs your decision** = an accent dot in the gutter and a semibold sender. That is the only accent colour in a resting row.
- **Urgent** = inset `danger-mark` stripe + the word "Urgent". **Priority** = the word only (no stripe) so the list never becomes a column of warning colours. Normal shows nothing. Handled rows drop urgency and mute the sender.
- **Reply state** comes from `getReviewStatus` (built on `getQueueState`): Draft ready · Edited · Draft discarded · No draft yet · Approved · Sent · Closed. A label that would repeat on every row of a view (Draft ready in Review) is hidden visually and kept for screen readers.
- Times are mail-style in UK time: `09:42` today, `Yesterday`, weekday within a week, then `12 Sept`; the full timestamp is in the title.
- One row is in the Tab order (roving focus). `J`/`K` or `↑`/`↓` move, `Home`/`End` jump, `Enter` opens, `/` focuses search, `Esc` clears then leaves search.
- A row is a single link, focus ring inset; selected (open in the workspace) uses `bg-selected`.

**Queue controls**
- One quiet search field (`Input variant="quiet"`, capped width) and one Filter control (Inbox, Urgency, Theme, Routed to). Never a row of equal-weight dropdowns.
- Active filters appear as removable chips under the toolbar. View, search, filters and paging are URL params (`view`, `q`, `inbox`, `urgency`, `theme`, `role`, `limit`); parameters are validated in `parseQueueParams`.
- Filter/search changes re-query on the server in a transition: the list dims slightly and a small spinner shows; no full-page loader.
- The queue pane lives in the layout (`MailFrame` + `MailProvider`) and reads `/api/queue` (same `getQueuePage`), so it stays mounted — scroll, selection and focus — while emails open beside it. Search/filter changes use the History API (no server round trip; an open email is untouched). Live changes to emails/drafts re-read it.
- Load failure → `ErrorState` with retry. Empty copy is per view ("You’re all caught up"…); "No emails match" is used only when search/filters are active.

**Forms:** a visible label always (use `hideLabel` only when context makes it obvious, such as search). Errors go under the field, not only in a toast.

**Copy:** sentence case, plain British English, verbs on buttons ("Save draft", not "Submit"), no emoji, no exclamation marks, and no "successfully".

---

## 11. Responsive behaviour

| Tier | Width | Shell | Queue ↔ workspace |
|---|---|---|---|
| Phone | < 640 | Top bar and bottom tab bar | List → full-screen workspace with a **sticky action bar** (safe-area aware) |
| Tablet | 640–1279 | Collapsible sidebar (icons) | List → full-screen workspace |
| Desktop | ≥ 1280 | Persistent sidebar | **Split view:** queue list + review workspace side by side; the workspace itself goes two-column when it is ≥ 60rem wide |

- One component tree, reflowed. Don't build separate mobile and desktop components.
- `/emails/[id]` remains the canonical, deep-linkable URL at every tier. WhatsApp links and bookmarks keep working.
- Touch devices get 44px targets and 16px input text automatically (§5).
- No horizontal scrolling of the page at any width. Wide tables become stacked rows on phones.

---

## 12. Information architecture and rebuild plan

**Navigation (work-organised):** **Review** (`/`, drafts awaiting a decision; the home view) · **Urgent** · **All mail** (with per-inbox sub-views: info@, team@) · **Handled** (approved, sent, discarded) · **Activity**. Views are URL search params, so filters survive list → detail → back and can be shared.

**Review workspace hierarchy:**
1. Sender, subject, urgency
2. AI triage (summary, routed roles, confidence as High/Medium/Low)
3. Original message
4. Activity and context for this email
5. Reply composer
6. Draft provenance (AI unedited / edited / manual, diff against the AI draft)
7. Review and edit state
8. Send action (§10)

**Voice** (`/voice/[email_id]`) uses the same system as a single-task mobile flow: **Listen → Adjust → Review text → Send**. Reviewing the final text is a required step before the send button appears. Safety invariants are in §15.

**Implementation order** (each step reviewed before the next):
1. ✅ Retire old visual authority
2. ✅ This document
3. ✅ Presentation/logic split (hooks + domain + format)
4. ✅ Primitives
5. ✅ Application shell (route-group layout; fixes the duplicated Navbar and the identity flicker)
6. ✅ Review queue
7. ✅ Review workspace (the queue stays beside the open email)
8. Activity
9. Voice
10. Login, error, loading, not-found
11. Responsive and accessibility pass
12. Regression test of existing functionality

**Legacy layer:** the block marked `LEGACY COMPATIBILITY LAYER` in `globals.css` maps retired token names onto the new tokens so un-rebuilt screens keep working. New code never uses it. Delete each alias once `grep` shows no users, and delete the block when step 10 is done. Files marked `LEGACY PRESENTATION` are replaced, not restyled.

---

## 13. Accessibility checklist (every screen)

- [ ] WCAG AA contrast: `node scripts/check-contrast.mjs` passes; no ad-hoc colours.
- [ ] Persistent text ≥ 12px (`text-xs`); 11px only in badges and kbd.
- [ ] Touch targets ≥ 44px on coarse pointers.
- [ ] Every interactive element is reachable and operable by keyboard, with a visible focus ring.
- [ ] Dialogs, sheets and menus trap and restore focus and close on Escape (use the primitives).
- [ ] Colour is never the only signal.
- [ ] Every region's loading, empty and error states are distinct and announced (`role=status` / `alert`).
- [ ] Icons are `aria-hidden` unless they are the only content (then `IconButton` with `label`).
- [ ] Heading outline is correct; landmarks (`header`, `nav`, `main`) are present.
- [ ] Works under `prefers-reduced-motion`.
- [ ] No horizontal page scroll at 320px wide.

---

## 14. Voice-specific rules

- State must be legible at a glance: idle, playing, listening, processing, updated, ready to send, sent, and the edge states (autoplay blocked, mic denied, nothing heard, command not understood, link expired).
- The live-audio meter is the only looping animation, and only while audio actually flows.
- The final text is shown and must be reviewed on screen before **Approve & send** is available.
- Copy is spoken-friendly and short; no emoji.

---

## 15. Functional invariants: the design system never changes these

- Auth split: `/voice/*` and `/api/voice/*` are public (HMAC token); everything else needs a Supabase session.
- The only write path is the three server actions in `src/app/(app)/emails/[id]/actions.ts`, including `draft_type` derivation, the `EDITABLE_DRAFT_STATUSES` server guard, `audit_log` inserts, `via`, and `revalidatePath`.
- Setting `drafts.status = 'approved'` triggers the real send through the database webhook to n8n. The UI adds confirmation; it never changes the trigger.
- Post-approval lockdown: approved or sent replies are read-only everywhere.
- Voice: `voice_send_blocked` (no sending by voice), recording and playback guards (`isRecordingRef`, `playbackSeqRef`), no global gesture listener for the autoplay unlock, and the token-protected routes. The logic lives verbatim in `src/hooks/use-voice-review.ts`; don't refactor it as part of visual work.
- `DOMPurify` sanitises every rendered `body_html` (in the browser; it has no DOM on the server). The shadow-root rendering adds isolation on top and never replaces sanitisation.
- `user-facing-error.ts`: raw errors are never shown to users.
- Realtime channels are always removed on unmount.

---

## 16. Changing the system

- A new colour, size, radius or shadow is a **token change here and in `globals.css`**, not a one-off value in a component.
- A new look for a primitive is a **new variant**, documented in §9 and shown on `/design-system`.
- After any colour change, run `node scripts/check-contrast.mjs`.
- Keep `/design-system` rendering every primitive in every state; it's how the system is reviewed.
