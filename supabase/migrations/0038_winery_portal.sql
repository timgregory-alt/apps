-- Tennessee Wine Trails — migration 0038: winery portal + VIP events.
--
-- Lets a winery log in and manage its own events (including VIP-only ones),
-- hours, and detail links, scoped strictly to that one winery — and adds a
-- "VIP events" flag subscribers get early access to, shown on a new /vip
-- page. A profile's `winery_id` marks it as a winery-staff account rather
-- than a guest account: staff are created by an admin (via the invite flow
-- in the admin dashboard), not self-signup.

alter table public.profiles
  add column if not exists winery_id uuid references public.wineries (id) on delete set null;

alter table public.winery_events
  add column if not exists vip_only boolean not null default false,
  add column if not exists ticket_url text;

-- ---------------------------------------------------------------------------
-- handle_new_user() — also copy winery_id from invite metadata, same
-- validate-then-null-out pattern already used for referred_by.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  ref_id uuid;
  target_winery_id uuid;
begin
  begin
    ref_id := nullif(new.raw_user_meta_data ->> 'referred_by', '')::uuid;
  exception when others then
    ref_id := null;
  end;
  if ref_id is not null and not exists (select 1 from public.profiles where id = ref_id) then
    ref_id := null;
  end if;

  begin
    target_winery_id := nullif(new.raw_user_meta_data ->> 'winery_id', '')::uuid;
  exception when others then
    target_winery_id := null;
  end;
  if target_winery_id is not null and not exists (select 1 from public.wineries where id = target_winery_id) then
    target_winery_id := null;
  end if;

  insert into public.profiles (
    id, email, name, birth_date, zip_code, trail_start_date, referred_by, agreed_to_terms_at, winery_id
  )
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    nullif(new.raw_user_meta_data ->> 'birth_date', '')::date,
    nullif(new.raw_user_meta_data ->> 'zip_code', ''),
    now(),
    ref_id,
    case when (new.raw_user_meta_data ->> 'terms_accepted') = 'true' then now() else null end,
    target_winery_id
  )
  on conflict (id) do update set winery_id = excluded.winery_id where public.profiles.winery_id is null;
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- is_winery_staff_for() — SECURITY DEFINER so RLS policies can check it
-- without a broad "read other people's profiles" grant.
-- ---------------------------------------------------------------------------
create or replace function public.is_winery_staff_for(target_winery_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(
    (select winery_id = target_winery_id from public.profiles where id = auth.uid()),
    false
  );
$$;

-- Additive alongside the existing "Admins manage ..." policies — a winery's
-- own staff can now also write to their own row(s), nothing else.
drop policy if exists "Winery staff manage their own winery" on public.wineries;
create policy "Winery staff manage their own winery" on public.wineries
  for all using (public.is_winery_staff_for(id)) with check (public.is_winery_staff_for(id));

drop policy if exists "Winery staff manage their own hours" on public.winery_hours;
create policy "Winery staff manage their own hours" on public.winery_hours
  for all using (public.is_winery_staff_for(winery_id)) with check (public.is_winery_staff_for(winery_id));

drop policy if exists "Winery staff manage their own events" on public.winery_events;
create policy "Winery staff manage their own events" on public.winery_events
  for all using (public.is_winery_staff_for(winery_id)) with check (public.is_winery_staff_for(winery_id));

-- ---------------------------------------------------------------------------
-- winery_repeat_guest_stats() — aggregate-only repeat-visit counts for a
-- winery's own staff (or admin). SECURITY DEFINER so it can read checkins
-- across guests without handing wineries a broad per-guest RLS grant — it
-- returns visit-count buckets only, never a guest's name or identity.
-- ---------------------------------------------------------------------------
create or replace function public.winery_repeat_guest_stats(target_winery_id uuid)
returns table (visit_bucket text, guest_count integer)
language sql
security definer
set search_path = public
stable
as $$
  with counts as (
    select user_id, count(*)::integer as visits
    from public.checkins
    where winery_id = target_winery_id
      and (public.is_admin() or public.is_winery_staff_for(target_winery_id))
    group by user_id
  )
  select
    case when visits = 1 then '1' when visits = 2 then '2' else '3+' end as visit_bucket,
    count(*)::integer as guest_count
  from counts
  group by 1;
$$;
