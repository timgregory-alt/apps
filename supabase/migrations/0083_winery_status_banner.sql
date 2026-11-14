-- Tennessee Wine Trails — migration 0083: winery status banner.
--
-- A short, staff-editable notice shown at the top of a winery's page —
-- e.g. "Tasting room closed today — the vineyard is open!" Editable from
-- both the admin dashboard and the winery's own portal (details page), so
-- staff can post a same-day closure/relocation notice themselves.

alter table public.wineries
  add column if not exists status_banner text;
