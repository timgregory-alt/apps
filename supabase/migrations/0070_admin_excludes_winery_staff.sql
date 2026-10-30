-- Tennessee Wine Trails — migration 0070: is_admin() excludes winery staff.
--
-- is_admin() (defined in policies.sql) previously granted admin access to
-- any profile with is_admin = true, full stop — if a winery-staff account
-- (profiles.winery_id set) ever also had is_admin = true, it would pass
-- every RLS policy and SECURITY DEFINER check gated on is_admin(), not just
-- the app's own admin-layout check. Winery staff should never have access
-- to the platform-wide admin dashboard, so is_admin() now requires
-- winery_id is null too — this only narrows what already passed, never
-- widens it, so it's safe to tighten in place.
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(
    (select is_admin and winery_id is null from public.profiles where id = auth.uid()),
    false
  );
$$;
