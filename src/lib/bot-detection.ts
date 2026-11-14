/** Known crawler/scraper/bot signatures seen in home_page_views.user_agent —
 * link-preview fetchers (Facebook, Slack-style unfurl bots), search/SEO
 * crawlers, and scripted clients (curl, aiohttp, headless browsers). Used to
 * keep bot noise out of the admin "Homepage Views" count without needing a
 * migration — the UA list just grows here as new ones show up. */
const BOT_USER_AGENT_PATTERN =
  /bot|crawl|spider|facebookexternalhit|slurp|bingpreview|whatsapp|embedly|preview|headless|nutch|curl|python|aiohttp|nomorevibe|scan|wget|phantom|selenium|puppeteer|okhttp|httpclient|postman|libwww|node-fetch|go-http-client/i;

export function isBotUserAgent(userAgent: string | null): boolean {
  if (!userAgent) return false;
  return BOT_USER_AGENT_PATTERN.test(userAgent);
}
