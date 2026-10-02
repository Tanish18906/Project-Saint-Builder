# FOREMAN — IMPLEMENT APPROVED PERFORMANCE PLAN

You are Claude Opus.

You previously:
1. Investigated Foreman's performance.
2. Identified the root causes.
3. Produced a performance implementation plan.

You are now authorized to implement that plan.

## APPROVED PLAN

PASTE THE APPROVED IMPLEMENTATION PLAN HERE.

## RULE

Implement ONLY the approved performance changes.

Do not turn this into a general refactor. Do not redesign the application. Do not change business behavior.

## PROJECT CONSTRAINTS

Frontend/application performance only.

Do NOT modify:
- Supabase schema
- n8n workflows
- Twilio
- unrelated backend systems
- business logic unrelated to the performance issue

Preserve:
- authentication
- authorization
- data correctness
- data freshness
- error handling
- existing UI
- existing behavior

Work on the correct feature branch. Never work directly on `main`.

## IMPLEMENTATION METHOD

Implement in logical batches.

After each major optimization:
1. Run type checking
2. Run linting if available
3. Run relevant tests
4. Benchmark the affected route
5. Check for regressions

Do not wait until the end to discover that an optimization broke the app.

## PERFORMANCE VALIDATION

Benchmark at minimum:
- `/`
- `/inbox`
- `/approvals`
- `/audit-log`

Compare BEFORE against AFTER.

Measure both development behavior where useful and production build behavior.

Do not claim improvement based solely on subjective feeling.

## SPECIAL ATTENTION: /inbox

Because `/inbox` previously reached 11.3 seconds, verify that the fix actually addresses:
- proxy latency
- application latency
- data waterfalls
- duplicated requests
- rendering/hydration

## SPECIAL ATTENTION: proxy.ts

Verify that middleware optimizations do NOT weaken:
- authentication
- authorization
- protected routes
- session handling
- redirects

## DO NOT USE FAKE OPTIMIZATIONS

Do not:
- hide latency
- remove functionality
- disable auth
- hardcode results
- add arbitrary delays
- suppress performance logs
- globally cache sensitive data
- blindly memoize everything

## FINAL REPORT

Provide:

# PERFORMANCE IMPLEMENTATION REPORT

## Changes Made
List every change.

## Files Modified
Exact paths.

## Root Cause → Fix
Show: Problem → Fix → Result

## Before vs After

| Route | Before | After | Difference |
|---|---:|---:|---:|
| `/` | | | |
| `/inbox` | | | |
| `/approvals` | | | |
| `/audit-log` | | | |

## Validation
- Typecheck
- Lint
- Tests
- Production build
- Navigation verification

## Remaining Bottlenecks
Be honest. If something remains slow, identify it.

## Regression Check
Confirm:
- auth
- navigation
- Inbox
- Approvals
- Audit Log
- dashboard
- loading states
- error states

Do not claim “fully optimized” unless measurements justify it.
