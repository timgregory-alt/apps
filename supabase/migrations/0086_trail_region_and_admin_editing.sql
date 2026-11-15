-- Tennessee Wine Trails — migration 0086: trail region field.
--
-- The homepage's trail card showed "Middle Tennessee" as a hardcoded
-- string regardless of which trail was selected — harmless while only
-- the Middle Tennessee trail was live, but wrong the moment Highland Rim,
-- Upper Cumberland, or East Tennessee go active. Adds a real per-trail
-- region field, editable from /admin/trails alongside the description.

alter table public.trails
  add column if not exists region text not null default 'Middle Tennessee';

update public.trails set region = 'Highland Rim' where slug = 'highland-rim';
update public.trails set region = 'Upper Cumberland' where slug = 'upper-cumberland';
update public.trails set region = 'East Tennessee' where slug = 'east-tennessee';
