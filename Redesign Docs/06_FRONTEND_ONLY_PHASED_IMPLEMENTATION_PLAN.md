# 06 — Frontend-Only Implementation Plan & Hard Execution Rules
## Foreman UI transformation — isolated branch, phased delivery

**Status:** Mandatory implementation contract for the coding agent  
**Scope:** Frontend only  
**Required branch:** `Tanish-frontend`  
**Merge policy:** Do not merge this branch into `main`. Do not merge `main` into this branch unless Tanish explicitly authorizes it.

---

# 1. Non-negotiable rules

The following rules override any conflicting instruction in other project documents or prompts.

## Rule 1 — Never work on `main`

- Do not implement, edit, commit, reset, rebase, cherry-pick, or otherwise modify work on `main`.
- Before making any file changes, inspect the current Git branch and working tree.
- Create and switch to a new branch named exactly `Tanish-frontend`.
- If `Tanish-frontend` already exists, inspect it and switch to it; do not delete or overwrite it.
- If the working tree contains uncommitted changes, do not discard, stash, reset, or overwrite them automatically. Report the state and preserve the user's work. Ask Tanish how to proceed if safely switching branches is not possible.
- Confirm the active branch is `Tanish-frontend` before every implementation phase and before every commit.
- All implementation commits, if any, must be made on `Tanish-frontend` only.
- Never commit to `main`.

### Branch setup procedure

Run and inspect the equivalent of:

```bash
git status --short --branch
git branch --show-current
git branch --list Tanish-frontend
```

If safe and the branch does not exist:

```bash
git switch -c Tanish-frontend
```

If it already exists:

```bash
git switch Tanish-frontend
```

Then verify:

```bash
git branch --show-current
git status --short --branch
```

The active branch must report `Tanish-frontend`. If it does not, stop immediately and report the blocker.

## Rule 2 — Never merge with `main`

- Do not merge `Tanish-frontend` into `main`.
- Do not open or complete an automatic merge into `main`.
- Do not create a pull request that targets `main`.
- Do not push changes to `main`.
- Do not rebase `Tanish-frontend` onto `main`, merge `main` into this branch, or cherry-pick `main` commits unless Tanish gives explicit, separate authorization.
- The task is to leave all frontend work isolated on `Tanish-frontend`.
- At the end of each phase, stop and report. Tanish decides when to authorize the next phase.
- At the end of the entire requested work, leave the branch unmerged. Do not perform cleanup that deletes the branch.

## Rule 3 — Frontend only. Absolutely no backend or integration changes

This task must not modify, configure, deploy, migrate, restart, or otherwise change anything outside the frontend.

**Strictly out of scope:**
- Supabase: database schema, migrations, SQL, RLS policies, triggers, functions, RPCs, storage, auth configuration, project settings, secrets, or data.
- n8n: workflows, nodes, credentials, executions, webhooks, environment variables, or deployment.
- Twilio, WhatsApp, Meta: APIs, templates, numbers, webhooks, credentials, configuration, or messaging behavior.
- IMAP/SMTP, email ingestion, email sending, mail providers, DNS, or provider configuration.
- Backend services, API routes, server actions that perform backend mutations, edge functions, workers, cron jobs, queues, and infrastructure.
- Environment variables, deployment settings, hosting configuration, CI/CD secrets, production/staging configuration, or external services.
- Dependencies or package changes that alter backend behavior, runtime contracts, or integrations without Tanish's explicit approval.

### Permitted frontend work

The coding agent may modify only the existing frontend presentation and client-side experience, such as:
- Frontend page layouts, styling, visual hierarchy, typography, spacing, colors, and responsive behavior.
- Frontend-only components and presentation primitives.
- Frontend navigation and layout, provided existing routes and permission behavior are preserved.
- Client-side rendering of data already provided by existing frontend/backend contracts.
- Frontend loading, empty, error, disabled, and success presentation states.
- Client-side filtering or sorting of data already loaded, provided it does not misrepresent counts or create security issues.
- Accessibility, keyboard behavior, and visual interaction states.
- Frontend tests and documentation.

### Existing API and backend contracts are read-only dependencies

The frontend may continue to call existing APIs, server actions, Supabase client queries, realtime subscriptions, and existing integration flows exactly as currently implemented, solely to preserve current functionality.

However:
- Do not change their implementation or contracts.
- Do not add new backend endpoints or modify request/response schemas.
- Do not add or change database fields, tables, policies, or migrations.
- Do not change authorization logic or server-side validation.
- Do not change the behavior of email send/approval, voice review, WhatsApp alerts, ingestion, or audit creation.
- Do not “fix” a backend limitation by changing backend code. Document it as a blocker or future request for explicit approval.
- If a frontend requirement cannot be completed without a backend change, implement only the safe frontend portion and report the backend dependency. Do not cross the boundary.

### Server-rendered frontend files

Some Next.js files may be server components or may contain server actions. Before editing such a file, inspect it and determine whether it contains backend logic or secrets.

- Do not alter server-side data access, mutations, credentials, authorization, or integration logic.
- If visual changes require touching a mixed UI/backend file, isolate the UI changes and leave backend code and behavior unchanged.
- If a safe separation cannot be made confidently, stop and report the file and reason rather than editing it.
- Never expose secrets or server-only values to client components.
- Do not print `.env` values, API keys, tokens, or credentials in logs, reports, screenshots, or generated documentation.

## Rule 4 — Work in phases. One phase at a time. Stop after each phase

Do not execute the entire transformation in one run, one prompt, one autonomous session, or one giant commit.

The required process is:

1. Work on only the currently authorized phase.
2. Complete that phase's defined scope.
3. Run the permitted frontend checks.
4. Review the diff to confirm that only frontend-allowed files and documentation changed.
5. Report results, changed files, screenshots if available, test outcomes, limitations, and risks.
6. STOP. Do not begin the next phase.
7. Wait for Tanish to explicitly authorize the next phase.

A statement such as “continue,” “proceed to Phase 2,” or equivalent from Tanish is required to start the next phase. Do not infer approval from silence or from the original overall request.

Do not perform future-phase work “while you're here.” Do not preemptively refactor unrelated components or make broad cleanups.

---

# 2. Phase plan and stop gates

## Phase 0 — Branch verification and frontend-only audit

**Goal:** Establish a safe baseline and plan without changing application behavior.

Tasks:
- Verify Git status and active branch.
- Create/switch to `Tanish-frontend` under the rules above.
- Inspect repository structure and identify frontend files versus backend/integration files.
- Inspect the supplied UI/UX screenshots and existing product/design documents.
- Map current frontend routes, layouts, components, styling system, UI library, icon library, and frontend data contracts.
- Identify which components call existing APIs or server actions; treat those contracts as read-only.
- Run existing frontend lint, typecheck, tests, and build commands if available. Do not change scripts or configuration to make checks pass.
- Record baseline failures separately from any future regressions.
- Create or update a frontend-only audit document under `docs/product-transformation/FRONTEND_AUDIT.md`.
- Create a phase-specific plan with exact files expected to change in Phase 1.

Forbidden in Phase 0:
- No UI implementation changes.
- No backend changes.
- No dependency installation or package modifications.
- No environment/configuration changes.
- No merge, rebase, or cherry-pick.

**Stop gate:** Report branch, working tree status, audit findings, baseline checks, and proposed Phase 1 file list. Stop and wait for Tanish's approval.

## Phase 1 — Design foundation and application shell

**Goal:** Establish a polished visual system and app shell without changing backend behavior.

Possible work:
- Centralize frontend-only design tokens using the existing styling approach.
- Refine typography, spacing, neutral surfaces, borders, focus states, and restrained brand accents.
- Refine the existing sidebar, top bar, page header, navigation active states, and responsive shell.
- Create or refine reusable frontend-only buttons, badges, inputs, tabs, tooltips, dialogs, skeletons, alerts, and empty states.
- Preserve existing routes, authentication behavior, permissions, and data access.
- Use existing dependencies and components wherever practical; do not add a new UI library without explicit approval.

Do not redesign individual workflow pages beyond what is required to validate the shell and shared components.

**Stop gate:** Run checks, inspect the diff, provide desktop/mobile screenshots if available, list changed files, and confirm no backend/integration files changed. Stop and wait.

## Phase 2 — Inbox UI redesign

**Goal:** Make the existing inbox easier to scan and operate while preserving current data and actions.

Possible work:
- Improve sender, subject, preview, timestamp, urgency, theme, and status hierarchy.
- Reduce repetitive chips, borders, and oversized card treatments.
- Refine existing tabs and filters without inventing new data or backend query capabilities.
- Improve responsive list/detail behavior using existing routes and data.
- Add frontend loading, empty, no-results, and error presentations based on existing states.
- Preserve existing email selection, navigation, and available actions.

Do not add assignment, snooze, archive, bulk actions, new filters requiring backend support, or new database concepts.

**Stop gate:** Verify existing inbox behavior and compare visual screenshots. Report and stop.

## Phase 3 — Email detail and draft review UI

**Goal:** Improve readability and human review without changing sending or approval logic.

Possible work:
- Visually distinguish original email, AI-generated draft, and staff-edited draft using data already available.
- Improve editor layout, recipient/subject/body presentation, placeholder warnings, and save-state feedback based on existing frontend responses.
- Improve the presentation of existing approval/send/discard controls while preserving their exact existing handlers and permission gates.
- Improve locked/read-only state presentation after approval/sending.
- Improve safe rendering only within the existing established sanitization path; do not weaken or replace security protections.

Do not change server actions, API contracts, send rules, placeholder validation, idempotency, SMTP behavior, or audit writes. If current backend behavior lacks a needed safeguard, report it; do not implement a backend workaround.

**Stop gate:** Verify the current workflow using available safe test/staging data. Do not send real email as part of UI testing unless Tanish explicitly authorizes it. Report and stop.

## Phase 4 — Approvals UI

**Goal:** Refine the existing approval queue and confirmation experience.

Possible work:
- Improve queue hierarchy and pending-review presentation using current data.
- Improve the review layout and make existing confirmation steps visually clear.
- Distinguish save, discard, approve, and send actions.
- Present actual backend success/failure responses accurately.
- Preserve existing permissions, confirmation logic, and no-duplicate-send safeguards.

Do not introduce bulk send, new approval policies, new roles, new backend checks, or new data models.

**Stop gate:** Verify existing approval paths without dispatching real messages unless explicitly authorized. Review diff, report, and stop.

## Phase 5 — Activity/audit UI

**Goal:** Make existing audit events understandable without changing audit generation or storage.

Possible work:
- Present readable labels for known event types in the frontend.
- Improve timestamp, actor, associated email, and summary hierarchy using fields already returned.
- Move existing technical metadata into a collapsed disclosure, if already available to the authorized frontend.
- Preserve all records, timestamps, and underlying values.
- Improve empty, loading, error, and responsive states.

Do not change audit schema, event creation, retention, immutability, logging, or backend queries. Do not fabricate actor names or human-readable summaries unsupported by known event types.

**Stop gate:** Confirm that the UI reflects the same audit records and that no audit backend changed. Report and stop.

## Phase 6 — Home/dashboard visual refinement

**Goal:** Improve the existing home screen using only existing data and existing queries.

Possible work:
- Refine layout and visual hierarchy.
- Make existing metrics link to existing views only when the corresponding route/filter already exists.
- Remove or visually de-emphasize decorative or unsupported metrics.
- Improve responsive behavior, loading states, and error handling.

Do not invent KPIs, create new queries/endpoints, add role-based data logic, or imply personal assignment if the backend only routes to roles.

**Stop gate:** Reconcile displayed values with existing source data, inspect diff, report and stop.

## Phase 7 — Voice portal frontend polish (only if separately approved)

**Goal:** Improve mobile usability of the existing voice review frontend without changing its security or integration behavior.

Possible work:
- Refine mobile layout, touch targets, audio controls, recording/transcription states, and accessible feedback.
- Preserve existing token handling, endpoints, expiry, and voice-send prohibition exactly.
- Do not expose data in invalid/expired-token states.

Do not modify HMAC verification, token generation, Twilio/WhatsApp, transcription services, APIs, server routes, or voice workflow logic.

**Stop gate:** Test only with approved safe test links/data; do not trigger real messages. Report and stop.

## Phase 8 — Frontend regression and polish

This phase must also be separately authorized.

Tasks:
- Review all completed frontend phases together.
- Test responsive breakpoints, keyboard navigation, visible focus, contrast, loading/empty/error/disabled states, and route consistency.
- Run existing frontend lint, typecheck, tests, and build.
- Review the full Git diff and file list for accidental backend/integration/configuration changes.
- Fix only frontend issues within the approved scope.
- Produce a final report and leave the work on `Tanish-frontend`, unmerged.

Do not merge, rebase, deploy, or push to production.

**Stop gate:** Provide final frontend-only report and wait for any separate instruction. Leave the branch intact and unmerged.

---

# 3. File boundary and change-control procedure

Before each phase:
1. State the active branch and verify it is `Tanish-frontend`.
2. List the exact files intended for modification.
3. Identify any mixed frontend/backend files and explain how backend logic will remain untouched.
4. Do not proceed if the scope is ambiguous.

After each phase:
1. Run `git status --short` and inspect `git diff --stat` and `git diff`.
2. Review every changed path.
3. Confirm no backend, integration, database, workflow, secret, environment, deployment, or infrastructure file changed.
4. If any forbidden file was changed accidentally, stop immediately. Do not commit, revert, or conceal it automatically. Report exactly what happened and ask Tanish how to recover.
5. Do not stage or commit unless Tanish has authorized commits. If commits are authorized, verify branch immediately before committing.
6. Do not push or merge unless separately and explicitly authorized; the default is no push and no merge.

### Examples of forbidden changes
- `supabase/**`, database migrations, SQL, RLS, RPCs, triggers.
- n8n workflow exports/configuration.
- Twilio, WhatsApp, Meta, IMAP, SMTP, or provider configuration.
- API routes, backend service modules, server actions that mutate data, edge functions, workers, jobs, webhooks.
- `.env*`, secrets, deployment/hosting configuration, CI/CD configuration, infrastructure files.
- Lockfiles/package manifests if dependency changes were not separately approved.

This list is illustrative, not exhaustive. When uncertain, treat a file as out of scope and ask.

---

# 4. Required phase completion report

At the end of every phase, output exactly this structure:

## Phase [N] — [Name] — Complete / Blocked

**Branch:** `Tanish-frontend` (verified: yes/no)  
**Scope completed:**  
- ...

**Files changed:**  
- `path/to/file` — reason

**Backend/integration boundary:**  
- Confirm whether any backend, Supabase, n8n, Twilio/WhatsApp, email-provider, API contract, environment, deployment, or infrastructure files changed. The required answer should be “No” unless a violation occurred; if violated, stop and disclose it.

**Checks run:**  
- Command — pass/fail/not available, with actual result

**Visual verification:**  
- Viewports/screenshots inspected, or clearly state not performed

**Known limitations / blocked requirements:**  
- ...

**Next phase proposed:**  
- Name only; do not begin it.

**Status:** STOPPED — awaiting explicit authorization from Tanish.

Do not continue after this report. Do not automatically start the next phase.

---

# 5. Initial instruction

Begin with Phase 0 only.

First inspect Git status and branch. Establish `Tanish-frontend` safely. Then perform the frontend-only audit and baseline checks, write the audit and Phase 1 plan, provide the required completion report, and stop.

Do not implement Phase 1 in the same run. Do not touch backend, Supabase, n8n, Twilio, email integrations, APIs, configuration, or infrastructure. Do not merge with `main`.
