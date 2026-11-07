-- Tennessee Wine Trails — migration 0074: single-use verification for reward
-- redemption codes.
--
-- redeemed_at already marks the moment a guest *reveals* their code in the
-- app — that happens client-side the instant they claim a reward, before
-- it's ever shown to anyone at a register. It was never a record of the
-- code actually being honored, so a screenshot of the QR code could be
-- shown — and honored — more than once. verified_at is a separate,
-- one-time flag set the first time winery staff actually scan or look up
-- the code in the portal; a second scan reports it as already verified
-- instead of silently approving it again.

alter table public.reward_redemptions add column if not exists verified_at timestamptz;

create index if not exists reward_redemptions_verified_idx on public.reward_redemptions (verified_at);
