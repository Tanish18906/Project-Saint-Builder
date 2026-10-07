# Project Saint Builder — "Foreman" AI Email Agent
## Comprehensive Developer & Coding Agent Context Manual

> **NOTICE FOR CODING AGENTS**:  
> Read this document first before inspecting individual source files. It contains the complete architectural blueprint, business rules, data schemas, authentication boundaries, and state machines for **Project Saint Builder (Foreman)**. You do not need to read the entire codebase to understand how to build features, fix bugs, or optimize performance.

---

## 1. Executive Summary & Purpose

- **Client**: **Allsaints Builders** (UK-based construction, contracting, and property management firm).
- **Project Codename**: **Foreman** (`Project_SaintBuilder`).
- **Core Problem**: Directors and site operations receive hundreds of high-stakes operational emails daily across multiple corporate accounts (quotes, site access notices, subcontractor certificates, client revisions, council notices). Key emails are missed or answered late because managers are on active construction sites rather than at desks.
- **Solution**: An intelligent email triage, classification, drafting, and human-in-the-loop approval platform:
  1. Ingests emails from dual corporate Titan inboxes (`info@` and `team@`).
  2. Classifies incoming emails with OpenAI GPT-4o into **9 operational themes**, assesses **urgency**, and routes them to specific **staff roles**.
  3. Generates contextual draft replies with safety placeholders (`[CONFIRM DATE]`, etc.) for unverified facts.
  4. Alerts staff via **Twilio WhatsApp** for urgent/priority items with a signed 1-click **Mobile Voice Review Link**.
  5. Provides a desktop/tablet **Staff Review Dashboard** and a hands-free **Mobile Voice Portal** where managers can review, dictate revisions, and approve replies.
  6. Dispatches approved replies through **Titan SMTP** with full email threading headers (`In-Reply-To`, `References`).

### The Architectural Philosophy: Decoupled Single Source of Truth
The architecture is deliberately decoupled:
- **Supabase (PostgreSQL 15)** is the **Single Source of Truth**.
- **n8n Automation Engine** is the **Background Automation & Ingestion Worker**.
- **Next.js 16 Web Dashboard** is the **Human-in-the-Loop Review & Control Interface**.
- **Business Logic Boundary**: Email ingestion, AI drafting, WhatsApp delivery, and actual SMTP email dispatch live in **n8n and Supabase database triggers**, NOT inside the Next.js web application. The web app's responsibility is presenting data, collecting user edits/approvals, and updating draft state in Supabase.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       Dual Titan Inboxes (IMAP)                             │
│   • info@allsaintsbuilders.com (Directors / Senior Admin)                   │
│   • team@allsaintsbuilders.com (Operations / Progressor)                    │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ Polled every 1-5 mins
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          n8n Cloud Workflow 1                               │
│                  (https://allsaintsbuilders.app.n8n.cloud)                  │
│   1. Extracts RFC 822 Message-ID, Subject, Body, Headers                    │
│   2. OpenAI GPT-4o: Categorizes theme, urgency, & routed_roles              │
│   3. OpenAI GPT-4o: Drafts contextual reply with [CONFIRM ...] guards       │
│   4. Inserts into Supabase `emails` and `drafts` + records `audit_log`      │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                     Supabase PostgreSQL Database                            │
│   • Tables: accounts, users, emails, drafts, audit_log                      │
│   • Realtime WebSockets: Live dashboard updates                             │
│   • Database Triggers (`pg_net`):                                           │
│     - `tr_email_inserted_whatsapp_webhook` -> fires n8n Workflow 3          │
│     - `tr_draft_approved_webhook`          -> fires n8n Workflow 2          │
└──────────────┬───────────────────────────────────────────────┬──────────────┘
               │                                               │
 (Urgent items │ trigger)                       (Status changes│ to 'approved')
               ▼                                               ▼
┌───────────────────────────────┐               ┌──────────────────────────────┐
│     n8n Workflow 3            │               │      n8n Workflow 2          │
│  (WhatsApp Dispatch)          │               │      (SMTP Dispatch)         │
│ • Matches `routed_roles` to   │               │ • Triggered by pg_net POST   │
│   users with phone numbers    │               │ • Sends reply via Titan SMTP │
│ • Generates signed HMAC token │               │   with In-Reply-To headers   │
│ • Sends WhatsApp template via │               │ • Flips email & draft status │
│   Twilio with /voice link     │               │   to 'sent' in Supabase      │
└──────────────┬────────────────┘               └──────────────────────────────┘
               │ (WhatsApp link)
               ▼
┌───────────────────────────────────────────────┐
│     Foreman Web Application (Next.js 16)      │
│                                               │
│  [A] Staff Review Dashboard (Session Auth)    │
│      • / (Command Centre / Overview)          │
│      • /inbox (Search, filter, themes)        │
│      • /approvals (Pending draft queue)       │
│      • /audit-log (Immutable action history)  │
│      • /emails/[id] (Draft editor & approval) │
│                                               │
│  [B] Mobile Voice Portal (Signed Token Auth)  │
│      • /voice/[email_id]?token=...            │
│      • /voice/<token>                         │
│      • Hands-free Whisper STT + GPT-4o Agent  │
│      • Server Actions for draft save/approve  │
└───────────────────────────────────────────────┘
```

---

## 2. Tech Stack & Exact Versions

| Component | Technology | Exact Version | Notes / Critical Caveats |
|---|---|---|---|
| **Framework** | Next.js (App Router) | **16.3.1** | Uses Turbopack. `params` & `searchParams` are `Promise` based. `cookies()` is async. |
| **UI Library** | React / React DOM | **19.2.8** | React 19 rules: Server Components first. Safe prop sync without cascading effects. |
| **Styling** | Tailwind CSS | **^4.0.0** | Uses `@theme` directive in `globals.css` with CSS custom variables. |
| **Icons** | Lucide React | **^1.31.0** | Uniform sizing (`size-4`, `size-5`). |
| **Database & Auth** | Supabase (`@supabase/ssr` + `@supabase/supabase-js`) | SSR: **^0.12.4**, JS: **^2.112.3** | PostgreSQL 15, `pg_net` webhooks, Realtime WebSockets. |
| **HTML Sanitizer**| DOMPurify | **^3.4.13** | Used for safe rendering of raw email HTML bodies. |
| **Language** | TypeScript | **^5.0.0** | Strict mode enabled. Hand-maintained schema types. |
| **Linter** | ESLint | **^9.0.0** | Flat config in `eslint.config.mjs` with `eslint-config-next`. |
| **AI Ingestion** | OpenAI API | GPT-4o | Used in n8n and Next.js `/api/voice/*` endpoints. |
| **Voice STT** | OpenAI Whisper | `whisper-1` | Audio transcription via `/api/voice/stt` (7.5s timeout). |
| **Voice TTS** | OpenAI Speech | `tts-1` / `tts-1-hd` | Synthesized voice via `/api/voice/tts` + Web Speech API fallback. |
| **Automation** | n8n Cloud | Hosted | `https://allsaintsbuilders.app.n8n.cloud`. |
| **Messaging** | Twilio API | WhatsApp Business | Templated WhatsApp notifications for urgent items. |

---

## 3. Repository Directory Structure & File Map

```
Project_SaintBuilder/
├── .agents/                               # Subagent skill guidelines & references
│   └── skills/frontend-developer/         # Frontend architectural standards
├── .env.example                           # Sample environment configuration
├── .env.local                             # Local development environment overrides
├── AGENTS.md                              # Next.js 16 breaking change rules
├── CLAUDE.md                              # Quick command reference and architecture notes
├── PROJECT_CONTEXT.md                     # <-- THIS DOCUMENT (Authoritative Project Context)
├── README.md                              # Public overview and onboarding instructions
├── package.json                           # Dependencies and npm scripts
├── next.config.ts                         # Next.js configuration
├── tsconfig.json                          # TypeScript compiler options
├── eslint.config.mjs                      # ESLint 9 flat configuration
├── vercel.json                            # Vercel deployment overrides
│
├── handover/                              # Migration records & DB exports (Sep 2026)
│   ├── schema.sql                         # Complete database schema snapshot
│   ├── rls-policies.sql                   # Row Level Security policy definitions
│   ├── webhooks.md                        # Documentation of database webhook triggers
│   └── data-export/                       # Seed CSV files (accounts, users, emails, etc.)
│
├── n8n/
│   └── workflows/
│       ├── Foreman Agent.json             # Workflows 1 & 2 (Ingestion, Drafting & SMTP Send)
│       └── Foreman Whatsapp.json          # Workflow 3 (Twilio WhatsApp urgent notifications)
│
├── Optimization/                          # Forensic performance reports and plans
│   ├── 02_PERFORMANCE_IMPLEMENTATION_PLAN.md
│   ├── 03_PERFORMANCE_IMPLEMENTATION_FIX.md
│   └── 04_PERFORMANCE_FORENSIC_SUBAGENT.md
│
├── scripts/                               # Direct tsx validation & testing scripts
│   ├── get-voice-link.ts                  # Generates signed voice review URL for an email ID
│   ├── gen-expired-voice-link.ts          # Generates expired token for error UI testing
│   ├── test-voice-token.ts                # Unit verification of HMAC token verification
│   ├── test-voice-api-routes.ts           # HTTP integration test for voice endpoints
│   ├── verify-voice-bugs.ts               # Verification of voice parser against real Supabase DB
│   └── verify-array-schema.ts             # Confirms theme & routed_roles array column in Supabase
│
├── supabase/                              # Database migrations & local configuration
│   ├── config.toml                        # Supabase local environment config
│   └── migrations/
│       ├── 20260812070800_setup_foreman_email_agent_schema.sql
│       ├── 20260817131500_add_email_inserted_whatsapp_webhook.sql
│       ├── 20260817132500_update_whatsapp_webhook_url_after_canvas_move.sql
│       ├── 20260826172500_theme_based_routing_schema_v2.sql  <-- Theme-routing migration
│       └── 20260921223000_update_webhook_urls_to_allsaintsbuilders.sql
│
└── src/
    ├── middleware.ts                      # Root Next.js middleware (delegates to supabase/middleware)
    │
    ├── types/
    │   └── database.ts                    # Hand-maintained Supabase database types
    │
    ├── lib/
    │   ├── voice-token.ts                 # 32-byte HMAC-SHA256 signed token mint/verify
    │   ├── voice-commands.ts              # Speech normalization & intent parsing utilities
    │   └── supabase/
    │       ├── client.ts                  # Browser Supabase client (createBrowserClient)
    │       ├── server.ts                  # Async Server Component client (createServerClient)
    │       └── middleware.ts              # Session auth middleware + fast-path cookie check
    │
    ├── app/
    │   ├── layout.tsx                     # Root HTML shell & Inter font loading
    │   ├── globals.css                    # Tailwind CSS v4 @theme, tokens, animations
    │   ├── not-found.tsx                  # Global 404 handler
    │   ├── error.tsx                      # Global error boundary
    │   │
    │   ├── login/                         # Staff Authentication
    │   │   ├── page.tsx                   # Architectural login screen with visual credentials feedback
    │   │   └── actions.ts                 # Server action for supabase.auth.signInWithPassword
    │   │
    │   ├── (dashboard)/                   # Protected Dashboard Group (AppShell layout)
    │   │   ├── layout.tsx                 # AppShell wrapper: Topbar + Sidebar + main slot
    │   │   ├── page.tsx                   # Route: / -> Command Centre (Metrics & Recent Feeds)
    │   │   ├── inbox/                     # Route: /inbox -> Full searchable/filterable email feed
    │   │   │   ├── page.tsx
    │   │   │   └── loading.tsx
    │   │   ├── approvals/                 # Route: /approvals -> Pending draft review queue
    │   │   │   ├── page.tsx
    │   │   │   └── loading.tsx
    │   │   ├── audit-log/                 # Route: /audit-log -> Historical audit log
    │   │   │   ├── page.tsx
    │   │   │   └── loading.tsx
    │   │   └── emails/[id]/               # Route: /emails/[id] -> Desktop email & draft review
    │   │       ├── page.tsx
    │   │       └── loading.tsx
    │   │
    │   ├── emails/[id]/                   # SERVER ACTIONS (Note physical folder placement!)
    │   │   └── actions.ts                 # saveDraftAction, approveAndSendAction, discardDraftAction
    │   │
    │   ├── voice/[email_id]/              # Standalone Mobile Voice Review Portal (Public / Token Auth)
    │   │   ├── page.tsx                   # Server page: handles /voice/[email_id]?token=... & /voice/<token>
    │   │   ├── loading.tsx
    │   │   └── error.tsx
    │   │
    │   └── api/voice/                     # Backend Voice API Endpoints (Exempt from dashboard login)
    │       ├── agent/route.ts             # OpenAI GPT-4o Conversational Voice Agent (JSON Schema)
    │       ├── rewrite/route.ts           # OpenAI draft restyling (formal, shorter, technical)
    │       ├── stt/route.ts               # OpenAI Whisper-1 Speech-To-Text audio transcriber
    │       └── tts/route.ts               # OpenAI TTS-1 / TTS-1-HD Text-To-Speech generator
    │
    └── components/                        # UI Components
        ├── ui/                            # Atoms: Button, Card, Input, Badge
        ├── shell/                         # Layout atoms: AppShell, Topbar, Sidebar
        ├── home/                          # Command Centre widgets (Metrics, Feeds, Activity)
        ├── inbox/                         # Modular inbox list items, tabs, filter bars, empty states
        ├── approvals/                     # Approval queue cards, filter bar, view container
        ├── audit-log/                     # Audit trail tables, action details, event helper utilities
        ├── email-detail/                  # Desktop draft editor cards, classification card, dialogs
        ├── voice/                         # Mobile voice portal widgets: VoiceOrb, AudioControls, Modals
        │
        ├── InboxView.tsx                  # Client container for /inbox (wraps @/components/inbox)
        ├── EmailDetailView.tsx            # Client container for /emails/[id] (wraps @/components/email-detail)
        ├── VoiceEmailView.tsx             # Client container for /voice (wraps @/components/voice)
        ├── AuditLogView.tsx               # Client container for /audit-log (wraps @/components/audit-log)
        ├── Navbar.tsx                     # Standalone navbar
        ├── StatusBadge.tsx                # Status badge component
        ├── ThemeBadge.tsx                 # Theme badge component (v2 9 themes)
        └── UrgencyBadge.tsx               # Urgency badge component (urgent, priority, normal)
```

---

## 4. Database Schema Deep Dive & Critical Schema Evolution

Supabase PostgreSQL is the system's core state repository. The database lives on project ref `clxqjxtmxswpjjvqunfx`.

### ⚠️ CRITICAL WARNING: Schema Migration Evolution (Theme-Based Routing v2)
Earlier versions of the codebase used two legacy classification columns: `emails.category` and `emails.routed_role`.  
In migration `20260826172500_theme_based_routing_schema_v2.sql`, the schema evolved:
- **`emails.category` is DEPRECATED**: It is superseded by `emails.theme`. Do NOT read or write `category` in any new business logic.
- **`emails.routed_role` (single string) is DEPRECATED**: It is superseded by `emails.routed_roles` (PostgreSQL `TEXT[]` array). An email can now be routed to multiple roles simultaneously (e.g., `['director', 'senior_admin']`).
- **`emails.urgency` was added**: Enforces strict CHECK constraint (`'urgent'`, `'priority'`, `'normal'`).

### Tables Specification

#### 1. `accounts`
Stores monitored corporate inboxes.
- `id` (`UUID`, PK)
- `email_address` (`TEXT`, Unique): e.g., `info@allsaintsbuilders.com`, `team@allsaintsbuilders.com`
- `display_name` (`TEXT`): e.g., `Info — Directors & Admin`, `Team — Progressor & Ops`
- `created_at` (`TIMESTAMPTZ`)

#### 2. `users`
Internal staff members and their operational routing targets.
- `id` (`UUID`, PK)
- `name` (`TEXT`): Staff member's name
- `email` (`TEXT`, Unique): Corporate email
- `role` (`TEXT`): Primary role: `director`, `senior_admin`, `progressor`, `accountant`
- `whatsapp_number` (`TEXT`, Nullable): E.164 phone number used by n8n Workflow 3 for Twilio WhatsApp dispatch
- `created_at` (`TIMESTAMPTZ`)

#### 3. `emails`
Every incoming message ingested by n8n IMAP trigger.
- `id` (`UUID`, PK)
- `account_id` (`UUID`, FK -> `accounts.id`)
- `message_id` (`TEXT`, Unique): RFC 822 `Message-ID` header. **Crucial for email threading**.
- `thread_id` (`TEXT`, Nullable): Thread group identifier
- `from_address` (`TEXT`): Sender's email
- `from_name` (`TEXT`, Nullable): Sender's display name
- `subject` (`TEXT`, Nullable): Email subject line
- `body_text` (`TEXT`, Nullable): Plain text version of email body
- `body_html` (`TEXT`, Nullable): Rich HTML version (sanitized via DOMPurify before rendering)
- `received_at` (`TIMESTAMPTZ`): Timestamp from email headers
- `theme` (`TEXT`, Nullable): One of 9 valid operational themes:
  - `'accounts'`, `'orders'`, `'finance'`, `'suppliers'`, `'promotions'`, `'nph_jobs'`, `'meetings_appointments'`, `'invoices'`, `'certificates'`
- `urgency` (`TEXT`, Nullable): `'urgent'` | `'priority'` | `'normal'`
- `routed_roles` (`TEXT[]`, Nullable): Array of target roles, e.g., `ARRAY['director', 'progressor']`
- `status` (`TEXT`, Default `'new'`): `'new'`, `'drafted'`, `'approved'`, `'sent'`, `'archived'`
- `category` (`TEXT`, Deprecated)
- `routed_role` (`TEXT`, Deprecated)

#### 4. `drafts`
Suggested AI replies and edited human drafts.
- `id` (`UUID`, PK)
- `email_id` (`UUID`, FK -> `emails.id`, Unique/1:1)
- `ai_generated_text` (`TEXT`, Nullable): The raw original reply drafted by OpenAI GPT-4o in Workflow 1
- `edited_text` (`TEXT`, Nullable): The draft containing human edits or voice rewrites
- `draft_type` (`TEXT`, Default `'ai_generated'`):
  - `'ai_generated'`: Sent exactly as drafted by AI
  - `'ai_edited'`: Sent with modifications to the AI draft
  - `'manual'`: Discarded AI text and wrote a brand-new reply from scratch
- `status` (`TEXT`, Default `'pending'`):
  - `'pending'`: Under review (editable)
  - `'approved'`: Approved by staff (triggers SMTP webhook!)
  - `'sent'`: Confirmed sent by n8n SMTP worker
  - `'discarded'`: Explicitly rejected by staff
- `approved_by` (`UUID`, Nullable, FK -> `users.id`)
- `approved_at` (`TIMESTAMPTZ`, Nullable)
- `sent_at` (`TIMESTAMPTZ`, Nullable)
- `created_at` (`TIMESTAMPTZ`)
- `updated_at` (`TIMESTAMPTZ`)

#### 5. `audit_log`
Immutable chronological audit trail of all automated and human interventions.
- `id` (`UUID`, PK)
- `email_id` (`UUID`, Nullable, FK -> `emails.id`)
- `draft_id` (`UUID`, Nullable, FK -> `drafts.id`)
- `user_id` (`UUID`, Nullable, FK -> `users.id`)
- `action` (`TEXT`): Recorded events:
  - `'classified'`: AI classification completed by n8n
  - `'drafted'`: Initial AI draft generated by n8n
  - `'edited'`: Draft saved with modifications
  - `'approved'`: Staff member clicked Approve
  - `'discarded'`: Staff member clicked Discard
  - `'sent'`: n8n completed SMTP delivery
  - `'whatsapp_notified'`: n8n Workflow 3 dispatched WhatsApp message
  - `'whatsapp_skipped'`: n8n Workflow 3 skipped dispatch (routine email or no valid phone)
- `details` (`JSONB`, Nullable): Context metadata (confidence scores, character counts, channel `via: 'voice' | 'dashboard'`)
- `created_at` (`TIMESTAMPTZ`)

### Database Webhooks & Triggers (`pg_net`)
Two active PostgreSQL triggers communicate directly with n8n Cloud (`https://allsaintsbuilders.app.n8n.cloud`):

1. **`tr_draft_approved_webhook`** (`public.drafts`, `AFTER UPDATE`):
   - Condition: `NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved')`
   - Executes: `public.notify_draft_approved_webhook()`
   - Target URL: `https://allsaintsbuilders.app.n8n.cloud/webhook/foreman-send-on-approval`
   - Payload: `{ type: 'UPDATE', table: 'drafts', schema: 'public', record: NEW, old_record: OLD }`

2. **`tr_email_inserted_whatsapp_webhook`** (`public.emails`, `AFTER INSERT`):
   - Executes: `public.notify_email_inserted_whatsapp_webhook()`
   - Target URL: `https://allsaintsbuilders.app.n8n.cloud/webhook/foreman-whatsapp-notifications`
   - Payload: `{ type: 'INSERT', table: 'emails', schema: 'public', record: NEW }`

---

## 5. Authentication Architecture: Two Separate Security Zones

The application has **two distinct authentication models** separated cleanly by middleware (`src/middleware.ts` -> `src/lib/supabase/middleware.ts`):

```
                               Incoming HTTP Request
                                         │
                                         ▼
                             src/middleware.ts
                                         │
                                         ▼
                       src/lib/supabase/middleware.ts
                                         │
                ┌────────────────────────┴────────────────────────┐
                ▼                                                 ▼
      Path starts with:                                 All Other Routes:
      /voice/* or /api/voice/*                           /, /inbox, /approvals,
                │                                       /audit-log, /emails/[id]
                ▼                                                 │
      [ZONE 1: PUBLIC VOICE]                                      ▼
      • Bypasses Supabase Auth session                  [ZONE 2: DASHBOARD]
      • NO login redirect                               • Supabase Session Required
      • Authenticated by custom signed                  • Fast-path cookie check (sb-*)
        HMAC-SHA256 token                               • Local getClaims() ES256 check
      • URL: /voice/[id]?token=...                      • Missing session -> Redirect /login
        or /voice/<compact-token>
```

### ⚠️ INVIOLABLE RULES FOR AUTHENTICATION
1. **NEVER pull `/voice/*` or `/api/voice/*` behind Supabase dashboard login**. Construction foremen access voice review links directly from WhatsApp on mobile devices while wearing gloves on job sites. They do not have desktop passwords memorized.
2. **Dashboard Session Fast-Path**: The middleware checks for the presence of cookies beginning with `sb-` containing `auth-token` or `access-token`. If missing, unauthenticated requests redirect immediately to `/login` with 0ms network overhead. Authenticated tokens are verified locally via `supabase.auth.getClaims()` against the cached JWKS (no network round-trip).

### Voice Token Cryptographic Protocol (`src/lib/voice-token.ts`)
Voice URLs use a compact, signed, tamper-proof binary token packed into 43 URL-safe base64url characters (32 raw bytes):
- **Bytes `[0, 16)`**: Email UUID in raw 16-byte hex format.
- **Bytes `[16, 20)`**: Expiration timestamp, big-endian `uint32` unix seconds (default 24h lifespan).
- **Bytes `[20, 32)`**: HMAC-SHA256 signature truncated to 96 bits (12 bytes) using `VOICE_TOKEN_SECRET`.

Both `src/lib/voice-token.ts` and n8n Workflow 3 ("Generate Signed Voice Token" node) implement the exact same hashing algorithm.  
When an agent or script needs a link for testing, use:
```bash
npx tsx scripts/get-voice-link.ts <email_id>
```

---

## 6. State Mutation & Server Actions: The Single Write Path

All state modifications for emails and drafts must route through the canonical Server Actions located at:
`src/app/emails/[id]/actions.ts`

Both the **Dashboard UI** (`EmailDetailView.tsx`) and the **Mobile Voice Portal** (`VoiceEmailView.tsx`) invoke these exact actions. Never bypass these actions with raw client-side Supabase writes.

### The Three Actions:

#### 1. `saveDraftAction({ emailId, draftId, editedText, via })`
- Purpose: Auto-saves or manually saves the draft text without changing workflow status.
- Updates: `drafts.edited_text = editedText`.
- Status: Stays `status = 'pending'`.
- Audit Log: Inserts `action = 'edited'`, details `{ text_length, via }`.
- Revalidates: `/emails/[id]`, `/voice/[id]`, `/`.

#### 2. `approveAndSendAction({ emailId, draftId, editedText, wasDiscarded, via })`
- Purpose: Approves the draft and initiates outbound email dispatch.
- Business Logic for `draft_type`:
  - If `wasDiscarded === true` or no original AI text -> `'manual'`
  - If `editedText.trim() === ai_generated_text.trim()` -> `'ai_generated'`
  - Otherwise -> `'ai_edited'`
- Updates:
  - `drafts.edited_text = editedText`
  - `drafts.draft_type = draftType`
  - `drafts.status = 'approved'`
  - `drafts.approved_at = now()`
  - `drafts.approved_by = user.id` (or null if via signed voice)
- Audit Log: Inserts `action = 'approved'`, details `{ draft_type, was_discarded, via }`.
- **THE CRITICAL EVENT**: Setting `drafts.status = 'approved'` activates PostgreSQL trigger `tr_draft_approved_webhook`, which fires the HTTP POST request to n8n Workflow 2 for Titan SMTP delivery.
- Revalidates: `/emails/[id]`, `/voice/[id]`, `/`.

#### 3. `discardDraftAction({ emailId, draftId, via })`
- Purpose: Discards the current draft.
- Updates: `drafts.status = 'discarded'`.
- Audit Log: Inserts `action = 'discarded'`, details `{ via }`.
- Revalidates: `/emails/[id]`, `/voice/[id]`, `/`.

---

## 7. Voice Portal & AI Assistant Architecture

The voice system lives at `src/app/voice/[email_id]/` and `src/app/api/voice/`. It is optimized for noisy mobile construction environments.

### The Voice Pipeline:
1. **Audio Capture**: The user taps the microphone orb in `VoiceEmailView.tsx`. Browser `MediaRecorder` records WebM audio chunks.
2. **STT (`/api/voice/stt`)**: WebM audio is sent with the signed token to `/api/voice/stt`. Server streams audio to OpenAI Whisper (`whisper-1`) with a 7.5-second timeout and returns the transcript.
3. **Conversational Agent (`/api/voice/agent`)**: The transcript and email context are sent to `/api/voice/agent`. OpenAI GPT-4o processes the utterance with strict JSON Schema output:
   ```json
   {
     "say": "Short spoken response for TTS",
     "action": "none | read_email | read_draft | update_draft | discard_draft | send_requested",
     "draft": "Complete updated draft reply (if action is update_draft)",
     "read_back": false
   }
   ```
4. **TTS (`/api/voice/tts`)**: Spoken response text is sent to `/api/voice/tts` which streams MP3 audio from OpenAI TTS (`tts-1`, voice `alloy`). If the OpenAI request fails or times out, the browser falls back gracefully to `window.speechSynthesis`.

### ⚠️ THE VOICE SAFETY RULE (NON-NEGOTIABLE)
**Voice commands can NEVER send an email directly.**  
If a user says *"Approve and send"*, *"Send it"*, or *"Looks good, shoot it off"*, the AI agent returns:
- `action = "send_requested"`
- `say = "I cannot send directly by voice. Please confirm and tap the Approve and Send button on your screen."`

The client receives `send_requested` and displays the **On-Screen Approval Modal** (`VoiceConfirmationModals.tsx`). A physical tap from a human finger on the screen is strictly required before `approveAndSendAction` executes.

### Post-Approval Lockdown
Once `draft.status === 'approved'` or `status === 'sent'`:
- Both `EmailDetailView.tsx` and `VoiceEmailView.tsx` immediately enter **locked read-only state**.
- Draft textarea becomes read-only (`disabled`).
- Action buttons are replaced with a "Approved by [Name]" or "Sent via Titan SMTP" badge.
- Microphone input is disabled.
- Prevents double-approvals, race conditions, or accidental resends.

---

## 8. End-to-End Automation Workflows (n8n & Supabase)

### Workflow 1: Ingestion, Classification & Drafting (`Foreman Agent.json`)
1. **IMAP Polling**: Checks `info@allsaintsbuilders.com` and `team@allsaintsbuilders.com` every 1-5 minutes.
2. **Metadata Preservation**: Captures RFC 822 `Message-ID`, `Subject`, `From`, `Date`, and HTML body.
3. **OpenAI Classification**: Evaluates email context against Allsaints operational taxonomy:
   - **Theme**: `accounts`, `orders`, `finance`, `suppliers`, `promotions`, `nph_jobs`, `meetings_appointments`, `invoices`, `certificates`.
   - **Urgency**: `urgent` (immediate safety/structural/contractual impact), `priority` (time-sensitive operations), `normal` (routine administrative).
   - **Routed Roles**: `director`, `senior_admin`, `progressor`, `accountant`.
4. **OpenAI Contextual Drafting**: Generates professional British English reply. Any unknown facts (dates, quotes, technician availability) are enclosed in safety brackets: `[CONFIRM DATE]`.
5. **Database Storage**: Writes email to `public.emails`, draft to `public.drafts`, and event to `public.audit_log`.

### Workflow 2: Send on Approval (`Foreman Agent.json`)
1. **Webhook Ingestion**: Triggered by PostgreSQL `tr_draft_approved_webhook` via `pg_net` when `drafts.status` changes to `'approved'`.
2. **Sanity Check**: Confirms draft status is `'approved'` and draft body is non-empty.
3. **SMTP Dispatch**: Sends email via Titan SMTP using the original incoming inbox as sender (`info@` or `team@`):
   - Sets header `In-Reply-To: <original_message_id>`
   - Sets header `References: <original_message_id>`
4. **Status Finalization**: Updates Supabase `drafts.status = 'sent'` and `emails.status = 'sent'`.
5. **Audit Logging**: Inserts `action = 'sent'` with delivery timestamp into `public.audit_log`.

### Workflow 3: Urgent WhatsApp Notifications (`Foreman Whatsapp.json`)
1. **Webhook Ingestion**: Triggered by PostgreSQL `tr_email_inserted_whatsapp_webhook` when a new email is created.
2. **Urgency Filter**: If urgency is NOT `'urgent'` or `'priority'`, execution halts and logs `'whatsapp_skipped'`.
3. **Recipient Resolution**: Queries `public.users` matching any role in `emails.routed_roles` who have a non-null `whatsapp_number`.
4. **Token Minting**: Generates HMAC-SHA256 signed 24h voice token for `emails.id`.
5. **Twilio Dispatch**: Dispatches WhatsApp template with email subject, urgency badge, and one-click voice link (`https://foreman.allsaintsbuilders.com/voice/<token>`).
6. **Audit Logging**: Records `action = 'whatsapp_notified'`.

---

## 9. Performance Architecture & Key Optimizations

Recent forensic audits resolved significant latency bottlenecks across the application. Any agent modifying pages or data fetching must adhere to these established patterns:

### 1. Parallel Fetching (`Promise.all`)
Never execute sequential awaits on independent database queries. All page routes use parallel queries:
- **`src/app/(dashboard)/page.tsx`**: Fetches emails, accounts, pending drafts, and audit log concurrently in a single `Promise.all([ ... ])`.
- **`src/app/(dashboard)/inbox/page.tsx`**: Fetches emails and accounts concurrently.
- **`src/app/(dashboard)/approvals/page.tsx`**: Fetches pending drafts, active emails, and accounts concurrently.
- **`src/app/(dashboard)/emails/[id]/page.tsx`**: Fetches email, draft, and classification audit log concurrently.
- **`src/app/voice/[email_id]/page.tsx`**: Fetches email and draft concurrently with timeout wrappers.

### 2. Timeout Wrappers & Replication Lag Retries (`voice/page.tsx`)
Mobile users on construction sites face intermittent 3G/4G connectivity.
- `withTimeout(promise, 12000)`: Prevents Supabase queries from hanging indefinitely.
- **Replication Lag Retries**: Newly inserted emails/drafts may lag behind WhatsApp arrival by ~200ms. The voice page includes explicit 250ms/400ms retry logic to prevent 404 false alarms.

### 3. Middleware Fast-Path
Checking raw cookies before calling `createServerClient` prevents unnecessary SSR overhead on every static asset and unauthenticated route.

### 4. Search Responsiveness (`InboxView.tsx`)
The search input uses React's `useDeferredValue(searchQuery)` to keep keyboard typing fluid and unblocked while filtering through 50+ email records.

---

## 10. Design System & Styling Guidelines

The application follows the **Foreman Design System** built on **Tailwind CSS v4**:

### Core Color Palette (`src/app/globals.css`)
- **App Background**: `#F7F8FA` (`var(--app-bg)`)
- **Surface / Card Background**: `#FFFFFF` (`var(--surface)`)
- **Subtle Surface**: `#F1F3F5` (`var(--surface-subtle)`)
- **Brand Dark Green**: `#1E3A2F` (`var(--brand)`)
- **Brand Subtle Tint**: `#E8EFEA` (`var(--brand-subtle)`)
- **Brand Light**: `#284E3F` (`var(--brand-light)`)
- **Primary Text**: `#17191C` (`var(--text-primary)`)
- **Secondary Text**: `#5E6470` (`var(--text-secondary)`)
- **Tertiary / Dim Text**: `#8B92A0` (`var(--text-tertiary)`)
- **Border Subtle**: `#E5E7EB` (`var(--border-subtle)`)
- **Border Strong**: `#D1D5DB` (`var(--border-strong)`)

### Urgency Badge Tokens
- **Urgent**: Text `#b91c1c`, BG `#fef2f2`, Border `#fecaca`
- **Priority**: Text `#c2560c`, BG `#fff7ed`, Border `#fed7aa`
- **Routine / Normal**: Text `#5E6470`, BG `#F1F3F5`, Border `#E5E7EB`

### Aesthetics Rules
- **No Neon Clichés**: Never add glowing borders, cybernetic gradients, or dark-mode sci-fi elements. This is an enterprise utility tool for construction directors.
- **Tabular Numerals**: Apply `.tabular-nums` (`font-variant-numeric: tabular-nums`) to dates, timestamps, IDs, and financial counts to prevent horizontal jitter.
- **High Information Density**: Clean borders, tight card headers, explicit empty states with helpful iconography, and micro-animations under 150ms.

---

## 11. Environment Variables Reference

| Variable Name | Client / Server | Required | Description / Default |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Public (Both) | **Yes** | Supabase Project URL (`https://clxqjxtmxswpjjvqunfx.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public (Both) | **Yes** | Supabase anonymous public API key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server Only | Optional | Supabase secret service-role key (used for administrative scripts) |
| `OPENAI_API_KEY` | Server Only | **Yes** | OpenAI API key for Whisper STT, TTS, and conversational voice agent |
| `VOICE_TOKEN_SECRET` | Server Only | **Yes (Prod)** | Secret key used for signing HMAC-SHA256 voice tokens. Defaults to dev fallback in development. |
| `NEXT_PUBLIC_APP_URL` | Public (Both) | Optional | Base URL of deployed application (defaults to `http://localhost:3000`) |

---

## 12. Agent Rules of Engagement: How NOT to Break the Codebase

Follow these strict rules when modifying or adding code:

1. **Next.js 16 Breaking Async Changes**:
   - `params` in Page components is a `Promise`: Always write `const { id } = await params`.
   - `searchParams` in Page components is a `Promise`: Always write `const { token } = await searchParams`.
   - `cookies()` from `next/headers` is async: Always write `const cookieStore = await cookies()`.
2. **Never Move Voice Behind Dashboard Auth**:
   - `/voice/*` and `/api/voice/*` MUST remain publicly accessible. Auth is handled by HMAC tokens.
3. **Never Add SMTP Dispatching into Next.js**:
   - Next.js does NOT send emails. Setting `drafts.status = 'approved'` causes Supabase `pg_net` to ping n8n Workflow 2. n8n sends the email.
4. **Do Not Rely on `category` or `routed_role`**:
   - Always use `emails.theme`, `emails.urgency`, and `emails.routed_roles` (array).
5. **Hand-Maintained Database Types**:
   - There is no automated `supabase gen types` script. If you alter the database via migrations, you MUST manually update `src/types/database.ts` to match.
6. **Voice Safety Guarantee**:
   - Never remove or bypass the `voice_send_blocked` / `send_requested` guard in `src/app/api/voice/agent/route.ts` or `src/lib/voice-commands.ts`. Voice commands must never execute SMTP delivery without a physical touch event on the screen.
7. **Post-Approval Lockdown**:
   - Any new draft-editing or sending feature must respect `isLocked = isApproved || isSent` and disable mutation controls.
8. **Realtime WebSockets Subscription Cleanup**:
   - Always unsubscribe and remove Supabase Realtime channels in the `useEffect` cleanup return: `supabase.removeChannel(channel)`.
9. **Verification Commands**:
   - Before completing tasks, always run:
     ```bash
     npm run build      # Verifies TypeScript types and Turbopack builds cleanly
     npm run lint       # Checks for ESLint errors (Note: Use catch (err: unknown) instead of any)
     npx tsx scripts/test-voice-token.ts   # Verifies voice token crypto
     ```
10. **ESLint Typing Convention**:
    - Avoid `catch (err: any)`. Use `catch (err: unknown)` with proper error narrowing (e.g., `err instanceof Error ? err.message : String(err)`) to comply with `@typescript-eslint/no-explicit-any`.

---
*Document Version: 2.0.0 — Updated for Next.js 16 App Router, React 19, Theme Routing v2, and Conversational Voice Agent.*
