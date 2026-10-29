-- Lets a trail that already has wineries mapped (like the Backroads Wine
-- Trail) still be manually marked "Coming soon" and made unselectable —
-- distinct from the existing stop-count-based "coming soon" treatment,
-- which only applies to trails with zero wineries mapped yet. Defaults to
-- false so every other trail is unaffected.
alter table public.trails
  add column if not exists coming_soon boolean not null default false;

update public.trails set coming_soon = true where slug = 'highland-rim';
