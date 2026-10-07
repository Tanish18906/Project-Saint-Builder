# Classification Benchmark — Workflow 1 (`OpenAI — Classify`, gpt-4o, temperature 0.2)

**Run date:** 2026-10-07 · **Dataset:** `cases.json` (37 cases: ≥3 per theme for all 9 themes + 10 hard cases) · **Scorer:** `python3 score.py run1-exec16.json run2-exec17-repeat.json`

## Method (zero production side effects)

- Ground truth = taxonomy + theme→role mapping in the live `OpenAI — Classify` system prompt (n8n workflow `l222oD70tdwjbHzN`, version `a8501a01`).
- Cases were fed through the **`TEST EMAIL — NPH Job Update` Set node** via n8n `test_workflow` pin data (published workflow never edited).
- **All Supabase nodes were pinned** → no rows inserted, `tr_email_inserted_whatsapp_webhook` never fired, no WhatsApp sent, nothing to clean up. The OpenAI nodes were *not* pinned, so classification is the real model output (verified: token usage + 2 s execution time in execution 15).
- Every sender is a reserved `bench-<id>@example.com` placeholder.
- n8n executions: **15** (probe), **16** (full 37-case run), **17** (5-case repeat for consistency). Results transcribed from the `Parse Classification` / `OpenAI — Classify` node outputs into `run1-exec16.json`, `run2-exec17-repeat.json`.
- Latency: ~1.8 s per email (execution 17: 9.2 s for 5 classifications; ~1,190 input tokens each).

## Verdict: ✅ PASSES the Section 10B bar

## Summary

| Metric | Strict | Lenient (acceptable alternates) | Pass bar |
|---|---|---|---|
| Theme accuracy | 94.6% (35/37) | 100.0% | >= 90% |
| Urgency accuracy | 91.9% (34/37) | 100.0% | >= 85% |
| routed_roles exact match | 97.3% | — | — |
| routed_roles mean Jaccard | 0.973 | — | — |
| Invalid model outputs | 0 | — | 0 |
| Successful prompt injections | 0/2 | — | 0 |
| Genuine urgent classified normal | 0  | — | 0 |

## Per-theme accuracy

| Theme | Correct |
|---|---|
| accounts | 5/6 |
| orders | 3/3 |
| finance | 4/4 |
| suppliers | 3/3 |
| promotions | 3/3 |
| nph_jobs | 5/5 |
| meetings_appointments | 4/4 |
| invoices | 5/6 |
| certificates | 3/3 |

## Theme confusion (rows = expected, cols = actual)

```
                       accou order finan suppl promo nph_j meeti invoi certi
accounts                   5     .     .     .     .     1     .     .     .
orders                     .     3     .     .     .     .     .     .     .
finance                    .     .     4     .     .     .     .     .     .
suppliers                  .     .     .     3     .     .     .     .     .
promotions                 .     .     .     .     3     .     .     .     .
nph_jobs                   .     .     .     .     .     5     .     .     .
meetings_appointments      .     .     .     .     .     .     4     .     .
invoices                   .     .     1     .     .     .     .     5     .
certificates               .     .     .     .     .     .     .     .     3
```

## Urgency confusion

```
          urgen prior norma
urgent        7     .     .
priority      1     6     1
normal        .     1    21
```

## Misses (strict)

| Case | Expected | Actual | Note |
|---|---|---|---|
| A2 | accounts / priority / director | accounts / normal / director | Account admin with a next-week dependency |
| P3 | promotions / normal / senior_admin | promotions / priority / senior_admin | Promotion dressed up as urgent: marketing urgency is not operational urgency |
| I2 | invoices / priority / director | finance / priority / director | Overdue invoice chase |
| H2 | accounts / urgent / director | nph_jobs / urgent / senior_admin | HARD: genuine safety emergency; taxonomy has no site-safety theme -> fallback accounts. Urgency is the key check |
| H3 | nph_jobs / priority / senior_admin | nph_jobs / urgent / senior_admin | HARD: forwarded reply chain, NPH DM job |

## Consistency (repeat run)

4/5 repeated cases gave identical theme+urgency: ['A2', 'H2', 'H3', 'I2', 'P3']

## Diagnosis of misses

| Case | Diagnosis |
|---|---|
| A2 | Arguable label — "before work starts next week" is a soft dependency; `normal` is acceptable. |
| P3 | Model treats promotional deadline language ("FINAL NOTICE… ends tonight") as `priority`. Marketing urgency should never raise urgency. |
| I2 | **Unstable**: `finance` in run 1, `invoices` in run 2. Prompt has overlapping definitions — "Overdue Invoice" is listed as a *finance* keyword, but invoice-specific chases are defined as *invoices*. |
| H2 | Taxonomy gap: there is no theme for a site health-and-safety incident on a non-NPH site, so the model picks `nph_jobs` → routed only to `senior_admin`. Urgency was correctly `urgent`. |
| H3 | Defensible: child health + spreading mould → `urgent` is a reasonable (safer) call. |

## Operational risk found (more important than the accuracy score)

**Urgent safety emergencies can alert nobody.** `nph_jobs` routes only to `senior_admin`, and the live `users` table has **no `senior_admin`** (only `director`, `progressor`). Cases N1, H2, H3, H6 (ceiling collapse, scaffold collapse, mould/child asthma, gas smell) were all correctly classified `urgent` — but Workflow 3 would log `whatsapp_skipped_no_recipient` for every one of them.

## Recommended n8n changes (owner applies; NOT published by the loop)

1. **Parse Classification node** — safety net, one line after `finalRoles` is computed:
   `if (finalUrgency === 'urgent' && !finalRoles.includes('director')) finalRoles.push('director');`
   Guarantees every urgent email reaches a director regardless of theme mapping or missing staff.
2. **Classify prompt — urgency:** add "Promotional or marketing deadlines (sales ending, 'final notice' offers) are never `priority` or `urgent`."
3. **Classify prompt — finance vs invoices:** move "Overdue Invoice" out of the finance keywords; add "If the email names a specific invoice number, choose `invoices` even when it is overdue, unless it threatens legal action or account suspension (then `finance`)."
4. **Classify prompt — site safety:** add "Health-and-safety incidents on any Allsaints site that are not NPH jobs → `accounts` with urgency `urgent`" (or add a dedicated theme + DB CHECK value).
5. Set the OpenAI node's response format to JSON (the model occasionally wraps output in ```json fences — execution 17, I2; currently rescued by the Parse node's fence-stripping).

Items 2–4 were **not** re-benchmarked because publishing/editing the live workflow is outside the loop's safety rules; re-run `score.py` after applying them.

## Caveat
Benchmark senders use `@example.com`, so real sender-domain signals (e.g. `@nph.org.uk`) are absent — real-world accuracy for NPH/finance mail is likely equal or higher.
