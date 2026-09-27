-- Tennessee Wine Trails — migration 0048: explicit trail display order.
--
-- Trails were ordered by created_at, which put the three empty "coming
-- soon" placeholders (Nashville, Upper Cumberland, East Tennessee — all
-- inserted together in migration 0037) ahead of Highland Rim, even though
-- Highland Rim is a real trail with wineries and those three aren't yet.
-- Adds sort_order so the two active trails (South Nashville, Highland
-- Rim) always show first, in that order, with the placeholders after.

alter table public.trails add column if not exists sort_order integer not null default 0;

update public.trails set sort_order = 1 where slug = 'founding-trail';
update public.trails set sort_order = 2 where slug = 'highland-rim';
update public.trails set sort_order = 3 where slug = 'nashville';
update public.trails set sort_order = 4 where slug = 'upper-cumberland';
update public.trails set sort_order = 5 where slug = 'east-tennessee';
