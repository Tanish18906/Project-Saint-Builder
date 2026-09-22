# n8n Workflow 1 — Tone Tie-Break Fix (follow-up to classify-prompt v2)

**For: coding agent (via n8n MCP)**
**Context:** Small correction to the `OpenAI — Draft Reply` tone-selection logic added in the theme-routing v2 update. The original rule ("use `routed_roles[0]`") was based on an assumption that director-first array ordering meant seniority-first ordering — that's only true for the `suppliers` theme. For `meetings_appointments` and `certificates`, the mapping table lists `senior_admin` first, so multi-role emails for those two themes are currently getting senior_admin's tone (professional/neutral) instead of director's (formal/concise) by accident of array position, not by intent.

This is a one-node logic fix. Do not touch the classify prompt, Parse Classification node, or Supabase insert mappings — those are correct and already tested.

---

## Fix

In the tone-selection logic (wherever `routed_roles[0]` is currently used to pick a tone preset — likely in a Code node or expression feeding the `OpenAI — Draft Reply` node), replace the array-position rule with a seniority-priority rule:

**Old logic:** use `routed_roles[0]` as the tone role.

**New logic:**
```
if routed_roles includes 'director' → use director's tone preset
else if routed_roles includes 'senior_admin' → use senior_admin's tone preset
else if routed_roles includes 'progressor' → use progressor's tone preset (currently unused, kept for completeness)
else if routed_roles includes 'accountant' → use accountant's tone preset (currently unused, kept for completeness)
else → fall back to whatever the current default/error-handling behavior is for an empty or unrecognized routed_roles value
```

This means: any email where `director` is one of the routed roles gets the director tone (formal/concise), regardless of where `director` sits in the array. Single-role themes are unaffected — this only changes behavior for `suppliers`, `meetings_appointments`, and `certificates` (the three multi-role themes), and only for the two of those where the old array-position rule was giving the wrong tone (`meetings_appointments`, `certificates`).

Update the sticky note on the canvas that currently flags this as a known inconsistency — either remove it (if the fix fully resolves it) or update its wording to reflect the new seniority-priority rule instead of the old array-position rule.

---

## Testing

Re-run the two test cases that exposed this originally, or equivalent ones, and confirm draft tone:
- A `meetings_appointments` email → draft should now come back in director's formal/concise tone, not senior_admin's professional/neutral tone
- A `certificates` email → same check
- Re-confirm the `suppliers` case (already correct under both old and new logic) still produces the same director-tone output as before, as a regression check

Show raw draft output text for at least the `meetings_appointments` case, before and after, so the tone difference is actually visible — not just a claim that "tone logic was updated."

## Output expected

- Confirmation of the exact node/expression changed
- Before/after draft text for at least one previously-mistagged theme
- Sticky note updated or removed
- No changes outside the tone-selection logic
