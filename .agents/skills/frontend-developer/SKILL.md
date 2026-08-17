---
name: frontend-developer
description: >-
  Expert guidance for modern frontend web application development using Next.js 16 App Router,
  React 19, Tailwind CSS v4, TypeScript, Supabase Realtime UI, accessible component design,
  and state management. Use whenever designing, building, refactoring, or optimizing frontend
  interfaces, components, and pages.
---

# Frontend Developer Skill

A comprehensive operational playbook for building fast, beautiful, responsive, and accessible web interfaces with Next.js 16 (App Router), React 19, Tailwind CSS v4, and Supabase Realtime.

---

## 🎯 Core Principles

1. **Server-First by Default**: Default to React Server Components (RSC) for data fetching, static rendering, and SEO. Use Client Components (`'use client'`) only when interactive state (`useState`, `useEffect`), event handlers (`onClick`, `onChange`), browser APIs, or Realtime WebSockets are strictly necessary.
2. **Function-Driven Premium Aesthetics**: Avoid generic boilerplate or cluttered layouts. Prioritize clear visual hierarchy, fluid typography, harmonious color palettes, subtle micro-interactions, responsive padding/margins, and graceful loading/empty states.
3. **Optimistic & Realtime Sync**: Leverage Supabase Realtime channels with optimistic UI updates to ensure the interface reflects actions with 0ms perceived latency while synchronizing seamlessly with the database.
4. **Resilience & Accessibility**: Implement semantic HTML5 elements, keyboard navigation, accessible ARIA attributes, error boundaries, and loading skeletons.

---

## 📚 Specialized References

Detailed manuals and pattern libraries for specific sub-systems:
- 📖 [Next.js 16 App Router & RSC Guide](./references/nextjs16-app-router.md) — Server vs Client component boundaries, Server Actions, Route Protection, Middleware.
- 🎨 [Tailwind CSS v4 & Modern Design Systems](./references/tailwind-v4-design-system.md) — Tailwind v4 `@theme`, color tokens, typography, micro-animations, responsive layout rules.
- ⚡ [Supabase Realtime & Optimistic UI Patterns](./references/supabase-realtime-ui.md) — WebSocket channel management, subscription cleanup, optimistic state reconcilers.

---

## 🛠️ Step-by-Step Frontend Workflow

### 1. Requirements & State Architecture
- Identify data dependencies: What can be fetched on the server vs. what needs client-side subscriptions?
- Determine component hierarchy: Separate pure presentational components from stateful container components.
- Plan interactive states: Default, hover, active, focused, disabled, loading skeleton, error boundary, and empty state.

### 2. Component Design & Composition
- Keep components focused and single-purpose.
- Place reusable UI building blocks in `src/components/ui/` (e.g. `button.tsx`, `badge.tsx`, `modal.tsx`, `skeleton.tsx`).
- Place feature-specific domain components in `src/components/<feature>/` (e.g., `src/components/inbox/`, `src/components/drafts/`).
- Use standard Lucide React icons with consistent sizing (`size-4`, `size-5`).

### 3. Styling & Layout with Tailwind CSS v4
- Use semantic class names and consistent spacing scales (`p-4`, `gap-3`, `space-y-4`).
- Ensure full responsiveness across all breakpoints (`sm:`, `md:`, `lg:`, `xl:`).
- Add smooth transitions on interactive elements (`transition-colors duration-150`, `transition-all ease-in-out`).
- Avoid banned design tropes: No colored glowing border accents on dark backgrounds, no over-nested cards, no untracked large headings.

### 4. Realtime & Optimistic Updates
- Create custom React hooks for Supabase Realtime subscriptions (e.g., `useRealtimeEmails`, `useRealtimeDrafts`).
- Always clean up channel subscriptions in `useEffect` return functions (`supabase.removeChannel(channel)`).
- Implement optimistic feedback on user actions (e.g. approving a draft updates UI instantly before database acknowledgment).

### 5. Verification & Testing
- Validate TypeScript types and run `npm run build` or `eslint` to catch syntax/type regressions.
- Test responsive behavior on mobile (375px), tablet (768px), and desktop (1280px+).
- Verify dark/light theme contrast and accessibility.
