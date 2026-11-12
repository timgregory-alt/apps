-- Tennessee Wine Trails — migration 0081: capture user-agent on homepage
-- views so bot/crawler traffic (Facebook's link-preview fetcher, search
-- engine crawlers, etc.) can actually be distinguished from real visitors.
-- Existing rows have no way to tell — this only helps going forward.

alter table public.home_page_views add column if not exists user_agent text;
