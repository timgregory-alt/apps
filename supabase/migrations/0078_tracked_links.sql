-- Tennessee Wine Trails — migration 0078: trackable redirect links.
--
-- Printed QR codes can't be changed once they're printed (the destination
-- is baked into the pixel pattern itself), so any QR code or link that
-- might need its destination changed later, or whose clicks need counting,
-- should point at a short redirect of our own (/t/<slug>) instead of the
-- final URL directly. The redirect logs the click, then forwards to
-- whatever destination_url currently says — which can be changed anytime
-- without reprinting anything.

create table if not exists public.tracked_links (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  label text not null,
  destination_url text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.link_clicks (
  id uuid primary key default gen_random_uuid(),
  link_id uuid not null references public.tracked_links (id) on delete cascade,
  user_id uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists link_clicks_link_idx on public.link_clicks (link_id, created_at);

alter table public.tracked_links enable row level security;
alter table public.link_clicks enable row level security;

drop policy if exists "Tracked links are admin-managed" on public.tracked_links;
create policy "Tracked links are admin-managed" on public.tracked_links
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Anyone can resolve a tracked link by slug" on public.tracked_links;
create policy "Anyone can resolve a tracked link by slug" on public.tracked_links
  for select using (true);

drop policy if exists "Anyone can log a link click" on public.link_clicks;
create policy "Anyone can log a link click" on public.link_clicks
  for insert with check (user_id is null or auth.uid() = user_id);

drop policy if exists "Only admins read link clicks" on public.link_clicks;
create policy "Only admins read link clicks" on public.link_clicks
  for select using (public.is_admin());
