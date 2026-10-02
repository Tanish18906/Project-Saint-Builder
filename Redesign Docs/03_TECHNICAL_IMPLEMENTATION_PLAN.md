# 03 — Technical Implementation & Migration Plan
## Preserve the working system while upgrading the product

## 1. Non-negotiable constraints

The Project Context describes the stack as Next.js App Router, Supabase/PostgreSQL, n8n Cloud, OpenAI, Twilio WhatsApp, and Titan IMAP/SMTP. Verify the actual versions and current implementation from `package.json`, lockfile, source, migrations, and deployment configuration.

Do not replace working infrastructure just to make the frontend easier.

Preserve unless an audit proves otherwise and the owner approves:
- Supabase as the source of truth.
- n8n workflow responsibilities and webhook contracts.
- IMAP ingestion and SMTP threading headers.
- Twilio/Meta notification contract.
- HMAC voice-token verification and expiration.
- Human-in-the-loop send approval.
- Voice sending prohibition.
- Post-approval/sent read-only behavior.
- Audit history semantics.

## 2. Phase 0 — repository audit (must happen first)

Before editing:
1. Inspect repository tree, `package.json`, lockfile, Next.js configuration, Tailwind/CSS setup, component library, icon library, fonts, and build scripts.
2. Map all routes, layouts, server components, client components, server actions, API routes, middleware, and data-access modules.
3. Trace the data path for inbox list, email detail, draft save, approval/send, discard, realtime subscriptions, audit feed, login, and voice portal.
4. Inspect Supabase schema/migrations, RLS policies, grants, RPCs, triggers, and generated types where present.
5. Inspect n8n JSON workflow contracts and webhook payloads without printing secrets.
6. Run baseline lint, typecheck, tests, and production build. Record existing failures separately from introduced failures.
7. Inspect both supplied UI screenshots and document concrete issues: top-level navigation is too small and sparse; inbox is a long stream of individually boxed rows with repetitive metadata pills; filters consume substantial horizontal space; urgency, role, theme, and lifecycle are all competing visually; audit log displays raw JSON in the primary table; activity rows have excessive metadata density and low-level event names.
8. Create `docs/product-transformation/REPO_AUDIT.md` and `IMPLEMENTATION_PLAN.md` in the repository. Include file paths, current behavior, reuse decisions, risks, and test baseline.

Do not print secret values. If credentials are present in docs or git-tracked files, flag and redact them in generated reports.

## 3. Phase 1 — foundation and design system

- Establish CSS variables/design tokens and map them into existing Tailwind conventions.
- Audit and reuse existing primitives; avoid duplicative component libraries.
- Build the app shell and responsive navigation.
- Implement typography, buttons, badges, inputs, tables/lists, dialogs, drawers, alerts, skeletons, empty/error states.
- Add a consistent page container and responsive layout primitives.
- Ensure all components have accessible labels, focus behavior, disabled/loading states.
- Verify at minimum 1440px desktop, 1024px tablet, 768px small tablet, 390px mobile, and 320px narrow mobile (adapt breakpoints to actual app).

## 4. Phase 2 — core workflows

Recommended sequence:
1. App shell and navigation.
2. Inbox list and filter behavior.
3. Email detail/review workspace.
4. Approval confirmation and locked state.
5. Activity/audit redesign.
6. Home/command centre using real queries.
7. Voice portal visual refinement, without changing its security model.

Each slice must be independently buildable and testable. Do not redesign all routes in one massive unreviewable change.

## 5. Data and architecture rules

- Use existing typed data-access patterns; strengthen types where missing.
- Keep server-only credentials and service-role access out of client bundles.
- Enforce authorization server-side and in Supabase RLS; hiding a button is not authorization.
- Avoid broad client queries that fetch all email bodies when only list metadata is needed.
- Use pagination/infinite loading for growing inbox/audit datasets. Define stable ordering with tie-breakers.
- Use database-backed filters where possible; avoid fetching all records and filtering in the browser.
- Realtime subscriptions must be scoped, cleaned up, and handle reconnect/stale state.
- Avoid N+1 requests for sender, account, draft, or actor metadata; use efficient joins/views/RPCs where appropriate and secure.
- Do not introduce schema changes without a migration, rollback plan, RLS review, and owner approval for new business concepts.
- Proposed assignments, SLA deadlines, work orders, internal notes, attachments, and reporting must not be faked in frontend state. First determine whether they exist. If missing, propose schema/API work separately.
- Preserve email threading headers and verify outgoing recipient/body.
- Do not silently strip `[CONFIRM ...]` placeholders. Enforce unresolved-placeholder policy at the server/action boundary, not only in the UI.
- Idempotency/duplicate-send protections must be server-side; UI disabling alone is insufficient.
- Every consequential mutation should create the appropriate audit event if the backend supports it; propose migration if it does not.

## 6. Security and privacy review

The supplied Project Context contains plaintext development credentials and secret-like values. Treat them as compromised:
- Rotate passwords, API keys, webhook secrets, voice token secrets, and any exposed provider credentials as applicable.
- Inspect Git history and revoke exposed values, not merely delete current files.
- Ensure `.env*` except approved examples are ignored.
- Keep only placeholder variable names in `.env.example`; no usable secrets.
- Redact tokens, phone numbers, message bodies, personal data, and secret fields from logs.
- Sanitize HTML email rendering; prevent script execution and unsafe remote resource loading.
- Use short-lived signed voice tokens, constant-time signature verification, expiration checks, and binding to the expected email ID.
- Review rate limiting and abuse controls for voice APIs.
- Avoid exposing service-role keys or provider credentials in client-side code or error payloads.
- Verify access checks for every email/draft/audit route and mutation.

## 7. Testing and definition of done

### Required checks
- `npm run lint` (or actual repo equivalent).
- TypeScript check.
- Production build.
- Existing tests and relevant verification scripts.
- Component tests for core interactions where test setup exists.
- End-to-end flows for login, inbox filtering, email review, save, approve/send guard, locked state, audit view, and voice-token guardrails where test infrastructure permits.
- Responsive visual review at specified viewports.
- Keyboard-only walkthrough and contrast/accessibility scan.

### Critical regression tests
1. No send without explicit authenticated human action and permission.
2. Cannot approve/send a draft with unresolved placeholders unless policy explicitly allows and user confirms via the approved process.
3. Duplicate approval/send attempts do not dispatch duplicate email.
4. Approved/sent draft is read-only.
5. Invalid/expired voice token returns safe denial and no email data.
6. Voice intent cannot trigger send.
7. Realtime update does not overwrite unsaved local draft edits without warning.
8. Unauthorized user cannot access records by changing URL IDs.
9. Audit event history cannot be edited/deleted through UI.
10. Error state never reports a failed dispatch as successful.

## 8. Delivery process and agent reporting

At the end of each phase, report:
- What changed (routes/components/files).
- What real functionality is connected.
- What remains mock, unavailable, or proposed.
- Schema/API changes and migration status.
- Commands run and exact results.
- Security/accessibility regressions found.
- Screenshots or concise visual evidence at desktop and mobile.
- Next recommended slice.

Do not claim “production-ready” based only on a successful frontend build.
