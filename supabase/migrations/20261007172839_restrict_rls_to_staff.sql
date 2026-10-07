-- SECURITY FIX: replace the "allow all for now" policies (granted to PUBLIC, i.e. the anon key that
-- ships in every browser) with least-privilege access for signed-in STAFF only.
--
-- Why "staff" and not just "authenticated": Supabase email sign-up is enabled on this project, so any
-- member of the public can create an auth account. A staff member is an auth user whose id has a row in
-- public.users (ids are shared between auth.users and public.users).
--
-- Who keeps access:
--   * Staff (dashboard, session auth): read all five tables; insert/update drafts; insert audit_log.
--     No deletes anywhere; audit_log is append-only.
--   * service_role (n8n workflows, voice portal server code after HMAC token check): bypasses RLS.
--   * Triggers (pg_net webhooks) are SECURITY DEFINER and unaffected.
-- Who loses access: anon (all privileges revoked), and authenticated non-staff accounts.

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.users where id = (select auth.uid()));
$$;

revoke execute on function public.is_staff() from public, anon;
grant execute on function public.is_staff() to authenticated;

do $$
declare
  t text;
begin
  foreach t in array array['accounts', 'users', 'emails', 'drafts', 'audit_log'] loop
    execute format('drop policy if exists "allow all for now - TIGHTEN LATER with real auth" on public.%I', t);
    execute format('drop policy if exists "staff read" on public.%I', t);
    -- TRUNCATE/REFERENCES/TRIGGER are not governed by RLS, so strip table grants down to what is used.
    execute format('revoke all on table public.%I from anon, authenticated', t);
    execute format('grant select on table public.%I to authenticated', t);
    execute format(
      'create policy "staff read" on public.%I for select to authenticated using ((select public.is_staff()))', t
    );
  end loop;
end $$;

-- Drafts: dashboard save / approve / discard (src/app/emails/[id]/actions.ts). Staff may only stamp
-- themselves as approver.
grant insert, update on table public.drafts to authenticated;

drop policy if exists "staff insert drafts" on public.drafts;
create policy "staff insert drafts" on public.drafts
  for insert to authenticated
  with check ((select public.is_staff()) and (approved_by is null or approved_by = (select auth.uid())));

drop policy if exists "staff update drafts" on public.drafts;
create policy "staff update drafts" on public.drafts
  for update to authenticated
  using ((select public.is_staff()))
  with check ((select public.is_staff()) and (approved_by is null or approved_by = (select auth.uid())));

-- Audit log: append-only; staff can only write entries attributed to themselves (or unattributed).
grant insert on table public.audit_log to authenticated;

drop policy if exists "staff insert own audit entries" on public.audit_log;
create policy "staff insert own audit entries" on public.audit_log
  for insert to authenticated
  with check ((select public.is_staff()) and (user_id is null or user_id = (select auth.uid())));
