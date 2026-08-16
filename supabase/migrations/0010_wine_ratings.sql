-- Tennessee Wine Passport — migration 0010: replace the like/pass toggle on
-- the curated wine tasting flight with a 1-5 star rating.
--
-- Existing ratings are backfilled from the old liked flag (liked -> 4,
-- not liked -> 2) so nobody's tasting history is lost, then the old
-- column is dropped. custom_wine_tastings (the "add a wine you tried"
-- feature) is untouched — it keeps its own liked/not-liked toggle.

alter table public.wine_tastings add column if not exists rating smallint;

update public.wine_tastings set rating = case when liked then 4 else 2 end
where rating is null;

alter table public.wine_tastings alter column rating set not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'wine_tastings_rating_range'
  ) then
    alter table public.wine_tastings
      add constraint wine_tastings_rating_range check (rating between 1 and 5);
  end if;
end $$;

alter table public.wine_tastings drop column if exists liked;
