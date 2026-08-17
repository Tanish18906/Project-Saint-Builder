# Tailwind CSS v4 & Design System Reference

## 1. Tailwind v4 Fundamentals

Tailwind CSS v4 uses pure CSS configuration with the `@theme` directive, eliminating the need for `tailwind.config.js`.

```css
/* app/globals.css */
@import "tailwindcss";

@theme {
  --font-sans: 'Inter', system-ui, -apple-system, sans-serif;
  --color-brand-50: #f0fdf4;
  --color-brand-500: #22c55e;
  --color-brand-600: #16a34a;
  --color-brand-700: #15803d;
  
  --color-urgent-50: #fef2f2;
  --color-urgent-500: #ef4444;
  --color-urgent-600: #dc2626;
  
  --color-priority-50: #fffbeb;
  --color-priority-500: #f59e0b;
  --color-priority-600: #d97706;
}
```

---

## 2. Visual Hierarchy & Spacing Guidelines

- **Container Max-Widths**: Standardize layout wrappers with `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`.
- **Rhythm & Padding**: Use a 4-unit base scale: `p-4` (16px), `p-6` (24px), `gap-4` (16px), `gap-6` (24px).
- **Subtle Borders & Elevation**: Use `border border-slate-200 shadow-sm rounded-xl bg-white` for cards rather than heavy drop shadows.
- **Badge Indicators**:
  - Urgent: `bg-red-50 text-red-700 border-red-200 ring-1 ring-red-500/10`
  - Priority: `bg-amber-50 text-amber-700 border-amber-200 ring-1 ring-amber-500/10`
  - Normal/Read Later: `bg-slate-50 text-slate-600 border-slate-200`
  - Sent/Completed: `bg-emerald-50 text-emerald-700 border-emerald-200`

---

## 3. Micro-Interactions & Transitions

All interactive components should have responsive hover, focus-visible, and active states:

```tsx
// Example button with micro-interactions
<button
  className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 active:scale-[0.98] transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
>
  Approve Draft
</button>
```

---

## 4. Banned Anti-Patterns

❌ **Do NOT use**:
- Purple/violet text on dark mode backgrounds.
- High-contrast glowing neon borders around card containers.
- Untracked huge headings (`tracking-tight` should always accompany `text-2xl`+).
- Unstructured bento boxes loaded with random generic icons.
- Nesting more than 2 levels of card containers.
