-- Tennessee Wine Passport — migration 0011: mark a wine as sold out.
--
-- Sold-out wines stay visible (guests can still read tasting notes and
-- see past ratings) but show a "Sold Out" badge and a muted card in the
-- app. Toggled per wine from each winery's admin edit page.

alter table public.wines
  add column if not exists sold_out boolean not null default false;
