-- Tennessee Wine Trails — migration 0035: recalibrate reward tier
-- thresholds now that check-ins repeat (migration 0034).
--
-- 1000/2000/3000/4000 (migration 0033) assumed points were still one-time
-- only and were unreachable through visits alone. Now that a return visit
-- earns points again, thresholds are sized around trips instead: an
-- immediate first-visit reward, then a real but achievable climb through
-- repeat visits.

update public.reward_tiers set points_required = 150 where label = 'First Pour';
update public.reward_tiers set points_required = 400 where label = 'Trail Blazer';
update public.reward_tiers set points_required = 750 where label = 'Estate Insider';
update public.reward_tiers set points_required = 1250 where label = 'Sommelier''s Choice';
