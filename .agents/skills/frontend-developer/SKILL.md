---
name: frontend-developer
description: >-
  Engineering playbook for the Foreman frontend: Next.js 16 App Router, React 19, Tailwind CSS v4,
  TypeScript and Supabase Realtime. Use whenever building, refactoring or reviewing frontend
  components and pages. Visual design authority is DESIGN_SYSTEM.md at the repo root — this skill
  covers engineering practice, not appearance.
---

# Frontend Developer Skill

Engineering practice for this codebase. **For every visual or interaction decision (colour, type, spacing, layout, component look, states, motion, responsive behaviour), `DESIGN_SYSTEM.md` at the repository root is the single authority.** Read it before building UI. Older design specs in `Docs/archive/superseded-design/` are historical only.

---

## Core principles

1. **Server-first.** Default to Server Components. Use `'use client'` only for state, event handlers, browser APIs or Realtime.
2. **Presentation is separate from logic.** Components render; hooks in `src/hooks/` own state, Realtime and calls to the shared server actions; pure rules live in `src/lib/domain.ts`, formatting in `src/lib/format.ts`.
3. **Compose primitives.** Build UI from `src/components/ui/` (Button, Badge, Input, Dialog, ConfirmDialog, Sheet, DropdownMenu, Tooltip, Toast, EmptyState, ErrorState…). Use semantic token utilities only. No raw hex, no Tailwind default palette, and no restyling primitives through `className`.
4. **Realtime hygiene.** Every Supabase channel is removed in its `useEffect` cleanup.
5. **Accessible by construction.** Semantic HTML, keyboard operation, visible focus, and distinct loading/empty/error states. Follow the checklist in `DESIGN_SYSTEM.md` §13.

## References

- [Next.js 16 App Router & RSC](./references/nextjs16-app-router.md): server/client boundaries, server actions, route protection.
- [Supabase Realtime & optimistic UI](./references/supabase-realtime-ui.md): channel management, cleanup, optimistic reconciliation.
- **Design:** [`DESIGN_SYSTEM.md`](../../../DESIGN_SYSTEM.md) and the live reference at `/design-system` (dev only).

## Workflow

1. **Data and state.** What's fetched on the server, and what needs a client subscription? Put stateful logic in a hook, not in the component.
2. **Composition.** Feature components go in `src/components/<feature>/` (`shell/`, `queue/`, `workspace/`, `activity/`, `voice/`). Reusable, domain-free building blocks go in `src/components/ui/`. If a primitive needs a new look, add a variant there and document it.
3. **States.** Design default, hover, focus, selected, disabled, loading, empty, error and locked up front, using the patterns in `DESIGN_SYSTEM.md` §7 and §10.
4. **Functional invariants.** Never alter the write path (the three server actions), the post-approval lockdown, voice safety guards, token auth, or DOMPurify sanitising while doing UI work (`DESIGN_SYSTEM.md` §15).
5. **Verify.** Run `npx tsc --noEmit`, `npm run lint` and `npm run build`; after colour changes, `node scripts/check-contrast.mjs`. Check 375px, 768px and 1280px+ widths, keyboard-only use, and `prefers-reduced-motion`.
