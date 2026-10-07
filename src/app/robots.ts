import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { SITE_URL } from "@/lib/site";

/**
 * Every `/japan/{id}` page is server-rendered, and rendering one costs the
 * backend an AJES call that no cache can share — the lot id makes each URL
 * unique by construction. With ~78,000 lots in the live window, a crawler that
 * walks the catalogue can spend the upstream's whole 20,000-a-day allowance on
 * its own, which is what took the Japan section down.
 *
 * Search engines stay welcome: lot pages are the long-tail traffic the site is
 * built on, and blocking them to save quota would trade the business for the
 * bill. What is blocked is the commercial SEO/backlink crawlers — they walk
 * every URL just as thoroughly and send nobody back.
 */
const CATALOGUE_WALKERS = [
  "AhrefsBot",
  "SemrushBot",
  "MJ12bot",
  "DotBot",
  "BLEXBot",
  "DataForSeoBot",
  "Barkrowler",
  "PetalBot",
  "SeekportBot",
  "serpstatbot",
  "ZoominfoBot",
  "MegaIndex",
  "SiteAuditBot",
  "rogerbot",
];

/**
 * Never worth crawling: `/dashboard` only ever hands a crawler a redirect to
 * the login form, `/auth` is that form, and the wishlist is per-visitor state
 * with nothing on it to index.
 *
 * `/garage` is not here on purpose. It is the public in-stock catalogue, and
 * its pages are served from our own database, so they cost no AJES call.
 */
const PRIVATE_PATHS = ["/dashboard/", "/wishlist", "/auth/"];

/**
 * Every page is served under a locale prefix, so a bare `/auth/` never matches
 * `/mn/auth/login` — each path has to be spelled out per locale. The bare forms
 * stay for the unprefixed URLs that redirect into them. `/api` is the proxy to
 * the backend (a crawled API URL is a pure AJES call with no page behind it)
 * and lives outside the locale segment.
 */
const DISALLOW = [
  "/api/",
  ...PRIVATE_PATHS,
  ...routing.locales.flatMap((locale) =>
    PRIVATE_PATHS.map((path) => `/${locale}${path}`),
  ),
];

/**
 * Seconds between Bingbot requests, which caps it at 8,640 a day. With ~60% of
 * those landing on Japan lots that is ~5,000 AJES calls — inside the 6,000 set
 * aside for bots, and spread over the day instead of spent by 07:00. Raise it
 * to 15 if the allowance still runs out.
 *
 * Google ignores `Crawl-delay`, and at ~80 requests a day does not need one.
 */
const BING_CRAWL_DELAY = 10;

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: DISALLOW },
      // A crawler with a group of its own never reads `*`, so without the
      // repeat Bing would be free of every ban above.
      {
        userAgent: "bingbot",
        allow: "/",
        disallow: DISALLOW,
        crawlDelay: BING_CRAWL_DELAY,
      },
      { userAgent: CATALOGUE_WALKERS, disallow: "/" },
    ],
    host: SITE_URL,
  };
}
