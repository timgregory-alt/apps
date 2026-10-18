-- Tennessee Wine Trails — migration 0057: let admins delete/archive app
-- feedback.
--
-- app_ratings only had user-scoped select/insert/update policies — no
-- delete, and no admin-write access at all — so the admin dashboard's "App
-- Feedback" list had no way to remove spam/stale entries or hide one without
-- deleting it. Adds an `archived` flag (soft-hide, keeps the row) and an
-- admin-wide policy covering every operation, matching the pattern already
-- used for other admin-managed tables (e.g. "Admins manage events").

alter table public.app_ratings add column if not exists archived boolean not null default false;

create policy "Admins manage app ratings" on public.app_ratings
  for all using (public.is_admin()) with check (public.is_admin());
