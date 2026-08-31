-- Tennessee Wine Trails — migration 0040: winery guest contact list.
--
-- A winery's own staff can now see the name/email/visit history of guests
-- who checked in at their winery specifically (not any other winery) — the
-- Terms of Service have been updated to disclose this. Same authorization
-- pattern as winery_repeat_guest_stats(): SECURITY DEFINER checks admin/
-- staff access internally rather than widening checkins/profiles RLS to
-- let wineries read arbitrary guest rows directly.

create or replace function public.winery_guest_list(target_winery_id uuid)
returns table (
  user_id uuid,
  name text,
  email text,
  visit_count integer,
  first_visit date,
  last_visit date
)
language sql
security definer
set search_path = public
stable
as $$
  select
    c.user_id,
    p.name,
    p.email,
    count(*)::integer as visit_count,
    min(c.checkin_date)::date as first_visit,
    max(c.checkin_date)::date as last_visit
  from public.checkins c
  join public.profiles p on p.id = c.user_id
  where c.winery_id = target_winery_id
    and (public.is_admin() or public.is_winery_staff_for(target_winery_id))
  group by c.user_id, p.name, p.email
  order by max(c.checkin_date) desc;
$$;
