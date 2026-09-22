# Workflow 1 — Classify Prompt Fix: Non-Construction Content Override

**For: coding agent (via n8n MCP)**
**Context:** Benchmark testing (20-case run) found one reproducible failure: a spam/marketing-style email with no genuine connection to Allsaints Builders' business got classified as `promotions` at 0.9 confidence, when it should have fallen back to `accounts` at low confidence. Root cause (confirmed by the agent that ran the benchmark): the prompt's fallback-to-`accounts` instruction only fires on "nothing fits," but never overrides a *stylistic* match — spam using promotional language ("exclusive offer," "claim now," "limited time") pattern-matches the `promotions` theme definition on tone alone, regardless of whether the content has anything to do with the business.

This is a small, targeted addition to the existing classify prompt — not a rewrite. Do not touch anything else in the prompt (theme definitions, urgency logic, routed_roles mapping) that isn't directly part of this fix.

---

## 1. The fix

Add an explicit disambiguation rule to the classify prompt, positioned near the `promotions` theme definition and/or the fallback instruction (wherever it reads most naturally without disrupting the existing structure):

```
Important: "promotions" applies only to genuine marketing/promotional content from businesses
Allsaints actually has a relationship with (suppliers, trade contacts, industry partners) —
e.g. a supplier offering a seasonal discount. It does NOT apply to generic spam, phishing,
prize/lottery content, or marketing-style language from unrelated senders with no connection
to Allsaints' construction business, even if the wording resembles a promotional offer
("exclusive," "claim now," "limited time"). Judge by whether the sender and subject matter
are plausibly connected to Allsaints' actual business — not by tone or wording alone. If an
email is generic spam or clearly unrelated to construction/property/trade business, classify
as "accounts" with low confidence, regardless of how promotional its language sounds.
```

Adjust exact wording as needed to fit naturally into the existing prompt's voice and structure — the substance (business-relationship test, not tone-based matching, for `promotions` specifically) is what matters, not the exact phrasing above.

---

## 2. What NOT to do

- Do not rewrite the `promotions` theme definition itself — add the disambiguation rule alongside it, don't replace it
- Do not touch the other 8 theme definitions, the urgency logic, or the routed_roles mapping
- Do not add similar override rules for other themes speculatively — this fix addresses the one confirmed failure (#16), not a general defensive rewrite
- Do not modify the Parse Classification node or Supabase mappings — this is a prompt-text-only change

---

## 3. Immediate verification (not the full retest — that's a separate task)

Before reporting this done, re-run **only the original failing case (#16)** — same test email as the benchmark, unchanged — through the live node once, and confirm it now correctly returns `theme: "accounts"` with low confidence. This is a quick sanity check that the fix works on the case that exposed it, not the full rigorous retest.

Show the raw before/after JSON output for this one case.

## 4. Output expected

- Exact wording added to the prompt, and where it was placed
- Raw JSON output for the #16 case, before (already have this from the benchmark) and after the fix
- Confirmation nothing else in the prompt was touched
- Progress tracker updated noting this fix, with a note that a fuller rigorous retest (harder, human-written cases) is coming as a separate follow-up task — do not run that retest as part of this task
