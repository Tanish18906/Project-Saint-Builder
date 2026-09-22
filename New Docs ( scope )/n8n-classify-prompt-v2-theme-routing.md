# n8n Workflow 1 — Classify Node Update (v2: Theme-Based Routing)

**For: coding agent (via n8n MCP)**
**Context:** Replaces the classify prompt in `OpenAI — Classify` node (Workflow 1: `iZxVrliRwHKuzmzX`). This implements the client's actual keyword/theme/routing doc verbatim. Do not soften, merge, or "improve" the category list — it must match the client's wording exactly, since this system has already been corrected once for silently deviating from client instructions.

Do not modify Workflow 2 (send-on-approval) or Workflow 3 (WhatsApp) in this task — those need separate updates listed in the migration doc's Section 5, tracked as follow-up work.

---

## 1. Replace the classify system prompt

Old prompt used a 7-category system (`urgent`/`priority`/`read_later`/`finance_accounts`/`contracts`/`nph_job_update`/`other`) with single `routed_role`. Replace entirely with:

```
You are an email triage assistant for Allsaints Builders, a UK construction company.
You must classify every email using the client's own operational taxonomy below — do not
invent categories or roles outside this list.

Classify the email into exactly one THEME, one URGENCY level, and one or more ROUTED ROLES.

THEMES (pick exactly one):

- accounts: general account-holder correspondence, not fitting a more specific theme below
- orders: purchase orders and supplier order confirmations. Keywords/senders: Supra UK Limited,
  Valliant, Brewers, Scottish Power, Tool Station
- finance: financial/payment correspondence, particularly NPH finance contacts. Keywords/senders:
  nphadfinance.nph@nph.org.uk, finance.nph@nph.org.uk, "PAYMENT CERT", "NPH AD FINANCE",
  "DISREP Payment Cert", "Overdue Invoice", Hastings
- suppliers: supplier relationship/account correspondence (distinct from one-off orders above).
  Keywords/senders: Plumb World, Brewers, Tomred Scaffold
- promotions: marketing offers and promotional emails. Keywords: "Offers"
- nph_jobs: NPH / Northampton Council job and repairs correspondence. Keywords: NPH, Disrepair,
  Urgent, Emergency, DM, A&A, "DAMP AND MOULD", VOID, DISRP
- meetings_appointments: meeting or appointment scheduling and confirmations
- invoices: invoice correspondence. Keywords: NPH, HIRE
- certificates: compliance certificates. Keywords: "MINOR WORKS", ELECTRICAL, GAS, ROOF

Note: some keywords appear under multiple themes (e.g. "NPH" appears under finance, nph_jobs,
and invoices; "Brewers" appears under both orders and suppliers). When a keyword is ambiguous,
use the surrounding email content to decide which theme actually fits — do not default to the
first matching theme mechanically. If genuinely unclear, choose "accounts" as the fallback and
set confidence low.

URGENCY (pick exactly one, independent of theme):

- urgent: needs response within hours — explicit urgency language, emergency, disrepair with
  safety implications, same-day deadlines
- priority: important but not same-day critical
- normal: no time pressure indicated

Note: words like "Urgent", "Emergency", "DM" can appear inside an nph_jobs-themed email as
content signals for urgency — they are not themes in themselves. Extract urgency separately
from theme even when they come from the same source text.

ROUTED ROLES — assign based on theme, using this exact mapping (an email can have more than
one routed role):

- accounts → director
- orders → senior_admin
- finance → director
- suppliers → director, senior_admin
- promotions → senior_admin
- nph_jobs → senior_admin
- meetings_appointments → senior_admin, director
- invoices → director
- certificates → senior_admin, director

Also provide:
- confidence: a number 0.0-1.0 reflecting how confident you are in the theme classification
- summary: a one-sentence plain-English summary of what the email is about, for a human reviewer

Respond ONLY with valid JSON, no other text, no markdown formatting:
{
  "theme": "...",
  "urgency": "...",
  "routed_roles": ["...", "..."],
  "confidence": 0.0,
  "summary": "..."
}
```

User message: pass through `subject` and `body_text` from the ingest step, same as before.

---

## 2. Update the `Parse Classification` Code node

The existing parsing node (built with multi-structure extraction & fallbacks per progress tracker) needs its expected shape updated:

- Old: extracts `category`, `routed_role` (single string)
- New: extracts `theme`, `urgency`, `routed_roles` (**array**, not a single string), `confidence`, `summary`

Since `routed_roles` is now an array, make sure:
- Fallback logic handles the case where the model returns a single string instead of an array (defensive parsing — coerce to `[value]` if a bare string comes back instead of an array)
- The extracted `routed_roles` value is passed downstream in a shape Supabase's node can insert directly into a `text[]` column (this typically means passing an actual JS array, not a stringified JSON array — check how the existing Supabase node in this workflow expects array-typed fields and match that format)

---

## 3. Update the Supabase insert into `emails`

Change the insert mapping:
- Remove: `category`, `routed_role`
- Add: `theme` (from parsed classification), `urgency` (from parsed classification), `routed_roles` (array, from parsed classification)
- Everything else (`account_id`, `message_id`, `from_address`, `from_name`, `subject`, `body_text`, `received_at`, `status`) stays as-is

---

## 4. Update the `audit_log` insert (classified action)

`details` jsonb should now contain:
```json
{"theme": "...", "urgency": "...", "routed_roles": ["...", "..."], "confidence": 0.0, "summary": "..."}
```
instead of the old `{"category": "...", "routed_role": "..."}` shape.

---

## 5. Draft reply prompt (OpenAI node #2) — minor update only

The draft prompt currently receives `category` and `routed_role` as context per the tone-customization logic already built (director: formal/concise, senior_admin: professional/neutral, progressor: technical/job-focused, accountant: figures-forward — per progress tracker section 2).

Since `routed_roles` can now contain more than one role (e.g. `['director', 'senior_admin']` for suppliers/meetings/certificates), update the tone-selection logic:
- If `routed_roles` has exactly one value, use the existing per-role tone mapping unchanged
- If `routed_roles` has multiple values, use the tone of whichever role is listed **first** in the array (director-first ordering already reflects seniority in the mapping table above, so this defaults to the more formal tone when a choice must be made — simplest reasonable option, document this choice in a code comment, don't ask, just proceed)
- `progressor` and `accountant` tone presets can stay in the code even though nothing currently routes to them — do not delete, just note in a comment they're currently unused pending v2/retainer scope

---

## 6. What NOT to do in this task

- Do not modify Workflow 2 (send-on-approval) — no theme/urgency/routed_roles dependency there
- Do not modify Workflow 3 (WhatsApp) in this task — its `urgency`-based filter and multi-recipient lookup update is separate follow-up work (see migration doc Section 5)
- Do not restore `progressor` as an active routed_roles target — this was an explicit client instruction, not an oversight
- Do not add categories/themes beyond the 9 listed, even if a test email doesn't fit well — use `accounts` as fallback with low confidence instead of inventing a new theme

---

## 7. Testing

Re-run the existing test email set (per progress tracker: nph_job_update, urgent, priority, general categories previously tested) through the updated prompt and confirm:
- Every test email gets a valid theme from the 9-value list
- `routed_roles` is a proper array matching the mapping table exactly for its assigned theme
- Urgency is extracted independently and correctly (e.g. an nph_jobs email containing "Emergency" should get `urgency: "urgent"`, not have urgency conflated with theme)
- Ambiguous-keyword test case: construct one test email using "NPH" in a clearly finance context and one using "NPH" in a clearly job-update context, confirm the model distinguishes them using surrounding content rather than keyword-matching alone

## 8. Output expected from coding agent

- Updated classify prompt live in the `OpenAI — Classify` node
- Updated `Parse Classification` Code node handling array-typed `routed_roles`
- Updated Supabase insert mappings (emails + audit_log)
- Updated tone-selection logic in the draft prompt for multi-role cases
- Test run results across the existing test set plus the two new NPH ambiguity test cases
- Summary of any assumptions made
