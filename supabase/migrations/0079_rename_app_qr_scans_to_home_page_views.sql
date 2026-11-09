-- Tennessee Wine Trails — migration 0079: track every homepage visit, not
-- just ones arriving via a tagged QR code or link.
--
-- app_qr_scans (migration 0077) only logged a row when the homepage loaded
-- with ?src=qr. Renaming it to home_page_views since it's now logged for
-- every visit (source stays nullable — null for direct/organic traffic,
-- 'qr' or a /t/<slug> link's own tag otherwise), matching the existing
-- winery_page_views pattern.

alter table public.app_qr_scans rename to home_page_views;
alter index if exists app_qr_scans_created_idx rename to home_page_views_created_idx;

drop policy if exists "Anyone can log an app qr scan" on public.home_page_views;
create policy "Anyone can log a home page view" on public.home_page_views
  for insert with check (user_id is null or auth.uid() = user_id);

drop policy if exists "Only admins read app qr scans" on public.home_page_views;
create policy "Only admins read home page views" on public.home_page_views
  for select using (public.is_admin());
