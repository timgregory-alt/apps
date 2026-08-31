-- Tennessee Wine Trails — migration 0039: real photo uploads for wineries.
--
-- Replaces hand-pasted image URLs (which turned out to sometimes be
-- Facebook CDN hotlinks — unreliable across devices/sessions, or HEIC
-- files unsupported outside Safari) with actual file uploads stored in a
-- Supabase Storage bucket the app controls directly.

insert into storage.buckets (id, name, public)
values ('winery-photos', 'winery-photos', true)
on conflict (id) do nothing;

drop policy if exists "Public read winery photos" on storage.objects;
create policy "Public read winery photos" on storage.objects
  for select using (bucket_id = 'winery-photos');

drop policy if exists "Admins manage winery photos" on storage.objects;
create policy "Admins manage winery photos" on storage.objects
  for all using (bucket_id = 'winery-photos' and public.is_admin())
  with check (bucket_id = 'winery-photos' and public.is_admin());
