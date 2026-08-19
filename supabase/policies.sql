-- Tennessee Wine Trails — Row Level Security
-- Run after schema.sql.

-- ---------------------------------------------------------------------------
-- Helper: is the current session an admin? SECURITY DEFINER avoids infinite
-- recursion when policies on `profiles` itself need to check admin status.
-- ---------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(
    (select is_admin from public.profiles where id = auth.uid()),
    false
  );
$$;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;

create policy "Profiles are viewable by their owner" on public.profiles
  for select using (auth.uid() = id or public.is_admin());

create policy "Users can update their own profile" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

create policy "Users can insert their own profile" on public.profiles
  for insert with check (auth.uid() = id);

-- ---------------------------------------------------------------------------
-- trails — publicly readable when active; admin-managed
-- ---------------------------------------------------------------------------
alter table public.trails enable row level security;

create policy "Active trails are public" on public.trails
  for select using (active or public.is_admin());

create policy "Admins manage trails" on public.trails
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- wineries — publicly readable when active; admin-managed
-- ---------------------------------------------------------------------------
alter table public.wineries enable row level security;

create policy "Active wineries are public" on public.wineries
  for select using (active or public.is_admin());

create policy "Admins manage wineries" on public.wineries
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- winery_hours — publicly readable; admin-managed
-- ---------------------------------------------------------------------------
alter table public.winery_hours enable row level security;

create policy "Winery hours are public" on public.winery_hours
  for select using (true);

create policy "Admins manage winery hours" on public.winery_hours
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- trail_wineries — publicly readable; admin-managed
-- ---------------------------------------------------------------------------
alter table public.trail_wineries enable row level security;

create policy "Trail stops are public" on public.trail_wineries
  for select using (true);

create policy "Admins manage trail stops" on public.trail_wineries
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- wines — publicly readable when active; admin-managed
-- ---------------------------------------------------------------------------
alter table public.wines enable row level security;

create policy "Active wines are public" on public.wines
  for select using (active or public.is_admin());

create policy "Admins manage wines" on public.wines
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- wine_tastings — users see and create only their own ratings
-- ---------------------------------------------------------------------------
alter table public.wine_tastings enable row level security;

create policy "Users view their own wine tastings" on public.wine_tastings
  for select using (auth.uid() = user_id or public.is_admin());

create policy "Users record their own wine tastings" on public.wine_tastings
  for insert with check (auth.uid() = user_id);

create policy "Users update their own wine tastings" on public.wine_tastings
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- custom_wine_tastings — fully private to the user who logged them
-- ---------------------------------------------------------------------------
alter table public.custom_wine_tastings enable row level security;

create policy "Users view their own custom wine tastings" on public.custom_wine_tastings
  for select using (auth.uid() = user_id or public.is_admin());

create policy "Users create their own custom wine tastings" on public.custom_wine_tastings
  for insert with check (auth.uid() = user_id);

create policy "Users delete their own custom wine tastings" on public.custom_wine_tastings
  for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- checkins — users see and create only their own; immutable once written
-- ---------------------------------------------------------------------------
alter table public.checkins enable row level security;

create policy "Users view their own checkins" on public.checkins
  for select using (auth.uid() = user_id or public.is_admin());

create policy "Users create their own checkins" on public.checkins
  for insert with check (auth.uid() = user_id);

-- No update/delete policy is defined for regular users — check-ins are
-- append-only from the client. Admins can still manage rows via the
-- service-role key from the admin dashboard's server actions.

-- ---------------------------------------------------------------------------
-- share_events
-- ---------------------------------------------------------------------------
alter table public.share_events enable row level security;

create policy "Users view their own share events" on public.share_events
  for select using (auth.uid() = user_id or public.is_admin());

create policy "Users log their own share events" on public.share_events
  for insert with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- wine_club_clicks
-- ---------------------------------------------------------------------------
alter table public.wine_club_clicks enable row level security;

create policy "Users view their own wine club clicks" on public.wine_club_clicks
  for select using (auth.uid() = user_id or public.is_admin());

create policy "Users log their own wine club clicks" on public.wine_club_clicks
  for insert with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- winery_page_views — anonymous-friendly analytics ping
-- ---------------------------------------------------------------------------
alter table public.winery_page_views enable row level security;

create policy "Anyone can log a page view" on public.winery_page_views
  for insert with check (user_id is null or auth.uid() = user_id);

create policy "Only admins read page views" on public.winery_page_views
  for select using (public.is_admin());

-- ---------------------------------------------------------------------------
-- rewards — publicly readable when active; admin-managed
-- ---------------------------------------------------------------------------
alter table public.rewards enable row level security;

create policy "Active rewards are public" on public.rewards
  for select using (active or public.is_admin());

create policy "Admins manage rewards" on public.rewards
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- trail_completions
-- ---------------------------------------------------------------------------
alter table public.trail_completions enable row level security;

create policy "Users view their own completions" on public.trail_completions
  for select using (auth.uid() = user_id or public.is_admin());

create policy "Users record their own completions" on public.trail_completions
  for insert with check (auth.uid() = user_id);
