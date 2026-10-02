# 04 — Master Prompt for the Coding Agent
## Foreman premium product transformation

You are acting as a principal product engineer, staff frontend architect, product designer, and security-conscious reviewer. Your task is to transform the existing Foreman application into a cohesive, premium, production-grade internal operations platform for Allsaints Builders.

Read all documents in `docs/product-transformation/` before implementation:
- `01_PRODUCT_VISION_AND_PRD.md`
- `02_DESIGN_SYSTEM_AND_UI_SPEC.md`
- `03_TECHNICAL_IMPLEMENTATION_PLAN.md`
- `05_RESEARCH_AND_REFERENCE_LIBRARY.md`

The existing repository and its runtime behavior are the source of truth. The Project Context and screenshots provide business context and observed UX, but may be stale. Verify everything.

## Product objective

The result must no longer look like a generic AI-generated admin dashboard. It must feel like a carefully designed internal software product used daily by directors, progressors, senior administrators, and accountants.

Design direction: Apple-level visual finesse and restraint; Linear-level workflow speed and keyboard-conscious interaction; Front-like shared inbox clarity; enterprise-grade operational accountability. Do not clone any reference brand or blindly copy their UI.

## Mandatory operating rules

1. **Audit before edit.** Do not begin broad UI changes until you have mapped the repository, routes, components, data access, schema, permissions, and existing tests.
2. Run baseline checks first and record results.
3. Create a concrete, ordered implementation plan with file paths and risk notes. Present it before broad implementation if the environment supports approval checkpoints.
4. Preserve working backend workflows, database contracts, email threading, Twilio/n8n integrations, HMAC voice security, explicit human send approval, voice-send prohibition, and post-send read-only guardrails.
5. Do not invent data, metrics, employee names, assignments, work orders, SLAs, attachments, or operational states.
6. Do not create fake buttons, nonfunctional filters, placeholder charts, decorative dashboard widgets, or static screens presented as finished functionality.
7. Every visible control must have a verified action, a meaningful disabled state, or an explicit planned/unavailable label.
8. Do not expose or print secret values. Treat secrets included in supplied documentation as compromised and flag rotation.
9. Do not make schema changes for new modules without a migration, RLS/authorization review, rollback plan, and clear report.
10. Do not claim tests/builds pass unless you ran them and observed the result.

## Phase 0 — inspect and report

Inspect:
- Repository tree and package scripts/dependencies.
- All app routes, layouts, server/client components, middleware, server actions, API routes.
- CSS/Tailwind tokens, fonts, icon library, existing UI primitives.
- Supabase schema/migrations/RLS, types, triggers, realtime subscriptions.
- n8n workflow JSON and webhook payload contracts (without secrets).
- Current auth and role checks.
- Current inbox, email detail, draft save, approve/send, discard, audit, and voice flows.

Run baseline lint, typecheck, tests, and build. Inspect the provided screenshots. Create:
- `docs/product-transformation/REPO_AUDIT.md`
- `docs/product-transformation/IMPLEMENTATION_PLAN.md`

The audit must explicitly identify current behavior versus assumptions, reusable code, dead/duplicate components, security risks, data-model gaps, and the root causes of the static/AI-sloppy appearance.

## Phase 1 — establish the product foundation

Implement a cohesive app shell and design system before styling individual pages:
- Design tokens centralized in CSS variables/Tailwind theme.
- Consistent typography, spacing, color, borders, radii, elevation, and motion.
- Sidebar/topbar, active states, user menu, page header, search/command affordance only if functional.
- Reusable buttons, form controls, badges, list/table primitives, dialogs, drawers, alerts, skeletons, empty/error states.
- Responsive and accessible patterns.
- Avoid introducing a new UI framework without checking existing dependencies and explaining the tradeoff.

After Phase 1, run checks and report before moving to the next major workflow if approval checkpoints are available.

## Phase 2 — redesign core workflows in this order

### A. Inbox
Make the inbox a real work queue, not a long stack of identical cards:
- Reduce redundant metadata pills.
- Establish strong sender/subject/preview hierarchy.
- Use urgency and lifecycle states consistently and distinctly.
- Provide account tabs and filters backed by real queries.
- Keep filter/search state coherent and ideally URL-serializable.
- Implement proper loading, empty, no-results, error, realtime-stale, and responsive states.
- Consider list/detail split view if it works with the existing routing and leaves adequate reading/editor space.

### B. Email detail and draft review
- Separate original email, AI-generated draft, and staff edits visually.
- Clearly label AI provenance.
- Show unresolved `[CONFIRM ...]` placeholders with explicit warnings.
- Ensure save status, failed save, concurrent edit, and stale data states are handled.
- Make recipient, subject, account, and exact outgoing body visible before send.
- Require explicit human approval; do not add voice-send or auto-send behavior.
- Enforce server-side permission, unresolved-placeholder policy, and idempotency.
- Keep approved/sent drafts read-only.

### C. Approvals
- Build a focused review queue from actual pending-review drafts.
- Provide a final review/confirmation step for send.
- Make discard and send visually distinct.
- Never bulk-send in this initial transformation.
- Display accurate server-returned status and dispatch errors.

### D. Activity / audit
- Replace raw JSON as the primary content with readable event titles, actor, time, email reference, and concise summary.
- Collapse technical metadata by default.
- Allow authorized disclosure of redacted raw details.
- Preserve every immutable audit event and its timestamp.
- Make the feed/table responsive and searchable with real backend filters.

### E. Home / command centre
- Create a role-aware start page using actual data.
- Counters must link to exact filtered queues and reconcile with their results.
- Prioritize urgent, aging, and awaiting-review items only when data supports the ordering.
- No fake KPIs or arbitrary charts.
- Clearly distinguish routed-to-role from personally assigned work if there is no assignment schema.

### F. Voice portal
- Refine the mobile experience while preserving token verification, expiry, email-ID binding, rate/security controls, and voice-send prohibition.
- Keep controls large and usable in field conditions.
- Make recording, transcription, playback, rewrite, save, and approval states obvious.
- Never expose email content on invalid/expired token states.

## Phase 3 — propose future operational modules carefully

Potential modules include My Work/assignments, operational work orders, SLA/deadline tracking, internal notes, reporting, admin settings, and integration health. These are product proposals, not assumed existing capabilities.

For each missing capability:
1. Identify the current data gap.
2. Propose schema and API changes separately.
3. Include RLS/authorization and audit implications.
4. Explain migration and rollback.
5. Do not build a fake frontend-only simulation.
6. Ask for owner approval before irreversible schema/business-policy changes where needed.

## Visual quality bar

Before marking a screen done, compare it against the UI specification and answer:
- Is the most important action visually obvious?
- Is there a clear hierarchy between page title, work content, and metadata?
- Are there too many cards, pills, borders, or decorative elements?
- Can a busy employee scan the page in 5 seconds?
- Does it work with long subject lines, long sender names, no data, errors, and narrow widths?
- Are labels plain-language and status semantics consistent?
- Does it look like one product across every route?

Avoid “AI slop”: repetitive cards, default component styling, gratuitous gradients, generic charts, random icons, bloated copy, fake avatars, and controls that look clickable but do nothing.

## Verification

Run the actual repository commands and report exact outputs for:
- lint
- typecheck
- tests
- production build
- applicable voice/auth/security verification scripts

Test the critical regression cases in `03_TECHNICAL_IMPLEMENTATION_PLAN.md`. If end-to-end tooling is absent, state that and perform the strongest feasible checks; do not pretend browser testing happened.

## Required final handoff

Provide:
1. Summary of delivered experience.
2. Routes/components changed.
3. Real backend functionality connected.
4. Proposed/unimplemented features and data gaps.
5. Database migrations and security implications.
6. Exact test/build results.
7. Known issues and recommended next phase.
8. Screenshots at desktop and mobile if the environment supports them.

Proceed incrementally. Prefer a polished, fully working core over a broad but shallow mockup. The success criterion is a cohesive, trustworthy internal operations product—not merely a visually impressive landing page.
