# Project Saint Builder — "Foreman" AI Email Agent

[![Supabase](https://img.shields.io/badge/Supabase-Database-3ECF8E?style=flat&logo=supabase&logoColor=white)](https://supabase.com)
[![n8n](https://img.shields.io/badge/n8n-Workflow_Automation-EA4B71?style=flat&logo=n8n&logoColor=white)](https://n8n.io)
[![OpenAI](https://img.shields.io/badge/OpenAI-Classification_%26_Drafting-412991?style=flat&logo=openai&logoColor=white)](https://openai.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-336791?style=flat&logo=postgresql&logoColor=white)](https://postgresql.org)

An intelligent email management, triage, AI reply generation, and human-in-the-loop approval system designed for **Allsaints Builders**. The platform monitors dual corporate inboxes, automatically categorizes incoming emails, routes them by operational roles, drafts context-aware replies via OpenAI, and coordinates email dispatch upon dashboard approval.

---
## 🏗️ System Architecture

The project follows a decoupled, event-driven architecture using **Supabase** as the single source of truth between the automation engine and the user interface.

```
┌────────────────────────────────────────────────────────┐
│              Titan Email Inboxes (IMAP)                │
│    • info@allsaintsbuilders.com (Directors / Admin)    │
│    • team@allsaintsbuilders.com (Progressor / Ops)     │
└───────────────────────────┬────────────────────────────┘
                            │ (IMAP Polling / Ingest)
                            ▼
┌────────────────────────────────────────────────────────┐
│                  n8n Automation Engine                 │
│   1. Extracts Email & Metadata (Message-ID, Headers)   │
│   2. OpenAI GPT-4o: Categorizes & Assigns Role         │
│   3. OpenAI GPT-4o: Drafts Contextual Response         │
│   4. Writes Email, Classification & Draft to Supabase  │
└───────────────┬──────────────────────────┬─────────────┘
                │                          │
                ▼                          ▼ (Urgent / Priority)
┌───────────────────────────────┐ ┌───────────────────────────────┐
│       Supabase Database       │ │   n8n WhatsApp Workflow 3     │
│ • accounts, users, emails,    │ │ • Role recipient lookup       │
│   drafts, audit_log           │ │ • HMAC-SHA256 Voice Link gen  │
│ • pg_net database triggers    │ │ • Twilio WhatsApp dispatch    │
└───────┬───────────────▲───────┘ └──────────────┬────────────────┘
        │ (Realtime WS) │ (Approve/Edit)         │ (WhatsApp alert + link)
        ▼               │                        ▼
┌───────────────────────────────┐ ┌───────────────────────────────┐
│    Review Dashboard UI        │ │  Mobile Voice Review Route    │
│ • Inbox feed & Triage tags    │ │ • /voice/[email_id]?token=... │
│ • Draft editor & auto-tagging │ │ • OpenAI TTS / Whisper STT    │
│ • Post-approval lockdown      │ │ • Voice AI rewrites & actions │
└───────────────┬───────────────┘ └──────────────┬────────────────┘
                │ (Status -> 'approved')         │ (Approve & Send via voice)
                └───────────────┬────────────────┘
                                │
                                ▼
┌────────────────────────────────────────────────────────┐
│            Supabase Approval Webhook Trigger           │
└───────────────────────────────┬────────────────────────┘
                                │ (HTTP POST)
                                ▼
┌────────────────────────────────────────────────────────┐
│             n8n Workflow 2: SMTP Dispatch              │
│   • Sends reply with In-Reply-To & References headers  │
│   • Updates Supabase email & draft status to 'sent'    │
│   • Logs delivery event in audit_log                   │
└────────────────────────────────────────────────────────┘
```

---

## 🗂️ Repository Branch Structure

The project codebase is organized across dedicated feature branches:

- **`main`**: Production-ready orchestrations and unified codebase.
- **`backend-supabase`**: Supabase migrations, database schemas, RLS policies, seed data, and pg_net webhooks.
- **`n8n-automation`**: n8n workflow JSON templates, prompt engineering, and email integration pipelines.
- **`frontend`**: Staff review dashboard, role-based interfaces, voice review portal, and approval UI.

---

## 🔄 End-to-End Workflow

1. **Ingestion**: An email lands in `info@allsaintsbuilders.com` or `team@allsaintsbuilders.com`.
2. **Detection & Ingest**: n8n IMAP trigger captures the message, preserving the critical RFC 822 `Message-ID` for thread chaining.
3. **AI Classification**: OpenAI classifies the message into domain-specific categories (`urgent`, `priority`, `read_later`, `finance_accounts`, `contracts`, `nph_job_update`, `other`) and routes it to the matching role (`director`, `senior_admin`, `progressor`, `accountant`).
4. **Draft Generation**: OpenAI generates a suggested professional response with `[CONFIRM ...]` placeholders for unverified facts.
5. **Persistence**: n8n inserts the email into `emails` and the generated draft into `drafts`, recording the classification event in `audit_log`.
6. **WhatsApp Notification (Workflow 3)**: If the category is `urgent` or `priority`, the Supabase `AFTER INSERT` webhook fires n8n Workflow 3, looks up the assigned staff user by `routed_role`, generates a secure signed HMAC-SHA256 voice token, and sends an urgent WhatsApp alert via Twilio.
7. **Review via Dashboard or Voice Portal**: Staff can review incoming items on the desktop/tablet dashboard or via the mobile-first voice portal (`/voice/[email_id]?token=...`):
   - **Approve as-is**: Stored as `ai_generated`.
   - **Edit & Approve**: Stored as `ai_edited`.
   - **Discard & Write Manual Reply**: Stored as `manual`.
   - **Voice commands**: "Read the draft", "Make it more formal/shorter/technical", "Approve and send".
8. **Approval Webhook**: When status changes to `approved`, a Supabase database trigger makes an HTTP POST request to the n8n webhook endpoint via `pg_net`.
9. **SMTP Dispatch & Threading**: n8n sends the approved email using Titan SMTP with `In-Reply-To` and `References` headers, updating status to `sent` across DB and dashboard.

---

## 🗄️ Database Schema (Supabase)

### Tables Overview

| Table | Description | Key Columns |
|---|---|---|
| **`accounts`** | Monitored email accounts / inboxes | `id`, `email_address`, `display_name`, `created_at` |
| **`users`** | Internal staff members & role definitions | `id`, `name`, `email`, `role`, `whatsapp_number`, `created_at` |
| **`emails`** | Ingested email messages and metadata | `id`, `account_id`, `message_id`, `thread_id`, `from_address`, `from_name`, `subject`, `body_text`, `body_html`, `category`, `routed_role`, `status` |
| **`drafts`** | AI and manual reply drafts per email | `id`, `email_id`, `ai_generated_text`, `edited_text`, `draft_type`, `status`, `approved_by`, `approved_at`, `sent_at`, `updated_at` |
| **`audit_log`** | Historical action logs for oversight | `id`, `email_id`, `draft_id`, `user_id`, `action`, `details`, `created_at` |

### Security & Triggers

- **Row Level Security (RLS)**: Enabled across all tables with permissive base policies for initial integration, ready for strict role restrictions upon Supabase Auth wiring.
- **Auto-timestamp**: `update_drafts_updated_at` trigger keeps `updated_at` timestamps accurate.
- **Webhook Dispatch**: `tr_draft_approved_webhook` triggers `net.http_post` when `drafts.status` switches to `approved`.
- **WhatsApp Webhook**: `tr_email_inserted_whatsapp_webhook` triggers `net.http_post` when new emails are inserted.

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [Supabase CLI](https://supabase.com/docs/guides/cli)
- [Docker](https://www.docker.com/) (for local Supabase instance)
- [n8n](https://n8n.io/) instance

### 1. Clone the Repository

```bash
git clone https://github.com/Tanish18906/Project-Saint-Builder.git
cd Project-Saint-Builder
```

### 2. Environment Configuration

Copy the sample environment file and configure your credentials:

```bash
cp .env.example .env
```

Set the corresponding variables:

```env
SUPABASE_URL=https://<your-project-ref>.supabase.co
SUPABASE_ANON_KEY=your-publishable-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-secret-service-role-key-here
```

### 3. Apply Supabase Migrations

To apply database migrations locally or link to your remote project:

```bash
# Link to your Supabase project
supabase link --project-ref <your-project-ref>

# Push migrations to the database
supabase db push
```

---

## 🧪 Testing Strategy

1. **Email Ingestion Simulation**: Trigger webhook endpoints with seed email payloads to test classification accuracy and draft quality across categories.
2. **Draft Modification Testing**: Validate that transitions (`ai_generated` -> `ai_edited` -> `manual`) persist correct flags in `drafts.draft_type`.
3. **Webhook Verification**: Confirm that setting `drafts.status = 'approved'` invokes the HTTP notification webhook.
4. **Header & Thread Testing**: Verify that outbound emails contain valid `Message-ID`, `In-Reply-To`, and `References` headers for uninterrupted conversation threads in email clients.
5. **WhatsApp & Voice Review Testing**: Verify email insert triggers WhatsApp notification, generates HMAC-SHA256 signed voice link, and enables voice control.

---

## 🗺️ Roadmap

- [x] Database schema design & Supabase migration
- [x] Approval webhook trigger & audit log structure
- [x] n8n classification & OpenAI drafting workflow (Workflow 1)
- [x] n8n send on approval workflow (Workflow 2)
- [x] Next.js / React staff review dashboard
- [x] WhatsApp notifications for urgent/priority triage (Workflow 3)
- [x] Voice transcription / voice note review integration (`/voice/[email_id]`)
- [ ] Role-based Access Control (RBAC) via Supabase Auth (pending client staff list)

---

## 📄 License

Internal project for **Allsaints Builders**. All rights reserved.
