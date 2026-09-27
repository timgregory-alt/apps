-- Tennessee Wine Trails — migration 0045: point Big Creek Winery's wine
-- sync at its actual wine list page instead of the homepage.

update public.wineries
set wine_menu_url = 'https://bigcreekwinerytennessee.com/wine-names/'
where slug = 'big-creek';
