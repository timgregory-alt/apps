-- Tennessee Wine Trails — migration 0061: winery feedback.
--
-- Lets winery staff send feedback about the platform itself straight to
-- the trail admin — separate from app_ratings, which is guest feedback
-- about the app. Shows up as its own "Winery Feedback" section on the
-- admin dashboard, with the same admin archive/delete controls already
-- used for app feedback.

create table if not exists public.winery_feedback (
  id uuid primary key default gen_random_uuid(),
  winery_id uuid not null references public.wineries (id) on delete cascade,
  submitted_by uuid references auth.users (id) on delete set null,
  feedback text not null,
  archived boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists winery_feedback_winery_idx on public.winery_feedback (winery_id);
create index if not exists winery_feedback_created_idx on public.winery_feedback (created_at desc);

alter table public.winery_feedback enable row level security;

create policy "Winery staff submit their own winery's feedback" on public.winery_feedback
  for insert with check (public.is_winery_staff_for(winery_id));

create policy "Winery staff view their own winery's feedback" on public.winery_feedback
  for select using (public.is_winery_staff_for(winery_id) or public.is_admin());

create policy "Admins manage winery feedback" on public.winery_feedback
  for all using (public.is_admin()) with check (public.is_admin());
