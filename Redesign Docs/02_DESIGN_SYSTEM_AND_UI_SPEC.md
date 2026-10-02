# 02 — Design System & UI Specification
## Foreman visual and interaction language

**Design intent:** Apple-level care and restraint, Linear-like workflow speed, Front-like shared inbox clarity, and enterprise-grade operational legibility. This is a synthesis of principles, not a request to copy any product's exact interface or branding.

## 1. Visual north star

Foreman should feel calm, precise, confident, and operational. It is used by busy staff who may be on site, on a phone, or handling urgent tenant and commercial communications.

### Use
- Strong typographic hierarchy.
- Neutral surfaces with a restrained brand accent.
- Thin borders and subtle elevation only where hierarchy requires it.
- Dense, scannable work lists with comfortable line-height.
- Consistent iconography (one icon family, preferably the icon library already installed).
- Intentional whitespace around major regions, not huge empty cards around every metric.
- Motion only to explain state change or preserve spatial continuity.

### Avoid
- Generic AI-generated dashboard patterns: 6 equal metric cards, random charts, decorative sparkle icons everywhere, gradient blobs, and excessive rounded cards.
- Glassmorphism or blur as a default surface treatment.
- Every datum rendered as a pill/badge.
- Monospaced JSON as the default audit presentation.
- Emoji as primary iconography.
- Giant headings that push useful work below the fold.
- Fake live indicators, fake analytics, mock employee avatars, fabricated job details, and placeholder charts in production.
- Overly pale gray text that looks elegant but fails contrast.

## 2. Design tokens

The coding agent must inspect existing CSS/Tailwind configuration and consolidate the system into centralized tokens. Do not scatter one-off colors and arbitrary values through components.

Suggested initial tokens (validate against existing brand assets and contrast tests):

### Color
- `--app-bg`: warm-neutral near-white, e.g. `#F7F8FA`.
- `--surface`: `#FFFFFF`.
- `--surface-subtle`: `#F1F3F5`.
- `--surface-raised`: `#FFFFFF`.
- `--text-primary`: near-black charcoal, e.g. `#17191C`.
- `--text-secondary`: muted slate with WCAG-safe contrast.
- `--text-tertiary`: use sparingly; still readable.
- `--border-subtle`: cool-neutral light border.
- `--border-strong`: medium neutral border.
- `--brand`: choose from actual Allsaints brand assets; if none exist, propose a restrained deep evergreen/ink accent and ask owner to approve before locking it.
- `--danger`: accessible red for urgent/error.
- `--warning`: amber for attention/caution.
- `--success`: green for completed/healthy.
- `--info`: blue for informational states.

Never communicate urgency, state, or permission using color alone. Pair color with text and/or icon.

### Typography
- Use the existing installed font if appropriate; otherwise use a reliable system sans stack or a carefully selected open-source sans (e.g. Inter/Geist only if licensing and project setup are appropriate).
- Body text: 14–16px depending on density; comfortable line height.
- Dense table/list metadata: generally 12–13px, never tiny low-contrast text.
- Page title: 24–30px, semibold, not oversized.
- Section heading: 15–18px, semibold.
- Use tabular numerals for timestamps, counts, and money.
- Avoid all-caps labels except tiny, occasional section eyebrow labels.

### Spacing and layout
Use a consistent 4px base scale. Preferred spacing steps: 4, 8, 12, 16, 20, 24, 32, 40, 48.
- App shell: persistent sidebar about 232–256px expanded; collapsible to icon rail on desktop.
- Content max width: allow operational lists to use available width; constrain long-form reading/editor content for readability.
- Desktop page gutters: 24–32px.
- Mobile page gutters: 16px.
- Standard control height: 36–40px; primary touch targets at least 44px on touch surfaces.
- Radius: restrained and consistent (6–10px for controls/cards; larger only for overlays or major surfaces).
- Borders define structure; shadows are rare and soft.

### Elevation
Use 3 levels at most:
1. Base canvas.
2. Raised panels/popovers.
3. Modal/dialog layer.
Do not use shadows on every row or nested card.

## 3. App shell and navigation

### Desktop
- Left sidebar with Foreman mark/wordmark, workspace identity, primary nav, optional section labels, and signed-in user menu at bottom.
- Main content has a stable header with page title, contextual controls, search/command affordance, and relevant actions.
- Sidebar collapse state must be usable and persist only if an existing preference mechanism or safe local preference is implemented.
- Active navigation is clear without a giant colored block.
- Show role context discreetly; do not expose permissions as a decorative badge.

### Tablet
- Sidebar collapses to icon rail or drawer depending on width.
- Lists and detail panes may become split view only when both remain readable.

### Mobile
- Use a mobile navigation pattern appropriate to the existing routes (drawer or bottom navigation for top destinations).
- Keep the voice portal separate and optimized for one-handed field use.
- No horizontal scrolling for the main inbox or audit table. Convert rows to responsive cards/stacked detail at narrow widths.

## 4. Core components

Build or standardize reusable components before screen-specific styling:
- `AppShell`, `Sidebar`, `Topbar`, `PageHeader`, `Breadcrumbs` (where useful).
- `CommandMenu` / global search, with keyboard shortcut only if implemented end-to-end.
- `Button` variants: primary, secondary, tertiary/ghost, destructive; loading and disabled states.
- `IconButton` with accessible label and tooltip.
- `StatusBadge` and `UrgencyIndicator`, each with text label and accessible color.
- `Avatar` only when real user identity/avatar is available; otherwise use initials or neutral icon.
- `SearchInput`, `FilterBar`, `FilterChip`, `Select`, `DateRange`.
- `DataTable` with responsive fallback, sorting, empty/loading/error states.
- `InboxListItem`, `InboxViewTabs`, `AssignmentControl` only if assignment backend exists.
- `EmailHeader`, `EmailBodyViewer`, `DraftEditor`, `PlaceholderWarning`, `DiffView`.
- `ApprovalReviewPanel`, `ConfirmActionDialog`.
- `ActivityTimelineItem`, `AuditMetadataDisclosure`.
- `Toast/InlineAlert`, `Skeleton`, `EmptyState`, `ErrorState`.
- `Drawer`, `Dialog`, `Popover`, `Tooltip`.
- `AudioPlayer`, `RecordingControl`, `TranscriptReview` for voice.

Use semantic HTML and accessible primitives. Prefer the existing component library if present and sound; do not install a second component system without documenting why.

## 5. Status and urgency semantics

Use a centralized mapping. Do not create slightly different status colors or labels on each page.

Email urgency:
- `urgent`: immediate action; red signal + explicit “Urgent”.
- `priority`: same-day action; amber/orange signal + “Priority”.
- `routine`: normal queue; neutral signal + “Routine”.
- `read_later`: informational; muted neutral + “Read later”.

Email lifecycle and draft lifecycle are different concepts. Do not collapse them into one ambiguous badge. The UI should distinguish:
- Email: pending / drafted / approved / sent / discarded / failed as defined in the current schema.
- Draft: pending review / approved / sent / discarded as defined in the current schema.
- Classification/theme: a category, not a lifecycle status.
If the current DB uses inconsistent states, surface the inconsistency in the audit; do not silently reinterpret it.

## 6. Inbox interaction specification

### List density
Offer a comfortable default with an optional compact mode only if it can be implemented without compromising readability. Each row should visually prioritize:
1. Sender and sender organization (if known).
2. Subject.
3. One- or two-line preview.
4. Received time/age.
5. Urgency.
6. Theme and routed role/owner as secondary metadata.
7. Email/draft state.

Avoid the current screenshot's repeated horizontal tag clutter. Render only the strongest status signals in the list; place secondary data in the detail pane.

### List behavior
- Entire row can open the detail view; nested controls must not accidentally trigger row navigation.
- Keyboard focus and arrow navigation are optional enhancements, but if included must be fully tested.
- Selection, unread/read, archive, assignment, snooze, and bulk actions must not be shown unless corresponding backend behavior exists.
- Filters must be URL-serializable where practical so views can be bookmarked/shared; ensure sensitive search terms are not leaked into analytics.
- Loading should preserve layout and not flash empty state before data arrives.

### Detail layout
- Desktop: use a persistent list + detail split if it fits actual app architecture and does not make the editor cramped. Otherwise use a dedicated detail route with return-to-list context.
- Header contains subject, sender, account, timestamp, urgency, theme, and routed roles.
- Original email content must be safely rendered; sanitize HTML and prevent remote content or scripts from executing.
- Draft panel has clear “AI-generated draft” provenance, editable state, save feedback, and unresolved placeholder handling.
- Make approval actions visually distinct from ordinary save actions.

## 7. Audit log redesign

Replace the current spreadsheet-like default with a readable activity feed/table hybrid:
- Main view: timestamp, event title, associated email, actor, and concise human-readable summary.
- Use consistent verbs and labels.
- Group consecutive related events only if doing so preserves individual immutable records and exact timestamps.
- Metadata is collapsed. Admin/developer can expand a safe, redacted JSON disclosure.
- Provide search and filters that correspond to real query capability.
- On mobile, stack event fields vertically with timestamp and actor clearly visible.
- Do not display raw identifiers as primary content; provide copy controls in a secondary technical detail view if needed.

## 8. Home / command centre

The home screen should be a working operational surface, not a marketing dashboard.
- One compact welcome/context line.
- A single row of meaningful counters (max 3–4), each clickable to a filtered list.
- A prioritized “Needs attention” queue.
- A “Waiting on review” section if pending draft data supports it.
- Recent activity or team workload only when supported by reliable records.
- Include “last updated” or connection state only when sourced from real subscription/query status.
- Avoid charts until there is enough trustworthy historical data and a defined business question.

## 9. Motion and micro-interactions

- Use restrained 120–200ms transitions for hover, focus, opening panels, and status feedback.
- Avoid springy, playful, or constant animations in a construction operations tool.
- Respect `prefers-reduced-motion`.
- Do not animate urgent alerts continuously.
- Save feedback should be subtle but unmistakable: Saving…, Saved at time, or Save failed.
- Optimistic updates are allowed only when rollback/error handling is correct.

## 10. Accessibility and content design

Target WCAG 2.2 AA as the practical baseline:
- Text contrast 4.5:1 for normal text, 3:1 for large text and essential UI graphics.
- Full keyboard access and visible focus.
- Semantic labels, headings, landmarks, and form associations.
- Screen-reader announcements for async save/send/error states.
- No color-only status encoding.
- Touch targets suitable for field use.
- Plain language; avoid internal system jargon.
- Respect zoom/reflow and reduced motion.

## 11. Required UI states per screen

For every data-driven screen, implement and test:
- Initial loading.
- Refreshing/realtime update.
- Empty dataset.
- Empty filtered results.
- Permission denied.
- Network/query failure.
- Stale data or realtime connection interruption.
- Mutation pending.
- Mutation success.
- Mutation failure.
- Read-only/locked record.
- Narrow viewport.

A design is not complete if it only looks good with populated mock data.
