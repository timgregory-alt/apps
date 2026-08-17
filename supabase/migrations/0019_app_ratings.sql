-- Tennessee Wine Passport — migration 0019: in-app rating + optional feedback.
--
-- A simple 1-5 star rating of the app itself (not a wine), with optional
-- free-text feedback. One rating per user — re-rating updates it in place.
-- Surfaced on the Profile page; aggregated on the admin dashboard.

create table if not exists public.app_ratings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  feedback text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

create index if not exists app_ratings_user_idx on public.app_ratings (user_id);

alter table public.app_ratings enable row level security;

create policy "Users view their own app rating" on public.app_ratings
  for select using (auth.uid() = user_id or public.is_admin());

create policy "Users submit their own app rating" on public.app_ratings
  for insert with check (auth.uid() = user_id);

create policy "Users update their own app rating" on public.app_ratings
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
