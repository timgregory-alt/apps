-- Tennessee Wine Trails — migration 0037: turn the single "Founding Trail"
-- into the first of several selectable trails. Renames it to South
-- Nashville (its existing 4 wineries stay mapped via trail_wineries, no
-- change needed there) and seeds placeholder rows for the trails the
-- Explore page has long teased as "coming soon" — they carry no wineries
-- yet, so they show up in the trail picker as unselectable until wineries
-- are actually assigned to them via trail_wineries.

update public.trails
set
  name = 'South Nashville',
  slug = 'south-nashville',
  description = 'A countryside tour through Middle Tennessee''s boutique wineries, just south of Nashville.'
where slug = 'founding-trail';

insert into public.trails (name, slug, description, active)
select 'Nashville Wine Trail', 'nashville', null, true
where not exists (select 1 from public.trails where slug = 'nashville');

insert into public.trails (name, slug, description, active)
select 'Upper Cumberland Wine Trail', 'upper-cumberland', null, true
where not exists (select 1 from public.trails where slug = 'upper-cumberland');

insert into public.trails (name, slug, description, active)
select 'East Tennessee Wine Trail', 'east-tennessee', null, true
where not exists (select 1 from public.trails where slug = 'east-tennessee');
