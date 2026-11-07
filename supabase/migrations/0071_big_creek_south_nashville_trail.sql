-- Tennessee Wine Trails — migration 0071: expose Big Creek Winery on the
-- South Nashville Trail.
--
-- Big Creek is now a confirmed pilot partner. It was only ever mapped to
-- the Highland Rim Wine Trail (migration 0043) — this adds it to South
-- Nashville Trail (slug 'founding-trail') too, at the end of that trail's
-- stop order, without touching its existing Highland Rim placement. Also
-- makes sure it's active/guest-visible, in case it was ever hidden.

update public.wineries
set active = true
where slug = 'big-creek';

insert into public.trail_wineries (trail_id, winery_id, display_order)
select
  t.id,
  w.id,
  (select coalesce(max(display_order), 0) + 1 from public.trail_wineries where trail_id = t.id)
from public.trails t, public.wineries w
where t.slug = 'founding-trail'
  and w.slug = 'big-creek'
  and not exists (
    select 1 from public.trail_wineries tw where tw.trail_id = t.id and tw.winery_id = w.id
  );
