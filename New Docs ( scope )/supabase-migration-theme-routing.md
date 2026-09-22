# Supabase Migration — Theme-Based Routing (v2 of classification schema)

**For: coding agent (via Supabase MCP)**
**Context:** This replaces the original `category`/`routed_role` classification model with the client's actual operational taxonomy (9 themes, keyword-driven, multi-recipient routing). This is a deliberate rollback of `progressor`/`accountant` as active routing targets — see note at bottom. Do not restore old behavior without explicit instruction.

Apply this to the existing `allsaints-email-agent` project. Do not touch `accounts`, `users`, `drafts`, `audit_log` structurally — only `emails` changes.

---

## 1. Migrate `emails` table

### 1a. Add new columns

```sql
alter table emails add column theme text;
alter table emails add column urgency text;
alter table emails add column routed_roles text[];
```

### 1b. Constraints

```sql
alter table emails add constraint emails_theme_check
  check (theme in (
    'accounts',
    'orders',
    'finance',
    'suppliers',
    'promotions',
    'nph_jobs',
    'meetings_appointments',
    'invoices',
    'certificates'
  ));

alter table emails add constraint emails_urgency_check
  check (urgency in ('urgent', 'priority', 'normal'));

-- routed_roles: array of role strings, validated at application/prompt level,
-- not enforced by a check constraint (Postgres array-element CHECK constraints
-- are awkward — validate in n8n before insert instead). Valid values remain
-- 'director', 'senior_admin', 'progressor', 'accountant' at the type level,
-- but only 'director' and 'senior_admin' are actively assigned by the
-- classify prompt as of this migration.
```

### 1c. Deprecate old columns — do not drop yet

```sql
-- Keep `category` and `routed_role` columns in place, unused going forward.
-- Do not drop them: historical rows still reference them, and dropping now
-- is a one-way door on a client relationship that has already required
-- multiple rollbacks. Revisit dropping them once v2 is stable in production
-- and historical data has been reviewed/exported if needed.
comment on column emails.category is 'DEPRECATED as of theme-routing migration. Superseded by emails.theme. Left in place for historical rows only — do not write to this column going forward.';
comment on column emails.routed_role is 'DEPRECATED as of theme-routing migration. Superseded by emails.routed_roles (array). Left in place for historical rows only — do not write to this column going forward.';
```

### 1d. Indexes

```sql
create index idx_emails_theme on emails(theme);
create index idx_emails_urgency on emails(urgency);
-- GIN index for array containment queries (dashboard filtering by role, e.g. WHERE 'director' = ANY(routed_roles))
create index idx_emails_routed_roles on emails using gin(routed_roles);
```

---

## 2. Theme → routed_roles reference table (for classify prompt + dashboard, not a DB table)

This is the authoritative mapping, taken verbatim from the client's routing doc. Do not deviate from this without explicit client instruction.

| theme | routed_roles |
|---|---|
| `accounts` | `['director']` |
| `orders` | `['senior_admin']` |
| `finance` | `['director']` |
| `suppliers` | `['director', 'senior_admin']` |
| `promotions` | `['senior_admin']` |
| `nph_jobs` | `['senior_admin']` |
| `meetings_appointments` | `['senior_admin', 'director']` |
| `invoices` | `['director']` |
| `certificates` | `['senior_admin', 'director']` |

**Note on `nph_jobs`:** this previously routed to `progressor` under the old schema. The client's routing doc explicitly lists NPH Jobs → admin, with no mention of Progressor. Per explicit client instruction, this is now routed to `senior_admin` only. The `team@` inbox / Progressor-specific workflow (voice review, WhatsApp routing tests for "urgent progressor," etc.) built during earlier development is not deleted, but is currently unused — nothing routes to it under this schema. If the client wants Progressor-specific routing restored, that is a v2/retainer scope item, not a bug.

---

## 3. RLS

No RLS policy changes needed — existing "allow all, tighten later" policies on `emails` already permit read/write on all columns including the new ones. No action required here.

---

## 4. What NOT to do in this migration

- Do not drop `category` or `routed_role` columns
- Do not delete or alter `progressor`/`accountant` as valid values anywhere they're still referenced (e.g. `users.role` check constraint) — they remain valid role types, just unused by current routing logic
- Do not touch `accounts`, `users`, `drafts`, `audit_log` table structures
- Do not build multi-recipient WhatsApp/dashboard logic in this migration — that's downstream application work, tracked separately (see Section 5)

---

## 5. Downstream work this migration requires (not built here — flagging for sequencing)

These are NOT part of this Supabase migration but will break or silently misbehave if left unaddressed. List them in the progress tracker as follow-up items:

1. **n8n Workflow 1 (classify)** — must write `theme`, `urgency`, `routed_roles` instead of `category`, `routed_role`. Covered by the separate prompt refinement doc, not this migration.
2. **n8n Workflow 3 (WhatsApp)** — currently filters `category IN ('urgent','priority')` and looks up a single recipient by `routed_role`. Needs updating to: filter on `urgency IN ('urgent','priority')`, and loop over `routed_roles` array to potentially notify multiple recipients (relevant for `suppliers`, `meetings_appointments`, `certificates` which have 2 roles).
3. **Dashboard inbox filters** — currently filter by `category`/`account_id`. Needs a `theme` filter dropdown (9 values) and an `urgency` filter, and role-based filtering needs to use `routed_roles @> ARRAY['director']`-style array containment instead of `routed_role = 'director'`.
4. **Dashboard category badges** — the UI design spec's category badge colors were built around the old 7-value category system. Need new badge treatment for the 9 themes, ideally as part of the UI/UX redesign already in progress rather than as a bolt-on.

## 6. Output expected from coding agent

- Confirm columns added, constraints applied, indexes created
- Confirm `category`/`routed_role` columns left untouched with comments applied
- Report: any existing rows in `emails` and whether they now have null `theme`/`urgency`/`routed_roles` (expected — this is a schema-forward migration, no backfill of historical rows required unless requested)
