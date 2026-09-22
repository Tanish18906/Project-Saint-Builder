# Workflow 1 — Classification Benchmark Test

**For: coding agent (via n8n MCP)**
**Context:** Workflow 1's classify prompt was updated to the client's 9-theme taxonomy in a prior task (theme-routing v2) and passed 4 hand-picked ambiguity tests at the time. This is a broader, pre-defined benchmark to check the classifier's reliability across a wider spread of realistic emails — not just the ambiguous cases already known to work. Run this against the **live** `OpenAI — Classify` node in Workflow 1 (real API calls, not mocked/pinned data), same as the prior test round.

Do not modify the classify prompt, Parse Classification node, or any Supabase mappings as part of this task. This is a test-only task. If a test reveals a real classification problem, **report it — do not silently patch the prompt to fix it.**

---

## 1. Test set — 20 cases, expected answers defined up front

Each case has a **predetermined expected answer**, written before running anything, so grading is objective (matches / doesn't match) rather than a judgment call made after seeing output.

Construct realistic test emails (subject + body_text, 2-4 sentences each, plausible sender) for the following 20 cases. Use the client's actual keyword list (from the classify prompt) as source material for realistic phrasing — don't just paste keywords as titles, embed them naturally the way a real email would.

| # | Case description | Expected theme | Expected urgency | Expected routed_roles |
|---|---|---|---|---|
| 1 | Clean `orders` email — one-off purchase from Tool Station | `orders` | `normal` | `['senior_admin']` |
| 2 | Clean `finance` email — NPH AD FINANCE payment cert query | `finance` | `priority` or `normal` (accept either — no urgency signal in content) | `['director']` |
| 3 | Clean `suppliers` email — Plumb World account review, credit terms | `suppliers` | `normal` | `['director', 'senior_admin']` |
| 4 | Clean `promotions` email — generic supplier discount offer | `promotions` | `normal` | `['senior_admin']` |
| 5 | Clean `nph_jobs` email — routine job update, no urgency language | `nph_jobs` | `normal` | `['senior_admin']` |
| 6 | Clean `meetings_appointments` email — site visit scheduling | `meetings_appointments` | `normal` | `['senior_admin', 'director']` |
| 7 | Clean `invoices` email — HIRE invoice query | `invoices` | `normal` | `['director']` |
| 8 | Clean `certificates` email — GAS certificate renewal reminder | `certificates` | `normal` | `['senior_admin', 'director']` |
| 9 | Clean `accounts` email — general director correspondence, no other theme fits | `accounts` | `normal` | `['director']` |
| 10 | NPH keyword in finance context (regression — already passed once, re-confirm) | `finance` | any | `['director']` |
| 11 | NPH keyword in job-update context (regression — already passed once, re-confirm) | `nph_jobs` | `urgent` | `['senior_admin']` |
| 12 | Brewers as one-off order (regression — re-confirm) | `orders` | `normal` | `['senior_admin']` |
| 13 | Brewers as ongoing supplier account (regression — re-confirm) | `suppliers` | `normal` | `['director', 'senior_admin']` |
| 14 | Urgent language embedded in a non-`nph_jobs` theme — e.g. an `orders` email marked "URGENT — need by tomorrow" | `orders` | `urgent` | `['senior_admin']` |
| 15 | DAMP AND MOULD + VOID keywords, clearly disrepair/job content | `nph_jobs` | `urgent` or `priority` | `['senior_admin']` |
| 16 | Ambiguous/garbage email — spam-like content, no keyword match, nothing construction-related | `accounts` | `normal` | `['director']` |
| 17 | Short, low-context email (one line: "Any update on this?" with a vague subject) — tests behavior under genuinely insufficient information | any theme (record what it picks) | any | any (record what it picks) — **grade this on confidence score being appropriately low, not on theme correctness** |
| 18 | Email containing keywords from TWO unrelated themes at once (e.g. mentions both an ELECTRICAL certificate AND a Scottish Power order in the same message) | record what it picks — **grade on whether the choice is defensible from content, not a single "correct" answer** | any | matching whichever theme is picked |
| 19 | HASTINGS keyword only, minimal other context (tests reliance on a single distinctive keyword) | `finance` | any | `['director']` |
| 20 | Certificates email specifically about ROOF cert with a hard compliance deadline mentioned | `certificates` | `urgent` or `priority` | `['senior_admin', 'director']` |

**Grading notes:**
- Cases 1–13, 19, 20 have a single correct expected answer — grade strictly (theme match, urgency match where specified, routed_roles exact array match).
- Cases 14, 15 test urgency-detection independent of theme — grade urgency strictly, theme should also match.
- Cases 16 is the fallback/garbage test — grade strictly on landing in `accounts` with low confidence, not defaulting to some other theme.
- Cases 17, 18 are **not pass/fail on a single correct answer** — they test how the model behaves under genuine ambiguity. Record the actual output and confidence score, and assess whether the behavior is *reasonable* (doesn't crash, doesn't hallucinate a theme not in the list, confidence score is honestly low rather than falsely high). Flag these as "informational" in the report, not "pass/fail."

---

## 2. Execution

- Run all 20 cases through the live `OpenAI — Classify` node, one at a time (reuse the existing Set-node test-case pattern already established in the workflow)
- Capture the full raw JSON output for every case — theme, urgency, routed_roles, confidence, summary
- Do not run these through the full downstream pipeline (Supabase inserts, draft generation) unless needed for debugging — this benchmark is specifically about the classify step's accuracy, not the whole workflow. Keep it fast and isolated.

---

## 3. Report format — keep this short

Produce a compact results table, not prose per case:

| # | Theme match | Urgency match | Routed_roles match | Confidence | Notes (only if failed or informational) |
|---|---|---|---|---|---|

Followed by:
- **Overall pass rate** (X/18 strict cases — excluding the 2 informational cases from the pass-rate denominator)
- **Any strict-case failures**, listed individually with expected vs. actual, and a one-line hypothesis for why (e.g. "keyword X pulled it toward theme Y despite context suggesting Z")
- **Informational case findings** (17, 18) in 2-3 sentences total, not a full breakdown
- **One sentence**: overall verdict — is the classifier reliable enough to trust in production as-is, or does it need another prompt refinement pass before the client sees it

Do not pad this with restated methodology or a case-by-case narrative — the table plus the four items above is the whole report.

## 4. What NOT to do

- Do not modify the classify prompt, even if you find a failure — report it, don't fix it in this task
- Do not run these against Workflow 2 or Workflow 3
- Do not insert benchmark test rows into the live `emails`/`drafts` tables — if the classify node's execution requires downstream nodes to run, either temporarily disconnect them for this test or clean up any test rows immediately after, your choice, but the production tables should show no trace of this benchmark afterward
- Do not skip the informational cases (17, 18) even though they're not pass/fail — they're testing failure-mode behavior, which matters as much as accuracy on easy cases
