# 01 — Product Vision & Product Requirements
## Foreman: Internal Operations Platform for Allsaints Builders

**Document status:** Product direction and proposed requirements. Validate against the repository and stakeholders before production release.

## 1. Product vision

Foreman is the internal operations workspace through which Allsaints Builders employees manage incoming communications, operational responsibilities, urgent issues, approvals, and the history of company actions.

It is not merely an AI email summarizer or a dashboard. It is a role-aware work system that makes the company's work visible, assignable, reviewable, and accountable.

**Product promise:** At the start of a shift, every employee can understand what needs attention, what they own, what is blocked, and what action is safe to take next.

## 2. Business context already established

The Project Context describes Allsaints Builders as a UK construction/building-maintenance contractor working with social housing associations, councils, tenants, commercial property owners, and subcontractors. It identifies two monitored inboxes:
- `info@allsaintsbuilders.com`: executive, commercial, tender, high-priority, and general corporate communication.
- `team@allsaintsbuilders.com`: operational job updates, tenant repair requests, contractor notes, and subcontractor updates.

Existing workflow capabilities documented:
- IMAP ingestion through n8n.
- AI theme, urgency, and role classification.
- AI response drafts with `[CONFIRM ...]` placeholders for unknown facts.
- Human approval before SMTP sending.
- WhatsApp notifications for urgent/priority messages.
- Mobile voice review using signed links, speech-to-text, text-to-speech, and controlled rewrite commands.
- Supabase persistence, realtime updates, and audit events.
- Supabase-authenticated dashboard and HMAC-protected voice portal.

The coding agent must inspect the actual repository and live configuration; these documented capabilities are not proof that every path currently works in the current branch.

## 3. Product principles

1. **Work before widgets.** Every screen should help a user complete or understand a real work task.
2. **Clarity over decoration.** Visual hierarchy, readable density, useful defaults, and strong interaction feedback matter more than gradients, blur, or ornamental cards.
3. **AI is an assistant, not an authority.** Show what AI suggested, preserve human review, surface uncertainty, and never imply that generated content is verified fact.
4. **Ownership must be explicit.** A routed role is not necessarily a named owner. Do not imply assignment to a person unless a real assignment exists in the data model.
5. **Operational risk is visible.** Urgency, age, due-time, legal/compliance risk, and missing confirmation facts should be communicated in plain language.
6. **One system, role-aware views.** Navigation and work surfaces should adapt to permission and role without fragmenting the product into inconsistent mini-apps.
7. **Progressive disclosure.** Show the operational summary first; expose technical metadata, raw payloads, and audit details only when requested and authorized.
8. **No fake functionality.** Every visible control must work, be disabled with a clear reason, or be explicitly labeled as planned.

## 4. Users and role-based needs

### Director
Needs:
- A concise view of urgent/high-risk communications and decisions awaiting sign-off.
- Commercial, legal/DISREP, high-value quote, and director-routed escalations.
- Visibility into who owns an item, its history, and what action is pending.
- Approval controls with safeguards against sending incomplete or unverified information.

### Progressor
Needs:
- Operational repair and site-related messages.
- Clear site/address, access, dates, contractor context, next action, and status.
- Fast mobile-first review while on site.
- Clear handoff and ownership rather than email-only triage.

### Senior Admin
Needs:
- Routine operational communications, compliance certificates, job updates, and administrative queries.
- Efficient queue management, categorization, assignment visibility, and reusable responses if supported.
- Clear unresolved and overdue items.

### Accountant
Needs:
- Invoices, CIS statements, payment applications, payment schedules, and related correspondence.
- Figure-forward content, reference numbers, sender, attachments if available, and approval status.
- No invented financial values or automatically approved payment decisions.

### System administrator / authorized manager
This is a proposed expanded permission group, not a currently confirmed database role.
Needs:
- Manage staff, roles, monitored mailboxes, routing configuration, and integrations only where backend support exists.
- View system health and configuration status without exposing secrets.
- Changes to access and integrations must be audited.

## 5. Proposed information architecture

Use a persistent app shell with a collapsible primary sidebar, top-level search/command access, workspace context, and user menu.

### Core navigation
1. **Home** — personal/role-aware command centre.
2. **Inbox** — shared communication queue, inbox accounts, and saved views.
3. **My Work** — work explicitly assigned to the signed-in employee. If assignments do not exist in the schema, show routed-to-me work as a clearly named view; do not pretend it is personal assignment.
4. **Approvals** — drafts awaiting explicit human review and send authorization.
5. **Operations** — proposed work-management layer for repairs, DISREP, compliance, finance, and tenders. Build only after mapping existing source data. Do not fabricate job-management records from email text.
6. **Activity** — human-readable audit and operational event timeline.
7. **Reports** — proposed metrics view; only show metrics that can be computed accurately from available data.
8. **Settings** — staff, roles, inboxes, routing, and integrations, gated by verified permissions.

Hide or disable nav destinations that have not been implemented. A disabled destination must explain whether it is unavailable to the role or not yet enabled.

## 6. Key user journeys

### Journey A — Start of shift
1. Employee signs in.
2. Home shows urgent and priority work relevant to their role, items awaiting their review, and recent activity.
3. Each count is clickable and opens the exact filtered list behind it.
4. Employee opens an item and can see why it is surfaced, current status, and available next actions.

### Journey B — Triage an email
1. Open Inbox.
2. Filter/search by account, theme, urgency, status, sender, or date.
3. Open an email in a focused detail workspace.
4. Review original message and AI triage separately.
5. Review/edit draft, resolve or explicitly acknowledge `[CONFIRM ...]` placeholders, save, discard, or approve/send according to permission.
6. Show pending/success/failure state from actual backend response. Never show “Sent” merely because an approval action was initiated.

### Journey C — Review an urgent alert on mobile
1. Employee opens a signed WhatsApp voice-review URL.
2. Show the sender, subject, urgency, concise email context, and draft.
3. Voice actions can play, rewrite, or apply dictated edits according to existing server rules.
4. Sending must require an explicit on-screen approval tap, consistent with the documented safety guard.
5. Expired/invalid token state must be clear and must not leak email data.

### Journey D — Inspect an audit event
1. Open Activity.
2. See a readable event description, timestamp, actor (person or automation), and linked email/draft.
3. Expand for permitted metadata.
4. Raw JSON is not the default display. It may be available in a developer/admin detail disclosure with safe redaction.

## 7. Screen requirements

### Home / Command Centre
- Greeting and current workspace/role context, without excessive personalization.
- Compact operational summary: urgent, priority, awaiting my review, unassigned/routed items where data supports it.
- “Needs attention” queue ordered by operational risk and age, not arbitrary card order.
- Recent activity and integration/system status only if reliable data exists.
- Avoid vanity charts and fabricated KPIs.

### Inbox
- Desktop: three-region workflow where practical—navigation/views, conversation list, selected message detail—or a list-to-detail layout that preserves context.
- Inbox tabs for `All monitored`, `Info`, `Team`; display real counts with accurate filters.
- Search with clear scope.
- Filters: role/routed role, theme, urgency, lifecycle status, date, and account, based on actual schema.
- Row/list items should prioritize sender, subject, short preview, age, urgency, theme, routing/ownership, and lifecycle state.
- Do not repeat every metadata tag as a chip on every row. Show the 2–3 most decision-relevant signals and move the rest to detail.
- Duplicate messages should not be silently merged or removed unless deduplication is implemented and traceable.

### Email detail / review workspace
- Strong subject heading, sender identity, received time, account, urgency, theme, and routed roles.
- Original email and AI draft must be visually distinct and clearly labeled.
- Draft editor must preserve unsent edits, show save status, and handle concurrent updates.
- Highlight `[CONFIRM ...]` placeholders and block or warn before send if unresolved, according to backend policy. Do not silently strip unresolved facts.
- Approval area must show the exact outgoing body and recipient before irreversible action.
- After approved/sent, enforce read-only behavior consistent with current guardrails.
- Show errors with actionable recovery; never swallow send failures.

### Approvals
- Queue of drafts actually in pending review.
- Review checklist: recipient, subject, body, unresolved confirmation placeholders, attachments/threading where applicable, and sender/account.
- Approve & Send is a high-consequence action; require explicit confirmation or an equally clear final review step.
- Keep discard separate from send and make destructive actions reversible only if backend supports recovery.
- No one-click bulk send in initial release.

### Activity / Audit
- Human-readable verbs: “Email classified”, “Draft created”, “Draft edited”, “WhatsApp alert sent”, “Draft approved”, “Email sent”, “Draft discarded”.
- Actor labels: named employee when identity is verified; “Automation” for system actions.
- Filters by action, actor, date, email, and status only if supported.
- Event details collapsed by default; raw JSON in an authorized disclosure with redaction.
- Preserve immutable audit semantics; UI must not offer editing/deleting historical events.

### Mobile voice portal
- Mobile-first, high-contrast, large touch targets, clear audio recording/playback states.
- One primary action at a time.
- Provide transcript visibility/edit confirmation when dictated content affects the draft.
- Respect token expiry and the existing “voice cannot send” safety rule.

## 8. Scope and sequencing

### Release 1 — Premium core workspace
- App shell and design system.
- Home/command centre based on actual available data.
- Inbox and email detail/review.
- Approvals.
- Activity/audit redesign.
- Responsive and accessible layouts.
- Preserve voice portal and integrations.

### Release 2 — Operational workflow depth
- Real named assignment and handoff model, if approved and added to database.
- Operations records linked to source email, with explicit provenance.
- Due dates/SLA timers only where defined and approved by the business.
- Role-aware saved views and reporting.

### Release 3 — Administration and platform maturity
- Admin settings, staff lifecycle, routing editor, integration health, configuration history, advanced reporting, and optional notifications/preferences.
- SSO/SCIM or enterprise identity only after security and hosting review.

## 9. Product acceptance criteria

A release is not accepted unless:
- Every implemented route is reachable through coherent navigation and permission checks.
- All counts, badges, filters, and status labels are derived from actual data and match their destination lists.
- All buttons either execute a verified action or clearly communicate why unavailable.
- No email can be sent without explicit human approval.
- A sent/approved draft is read-only and cannot be accidentally sent twice.
- AI uncertainty and unresolved confirmation placeholders are visible.
- Errors, empty states, loading states, and stale/realtime states are designed.
- Desktop and mobile workflows are usable; the voice portal remains mobile-first.
- Keyboard navigation, visible focus, semantic controls, and accessible contrast are tested.
- No secrets, tokens, full email bodies, or sensitive data are written to client logs or analytics.
- Production build, lint, type checks, and relevant tests pass—or failures are explicitly reported with cause and remediation.
