-- Tennessee Wine Trails — migration 0076: dual admin/winery-staff access for
-- a short allowlist of trusted owner emails.
--
-- Migration 0070 made is_admin() require winery_id is null, so a winery-
-- staff account could never also pass as platform admin — the actual
-- worry was a winery owner's account accidentally getting is_admin set.
-- The app's own owner legitimately wants to use the same couple of email
-- addresses for both the winery portal and the admin dashboard, so this
-- carves out an explicit exception for exactly those emails. Every other
-- profile still needs winery_id is null to pass is_admin() — this only
-- widens access for the two listed addresses, nothing else.
--
-- Keep this allowlist in sync with ADMIN_WINERY_EXCEPTION_EMAILS in
-- src/lib/admin.ts.
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(
    (
      select is_admin and (
        winery_id is null
        or lower(email) in ('tim.gregory@hotmail.com', 'tim@woodfeatherfarm.com')
      )
      from public.profiles
      where id = auth.uid()
    ),
    false
  );
$$;
