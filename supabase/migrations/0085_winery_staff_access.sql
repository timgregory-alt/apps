-- Tennessee Wine Trails — migration 0085: multi-winery staff access.
--
-- profiles.winery_id is a single FK, so one login could only ever manage
-- one winery. Big Creek now runs two stops on the trail (the original and
-- Big Creek Winery East) under the same family — staff need one login that
-- can switch between both rather than a separate account per location.
--
-- winery_staff_access is a new many-to-many table that becomes the real
-- source of truth for "which wineries can this profile act as staff for."
-- profiles.winery_id is kept as-is (unchanged meaning: a profile's default/
-- primary winery — used by is_admin()'s dual-access allowlist and
-- is_staff_account's "ever been staff" bookkeeping) and is kept in sync by
-- the invite/revoke actions below, so every existing single-winery staff
-- account keeps behaving exactly as before with zero visible change.

create table if not exists public.winery_staff_access (
  profile_id uuid not null references public.profiles (id) on delete cascade,
  winery_id uuid not null references public.wineries (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (profile_id, winery_id)
);

create index if not exists winery_staff_access_winery_idx on public.winery_staff_access (winery_id);

alter table public.winery_staff_access enable row level security;

create policy "Staff can view their own winery access" on public.winery_staff_access
  for select using (profile_id = auth.uid());

create policy "Admins manage winery staff access" on public.winery_staff_access
  for all using (public.is_admin()) with check (public.is_admin());

-- Backfill: every existing single-winery grant becomes a row here too.
insert into public.winery_staff_access (profile_id, winery_id)
  select id, winery_id from public.profiles where winery_id is not null
  on conflict (profile_id, winery_id) do nothing;

-- ---------------------------------------------------------------------------
-- is_winery_staff_for() — check winery_staff_access instead of
-- profiles.winery_id, so a profile with access to more than one winery
-- passes RLS for all of them, not just whichever is "primary."
-- ---------------------------------------------------------------------------
create or replace function public.is_winery_staff_for(target_winery_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.winery_staff_access
    where profile_id = auth.uid() and winery_id = target_winery_id
  );
$$;

-- ---------------------------------------------------------------------------
-- handle_new_user() — also insert into winery_staff_access for a brand-new
-- invited staff account, so RLS recognizes it immediately. Otherwise
-- unchanged from migration 0082.
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
    id, email, name, birth_date, zip_code, trail_start_date, referred_by, agreed_to_terms_at, winery_id,
    is_staff_account
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
    target_winery_id,
    target_winery_id is not null
  )
  on conflict (id) do update set
    winery_id = excluded.winery_id,
    is_staff_account = public.profiles.is_staff_account or excluded.is_staff_account
  where public.profiles.winery_id is null;

  if target_winery_id is not null then
    insert into public.winery_staff_access (profile_id, winery_id)
      values (new.id, target_winery_id)
      on conflict (profile_id, winery_id) do nothing;
  end if;

  return new;
end;
$$;
