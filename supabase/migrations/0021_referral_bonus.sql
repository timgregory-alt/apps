-- Tennessee Wine Passport — migration 0021: referral bonus.
--
-- A guest can share a personal link (?ref=<their user id>) that ties a new
-- signup back to them. The referrer earns bonus points once — not per
-- check-in — when their referred friend actually visits (their first
-- check-in), not just on signup, to discourage throwaway-account farming.
--
-- Points stay derived, never stored (same philosophy as the rest of the
-- rewards system): count_qualifying_referrals() computes the count live
-- from profiles + checkins. It's SECURITY DEFINER so a guest can count
-- their own referrals without a broad cross-user RLS policy that would
-- otherwise expose referred friends' full profile rows (email, birth date).

alter table public.profiles
  add column if not exists referred_by uuid references public.profiles (id);

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

  insert into public.profiles (id, email, name, birth_date, passport_start_date, referred_by)
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

create or replace function public.count_qualifying_referrals()
returns integer
language sql
security definer
set search_path = public
stable
as $$
  select count(*)::integer
  from public.profiles p
  where p.referred_by = auth.uid()
    and exists (select 1 from public.checkins c where c.user_id = p.id);
$$;
