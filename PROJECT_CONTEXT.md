# Project Saint Builder — "Foreman" AI Email Agent
## Comprehensive Project Context & System Specification

> **Document Version:** 2.0 (Post-Audit & MVP Verification)  
> **Last Updated:** September 2026  
> **Repository:** `Tanish18906/Project-Saint-Builder`  
> **Target Production Platforms:** Next.js 16 (App Router), Supabase (PostgreSQL 15), n8n Cloud, OpenAI GPT-4o / Whisper / TTS, Twilio WhatsApp API, Titan Email (IMAP/SMTP).

---

## Table of Contents
1. [Executive Summary & Business Context](#1-executive-summary--business-context)
2. [End-to-End System Architecture](#2-end-to-end-system-architecture)
3. [Database Architecture & Schema (Supabase)](#3-database-architecture--schema-supabase)
4. [n8n Automation Engine & Workflows](#4-n8n-automation-engine--workflows)
5. [Twilio & WhatsApp Integration](#5-twilio--whatsapp-integration)
6. [Voice Portal & AI Voice System](#6-voice-portal--ai-voice-system)
7. [Frontend Review Dashboard (Next.js 16)](#7-frontend-review-dashboard-nextjs-16)
8. [Authentication, Access Control & User Roles](#8-authentication-access-control--user-roles)
9. [Configuration & Environment Variables](#9-configuration--environment-variables)
10. [Test & Verification Scripts](#10-test--verification-scripts)
11. [Operational Runbook & Deployment Status](#11-operational-runbook--deployment-status)

---

## 1. Executive Summary & Business Context

**Allsaints Builders** is a UK construction and building maintenance contractor primarily servicing social housing associations, municipal councils (notably Northampton Partnership Homes - NPH), private tenants, and commercial property owners.

### The Operational Challenge
Allsaints Builders operates two core company inboxes:
- `info@allsaintsbuilders.com` — Executive, commercial, tender, high-priority, and general corporate communications.
- `team@allsaintsbuilders.com` — Operational job updates, tenant repair requests, contractor notes, and sub-contractor updates.

Field managers, directors, and progressors are frequently on-site or in transit. Emergency repairs (e.g., active water leaks, heating/boiler failures, gas safety issues, housing disrepair/DISREP claims with strict legal escalation timers) require rapid triaging, notification, and response drafting within statutory response windows.

### The Solution: "Foreman"
"Foreman" is an intelligent, event-driven email triage, AI draft generation, and human-in-the-loop review system. It autonomously:
1. **Polls and ingests** inbound emails via RFC 822 compliant IMAP connections.
2. **Classifies** messages into operational themes and urgency levels using OpenAI GPT-4o.
3. **Drafts** context-aware replies with tone calibrated to the assigned internal role, automatically inserting explicit `[CONFIRM ...]` placeholders for unverified facts.
4. **Dispatches instant WhatsApp notifications** via Twilio to the responsible staff member for `urgent` and `priority` emails, embedding a secure signed one-click Voice Review Link.
5. **Enables mobile-first voice review** (`/voice/[email_id]?token=...`), allowing on-site staff to listen to drafts, verbally request edits or tone adjustments (formal, shorter, technical), or verbally dictating facts.
6. **Guarantees safety with human-in-the-loop approval**: Email dispatch requires an explicit user action (button tap in web dashboard or mobile portal). Voice sending is deliberately blocked by safety guards.
7. **Dispatches outbound SMTP replies** via n8n preserving RFC 2822 threading headers (`In-Reply-To` and `References`) so clients and tenants see seamless conversational replies.

---

## 2. End-to-End System Architecture

The system uses a decoupled, event-driven architecture with **Supabase PostgreSQL** acting as the single source of truth connecting n8n automation workflows and the Next.js review interfaces.

```
                              ┌──────────────────────────────────────────────┐
                              │          Titan Email Inboxes (IMAP)          │
                              │  • info@allsaintsbuilders.com (Directors)    │
                              │  • team@allsaintsbuilders.com (Ops/Triage)   │
                              └──────────────────────┬───────────────────────┘
                                                     │ (IMAP Polling)
                                                     ▼
                              ┌──────────────────────────────────────────────┐
                              │            n8n Automation Engine             │
                              │             [Workflow 1: Ingest]             │
                              │  1. Extract headers, body, Message-ID        │
                              │  2. OpenAI GPT-4o: Categorize & Route        │
                              │  3. OpenAI GPT-4o: Role-Tuned Draft Reply    │
                              │  4. Insert email, draft, and audit records   │
                              └──────────────────────┬───────────────────────┘
                                                     │
                                                     ▼
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                       Supabase Database (PostgreSQL)                                   │
│  Tables: accounts, users, emails, drafts, audit_log                                                    │
│  Triggers:                                                                                             │
│    • tr_email_inserted_whatsapp_webhook (AFTER INSERT on emails)                                      │
│    • tr_draft_approved_webhook (AFTER UPDATE of status='approved' on drafts)                          │
└──────────────┬───────────────────────────────────────────────────────────────────────────┬─────────────┘
               │                                                                           │
               │ (HTTP POST via pg_net)                                                    │ (HTTP POST via pg_net)
               ▼                                                                           ▼
┌──────────────────────────────────────────────┐                         ┌──────────────────────────────────────────────┐
│          n8n Workflow 3: WhatsApp            │                         │          n8n Workflow 2: SMTP Send           │
│  • Filters: urgency IN (urgent, priority)    │                         │  • Triggered on status = 'approved'          │
│  • Resolves staff phone from routed_roles    │                         │  • Titan SMTP dispatch with RFC threading    │
│  • Generates HMAC-SHA256 signed voice link   │                         │  • Updates status to 'sent' in emails/drafts │
│  • Twilio WhatsApp Template dispatch         │                         │  • Logs delivery confirmation in audit_log   │
└──────────────────────┬───────────────────────┘                         └──────────────────────────────────────────────┘
                       │ (WhatsApp message)
                       ▼
┌──────────────────────────────────────────────┐                         ┌──────────────────────────────────────────────┐
│           Mobile WhatsApp Device             │                         │             Next.js Web Dashboard            │
│  • Alert received with summary & link        │                         │  • Realtime inbox view & status badges       │
│  • Taps secure 1-click voice review link     │                         │  • Multi-filter triage (Urgency, Theme)      │
└──────────────────────┬───────────────────────┘                         │  • In-browser draft editor & diff tracking   │
                       │                                                 │  • Direct "Approve & Send" button            │
                       ▼                                                 └──────────────────────┬───────────────────────┘
┌──────────────────────────────────────────────┐                                                │
│         Mobile Voice Review Portal           │                                                │
│         (/voice/[email_id]?token=...)        │                                                │
│  • Token verified via HMAC-SHA256            │                                                │
│  • OpenAI Whisper (STT) + OpenAI TTS         │                                                │
│  • AI Rewrites: Formal / Shorter / Technical │                                                │
│  • Spoken natural language edit instructions │                                                │
│  • Explicit button tap to "Approve & Send"   │                                                │
└──────────────────────┬───────────────────────┘                                                │
                       │                                                                        │
                       └───────────────────► Calls Server Action ◄──────────────────────────────┘
                                            (src/app/emails/[id]/actions.ts)
                                            Sets drafts.status = 'approved'
```

---

## 3. Database Architecture & Schema (Supabase)

### 3.1 Entity Relationship Diagram

```
 accounts (1) ──────────< (N) emails (1) ──────────< (1) drafts
                                │                          │
                                │ (1)                      │ (1)
                                ├──< (N) audit_log >───────┘
                                │            │ (N)
   users (1) ───────────────────┼────────────┘
   (Staff / Routed Recipients)  │ (Linked by role / routed_roles)
```

### 3.2 Tables Specification

#### Table: `public.accounts`
Monitored email mailboxes.
- `id` (`UUID`, PK, default: `gen_random_uuid()`)
- `email_address` (`TEXT`, UNIQUE, NOT NULL): e.g. `info@allsaintsbuilders.com`, `team@allsaintsbuilders.com`
- `display_name` (`TEXT`, NULL): e.g. `Allsaints Inquiries`, `Allsaints Operations`
- `created_at` (`TIMESTAMPTZ`, default: `NOW()`)

#### Table: `public.users`
Internal staff roster mapped to operational roles for alert routing.
- `id` (`UUID`, PK, default: `gen_random_uuid()`)
- `name` (`TEXT`, NOT NULL): Staff member display name (e.g. `tanish`, `Dave Hall`)
- `email` (`TEXT`, UNIQUE, NOT NULL): Corporate login email
- `role` (`TEXT`, NOT NULL): Core organizational role (`director`, `senior_admin`, `progressor`, `accountant`)
- `whatsapp_number` (`TEXT`, NULL): E.164 phone number for Twilio alerts (e.g. `+916260110569`, `+447...`)
- `created_at` (`TIMESTAMPTZ`, default: `NOW()`)

#### Table: `public.emails`
Ingested inbound emails and classification outputs.
- `id` (`UUID`, PK, default: `gen_random_uuid()`)
- `account_id` (`UUID`, FK -> `accounts.id`, NOT NULL)
- `message_id` (`TEXT`, NOT NULL): Inbound RFC 822 `Message-ID` used to maintain email threading
- `thread_id` (`TEXT`, NULL): Grouping thread identifier
- `from_address` (`TEXT`, NOT NULL): Sender email address
- `from_name` (`TEXT`, NULL): Extracted sender display name
- `to_address` (`TEXT`, NULL): Target inbox email
- `subject` (`TEXT`, NOT NULL): Subject line
- `body_text` (`TEXT`, NULL): Plaintext email body
- `body_html` (`TEXT`, NULL): Renderable HTML email body
- `status` (`TEXT`, NOT NULL, default: `'pending'`): Lifecycle status (`pending`, `drafted`, `approved`, `sent`, `discarded`, `failed`)
- **Theme-Based Routing Schema V2 Fields:**
  - `theme` (`TEXT`, NULL, check: `emails_theme_check`):
    - `emergency_repairs` (Active leaks, structural hazard, heating failure in winter)
    - `disrep` (Housing Disrepair legal claims / formal Section 11 notices)
    - `general_repairs` (Scheduled work, standard tenant queries)
    - `finance_invoicing` (Invoices, CIS statements, payment schedules)
    - `quotes_tenders` (Tender invites, estimates, schedule of rates)
    - `compliance_safety` (EICR, CP12 gas safety, asbestos register)
    - `general_enquiry` (General administrative communication)
  - `urgency` (`TEXT`, NULL, check: `emails_urgency_check`):
    - `urgent` (Requires action within 2-4 hours; triggers WhatsApp)
    - `priority` (Requires action same-day; triggers WhatsApp)
    - `routine` (Standard SLA 24-48 hours)
    - `read_later` (Informational, newsletters, low priority)
  - `routed_roles` (`TEXT[]`, NULL, indexed via GIN): Roles assigned to message (e.g. `ARRAY['director']` or `ARRAY['progressor', 'senior_admin']`)
- **Legacy Deprecated Columns (Retained for backwards compatibility):**
  - `category` (`TEXT`, NULL): Deprecated in favor of `theme` + `urgency`
  - `routed_role` (`TEXT`, NULL): Deprecated in favor of `routed_roles`
- `received_at` (`TIMESTAMPTZ`, default: `NOW()`)
- `created_at` (`TIMESTAMPTZ`, default: `NOW()`)

#### Table: `public.drafts`
AI and human-authored reply drafts.
- `id` (`UUID`, PK, default: `gen_random_uuid()`)
- `email_id` (`UUID`, FK -> `emails.id`, NOT NULL)
- `ai_generated_text` (`TEXT`, NULL): Raw original response draft produced by OpenAI
- `edited_text` (`TEXT`, NULL): Working draft content (edited via dashboard or voice)
- `draft_type` (`TEXT`, NOT NULL, default: `'ai_generated'`):
  - `ai_generated`: Unmodified AI output
  - `ai_edited`: Modified by staff user
  - `manual`: Written from scratch after discarding AI draft
- `status` (`TEXT`, NOT NULL, default: `'pending_review'`):
  - `pending_review`: Awaiting human review
  - `approved`: Marked ready for dispatch (triggers n8n Workflow 2)
  - `sent`: Successfully delivered via SMTP
  - `discarded`: Dismissed by user
- `approved_by` (`TEXT`, NULL): Staff identifier or email of approver
- `approved_at` (`TIMESTAMPTZ`, NULL): Timestamp of approval
- `sent_at` (`TIMESTAMPTZ`, NULL): Timestamp of SMTP dispatch
- `created_at` (`TIMESTAMPTZ`, default: `NOW()`)
- `updated_at` (`TIMESTAMPTZ`, default: `NOW()`)

#### Table: `public.audit_log`
Immutable historical event ledger.
- `id` (`UUID`, PK, default: `gen_random_uuid()`)
- `email_id` (`UUID`, FK -> `emails.id`, NULL)
- `draft_id` (`UUID`, FK -> `drafts.id`, NULL)
- `user_id` (`UUID`, FK -> `users.id`, NULL)
- `action` (`TEXT`, NOT NULL): e.g. `ingested`, `classified`, `drafted`, `draft_saved`, `approved`, `sent`, `discarded`
- `details` (`JSONB`, NULL): Structured context (e.g. tone applied, model used, diff size, token count)
- `created_at` (`TIMESTAMPTZ`, default: `NOW()`)

---

### 3.3 Database Triggers & pg_net Webhooks

The database utilizes the PostgreSQL extension `pg_net` to fire asynchronous non-blocking HTTP requests to n8n Cloud webhooks:

1. **`notify_draft_approved_webhook()`**
   - **Trigger:** `tr_draft_approved_webhook` (AFTER UPDATE ON `drafts`)
   - **Condition:** `NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved')`
   - **Target Endpoint:** `https://allsaintsbuilders.app.n8n.cloud/webhook/foreman-send-on-approval`
   - **Payload:** `{"type": "UPDATE", "table": "drafts", "record": NEW, "old_record": OLD}`

2. **`notify_email_inserted_whatsapp_webhook()`**
   - **Trigger:** `tr_email_inserted_whatsapp_webhook` (AFTER INSERT ON `emails`)
   - **Condition:** Every new email record inserted
   - **Target Endpoint:** `https://allsaintsbuilders.app.n8n.cloud/webhook/foreman-whatsapp-notifications`
   - **Payload:** `{"type": "INSERT", "table": "emails", "record": NEW}`

3. **`update_drafts_updated_at()`**
   - **Trigger:** `update_drafts_updated_at` (BEFORE UPDATE ON `drafts`)
   - **Action:** Sets `NEW.updated_at = NOW()`

---

## 4. n8n Automation Engine & Workflows

Workflows are authored in n8n Cloud (`https://allsaintsbuilders.app.n8n.cloud`) and mirrored in version control under `n8n/workflows/`.

### Workflow 1: Email Ingestion, Classification & Drafting
*File: [`n8n/workflows/Foreman Agent.json`](file:///home/tanish-mishra/Project_SaintBuilder/n8n/workflows/Foreman%20Agent.json)*

1. **Ingest Node**: IMAP trigger connects to Titan Email mailboxes, downloading message body, sender, subject, and RFC 822 `Message-ID`.
2. **Account Lookup**: Queries Supabase `accounts` table by `to_address` to obtain `account_id`.
3. **OpenAI Classification Node (`gpt-4o`)**:
   - Classifies email into `theme` (`emergency_repairs`, `disrep`, `general_repairs`, `finance_invoicing`, `quotes_tenders`, `compliance_safety`, `general_enquiry`).
   - Assigns `urgency` (`urgent`, `priority`, `routine`, `read_later`).
   - Assigns `routed_roles` array (`director`, `senior_admin`, `progressor`, `accountant`).
   - Generates confidence score and brief triage summary.
4. **Supabase Insert (Email & Audit)**:
   - Inserts record into `emails`.
   - Records `classified` event into `audit_log`.
5. **OpenAI Reply Drafting Node (`gpt-4o`)**:
   - System prompt incorporates role-specific tone guidance:
     - **Director:** Highly formal, concise, direct decision-making.
     - **Senior Admin:** Professional, courteous, process-oriented.
     - **Progressor:** Site-oriented, technical, focused on dates and access.
     - **Accountant:** Precise, figures-forward, reference-heavy.
   - Enforces the `[CONFIRM ...]` placeholder pattern: If a specific date, quote amount, or site detail is unknown, the model inserts explicit brackets (e.g. `[CONFIRM SITE ACCESS DATE]`).
6. **Supabase Insert (Draft & Audit)**:
   - Inserts draft into `drafts` with `status = 'pending_review'`.
   - Records `drafted` event into `audit_log`.

---

### Workflow 2: Send on Approval
*File: [`n8n/workflows/Foreman Agent.json`](file:///home/tanish-mishra/Project_SaintBuilder/n8n/workflows/Foreman%20Agent.json)*

1. **Webhook Trigger**: `/webhook/foreman-send-on-approval` receives payload from Supabase `pg_net` trigger.
2. **Validation Node**: Asserts `record.status === 'approved'` and verifies draft body (`edited_text` or `ai_generated_text`) is non-empty.
3. **Context Enrichment**: Fetches corresponding `emails` and `accounts` records from Supabase.
4. **SMTP Dispatch Node (Titan Email)**:
   - Recipient: `emails.from_address`
   - Subject: `Re: ${emails.subject}`
   - Body: Cleaned draft content (strips unconfirmed brackets or alerts approver)
   - **RFC Threading Headers:**
     - `In-Reply-To: ${emails.message_id}`
     - `References: ${emails.message_id}`
5. **Supabase Status Finalization**:
   - Updates `drafts.status = 'sent'` and sets `sent_at = NOW()`.
   - Updates `emails.status = 'sent'`.
   - Appends `sent` event to `audit_log`.

---

### Workflow 3: WhatsApp Urgent/Priority Notification
*File: [`n8n/workflows/Foreman Whatsapp.json`](file:///home/tanish-mishra/Project_SaintBuilder/n8n/workflows/Foreman%20Whatsapp.json)*

1. **Webhook Trigger**: `/webhook/foreman-whatsapp-notifications` receives insert payload from Supabase.
2. **Urgency Filter**: Evaluates `record.urgency IN ('urgent', 'priority')`. If `routine` or `read_later`, workflow gracefully halts.
3. **Staff Recipient Resolution**:
   - Queries `users` table for active users matching `routed_roles`.
   - Resolves E.164 phone numbers (e.g. `+916260110569`).
4. **HMAC-SHA256 Token Minting**:
   - Node uses `VOICE_TOKEN_SECRET` to sign an expiration token (24-hour validity) for `email_id`.
   - Constructs voice review URL: `https://<domain>/voice/{email_id}?token={signedToken}`.
5. **Twilio WhatsApp Dispatch**:
   - Sends message via Twilio Messaging Service using Meta WhatsApp Approved Content Template `urgent_priority_alert_v1`.

---

## 5. Twilio & WhatsApp Integration

### 5.1 Meta Approved Content Template
- **Template Name:** `urgent_priority_alert_v1`
- **Content SID:** `HX23c91dbb0fd309db1710fe30089e933e`
- **Language:** English (`en` / `en_US`)
- **Status:** **APPROVED by Meta**
- **Messaging Service SID:** `MG1b1ad480fc3c46a6f1ea0d832c32cf8a`
- **Active Test Recipient:** `+91 6260110569` (Director: Tanish Mishra)

### 5.2 Template Structure & Variable Mapping

```text
New email alert for Allsaints Builders regarding {{2}}.
From {{3}}: {{4}}
Please review and respond securely here: {{5}}
This link expires in 24 hours.
```

| Parameter | Content Passed | Example Value |
|---|---|---|
| `{{1}}` | Recipient Staff Name | `tanish` |
| `{{2}}` | Urgency Prefix + Email Subject | `🔴 [URGENT] DISREP boiler failure on 15 Market St` |
| `{{3}}` | Sender Name & Organization | `Sarah Jenkins (NPH Finance)` |
| `{{4}}` | Cleaned Executive Summary | `Water leak requires immediate contractor attendance.` |
| `{{5}}` | Signed Voice Review URL | `https://allsaints.app/voice/b66c5b59-...?token=eyJhbGci...` |

---

## 6. Voice Portal & AI Voice System

The voice portal (`/voice/[email_id]`) is an ultra-fast, mobile-first interface designed for staff in the field to review, dictate modifications to, and approve email replies without needing to open a laptop.

### 6.1 Cryptographic Token Authentication
- Voice routes are intentionally exempt from Supabase dashboard session cookies in `src/middleware.ts`.
- Authentication is governed by an **HMAC-SHA256 signed JWT-style token** generated in `src/lib/voice-token.ts`:
  - Payload: `{ "email_id": "<uuid>", "exp": <timestamp>, "iat": <timestamp> }`
  - Signed using secret: `process.env.VOICE_TOKEN_SECRET`
  - All token verification utilizes constant-time buffer comparison (`crypto.timingSafeEqual`) to prevent timing attacks.
  - If a token is expired, missing, or references another `email_id`, access is denied with HTTP 401.

### 6.2 Voice Command Processor (`src/lib/voice-commands.ts`)
Staff voice inputs are transcribed using OpenAI Whisper (`/api/voice/stt`) and parsed into deterministic intent actions:

| Spoken Phrase Pattern | Intent Action | Behavior |
|---|---|---|
| *"Read the draft"*, *"Listen to reply"*, *"Play it back"* | `read_draft` | Synthesizes draft via OpenAI TTS (`/api/voice/tts`) and plays audio. |
| *"Make it formal"*, *"More professional"* | `rewrite_formal` | Sends to `/api/voice/rewrite` with concise formal prompting. |
| *"Make it shorter"*, *"Too long, cut it down"* | `rewrite_shorter` | Trims fluff and leaves strictly essential points. |
| *"Make it technical"*, *"Job focused"* | `rewrite_technical` | Enhances technical trade vocabulary and site references. |
| *"Discard draft"*, *"Clear draft"* | `discard` | Clears draft text for manual rewrite. |
| Spoken instructions (e.g. *"Completion date is Friday 5pm"*) | `apply_edit` | GPT-4o merges spoken facts into draft and replaces `[CONFIRM ...]` placeholders. |
| *"Send the email"*, *"Approve and send"* | `voice_send_blocked` | **SAFETY INTERCEPT:** Voice sending is explicitly blocked. Voice prompt informs the user that sending requires tapping the on-screen button. |

### 6.3 Post-Approval Lockdown
Once an email draft transitions to `approved` or `sent`:
- Both the Web Dashboard and the Voice Review Portal enter a strict **read-only state**.
- Editing, re-approving, or re-sending is disabled in the UI to prevent duplicate outbound emails.

---

## 7. Frontend Review Dashboard (Next.js 16)

### 7.1 Architecture & Stack
- **Framework:** Next.js 16 (App Router)
- **Styling:** Tailwind CSS with custom responsive UI components
- **Realtime Updates:** Supabase client WebSocket subscriptions (`supabase_realtime`) auto-refresh the inbox feed, email detail view, and audit log.
- **Server Actions:** All mutations are executed via Server Actions in `src/app/emails/[id]/actions.ts`:
  - `saveDraftAction`: Saves edits and recalculates diff vs AI generated text.
  - `approveAndSendAction`: Updates `status = 'approved'`, triggering n8n SMTP dispatch.
  - `discardDraftAction`: Marks draft discarded and logs audit event.

### 7.2 Route Hierarchy
- `/login` — Supabase Auth email/password login screen.
- `/` — Main review dashboard and inbox feed with search, category filtering, and urgency tags.
- `/emails/[id]` — Desktop email review & editor interface:
  - Original email headers, sender info, body viewer.
  - Interactive draft editor with diff highlighting.
  - Triage metadata drawer and action bar.
- `/voice/[email_id]?token=...` — Dedicated mobile voice review portal.
- `/audit-log` — Complete historical timeline of email actions across the organization.
- `/api/voice/stt` — Speech-to-text API (OpenAI Whisper).
- `/api/voice/tts` — Text-to-speech API (OpenAI TTS `tts-1`).
- `/api/voice/rewrite` — AI draft rewriter (formal, shorter, technical, spoken edits).

---

## 8. Authentication, Access Control & User Roles

### 8.1 Dual Authentication Zones
1. **Dashboard Zone (`/`, `/emails/*`, `/audit-log`):**
   - Protected by standard Supabase session cookies (`@supabase/ssr`).
   - Unauthenticated visitors are redirected to `/login`.
2. **Voice Review Zone (`/voice/*`, `/api/voice/*`):**
   - Publicly accessible without a session cookie, protected exclusively by cryptographic HMAC-SHA256 URL tokens.
   - Enforced by `src/middleware.ts`.

### 8.2 Operational Staff Roles
- **Director:** Full authority. Reviews commercial disputes, legal DISREP claims, quotes > £10k, and director-routed escalations.
- **Progressor:** Field operations. Reviews tenant repair bookings, site access delays, and subcontractor updates.
- **Senior Admin:** Reviews routine NPH job updates, compliance certificates, and general administrative queries.
- **Accountant:** Reviews invoices, CIS statements, contractor payment applications.

### 8.3 Development Credentials (Supabase Auth)
- **Email:** `123@gmail.com` *(Staff profile: tanish, Director)*
- **Password:** `admin123`
- **Secondary Test Email:** `test@allsaintsbuilders.com` *(Password: `admin123`)*

---

## 9. Configuration & Environment Variables

### `.env.local` Specification

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://clxqjxtmxswpjjvqunfx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<SUPABASE_ANON_KEY>
SUPABASE_SERVICE_ROLE_KEY=<SUPABASE_SERVICE_ROLE_KEY>

# OpenAI Configuration (Classification, Drafting, STT Whisper, TTS)
OPENAI_API_KEY=sk-proj-...

# Cryptographic Voice Link Secret (Shared between Next.js and n8n Workflow 3)
VOICE_TOKEN_SECRET=foreman-voice-secret-key-3b7c89f2a4e10d

# Base Application URL (Used for generating voice portal hyperlinks)
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Twilio WhatsApp Credentials
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_MESSAGING_SERVICE_SID=MG1b1ad480fc3c46a6f1ea0d832c32cf8a
TWILIO_WHATSAPP_CONTENT_SID=HX23c91dbb0fd309db1710fe30089e933e
```

---

## 10. Test & Verification Scripts

All verification scripts are located in `scripts/` and run using `npx tsx`:

1. **Generate Voice Review Link for Testing:**
   ```bash
   npx tsx scripts/get-voice-link.ts <email_id>
   ```
   Outputs an HMAC-signed token URL valid for 24 hours.

2. **Verify Voice API Routes (STT, TTS, Rewrite):**
   ```bash
   npx tsx scripts/test-voice-api-routes.ts
   ```

3. **Verify Voice Token Cryptography:**
   ```bash
   npx tsx scripts/test-voice-token.ts
   ```

4. **Verify Voice Bug Fixes & Guardrails:**
   ```bash
   npx tsx scripts/verify-voice-bugs.ts
   ```

5. **Verify Theme-Based Routing Schema V2:**
   ```bash
   npx tsx scripts/verify-array-schema.ts
   ```

---

## 11. Operational Runbook & Deployment Status

### Build & Lint Commands
```bash
npm run dev      # Launches Next.js local development server (port 3000)
npm run build    # Production build and TypeScript type-check
npm run lint     # ESLint code quality scan
```

### Current MVP Status (Verified & Active)
- [x] Supabase PostgreSQL database schema v2 live and indexed.
- [x] Database `pg_net` webhooks configured to `https://allsaintsbuilders.app.n8n.cloud`.
- [x] n8n Workflow 1 (IMAP Ingestion, OpenAI Classification & Drafting) active.
- [x] n8n Workflow 2 (Approval Webhook & Titan SMTP Send) verified with RFC threading.
- [x] n8n Workflow 3 (Urgent/Priority WhatsApp Notification) configured.
- [x] Twilio WhatsApp Meta Template `urgent_priority_alert_v1` approved by Meta.
- [x] Voice Review Portal `/voice/[email_id]` hardened with HMAC token authentication.
- [x] Voice command safety guard verified (prevents accidental voice sending).
- [x] Staff dashboard authentication enabled via Supabase Auth.
- [x] Codebase clean and pushed to GitHub `origin/main`.
