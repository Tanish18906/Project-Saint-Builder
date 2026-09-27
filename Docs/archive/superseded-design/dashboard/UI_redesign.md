# Foreman Dashboard — UI Redesign Spec

**For: coding agent**
**Context:** The dashboard is functionally complete and verified working (see `foreman-progress-tracker.md`, section 5). This is a **visual-only** pass. It supersedes `Dashboard-UI_Design-spec.md` where the two conflict — that file was the v1 direction; this is the corrected version after seeing the built result look generic/AI-scaffolded rather than like real software for a real construction company.

**Hard constraint — read this twice:** Do not touch backend logic, Supabase queries, Realtime subscriptions, business logic (Approve/Discard/Save, draft_type tagging, post-approval lockdown), routing, or component state/data flow. Every button must call the exact same handler it currently calls. Every query must return the exact same data. If a visual change seems to require a logic change, stop and flag it instead of making the change — do not get creative with functionality while "redesigning."

If anything here is ambiguous, choose the simpler/quieter option and leave a comment explaining the choice — don't ask, proceed and note it.

---

## 0. Why this pass exists

The current build works correctly but looks like a generic AI-scaffolded internal tool — the kind you'd get from any AI-assisted build without a specific design point of view. Specific tells, diagnosed from the live screenshots:

1. Every filter group is a row of black pill buttons (Inbox: Inboxes, Role Queue. Audit Log: Action). This is the most recognizable "shadcn default" pattern in current AI-generated UIs — real staff who've used any real internal tool will clock it immediately.
2. Empty states are centered, with a soft circular icon, bold headline, gray subtext — a template pattern, copy-pasted everywhere. Not wrong, just generic.
3. Whitespace is applied at the Tailwind default scale, not tightened for density. The dashboard's own original spec called for "dense, scannable, list-heavy" — the built version is airier than that goal.
4. All-caps labels used everywhere at once ("INBOXES:", "ROLE QUEUE:", "ACTION:", "ACTIVITY TRAIL (0 EVENTS)", "INBOX FEED (0)") — a specific AI-tool tic. Real dashboards use this sparingly, not as the default heading style throughout.
5. Zero visual connection to Allsaints Builders. The dashboard could be reskinned for any company in any industry right now.

**The fix is not new colors.** `allsaintsbuilders.com`'s real `theme-color` meta tag is `#1c1a17`, matching the charcoal token already in use. The existing token set is correct — verified against the live site, not guessed. The fix is application: fewer competing hues, quieter typography, tighter density, and small deliberate details that tie it to the actual brand.

---

## 1. Reference: what the real site actually does

Pulled directly from `allsaintsbuilders.com` (fetched live, not assumed):

- **Sentence case everywhere**, never all-caps section headers. "Why choose us," "What we do," "In their words," "Recent work." The dashboard should match this — all-caps labels get removed except where truly justified (see Section 4).
- **Stat blocks over icon-badges.** The homepage shows trust via plain numbers: `25+` years, `100%` Awaab's Law aligned, `5★` reviews — no icon-in-circle treatment, no card chrome. Numbers and short labels, side by side, minimal decoration.
- **One CTA-weight button per context**, not a row of equal-weight pills. The header has exactly one primary action ("Get a Quote") plus a phone number as a first-class element, not buried in a menu.
- **Restraint as the brand signal.** Copy leans on real credentials (CHAS Verified, Constructionline, Federation of Damp, local authority approved) rather than visual flourish. The company sells trust through specificity, not through polish. The dashboard should feel the same: plain, confident, unfussy.
- **A real logo asset exists**: `logo-cream-BZDC1Xnj.png`, designed for dark backgrounds. Flagging this as a decision point below (Section 5) since the prior UI spec called for a text wordmark only.

---

## 2. Color — keep the tokens, fix the application

**Do not change these — they are verified-correct against the live site:**

```css
--foreman-charcoal: #1c1a17;
--foreman-charcoal-light: #2a2723;
--foreman-cream: #f5f1e8;
--foreman-cream-dim: #e8e2d4;
--foreman-white: #ffffff;
--foreman-text-primary: #1c1a17;
--foreman-text-secondary: #6b6559;
```

**Change this — the category/status color system is the actual problem, not the brand tokens.**

The current system assigns a distinct hue to every category (7 hues: red, orange, teal, purple, green, two grays) and every status (5 more colors). That's more simultaneous hues than the eye can parse quickly on a dense list — which directly undermines the "scan 30 emails, spot the urgent one instantly" goal the dashboard is actually built for. It's also the single most "generic AI dashboard" visual tell of all, because "assign each enum a nice color" is the default move any AI-assisted build reaches for first.

**Replace with a two-tier urgency system:**

```css
/* Urgency — the only place color carries real signal, like a hazard marker on site */
--urgency-urgent: #b91c1c;      /* deeper, less neon than the old #dc2626 — reads as serious, not alarm-fatigue red */
--urgency-priority: #c2560c;    /* deeper amber-orange, same logic */

/* Everything else — category is conveyed by TEXT LABEL, not hue */
--tag-neutral-bg: #ece7db;      /* quiet fill, close to cream-dim */
--tag-neutral-text: #4a453c;    /* muted charcoal, not full-strength text-primary */

/* Status — weight/style does the work color used to do */
--status-sent-bg: var(--foreman-charcoal);
--status-sent-text: var(--foreman-cream);
--status-approved-text: #2f6b3f;   /* single muted green, used sparingly — text only, no fill */
--status-pending-text: var(--foreman-text-secondary);
--status-discarded-text: var(--foreman-text-secondary);
```

Concretely, on the inbox list:
- `urgent` and `priority` rows get the left-border accent (already specced in the old file — keep this) using the two urgency colors above. This is the one place color pulls the eye.
- `finance_accounts`, `contracts`, `nph_job_update`, `read_later`, `other` render as a small plain-text label (e.g. "Finance," "Contracts," "NPH Update") in `--tag-neutral-text` on `--tag-neutral-bg`, or as plain text with no background at all if that reads cleanly enough — try text-only first, add the quiet fill only if categories get lost in the row without it.
- Status becomes mostly typographic: `sent` is solid charcoal (it's final, it should look final), `approved` is muted green text only, `pending`/`discarded` are secondary-gray text. Do not add new hues beyond what's listed above.

**Net effect:** the palette goes from ~12 competing colors to charcoal, cream, two urgency tones, and one muted status green. Everything else is typography and weight. This is a direct, testable UX improvement (fewer hues = faster scan time), not just taste.

---

## 3. Typography

- Keep the existing system font stack — correct, no change needed.
- **Remove all-caps as the default heading treatment.** Convert to sentence case to match the brand: "Inboxes" not "INBOXES:", "Role queue" not "ROLE QUEUE:", "Activity trail" not "ACTIVITY TRAIL (0 EVENTS)". Counts can stay as a trailing detail (e.g. "Activity trail · 12 events") but drop the all-caps shouting.
- **Exception**: it's fine to keep ONE all-caps treatment somewhere small and deliberate if it reads as a badge, not a heading — e.g. the existing "AI TRIAGE" tag next to the Foreman wordmark in the header is fine as-is, that's a badge convention, not a section label.
- Establish real hierarchy on the inbox row: subject should be visibly heavier/darker than sender, sender heavier than timestamp. Right now (per the spec, not yet visible in empty-state screenshots) these risk rendering at similar weight — make subject `font-medium` or `font-semibold` at `text-primary`, sender `font-normal` at `text-primary`, timestamp `font-normal` at `text-secondary`, one size step down.
- Reduce base body size slightly if not already tight — target ~14px for list rows, matching the original spec's "dense, scannable" intent. Do not go below 13px for accessibility.

---

## 4. Filters — replace pill rows with a quieter pattern

This is the biggest single change. Both screenshots show the same pattern repeated: a horizontal row of equal-weight black/light pill buttons for every filter group. Replace with:

- **Primary filter (Inbox: which account; Audit Log: which action)** — keep as a simple horizontal tab/segment control, but restyle: no black pill background on the active state, use an underline or a single bottom-border indicator instead (closer to how the real site's nav treats active states — plain text links, not button chrome). This alone removes most of the "SaaS template" read.
- **Secondary filter (Role Queue on Inbox)** — do not render as a second row of pills stacked under the first. Fold into a single compact dropdown/select (you already have this pattern working for Category/Status on the inbox — extend that pattern here instead of introducing a third filter style). Three different filter UI patterns on one screen (pills, pills, dropdown) is itself part of what reads as unconsidered; get it down to two patterns max, ideally one.
- Keep the search input as-is structurally, just verify it matches the tightened spacing from Section 6.

---

## 5. Header / branding

- Keep charcoal header background, cream text — correct, matches the real site's header treatment.
- **Decision point, not a directive — flag this to the user before implementing:** the old design spec said text wordmark only, no client logo. Now that the real logo asset is known to exist and is designed specifically for dark backgrounds (`logo-cream-BZDC1Xnj.png`), consider whether the actual client asset would read as more legitimate/native than a text wordmark. Default to keeping the text wordmark "Foreman" as specced (it has good reasoning — this is an internal tool, not a rebrand) unless the user says otherwise, but note in your summary that this was considered.
- Keep "AI TRIAGE" badge next to the wordmark — small, all-caps is fine here (see Section 3 exception), it's clearly a product badge not a heading.
- Keep the subtitle "Allsaints Builders Email Assistant" — matches the old spec's guidance and ties the tool to the client without copying their branding wholesale.

---

## 6. Density and spacing

- Reduce padding inside the filter bar container — target roughly 25-30% tighter than current based on the screenshots (the filter bar currently has significant breathing room above/below and between groups; this is a working tool used all day, not a marketing page).
- Reduce the gap between the filter bar and the list/table below it.
- Tighten row height on inbox list items and audit log rows once real data is present — err toward more rows visible per scroll, not fewer.
- Empty states (Section 7) get much smaller vertical padding than currently shown — they should not dominate the viewport the way they currently do.

---

## 7. Empty states — de-templatize

Current pattern (both screenshots): large centered card, soft circular icon, bold headline, muted subtext, dominating most of the visible content area. This is a recognizable default component pattern.

Replace with something quieter and smaller:
- Drop the circular icon treatment entirely, or shrink it significantly and make it a simple line-icon with no background circle.
- Reduce the message to a single line where possible: "No emails match your filters" — drop the second line of subtext unless it adds real instruction (e.g. keep something like "Try a different filter" only if it's genuinely useful, not as decorative filler).
- Do not center the empty state in a large empty card with heavy padding — let it sit closer to where the content would normally start, more like "the list is just short right now" than "look at this empty state we designed."

---

## 8. Buttons

- **Primary action (Approve & Send)**: charcoal fill, cream text — matches existing spec, correct, keep.
- **Destructive/secondary (Discard)**: outlined, muted — matches existing spec, keep, but make sure it's visibly lighter-weight than Approve, not just a different color at the same visual weight (per the old spec's own instruction, which the filter-pill pattern currently violates elsewhere on the page).
- **Filter/tab buttons**: per Section 4, move away from filled-pill-for-every-option toward underline/segment style so buttons don't compete visually with the two real action buttons (Approve/Discard) that actually matter.

---

## 9. What NOT to do

- Do not change the charcoal/cream brand tokens — they are correct.
- Do not introduce new hues beyond what's specified in Section 2.
- Do not touch any backend call, Supabase query, Realtime subscription, or business logic.
- Do not change routing structure — that's UX_redesign.md's job if anything, and even there, list/detail data flow stays identical.
- Do not add animations, marketing-style transitions, decorative illustrations, or hero imagery — still an internal tool, per the original design spec's own instruction, which remains correct.
- Do not pull in client marketing photography or copy — the wordmark/logo decision in Section 5 is the only branding crossover point, and it's explicitly a flagged decision, not a default.

---

## 10. Output expected from the coding agent

- Updated CSS variables / Tailwind theme config reflecting Section 2's color changes
- Typography changes per Section 3 applied across all 4 screens
- Filter UI restructured per Section 4 on both Inbox and Audit Log screens
- Header reviewed per Section 5 (with the logo decision explicitly flagged back to the user, not silently decided)
- Spacing/density tightened per Section 6
- Empty states simplified per Section 7
- Button hierarchy confirmed per Section 8
- A short summary: what changed, what was flagged as a decision point (Section 5), confirmation that no backend/business logic was touched, and a spot-check that Approve/Discard/Save still work exactly as before
