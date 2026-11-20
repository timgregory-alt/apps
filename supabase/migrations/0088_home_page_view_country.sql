-- Tennessee Wine Trails — migration 0088: passive country capture for
-- homepage views.
--
-- Captured from Vercel's x-vercel-ip-country request header (set
-- automatically on every request by Vercel's edge network) — no
-- permission prompt needed, unlike the browser's Geolocation API, which
-- this app only ever asks for at check-in (where precise GPS actually
-- matters for the geofence).

alter table public.home_page_views
  add column if not exists country text;
