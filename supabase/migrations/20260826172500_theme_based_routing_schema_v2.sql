-- Supabase Migration: Theme-Based Routing (v2 of classification schema)
-- Target: emails table
-- Context: Replaces category/routed_role classification with 9 operational themes, urgency levels, and multi-recipient routed_roles array.

-- 1a. Add new columns
ALTER TABLE public.emails ADD COLUMN IF NOT EXISTS theme TEXT;
ALTER TABLE public.emails ADD COLUMN IF NOT EXISTS urgency TEXT;
ALTER TABLE public.emails ADD COLUMN IF NOT EXISTS routed_roles TEXT[];

-- 1b. Add Constraints
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'emails_theme_check'
  ) THEN
    ALTER TABLE public.emails ADD CONSTRAINT emails_theme_check
      CHECK (theme IN (
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
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'emails_urgency_check'
  ) THEN
    ALTER TABLE public.emails ADD CONSTRAINT emails_urgency_check
      CHECK (urgency IN ('urgent', 'priority', 'normal'));
  END IF;
END $$;

-- 1c. Deprecate old columns (do not drop them — historical rows reference them)
COMMENT ON COLUMN public.emails.category IS 'DEPRECATED as of theme-routing migration. Superseded by emails.theme. Left in place for historical rows only — do not write to this column going forward.';
COMMENT ON COLUMN public.emails.routed_role IS 'DEPRECATED as of theme-routing migration. Superseded by emails.routed_roles (array). Left in place for historical rows only — do not write to this column going forward.';

-- 1d. Create Indexes
CREATE INDEX IF NOT EXISTS idx_emails_theme ON public.emails(theme);
CREATE INDEX IF NOT EXISTS idx_emails_urgency ON public.emails(urgency);
CREATE INDEX IF NOT EXISTS idx_emails_routed_roles ON public.emails USING gin(routed_roles);
