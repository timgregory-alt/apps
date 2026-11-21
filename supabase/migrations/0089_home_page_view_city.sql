-- Tennessee Wine Trails — migration 0089: passive city capture for
-- homepage views, same pattern as migration 0088's country column.
--
-- Captured from Vercel's x-vercel-ip-city request header — no permission
-- prompt, set automatically by the edge network on every request.

alter table public.home_page_views
  add column if not exists city text;
