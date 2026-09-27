-- Tennessee Wine Trails — migration 0046: allow a winery's wine-list sync
-- to check multiple pages instead of just one.
--
-- Some wineries (Beans Creek) split their wine list across several
-- category pages (dry red, off-dry, sparkling, etc.) rather than one
-- consolidated menu page, so a single wine_menu_url can't capture the
-- whole list. Converts the column from a single URL to an array of URLs;
-- existing single values become one-element arrays so nothing already
-- configured (Big Creek's /wine-names/ page, Woodfeather's /shop/, etc.)
-- changes behavior.

alter table public.wineries
  alter column wine_menu_url type text[]
  using (case when wine_menu_url is null or wine_menu_url = '' then null else array[wine_menu_url] end);
