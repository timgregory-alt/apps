-- Tennessee Wine Trails — migration 0075: record which winery verified a
-- reward redemption, alongside the existing verified_at timestamp, so staff
-- who encounter an already-used code can see where (not just when) it was
-- first honored.

alter table public.reward_redemptions
  add column if not exists verified_by_winery_id uuid references public.wineries (id) on delete set null;
