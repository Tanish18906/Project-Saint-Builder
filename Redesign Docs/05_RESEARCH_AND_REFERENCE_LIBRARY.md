# 05 — Research & Reference Library
## Design and product patterns to study

These are public reference sources reviewed for this handoff. Use them to understand principles and product patterns. Do not copy proprietary visual identity, assets, copy, or exact layouts.

## 1. Apple Human Interface Guidelines

- Human Interface Guidelines: https://developer.apple.com/design/human-interface-guidelines
- Foundations: https://developer.apple.com/design/human-interface-guidelines/foundations
- Apple HIG overview emphasizes hierarchy, harmony, and consistency, plus foundations such as accessibility, color, layout, materials, and typography.

**Apply to Foreman**
- Establish clear hierarchy between navigation, controls, and work content.
- Use consistent conventions across screen sizes.
- Keep materials and translucency functional and restrained; web enterprise UI does not need to imitate Apple's platform-specific effects.
- Treat typography, spacing, and interaction states as product quality—not decoration.

## 2. Linear — speed and focus

- Linear Learn, Intro to Linear: https://linear.app/learn/intro-to-linear

The public learning material describes an organization/workspace model and emphasizes fast, intuitive workflows, keyboard shortcuts, and a command menu.

**Apply to Foreman**
- A coherent organization-level workspace.
- Quick navigation and search.
- Keyboard support for frequent actions where the app can implement and test it properly.
- Dense but legible work queues, consistent action placement, and reduced context switching.

**Do not copy**
- Linear's exact dark/light palette, brand, icons, proprietary visual details, or product-specific terminology.

## 3. Front — shared inbox and employee ownership

- Front 101: https://help.front.com/en/articles/2157
- Shared inbox management: https://front.com/guides/shared-inbox-management
- Front product/pricing features: https://front.com/pricing
- Front workspaces: https://help.front.com/en/articles/2270
- Front analytics live dashboard: https://help.front.com/en/articles/1146752

Public Front documentation describes shared inboxes, assignments, inbox views, internal collaboration, snoozing, templates, and live workload/queue monitoring.

**Apply to Foreman**
- Shared communication should be treated as team work, not just a personal mailbox.
- Clear assignment and ownership are essential—but Foreman must not display personal assignment until a real assignment model exists.
- Views should answer a workflow question (urgent, pending review, routed to role, etc.).
- Analytics should help managers identify queue risk and workload, and should only be shown when backed by trustworthy data.

## 4. Atlassian Design System — consistency and accessibility

- Foundations: https://atlassian.design/foundations
- Accessibility: https://atlassian.design/foundations/accessibility
- Navigation design article: https://www.atlassian.com/blog/how-we-build/designing-atlassians-new-navigation
- Accessibility approach: https://www.atlassian.com/accessibility

Atlassian's public design resources emphasize shared design tokens, consistent patterns, semantic HTML, keyboard support, plain language, contrast, and accessible design built into components.

**Apply to Foreman**
- Define tokens as a single source of truth.
- Reuse the same interaction pattern for the same task across pages.
- Use semantic controls, keyboard support, and visible focus.
- Do not rely on color alone.
- Treat responsive reflow and reduced motion as requirements, not polish.

## 5. Reference-to-requirement translation

| Reference | Pattern to learn | Foreman implementation |
|---|---|---|
| Apple HIG | Hierarchy, consistency, typography, purposeful materials | Calm visual language, consistent controls, restrained surfaces |
| Linear | Fast navigation, command/search, workflow focus | Quick search, coherent sidebar, keyboard actions where tested |
| Front | Shared inbox, assignment, views, workload visibility | Role/routed queues now; named assignment only after backend support |
| Atlassian | Tokens, reusable components, accessibility | Central design system and accessibility acceptance checks |

## 6. Current screenshot observations

### Inbox screenshot
Observed issues:
- Header and navigation are visually sparse and lack a clear app-shell structure.
- The filter region has many controls competing for horizontal space.
- Each email is a large standalone card, producing a long scrolling stack.
- Repeated metadata pills (theme, urgency, role, status, account) all compete with sender and subject.
- Sender, subject, preview, and action priority need stronger typographic hierarchy.
- Urgent items use red border/pills, but the page does not create a coherent “work queue” hierarchy or concise attention-first view.
- Example data appears duplicated in adjacent rows; the agent must verify whether this is actual duplicated data, distinct messages, or screenshot/test data before changing deduplication behavior.

### Audit screenshot
Observed issues:
- Raw JSON is shown in the primary Details/metadata column, making the audit log feel like a developer console.
- Event names include low-level/technical forms such as `whatsapp_notified`; user-facing copy should translate them while retaining the underlying immutable event.
- Table rows contain too many competing columns and truncation.
- The default view should prioritize readable action, time, actor, related email, and summary, with technical details collapsed.
- Event history must remain complete and immutable.

## 7. Research limitations
- Public documentation and product pages are references, not a substitute for observing Allsaints employees doing their actual work.
- The handoff has not conducted employee interviews, workflow shadowing, formal usability testing, or brand-asset review.
- The design tokens are proposed starting points. Confirm company brand colors and typography before finalizing.
- Confirm legal/compliance SLA rules with the business; do not invent statutory timers or response deadlines.
