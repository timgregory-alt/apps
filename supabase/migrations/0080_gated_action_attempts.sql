-- Tennessee Wine Trails — migration 0080: track signed-out attempts at a
-- gated action (check in, rate a wine, save tasting notes, add a custom
-- wine). Now that the homepage and winery pages are browsable without an
-- account, raw page-view counts can't tell apart "browsed and left" from
-- "actually tried to do something and hit the login wall" — this does.
-- Always anonymous by definition (it only fires when the visitor is signed
-- out), so there's no user_id column.

create table if not exists public.gated_action_attempts (
  id uuid primary key default gen_random_uuid(),
  action text not null,
  winery_id uuid references public.wineries (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists gated_action_attempts_created_idx on public.gated_action_attempts (created_at);

alter table public.gated_action_attempts enable row level security;

drop policy if exists "Anyone can log a gated action attempt" on public.gated_action_attempts;
create policy "Anyone can log a gated action attempt" on public.gated_action_attempts
  for insert with check (true);

drop policy if exists "Only admins read gated action attempts" on public.gated_action_attempts;
create policy "Only admins read gated action attempts" on public.gated_action_attempts
  for select using (public.is_admin());
