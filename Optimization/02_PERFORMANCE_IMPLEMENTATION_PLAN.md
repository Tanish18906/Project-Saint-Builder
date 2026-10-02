# FOREMAN — PERFORMANCE IMPLEMENTATION PLAN

You are Claude Opus.

You previously performed a forensic performance investigation of Foreman.

Your task is to convert those findings into a precise implementation plan.

**DO NOT IMPLEMENT ANYTHING. DO NOT MODIFY CODE.**

## INVESTIGATION REPORT

PASTE THE COMPLETE FORENSIC REPORT HERE.

## OBJECTIVE

Create the smallest set of technically correct changes that address the confirmed bottlenecks.

Do NOT turn this into a general refactor. Do NOT optimize unrelated code. Every proposed change must have a reason connected to an identified bottleneck.

## PLAN REQUIREMENTS

For every proposed fix provide:

1. Problem
2. Root cause
3. Evidence
4. Exact file(s)
5. Exact code area/component
6. Proposed change
7. Why it should improve latency
8. Potential regression risk
9. How to test it
10. Expected performance impact

## OPTIMIZATION ORDER

Prioritize:

1. proxy/middleware bottlenecks
2. `/inbox` waterfalls
3. duplicated data fetching
4. blocking server work
5. navigation behavior
6. server/client boundaries
7. rendering
8. bundle/runtime issues

Do not optimize something with negligible impact before a confirmed major bottleneck.

## IMPORTANT

Preserve authentication, authorization, data correctness, data freshness, error handling, existing UI, and existing functionality.

Do NOT solve latency by removing authentication, removing data, hardcoding data, disabling security, globally caching sensitive data, hiding latency with fake skeletons, or removing required functionality.

## CONCURRENCY

If sequential awaits can safely become concurrent operations, explicitly show:

CURRENT FLOW
↓
PROPOSED FLOW

Verify dependencies before proposing `Promise.all`.

## NAVIGATION

If navigation can be improved through prefetching, Suspense, streaming, route-level loading, avoiding unnecessary refreshes, or reducing blocking work, explain exactly why.

## DELIVERABLE

Produce:

# FOREMAN PERFORMANCE IMPLEMENTATION PLAN

## Phase 1 — Highest Impact Fixes
## Phase 2 — Secondary Fixes
## Phase 3 — UX / Navigation Improvements
## Phase 4 — Optional Optimizations

For each phase include:

- files
- changes
- dependencies
- risks
- validation

Then provide:

## Expected Before/After

| Route | Current | Target/Expected | Main Fix |
|---|---:|---:|---|
| `/` | ... | ... | ... |
| `/inbox` | ... | ... | ... |
| `/approvals` | ... | ... | ... |
| `/audit-log` | ... | ... | ... |

Do NOT invent target numbers if the investigation does not support them.

## Validation Plan

Explain exactly how the implementation will be benchmarked.

## Rollback Plan

Explain how each major change can be safely reverted.

STOP. Do not implement anything. Wait for explicit approval.
