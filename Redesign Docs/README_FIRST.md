# FOREMAN — Product Transformation Handoff
## Read this first

This package is the product, design, and engineering brief for transforming the existing Foreman MVP into a premium internal operations platform for Allsaints Builders.

### Documents
1. `01_PRODUCT_VISION_AND_PRD.md` — product positioning, employee personas, information architecture, workflows, scope, and acceptance criteria.
2. `02_DESIGN_SYSTEM_AND_UI_SPEC.md` — visual direction, design tokens, interaction patterns, component rules, responsive behavior, accessibility, and screen specifications.
3. `03_TECHNICAL_IMPLEMENTATION_PLAN.md` — repository audit, architecture constraints, data and security requirements, migration strategy, testing, and delivery phases.
4. `04_CODING_AGENT_MASTER_PROMPT.md` — copy/paste instruction for the coding agent to inspect, plan, implement, and verify the work.
5. `05_RESEARCH_AND_REFERENCE_LIBRARY.md` — source links and what to learn from each reference, plus explicit anti-patterns.

### How to use
- Put these files in the repository under `/docs/product-transformation/` (or provide the folder to your coding agent).
- Start the coding agent with `04_CODING_AGENT_MASTER_PROMPT.md`.
- Require the agent to complete Phase 0 (repo audit and implementation plan) before it edits the application.
- Review the audit and plan. Then let it proceed in small, verifiable slices.
- Do not allow the agent to claim a feature is implemented unless it is connected to real data and working actions, or explicitly marked as a non-functional prototype.

### Source-of-truth hierarchy
1. Actual repository code, migrations, tests, environment variable names, and runtime behavior.
2. Existing Project Context specification and screenshots.
3. This handoff's product/design recommendations.
4. External design references, used for principles and patterns—not copied as a branded clone.

If documentation and code disagree, the coding agent must report the discrepancy and preserve working production behavior until the owner approves a change.

### Important security note
The supplied Project Context contains development credentials and secret-like values. Treat any credential or secret that was shared in plaintext as compromised. Do not copy secrets into these documents, source code, commits, screenshots, prompts, or logs. Rotate exposed credentials/secrets, review repository history, and move real values to managed environment variables. The coding agent must not print `.env` values or secret contents in its audit.
