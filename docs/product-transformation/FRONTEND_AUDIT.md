# Foreman — Frontend-Only Architectural Audit & Baseline Report

**Project:** Foreman — Allsaints Builders Internal Operations Platform  
**Document:** Phase 0 Baseline Audit & Architecture Mapping  
**Date:** September 2026  
**Active Branch:** `Tanish-frontend`  
**Execution Scope:** Frontend Presentation Only (Strict Backend & Integration Isolation)

---

## 1. Executive Summary & Verification Baseline

This audit establishes the baseline for transforming the Foreman frontend into an enterprise-grade operational workspace for Allsaints Builders, complying strictly with the non-negotiable rules in `Redesign Docs/06_FRONTEND_ONLY_PHASED_IMPLEMENTATION_PLAN.md`.

### Git Branch & Workspace Verification
- **Current Branch:** `Tanish-frontend` (Created and switched from `main` without data loss or reset).
- **Merge & Rebase Policy:** `main` is untouched. No commits, merges, or pushes to `main`.
- **Isolation:** All work remains strictly within `Tanish-frontend`.

### Quality & Baseline Command Results
- **TypeScript Check (`npx tsc --noEmit`):**
  - **Result:** `PASS` (0 errors).
  - All application files, types, and route definitions satisfy TypeScript 5.
- **Production Build Check (`npm run build`):**
  - **Result:** `PASS` (Turbopack compiled 7/7 routes cleanly in 1463ms).
  - Routes verified:
    - `/` (Dynamic Server Component)
    - `/_not-found` (Static)
    - `/api/voice/rewrite` (Dynamic API)
    - `/api/voice/stt` (Dynamic API)
    - `/api/voice/tts` (Dynamic API)
    - `/audit-log` (Dynamic Server Component)
    - `/emails/[id]` (Dynamic Server Component)
    - `/login` (Static Client Page)
    - `/voice/[email_id]` (Dynamic Server Component)
- **Lint Check (`npm run lint`):**
  - **Result:** `73 pre-existing issues` (56 errors, 17 warnings).
  - **Cause:** Pre-existing `@typescript-eslint/no-explicit-any` (56) in legacy client components (`InboxView.tsx`, `EmailDetailView.tsx`, `VoiceEmailView.tsx`) and voice token script helpers, plus unused variable warnings (17).
  - **Baseline Rule:** These are recorded as pre-existing baseline debt. Future phases will not introduce new lint errors and will incrementally eliminate these as components are refactored.
- **Automated Tests (`npm test`):**
  - **Result:** `Not Available` (No test script is currently configured in `package.json`).

---

## 2. Technology Stack & Framework Constraints

- **Framework:** Next.js `16.3.1` (App Router) with React `19.2.8`.
  - Next.js 16/React 19 conventions: Route `params` and `searchParams` in Server Components are asynchronous promises (`const { id } = await params`).
  - Next.js 16 note: `middleware.ts` is deprecated in Next 16 in favor of proxying, but per Rule 3 backend/middleware configuration is untouched in this frontend-only scope.
- **Styling System:** Tailwind CSS v4 (`@tailwindcss/postcss ^4`, `tailwindcss ^4`).
  - Configuration is CSS-first via `@import "tailwindcss";` in `src/app/globals.css`. There is no legacy `tailwind.config.js`. Design tokens must be defined via the `@theme` directive or CSS variables in `:root`.
- **Iconography:** `lucide-react` `^1.31.0` is the single established icon library.
- **HTML Sanitization:** `dompurify` `^3.4.13` (used for email body rendering).
- **Backend & State Clients:** `@supabase/ssr ^0.12.4`, `@supabase/supabase-js ^2.112.3`.

---

## 3. Comprehensive Route Map & Layout Architecture

### Route Inventory

| Route | Kind | Auth & Protection | Data Fetching (Read-Only) | Presentation Component |
| :--- | :--- | :--- | :--- | :--- |
| `/login` | Client Page | Public / Redirects to `/` if session exists | Calls `login(formData)` server action | `src/app/login/page.tsx` |
| `/` | Server Component (`force-dynamic`) | Supabase Session Auth (Middleware redirect) | `emails` joined with `accounts`, `accounts` list | `src/app/page.tsx` -> `InboxView` |
| `/emails/[id]` | Server Component (`force-dynamic`) | Supabase Session Auth | `emails` (by id), `drafts` (by email_id), `audit_log` (classified) | `src/app/emails/[id]/page.tsx` -> `EmailDetailView` |
| `/audit-log` | Server Component (`force-dynamic`) | Supabase Session Auth | `audit_log` joined with `emails` & `users` | `src/app/audit-log/page.tsx` -> `AuditLogView` |
| `/voice/[email_id]` | Server Component (`force-dynamic`) | Public to dashboard session; **Secured via signed HMAC Token** | `emails`, latest `drafts`, `users` | `src/app/voice/[email_id]/page.tsx` -> `VoiceEmailView` |
| `/_not-found` | Client Page | Public / Standard 404 | None | `src/app/not-found.tsx` |
| Error Boundary | Client Component | Catches route errors | None | `src/app/error.tsx` |
| Route Skeletons | Server Components | Loading fallbacks | None | `src/app/loading.tsx`, `emails/[id]/loading.tsx`, `audit-log/loading.tsx`, `voice/[email_id]/loading.tsx` |

### Layout Shell Analysis
- Currently, `src/app/layout.tsx` is completely empty of shell structure. Every page (`/`, `/emails/[id]`, `/audit-log`, error, not-found) redundantly imports and mounts `<Navbar />` individually.
- The existing `<Navbar />` is a basic top horizontal bar with only 2 links (`Inbox` and `Audit Log`) and a dark charcoal background.
- **Target Specification Gap:** `02_DESIGN_SYSTEM_AND_UI_SPEC.md` requires a persistent, collapsible sidebar (232–256px expanded, icon rail collapsed), a topbar with page title and search affordance, and role-aware navigation destinations (`Home`, `Inbox`, `Approvals`, `Activity`).

---

## 4. Component Inventory

| Component | Path | Responsibilities & UI States |
| :--- | :--- | :--- |
| `Navbar` | `src/components/Navbar.tsx` | Horizontal topbar, brand wordmark, links, user email, sign-out button. |
| `InboxView` | `src/components/InboxView.tsx` | Email list feed, filter dropdowns (Role, Theme, Urgency, Status), account tabs, search input, mobile filter bottom-sheet, Realtime live connection indicator. |
| `EmailDetailView` | `src/components/EmailDetailView.tsx` | Split layout: original sanitized email + AI classification card + reply draft editor. Actions: Save, Approve & Send, Discard. Read-only lock state when approved/sent. |
| `AuditLogView` | `src/components/AuditLogView.tsx` | Activity log with action filter buttons, search input, mobile stacked cards, desktop table view, details JSON formatter. |
| `VoiceEmailView` | `src/components/VoiceEmailView.tsx` | Mobile-first push-to-talk voice portal: audio recorder, STT, OpenAI TTS stream, rewrite commands, on-screen approve & send button. |
| `StatusBadge` | `src/components/StatusBadge.tsx` | Renders status chips (`new`, `classified`, `drafted`, `pending`, `approved`, `sent`, `discarded`). |
| `ThemeBadge` | `src/components/ThemeBadge.tsx` | Renders neutral category chips for 9 business themes (`accounts`, `orders`, `finance`, etc.). |
| `UrgencyBadge` | `src/components/UrgencyBadge.tsx` | Renders urgency indicator with colored dot (`urgent`, `priority`, `normal`). |

---

## 5. Strict Read-Only Boundaries & Untouchable Files

Under Rule 3 of the Phased Implementation Plan, all backend mutations, server actions, API routes, database schemas, and integration flows are strictly **READ-ONLY** and must not be altered:

### Untouchable Files:
1. `src/app/emails/[id]/actions.ts` (Server actions: `saveDraftAction`, `approveAndSendAction`, `discardDraftAction`).
   - *Note:* These actions perform database updates and trigger n8n webhooks for email dispatch. The frontend must preserve their exact call signatures and parameters (`emailId`, `draftId`, `editedText`, `wasDiscarded`, `via`).
2. `src/app/login/actions.ts` (Server actions: `login`, `logout`).
3. `src/app/api/voice/tts/route.ts` (OpenAI TTS streaming endpoint).
4. `src/app/api/voice/stt/route.ts` (OpenAI Whisper transcription endpoint).
5. `src/app/api/voice/rewrite/route.ts` (OpenAI GPT-4o mini rewrite endpoint).
6. `src/lib/voice-token.ts` & `src/lib/voice-commands.ts` (HMAC security token verification and voice parsing).
7. `src/lib/supabase/*` (Supabase client/server/middleware initializers).
8. `src/middleware.ts` (Route authentication session handler).
9. `src/types/database.ts` (Generated Supabase database schema types).
10. All non-frontend directories: `supabase/**`, `n8n/**`, `scripts/**`, `handover/**`, `New Docs/**`.

---

## 6. Visual System Findings & Gap Analysis

| Dimension | Current Implementation | Target Specification (`02_DESIGN_SYSTEM_AND_UI_SPEC.md`) | Gap / Action Needed |
| :--- | :--- | :--- | :--- |
| **Color Tokens** | Defined as one-off variables in `:root` (`--foreman-charcoal: #1c1a17`, `--foreman-cream: #f5f1e8`, etc.) but components use arbitrary inline hexes (`bg-[#f5f1e8]`, `text-[#1c1a17]`, `border-[#e8e2d4]`). | Centralized semantic design tokens via Tailwind v4 `@theme`: `--app-bg` (`#F7F8FA`), `--surface` (`#FFFFFF`), `--surface-subtle` (`#F1F3F5`), `--text-primary` (`#17191C`), `--text-secondary`, `--border-subtle`, `--border-strong`, `--brand` (restrained ink/evergreen). | Centralize design tokens in `globals.css` using Tailwind v4 `@theme` block and replace hardcoded hexes. |
| **Visual Hierarchy & Clutter** | Every email row renders 4 to 5 badges (Account, Theme, Urgency, Role, Status) creating horizontal badge clutter. | Dense, scannable work lists. Show only the 2 strongest status signals on rows; move secondary metadata to the detail pane. | Streamline list item rows in Phase 2; establish base Badge primitives in Phase 1. |
| **Typography** | Generic unstyled system font stack. No tabular figures. | Refined typography hierarchy with clear sizing (Page title 24–30px, Section 15–18px, Body 14–16px, Meta 12–13px). Tabular numbers for timestamps and counts. | Define typography tokens and apply `tabular-nums` for numbers and timestamps. |
| **App Shell** | Single top horizontal bar with 2 links. No persistent sidebar or drawer. | Persistent collapsible sidebar (232–256px expanded, icon rail on desktop, drawer on mobile), sticky topbar with page title and search. | Construct `AppShell`, `Sidebar`, `Topbar`, and `PageHeader` in Phase 1. |
| **Urgency Mapping** | `urgent`, `priority`, `normal`. | `urgent` (red), `priority` (amber), `routine` (neutral), `read_later` (muted). | Expand `UrgencyBadge` to support `routine` and `read_later` alongside legacy `normal`. |
| **URL State** | Inbox filters exist only in local `useState`; unable to bookmark or link to filtered views. | Filters must be URL-serializable so counters on Home can link directly to filtered Inbox views. | Refactor filtering to URL query parameters in Phase 2. |

---

## 7. Phase 1 Scope & Implementation Plan

### Goal:
Establish a polished design foundation and responsive application shell without altering any backend behavior or data mutations.

### Files Proposed for Phase 1 Modification / Creation:

#### 1. Token & Style Configuration:
- `src/app/globals.css` — Modify to define centralized design tokens using Tailwind v4 `@theme`, clear semantic CSS variables (`--app-bg`, `--surface`, `--surface-subtle`, `--text-primary`, `--text-secondary`, `--border-subtle`, `--brand`), accessible focus rings, and custom scrollbars.

#### 2. Reusable UI Primitives:
- `src/components/ui/Button.tsx` (New) — Accessible button primitive (primary, secondary, ghost, destructive variants; loading spinner & disabled states).
- `src/components/ui/Badge.tsx` (New) — Unified token-based badge primitive.
- `src/components/ui/Card.tsx` (New) — Surface container with restrained border and elevation.
- `src/components/StatusBadge.tsx` (Modify) — Refactor to use new design tokens and accessible contrast.
- `src/components/ThemeBadge.tsx` (Modify) — Refactor to use clean neutral badge tokens.
- `src/components/UrgencyBadge.tsx` (Modify) — Refactor to support `urgent`, `priority`, `routine`, `read_later` semantics with accessible indicator dots.

#### 3. Application Shell Components:
- `src/components/shell/AppShell.tsx` (New) — Top-level shell provider managing sidebar collapse state, desktop rail, and mobile drawer.
- `src/components/shell/Sidebar.tsx` (New) — Left navigation bar with brand mark, navigation destinations (`Home`, `Inbox`, `Approvals`, `Activity`), active state indicator, and signed-in user footer.
- `src/components/shell/Topbar.tsx` (New) — Top header with page title, search/filter affordance, and live status indicator.
- `src/components/Navbar.tsx` (Modify) — Refactor to preserve backward compatibility while delegating to the new shell components.

#### 4. Root Layout Integration:
- `src/app/layout.tsx` (Modify) — Apply base background token and integrate font configuration.

### Files Strictly Untouched in Phase 1:
- `src/components/InboxView.tsx` (Deferred to Phase 2)
- `src/components/EmailDetailView.tsx` (Deferred to Phase 3)
- `src/components/AuditLogView.tsx` (Deferred to Phase 5)
- `src/components/VoiceEmailView.tsx` (Preserved intact; deferred to Phase 7)
- All server actions, API routes, Supabase queries, and database types.

---

## 8. Stop Gate Sign-Off

Phase 0 verification and audit are complete. No application behavior has been changed. No backend files have been touched. Awaiting explicit user authorization to proceed to Phase 1.
