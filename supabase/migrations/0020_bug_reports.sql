-- Tennessee Wine Passport — migration 0020: "Report a Bug" from Profile.
--
-- A lightweight bug report: what happened + which page they were on.
-- Visible to admins on the dashboard with an open/resolved toggle for triage.

create table if not exists public.bug_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  description text not null,
  page_url text,
  status text not null default 'open' check (status in ('open', 'resolved')),
  created_at timestamptz not null default now()
);

create index if not exists bug_reports_status_idx on public.bug_reports (status, created_at);

alter table public.bug_reports enable row level security;

create policy "Users view their own bug reports" on public.bug_reports
  for select using (auth.uid() = user_id or public.is_admin());

create policy "Users submit their own bug reports" on public.bug_reports
  for insert with check (auth.uid() = user_id);

create policy "Admins update bug report status" on public.bug_reports
  for update using (public.is_admin()) with check (public.is_admin());
