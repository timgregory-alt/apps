-- Tennessee Wine Trails — migration 0049: rename the Highland Rim Wine
-- Trail to the Backroads Wine Trail.
--
-- "Highland Rim" technically applies (all four counties sit on it), but
-- the trail now spans both the western rim (Marshall/Giles) and the
-- eastern rim (Coffee), which is more geography than a guest needs to
-- parse. "Backroads" describes what the trail actually is — a full-day
-- rural driving loop — without pinning down a landform that won't fit
-- whatever gets added next. Slug stays 'highland-rim' (the stable DB key
-- every trail_wineries row, redirect, and lookup already points at) —
-- only the display name and description change, same pattern as the
-- Founding Trail -> South Nashville Trail rename in migration 0037.

update public.trails
set
  name = 'Backroads Wine Trail',
  description = 'A full-day loop down the back roads of Middle Tennessee, from Marshall County through Giles County and out to Coffee County.'
where slug = 'highland-rim';
