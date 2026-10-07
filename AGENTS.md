<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
 
# Project Saint Builder — Agent Onboarding Context
 
Before starting any coding task on this project, please consult the complete architectural guide and developer manual in [`PROJECT_CONTEXT.md`](file:///home/tanish-mishra/Project_SaintBuilder/PROJECT_CONTEXT.md).
It contains:
- Complete system architecture and decoupling between n8n, Supabase, and Next.js 16
- Database schema and critical deprecation rules (theme-based routing v2)
- Dual authentication zones (dashboard session auth vs signed voice token auth)
- The canonical server actions write path (`src/app/emails/[id]/actions.ts`)
- The voice portal safety rules and conversational voice agent pipeline
- Key performance requirements and design system tokens
