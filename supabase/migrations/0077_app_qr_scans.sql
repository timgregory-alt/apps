-- Tennessee Wine Trails — migration 0077: track scans of the general app QR
-- code (the one on business cards, banners, and other printed collateral
-- that isn't tied to a specific winery).
--
-- The homepage had no tracking at all, so a scan of a printed card/banner
-- was indistinguishable from someone just typing the URL in — there was no
-- way to tell whether a marketing piece actually drove anyone to the app.
-- Mirrors the existing winery_page_views pattern (anonymous-friendly ping,
-- admin-only read).

create table if not exists public.app_qr_scans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  source text,
  created_at timestamptz not null default now()
);

create index if not exists app_qr_scans_created_idx on public.app_qr_scans (created_at);

alter table public.app_qr_scans enable row level security;

create policy "Anyone can log an app qr scan" on public.app_qr_scans
  for insert with check (user_id is null or auth.uid() = user_id);

create policy "Only admins read app qr scans" on public.app_qr_scans
  for select using (public.is_admin());
