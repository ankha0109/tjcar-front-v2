/**
 * Site-wide identity constants. `SITE_URL` was copy-pasted into every JSON-LD
 * block before this file existed; it is also `metadataBase`, which is what turns
 * the relative `openGraph.images` some pages use into the absolute URLs
 * scrapers require.
 */
export const SITE_URL = "https://v2.tjcar.mn";

export const SITE_NAME = "TJCAR.MN";

/**
 * Default social preview, served from our own CDN rather than `/public` so a
 * marketing swap does not need a deploy. 1672×941 (≈16:9) — inside every
 * scraper's limits and above Facebook's 600×315 minimum for a large card.
 */
export const OG_IMAGE = {
  url: "https://cdn.tjcar.mn/public/static/tjcar_ogimage.jpeg",
  width: 1672,
  height: 941,
} as const;

/** OG wants a full locale tag; next-intl gives us the language alone. */
export const OG_LOCALES: Record<string, string> = {
  mn: "mn_MN",
  en: "en_US",
  ru: "ru_RU",
};

/**
 * The card fields every page shares. Next replaces a parent's `openGraph`
 * wholesale rather than merging it, so a page that sets its own image drops the
 * layout's `og:site_name` and `og:locale` unless it spreads these back in.
 */
export function ogSite(locale: string) {
  return {
    siteName: SITE_NAME,
    locale: OG_LOCALES[locale] ?? locale,
  };
}
