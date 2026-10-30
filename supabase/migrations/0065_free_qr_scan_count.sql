-- Tennessee Wine Trails — migration 0065: make QR scan count a free stat.
--
-- QR Code Scans was added to the paid analytics bundle (winery_conversion_
-- stats), but it's basic operational info like Total Guests, not a deep
-- analytics breakdown — this gives winery staff a free, lightweight way to
-- see it regardless of whether they're subscribed to Winery Analytics.

create function public.winery_qr_scan_count(target_winery_id uuid)
returns integer
language sql
security definer
set search_path = public
stable
as $$
  select count(*)::integer
  from public.winery_page_views
  where winery_id = target_winery_id
    and source = 'qr'
    and (public.is_admin() or public.is_winery_staff_for(target_winery_id));
$$;
