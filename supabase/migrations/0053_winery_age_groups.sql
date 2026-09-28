-- Tennessee Wine Trails — migration 0053: guest age group breakdown per
-- winery, alongside the single average added in migration 0052.
--
-- Same bucket edges as AGE_GROUPS in src/lib/utils.ts (21-24, 25-34,
-- 35-44, 45-54, 55-64, 65+) so admin and winery-portal views report the
-- same groups. Same pattern as winery_repeat_guest_stats — a table of
-- (bucket, count) rows rather than one scalar, since there are several
-- buckets to show.

create function public.winery_age_group_stats(target_winery_id uuid)
returns table (age_group text, guest_count integer)
language sql
security definer
set search_path = public
stable
as $$
  with distinct_guests as (
    select distinct c.user_id
    from public.checkins c
    where c.winery_id = target_winery_id
      and (public.is_admin() or public.is_winery_staff_for(target_winery_id))
  ),
  ages as (
    select extract(year from age(current_date, p.birth_date))::integer as age
    from distinct_guests g
    join public.profiles p on p.id = g.user_id
    where p.birth_date is not null
  )
  select
    case
      when age < 25 then '21-24'
      when age < 35 then '25-34'
      when age < 45 then '35-44'
      when age < 55 then '45-54'
      when age < 65 then '55-64'
      else '65+'
    end as age_group,
    count(*)::integer as guest_count
  from ages
  group by 1;
$$;
