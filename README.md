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
                            │ (IMAP Polling / Push)
                            ▼
┌────────────────────────────────────────────────────────┐
│                      n8n Engine                        │
│   1. Extracts Email & Metadata (Message-ID, Headers)   │
│   2. OpenAI: Categorizes & Assigns Role                │
│   3. OpenAI: Drafts Contextual Response                │
│   4. Writes Email & Draft to Supabase                  │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│                   Supabase Database                    │
│   • Tables: accounts, users, emails, drafts, audit_log │
│   • Row Level Security (RLS) enabled                   │
│   • Webhook: status = 'approved' -> triggers n8n       │
└─────────────────────┬───────────────────▲──────────────┘
                      │ (Realtime / REST) │ (Approve / Edit / Discard)
                      ▼                   │
┌────────────────────────────────────────────────────────┐
│                   Review Dashboard                     │
│   • Triage & Categorized Email Feeds                   │
│   • In-place Draft Review, Editing & Re-writing        │
│   • Single-click Approval Workflow                     │
│   • Audit Trail Inspection                             │
└────────────────────────────────────────────────────────┘
                            │
                            │ (Status changed to 'approved')
                            ▼
┌────────────────────────────────────────────────────────┐
│           Supabase Database Webhook Trigger            │
└───────────────────────────┬────────────────────────────┘
                            │ (HTTP POST)
                            ▼
┌────────────────────────────────────────────────────────┐
│                  n8n SMTP Dispatch                     │
│   • Sends reply with In-Reply-To & References headers  │
│   • Updates Supabase email & draft status to 'sent'    │
└────────────────────────────────────────────────────────┘
```

---

## 🗂️ Repository Branch Structure

The project codebase is organized across dedicated feature branches:

- **`main`**: Production-ready orchestrations and unified codebase.
- **`backend-supabase`**: Supabase migrations, database schemas, RLS policies, seed data, and pg_net webhooks.
- **`n8n-automation`**: n8n workflow JSON templates, prompt engineering, and email integration pipelines.
- **`frontend`**: Staff review dashboard, role-based interfaces, and approval UI.

---

## 🔄 End-to-End Workflow

1. **Ingestion**: An email lands in `info@allsaintsbuilders.com` or `team@allsaintsbuilders.com`.
2. **Detection & Ingest**: n8n IMAP trigger captures the message, preserving the critical RFC 822 `Message-ID` for thread chaining.
3. **AI Classification**: OpenAI classifies the message into domain-specific categories (`urgent`, `priority`, `read_later`, `finance_accounts`, `contracts`, `nph_job_update`, `other`) and routes it to the matching role (`director`, `senior_admin`, `progressor`, `accountant`).
4. **Draft Generation**: OpenAI generates a suggested professional response.
5. **Persistence**: n8n inserts the email into `emails` and the generated draft into `drafts`.
6. **Review on Dashboard**: Staff members review incoming items:
   - **Approve as-is**: Stored as `ai_generated`.
   - **Edit & Approve**: Stored as `ai_edited`.
   - **Discard & Write Manual Reply**: Stored as `manual`.
7. **Approval Webhook**: When status changes to `approved`, a Supabase database trigger makes an HTTP POST request to the n8n webhook endpoint via `pg_net`.
8. **SMTP Dispatch & Threading**: n8n sends the approved email using Titan SMTP with `In-Reply-To` and `References` headers, updating status to `sent`.

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

---

## 🗺️ Roadmap

- [x] Database schema design & Supabase migration
- [x] Approval webhook trigger & audit log structure
- [ ] n8n classification & OpenAI drafting workflow
- [ ] Next.js / React staff review dashboard
- [ ] Role-based Access Control (RBAC) via Supabase Auth
- [ ] WhatsApp notifications for urgent/priority triage
- [ ] Voice transcription / voice note review integration

---

## 📄 License

Internal project for **Allsaints Builders**. All rights reserved.
