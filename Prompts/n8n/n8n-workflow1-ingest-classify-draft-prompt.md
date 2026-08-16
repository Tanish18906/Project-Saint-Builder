# n8n Workflow Build Spec — Foreman Ingest, Classify & Draft

> [!NOTE]
> **Implementation Status (Live & Verified):**  
> Workflow ID: `iZxVrliRwHKuzmzX` ("Foreman: Ingest, Classify & Draft").  
> IMAP is not connected yet (client hasn't provided Titan credentials) — the workflow currently uses a test Set node (`TEST EMAIL — NPH Job Update`) with simulated email data. The classify and drafting prompts have been refined and verified in live executions.

Supabase project: `allsaints-email-agent` (`clxqjxtmxswpjjvqunfx`).

---

## Workflow Structure

```
Manual Trigger
  → Set node ("TEST EMAIL — NPH Job Update")
  → OpenAI node ("OpenAI — Classify", gpt-4o)
  → Code node ("Parse Classification" — JSON parsing, fence cleaning & DB fallback safety)
  → Supabase node ("Supabase — Get Account" — dynamic account_id lookup)
  → Supabase node ("Supabase — Insert Email")
  → Supabase node ("Supabase — Audit Log (Classified)")
  → OpenAI node ("OpenAI — Draft Reply", gpt-4o)
  → Supabase node ("Supabase — Insert Draft")
  → Supabase node ("Supabase — Audit Log (Drafted)")
```

---

## 1. Manual Trigger + Set Node (Test Email Data)

**Node Name:** `TEST EMAIL — NPH Job Update`  
Pre-filled with test data:

```json
{
  "from_address": "councilofficer@northampton.gov.uk",
  "from_name": "J. Whitfield",
  "subject": "Update required on NPH job #4521",
  "body_text": "Hi team, could you confirm the completion date for the roofing works at 12 Elm Street? Council needs this for our records by Friday.",
  "message_id": "test-msg-001@fake.local",
  "received_at": "2026-08-12T09:00:00Z",
  "account_email": "team@allsaintsbuilders.com"
}
```

*Note:* This node will be replaced by an IMAP Trigger node once Titan credentials are provided. All downstream field keys (`from_address`, `from_name`, `subject`, `body_text`, `message_id`, `received_at`, `account_email`) must be preserved.

---

## 2. OpenAI Node #1 — Classify

**Node Name:** `OpenAI — Classify`  
**Model:** `gpt-4o` | **Temperature:** `0.2`

### System Prompt (Live Prompt Text):
```
You are an email triage assistant for Allsaints Builders, a construction company.
Classify the incoming email into exactly one category, one routed_role, assign a confidence score (0-100), and provide a one-sentence summary.

Categories (choose EXACTLY one):
- urgent: needs response within hours, safety/legal/compliance issues, angry clients, deadlines today
- priority: important and requires action, but has more than a day of runway (not same-day critical)
- read_later: informational, newsletters, announcements, no action needed soon
- finance_accounts: invoices, payments, financial queries, amounts owed
- contracts: contract terms, agreements, signatures, legal wording changes
- nph_job_update: communications specifically regarding Northampton Partnership Homes (NPH) / Northampton Council jobs (do not use for generic jobs or private sites)
- other: matters that do not fit the above categories

Disambiguation Rules:
- urgent vs priority: Use 'urgent' only when a response is needed within hours, involves imminent deadlines today, safety/legal risks, or escalation. Use 'priority' when an action is required but has a reasonable timeline (days/weeks).
- finance_accounts vs contracts: Use 'finance_accounts' for invoices, billing, bank details, and payment chasing. Use 'contracts' for formal contractual terms, subcontractor agreements, scope variations, and legal document signatures.
- nph_job_update: Must ONLY be used when the email specifically references NPH or Northampton Council jobs/officers/job numbers. Generic job/site references without council/NPH affiliation should use 'priority', 'urgent', or 'other'.

Routed Roles (routed_role MUST be EXACTLY one of these four strings — NO OTHER VALUES ARE ALLOWED):
- director: confidential, high-value decisions, company contracts, high-level quotes
- senior_admin: general info@ admin matters, general queries, office tasks
- progressor: NPH/Northampton Council job communications (team@ inbox)
- accountant: invoicing, payment processing, accounting-specific queries

Output JSON Schema:
{
  "category": "<one of the 7 allowed categories>",
  "routed_role": "<one of the 4 allowed roles>",
  "confidence": <integer from 0 to 100>,
  "summary": "<one plain-English sentence summarizing what the email is about and what is being asked>"
}

Example output:
{
  "category": "nph_job_update",
  "routed_role": "progressor",
  "confidence": 95,
  "summary": "Council officer J. Whitfield is requesting confirmation by Friday on the completion date for roofing works at 12 Elm Street under NPH job #4521."
}

Respond ONLY with valid JSON matching the exact schema above. Do not include markdown code blocks, backticks, or any other text.
```

### User Message (Live Expression):
```
FROM:- {{ $json.from_name }}
sender's address:- {{ $json.from_address }}

subject - {{ $json.subject }}

body -  {{ $json.body_text }}

recieved on - {{ $json.account_email }}
```

---

## 3. Code Node — Parse Classification & Fallback Handling

**Node Name:** `Parse Classification`  
**Type:** `n8n-nodes-base.code` (Run Once For Each Item)

### Bug Discovered & Fixed:
During initial test executions (runs 3478–3481), the LangChain/OpenAI node output varied across versions (sometimes `$json.text`, `$json.response`, `$json.output[0].content[0].text`, or `$json.message.content`) and often returned Markdown-wrapped JSON (` ```json ... ``` `). When downstream nodes attempted to parse this directly, JSON parsing failed or passed nulls/invalid strings to Supabase, triggering database check constraint violations on `check_email_routed_role` and `check_email_category`.

### Solution & Fallback Logic:
A dedicated JavaScript Code node was introduced to:
1. Dynamically inspect all possible LLM output keys to extract raw text.
2. Clean out Markdown code fences (`replace(/```json\s*/gi, '').replace(/```\s*/gi, '')`).
3. Parse JSON with a secondary regex-based extraction fallback if `JSON.parse()` throws an exception.
4. Enforce strict database check constraint validation:
   - `category` normalized; if not in allowed list, defaults to `'other'`.
   - `routed_role` normalized; if not in allowed list (`['director', 'senior_admin', 'progressor', 'accountant']`), defaults to `'senior_admin'` so Supabase inserts never fail.
5. Provide a fallback summary string if empty.

```javascript
// Robust extraction across different OpenAI / LLM node output formats
let rawText = '';
const item = $input.item.json;

if (typeof item === 'string') {
  rawText = item;
} else if (item.text) {
  rawText = item.text;
} else if (item.response) {
  rawText = item.response;
} else if (item.output && Array.isArray(item.output) && item.output[0]?.content) {
  const contentObj = item.output[0].content;
  if (Array.isArray(contentObj) && contentObj[0]?.text) {
    rawText = contentObj[0].text;
  } else if (typeof contentObj === 'string') {
    rawText = contentObj;
  }
} else if (item.message && item.message.content) {
  rawText = typeof item.message.content === 'string' ? item.message.content : JSON.stringify(item.message.content);
} else {
  rawText = JSON.stringify(item);
}

rawText = rawText.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();

const ALLOWED_CATEGORIES = ['urgent', 'priority', 'read_later', 'finance_accounts', 'contracts', 'nph_job_update', 'other'];
const ALLOWED_ROLES = ['director', 'senior_admin', 'progressor', 'accountant'];

let parsedCategory = '';
let parsedRole = '';
let parsedConfidence = 85;
let parsedSummary = '';

try {
  const jsonMatch = rawText.match(/\{[\s\S]*\}/);
  const jsonStr = jsonMatch ? jsonMatch[0] : rawText;
  const parsed = JSON.parse(jsonStr);
  if (parsed.category) parsedCategory = String(parsed.category).trim().toLowerCase();
  if (parsed.routed_role) parsedRole = String(parsed.routed_role).trim().toLowerCase();
  if (parsed.confidence !== undefined) {
    const conf = parseInt(parsed.confidence, 10);
    if (!isNaN(conf)) parsedConfidence = Math.max(0, Math.min(100, conf));
  }
  if (parsed.summary) parsedSummary = String(parsed.summary).trim();
} catch (e) {
  const catMatch = rawText.match(/"category"\s*:\s*"([^"]+)"/i);
  const roleMatch = rawText.match(/"routed_role"\s*:\s*"([^"]+)"/i);
  const confMatch = rawText.match(/"confidence"\s*:\s*(\d+)/i);
  const sumMatch = rawText.match(/"summary"\s*:\s*"([^"]+)"/i);
  if (catMatch) parsedCategory = catMatch[1].trim().toLowerCase();
  if (roleMatch) parsedRole = roleMatch[1].trim().toLowerCase();
  if (confMatch) parsedConfidence = Math.max(0, Math.min(100, parseInt(confMatch[1], 10)));
  if (sumMatch) parsedSummary = sumMatch[1].trim();
}

const finalCategory = ALLOWED_CATEGORIES.includes(parsedCategory) ? parsedCategory : 'other';
const finalRole = ALLOWED_ROLES.includes(parsedRole) ? parsedRole : 'senior_admin';

if (!parsedSummary) {
  parsedSummary = `Email from ${$('TEST EMAIL — NPH Job Update').item.json.from_name || 'sender'} regarding ${$('TEST EMAIL — NPH Job Update').item.json.subject || 'inquiry'}.`;
}

return {
  json: {
    category: finalCategory,
    routed_role: finalRole,
    confidence: parsedConfidence,
    summary: parsedSummary,
    raw_classification_text: rawText
  }
};
```

---

## 4. Supabase Nodes — Email & Audit Log Persistence

### A. `Supabase — Get Account`
- **Table:** `accounts`
- **Operation:** `getAll`, Limit 1
- **Filter:** `email_address = {{ $('TEST EMAIL — NPH Job Update').item.json.account_email }}`

### B. `Supabase — Insert Email`
- **Table:** `emails`
- **Fields:**
  - `account_id`: `={{ $('Supabase — Get Account').item.json.id }}`
  - `message_id`: `={{ $('TEST EMAIL — NPH Job Update').item.json.message_id }}`
  - `from_address`: `={{ $('TEST EMAIL — NPH Job Update').item.json.from_address }}`
  - `from_name`: `={{ $('TEST EMAIL — NPH Job Update').item.json.from_name }}`
  - `subject`: `={{ $('TEST EMAIL — NPH Job Update').item.json.subject }}`
  - `body_text`: `={{ $('TEST EMAIL — NPH Job Update').item.json.body_text }}`
  - `received_at`: `={{ $('TEST EMAIL — NPH Job Update').item.json.received_at }}`
  - `category`: `={{ $('Parse Classification').item.json.category }}`
  - `routed_role`: `={{ $('Parse Classification').item.json.routed_role }}`
  - `status`: `'classified'`

### C. `Supabase — Audit Log (Classified)`
- **Table:** `audit_log`
- **Fields:**
  - `email_id`: `={{ $('Supabase — Insert Email').item.json.id }}`
  - `action`: `'classified'`
  - `details`: `={{ JSON.stringify({ category: $('Parse Classification').item.json.category, routed_role: $('Parse Classification').item.json.routed_role, confidence: $('Parse Classification').item.json.confidence, summary: $('Parse Classification').item.json.summary }) }}`

---

## 5. OpenAI Node #2 — Draft Reply

**Node Name:** `OpenAI — Draft Reply`  
**Model:** `gpt-4o` | **Temperature:** `0.7`

### System Prompt (Live Prompt Text):
```
You are drafting a reply on behalf of Allsaints Builders, a construction company.

First, identify the specific question, request, or action item in the original email.

Write a professional, concise reply that directly addresses that specific request:
- Identify exactly which facts the email is asking for (a date, price, decision, quantity, confirmation, etc.).
- For each fact you do not have, you MUST insert a placeholder in square brackets exactly where that fact belongs in the sentence — e.g. "The completion date is [CONFIRM COMPLETION DATE]." Do NOT write a fluent sentence that implies you know or will provide the answer (e.g. "I will confirm by Friday") — that is treated as inventing a fact, even without a specific number, because it makes a commitment you cannot verify.
- Only reference dates/deadlines that were explicitly stated BY THE SENDER as their own deadline — never state or imply a date as something Allsaints is committing to unless it was given to you as a known fact.
- If the email requires a decision or action, address it directly rather than deflecting.
- Avoid generic filler like "feel free to reach out" or "let us know if you need anything" unless it adds real value beyond restating that you received the email.

Keep the tone appropriate to a UK building company communicating with clients, council contacts, or internal team members.
Do not include a subject line — body text only.
Respond with the reply text only, no preamble or explanation.
```

### User Message (Live Expression):
```
Context:{{ $('Parse Classification').item.json.category }}
- Category: 
- Routed Role: {{ $('Parse Classification').item.json.routed_role }}
- Summary: {{ $('Parse Classification').item.json.summary }}

Incoming Email:
From: {{ $('TEST EMAIL — NPH Job Update').item.json.from_name }}, {{ $('TEST EMAIL — NPH Job Update').item.json.from_address }}
Subject: {{ $('TEST EMAIL — NPH Job Update').item.json.subject }}
```

---

## 6. Supabase Nodes — Draft & Audit Log Persistence

### A. `Supabase — Insert Draft`
- **Table:** `drafts`
- **Fields:**
  - `email_id`: `={{ $('Supabase — Insert Email').item.json.id }}`
  - `ai_generated_text`: `={{ $json.text || ($json.output && $json.output[0] && $json.output[0].content && $json.output[0].content[0] && $json.output[0].content[0].text) || ($json.message && $json.message.content) || '' }}`
  - `edited_text`: `={{ $json.text || ($json.output && $json.output[0] && $json.output[0].content && $json.output[0].content[0] && $json.output[0].content[0].text) || ($json.message && $json.message.content) || '' }}`
  - `draft_type`: `'ai_generated'`
  - `status`: `'pending'`

### B. `Supabase — Audit Log (Drafted)`
- **Table:** `audit_log`
- **Fields:**
  - `email_id`: `={{ $('Supabase — Insert Email').item.json.id }}`
  - `draft_id`: `={{ $('Supabase — Insert Draft').item.json.id }}`
  - `action`: `'drafted'`
  - `details`: `null`

---

## 7. What NOT to Build in this Workflow

- No IMAP or SMTP nodes (test Set node used until Titan credentials provided).
- No WhatsApp nodes (later phase).
- No send-on-approval logic (handled by separate Workflow #2 via Supabase webhook).
- No schema alterations.
