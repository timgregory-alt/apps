-- Tennessee Wine Passport — migration 0017: age verification + birthday reward.
--
-- 1. Adds birth_date to profiles, collected at signup for 21+ age
--    verification, and wires it into the new-user trigger so it's saved
--    even when email confirmation delays the user's first session.
-- 2. Adds a birthday_only flag to reward_tiers for a surprise reward that
--    is NOT part of the regular points ladder — it only appears (and is
--    redeemable) on the guest's actual birthday.
-- 3. Reward redemptions gain a period_key so a recurring reward (the
--    birthday one) can be re-issued every year instead of only once ever,
--    while ordinary tiers keep their original one-time-ever behavior.

alter table public.profiles add column if not exists birth_date date;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, name, birth_date, passport_start_date)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    nullif(new.raw_user_meta_data ->> 'birth_date', '')::date,
    now()
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

alter table public.reward_tiers add column if not exists birthday_only boolean not null default false;

alter table public.reward_redemptions add column if not exists period_key text not null default '';

alter table public.reward_redemptions drop constraint if exists reward_redemptions_user_id_tier_id_key;
alter table public.reward_redemptions
  add constraint reward_redemptions_user_tier_period_key unique (user_id, tier_id, period_key);

insert into public.reward_tiers (label, points_required, discount_percent, choice_options, birthday_only, sort_order, active)
select 'Happy Birthday!', 0, 10, null, true, 99, true
where not exists (select 1 from public.reward_tiers where birthday_only = true);
