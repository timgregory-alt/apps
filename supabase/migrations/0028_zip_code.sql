-- Tennessee Wine Trails — migration 0028: collect zip code at signup.
--
-- Stored on the profile so we can eventually understand where guests are
-- traveling from (e.g. targeting nearby markets, or a "closest winery"
-- suggestion later). Optional, not validated beyond what the signup form
-- itself enforces client-side.

alter table public.profiles
  add column if not exists zip_code text;

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

  insert into public.profiles (id, email, name, birth_date, zip_code, trail_start_date, referred_by)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    nullif(new.raw_user_meta_data ->> 'birth_date', '')::date,
    nullif(new.raw_user_meta_data ->> 'zip_code', ''),
    now(),
    ref_id
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
