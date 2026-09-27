-- Tennessee Wine Trails — migration 0047: point Beans Creek Winery's wine
-- sync at its actual category pages (their site has no single wine-list
-- page — the list is split across dry red, dry rosé, off-dry, semi-sweet,
-- and sparkling pages).

update public.wineries
set wine_menu_url = array[
  'https://beanscreekwinery.com/dry-red',
  'https://beanscreekwinery.com/dry-ros%C3%A9',
  'https://beanscreekwinery.com/off-dry',
  'https://beanscreekwinery.com/semi-sweet',
  'https://beanscreekwinery.com/sparkling'
]
where slug = 'beans-creek';
