import type { MetadataRoute } from "next";
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
 * Never worth crawling: `/api` is the proxy to the backend (a crawled API URL is
 * a pure AJES call with no page behind it) and the rest need a session, so a
 * crawler only ever reaches a redirect.
 */
const PRIVATE_PATHS = ["/api/", "/dashboard/", "/wishlist", "/auth/", "/garage/"];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: PRIVATE_PATHS },
      { userAgent: CATALOGUE_WALKERS, disallow: "/" },
    ],
    host: SITE_URL,
  };
}
