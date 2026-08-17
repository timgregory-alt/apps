-- Tennessee Wine Passport — migration 0015: reward tier ladder + "pick one" tiers.
--
-- Expands the single reward tier (migration 0014) into a 4-step ladder, and
-- adds support for a tier where the guest picks one of several rewards
-- (Sommelier's Choice: a bigger discount OR a complimentary tasting)
-- instead of always getting a fixed discount_percent.

alter table public.reward_tiers add column if not exists choice_options jsonb;
alter table public.reward_redemptions add column if not exists chosen_option text;

-- The original seed tier (150 pts / 15% off) becomes "Trail Blazer".
update public.reward_tiers
set label = 'Trail Blazer', sort_order = 2
where label = '15% Off Your Next Bottle' and points_required = 150 and discount_percent = 15;

insert into public.reward_tiers (label, points_required, discount_percent, choice_options, sort_order, active)
select 'First Pour', 75, 10, null, 1, true
where not exists (select 1 from public.reward_tiers where label = 'First Pour');

insert into public.reward_tiers (label, points_required, discount_percent, choice_options, sort_order, active)
select 'Estate Insider', 250, 20, null, 3, true
where not exists (select 1 from public.reward_tiers where label = 'Estate Insider');

insert into public.reward_tiers (label, points_required, discount_percent, choice_options, sort_order, active)
select
  'Sommelier''s Choice', 400, 35,
  '["35% off your next purchase", "A complimentary tasting for two"]'::jsonb,
  4, true
where not exists (select 1 from public.reward_tiers where label = 'Sommelier''s Choice');

-- Safety net: if the original seed tier was already renamed/edited by an
-- admin and the update above found no match, make sure a Trail Blazer tier
-- still exists so the ladder isn't missing a step.
insert into public.reward_tiers (label, points_required, discount_percent, choice_options, sort_order, active)
select 'Trail Blazer', 150, 15, null, 2, true
where not exists (select 1 from public.reward_tiers where label = 'Trail Blazer');
