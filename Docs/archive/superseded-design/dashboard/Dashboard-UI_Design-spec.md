# Foreman Dashboard — UI/Design Spec

**For: coding agent**
**Context:** Visual direction for the Foreman dashboard, based on Allsaints Builders' real branding (https://allsaintsbuilders.com/). This is a working internal tool for staff, not a marketing site — prioritize clarity, scannability, and speed over decoration. Apply this AFTER the functional build in `foreman-dashboard-build-spec.md` is working — do not let styling block functionality.

---

## 1. Brand source

Pulled directly from the client's live site:
- Site theme color: `#1c1a17` (warm near-black charcoal)
- Logo uses a cream/off-white tone on dark backgrounds
- Overall brand feel: premium, trustworthy, understated — a council-approved contractor doing damp/mould remediation and refurbishment work, not a flashy consumer brand

**Principle: match the palette and tone, not the marketing layout.** No hero images, no big marketing copy, no decorative sections — this is a dense, functional tool for staff triaging emails all day.

---

## 2. Color tokens

```css
--foreman-charcoal: #1c1a17;      /* primary dark — header, nav, primary buttons */
--foreman-charcoal-light: #2a2723; /* hover states, secondary dark surfaces */
--foreman-cream: #f5f1e8;          /* light background, cards */
--foreman-cream-dim: #e8e2d4;      /* subtle borders, dividers on light bg */
--foreman-white: #ffffff;          /* main content background */
--foreman-text-primary: #1c1a17;   /* body text on light background */
--foreman-text-secondary: #6b6559; /* muted text — timestamps, metadata */

/* Category badge colors — functional, not brand-derived, needs to be scannable at a glance */
--category-urgent: #dc2626;        /* red — needs immediate attention */
--category-priority: #ea580c;      /* orange */
--category-finance: #0891b2;       /* teal */
--category-contracts: #7c3aed;     /* purple */
--category-nph: #059669;           /* green — council/job related */
--category-read-later: #6b6559;    /* muted gray */
--category-other: #94a3b8;         /* light gray */

/* Status badges */
--status-new: #94a3b8;
--status-pending: #ea580c;
--status-approved: #059669;
--status-sent: #1c1a17;
--status-discarded: #94a3b8;
```

**Note on category colors:** these are functional (chosen for clarity/contrast, so a Director can scan a list of 30 emails and instantly spot the one red "urgent" row), not pulled from the brand. Do not force brand charcoal onto category badges — clarity here matters more than brand consistency.

---

## 3. Typography

- Use a clean, professional sans-serif — system font stack is fine (`-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`) or Inter if easily available. Do not use a decorative/serif font — this is a working tool, not a brochure.
- Keep font sizes restrained — this is a dense, scannable list-heavy interface. Body text ~14-15px, not oversized marketing-style headings.

---

## 4. Layout principles

- **Header/nav bar:** dark charcoal (`--foreman-charcoal`) background, cream/white text and logo wordmark — this is the one place brand color should be prominent and unmissable, like the real site's header
- **Main content area:** white or very light cream background — NOT dark. Staff will stare at this screen for hours; a dark dashboard is fatiguing for daily use, unlike a marketing site meant for a short visit. Keep dark charcoal to the header/nav and primary action buttons only.
- **Cards/rows (inbox list, email detail):** white background, subtle border (`--foreman-cream-dim`), generous padding, clear visual separation between rows
- **Primary buttons** (Approve & Send): charcoal background, cream/white text
- **Destructive/secondary buttons** (Discard): outlined or muted, not the same visual weight as Approve
- **Urgent rows:** left border accent or subtle background tint in `--category-urgent`, so they're visually distinct without needing to read the badge text

---

## 5. Logo / wordmark

- Use plain text "Foreman" in the header (cream/white on charcoal), not the client's actual logo image — this is an internal tool with its own identity, not a rebrand of their website
- Optional: small subtitle under/beside it, e.g. "Foreman — Allsaints Builders Email Assistant", small and muted

---

## 6. What NOT to do

- Do not pull in the client's actual site imagery, hero photos, or marketing copy
- Do not make the whole dashboard dark-themed — charcoal is an accent (header, primary buttons), not the dominant background
- Do not add animations, marketing-style transitions, or decorative elements — internal tool, speed and clarity over polish
- Do not use the client's exact logo file — use a text wordmark for "Foreman" instead

---

## 7. Output expected

Apply these tokens (as CSS variables or a Tailwind theme config extension) across the 4 screens already specified in `foreman-dashboard-build-spec.md`. This is a styling pass, not a rebuild — functional behavior (Approve/Discard/Edit logic, data flow) should not change.
