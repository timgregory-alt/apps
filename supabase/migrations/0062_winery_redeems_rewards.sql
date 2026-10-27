-- Lets a winery opt out of honoring reward redemptions (e.g. Arrington
-- Vineyards) while guests still earn points for checking in there. Defaults
-- to true so every existing winery keeps redeeming rewards as before.
alter table public.wineries
  add column if not exists redeems_rewards boolean not null default true;

update public.wineries set redeems_rewards = false where slug = 'arrington-vineyards';
