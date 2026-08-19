-- Tennessee Wine Trails — migration 0027: drop "passport" terminology from
-- the schema (already renamed in migration 0026's trail copy). Renames
-- profiles.passport_start_date -> trail_start_date, the passport_completions
-- table -> trail_completions, and the 'passport_completion' share_type value
-- -> 'trail_completion'. handle_new_user() is redefined to match.

alter table public.profiles
  rename column passport_start_date to trail_start_date;

alter table public.passport_completions
  rename to trail_completions;

alter index if exists passport_completions_pkey rename to trail_completions_pkey;
alter index if exists passport_completions_user_idx rename to trail_completions_user_idx;
alter index if exists passport_completions_user_id_trail_id_key rename to trail_completions_user_id_trail_id_key;

-- Drop whatever the auto-generated (or explicit) name of the share_type
-- check constraint turned out to be, then recreate it with the new value.
do $$
declare
  constraint_name text;
begin
  select conname into constraint_name
  from pg_constraint
  where conrelid = 'public.share_events'::regclass
    and contype = 'c'
    and pg_get_constraintdef(oid) like '%share_type%';

  if constraint_name is not null then
    execute format('alter table public.share_events drop constraint %I', constraint_name);
  end if;
end $$;

alter table public.share_events
  add constraint share_events_share_type_check check (
    share_type in (
      'winery_checkin', 'trail_completion', 'native_share',
      'copy_link', 'facebook', 'instagram', 'save_image'
    )
  );

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  ref_id uuid;
begin
  begin
    ref_id := nullif(new.raw_user_meta_data ->> 'referred_by', '')::uuid;
  exception when others then
    ref_id := null;
  end;

  if ref_id is not null and not exists (select 1 from public.profiles where id = ref_id) then
    ref_id := null;
  end if;

  insert into public.profiles (id, email, name, birth_date, trail_start_date, referred_by)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    nullif(new.raw_user_meta_data ->> 'birth_date', '')::date,
    now(),
    ref_id
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
