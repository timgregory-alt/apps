-- Tennessee Wine Trails — migration 0033: raise reward tier thresholds so
-- reaching each level takes multiple trips instead of one big day.

update public.reward_tiers set points_required = 1000 where label = 'First Pour';
update public.reward_tiers set points_required = 2000 where label = 'Trail Blazer';
update public.reward_tiers set points_required = 3000 where label = 'Estate Insider';
update public.reward_tiers set points_required = 4000 where label = 'Sommelier''s Choice';
