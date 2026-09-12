import "server-only";
import { cache } from "react";
import ServerApi from "@/services/ServerApi";

export type SiteConfig = {
  /** JPY → MNT exchange rate. */
  JPY: number;
  /** USD → MNT exchange rate. */
  USD: number;
  /**
   * KRW → MNT exchange rate. Unlike JPY and USD — which the API's
   * `app:khanbank-rate` command refreshes on a schedule — this one is typed in
   * by an admin, so it can sit still for a while.
   */
  KRW: number;
  /** List price of one vehicle history report, MNT. */
  reportPrice: number;
  /** Promo price, MNT. 0 means "no promo running". */
  reportDiscountPrice: number;
  /** Last day the promo applies, "YYYY-MM-DD". Empty when unset. */
  reportDiscountEndDate: string;
};

const EMPTY_CONFIG: SiteConfig = {
  JPY: 0,
  USD: 0,
  KRW: 0,
  reportPrice: 0,
  reportDiscountPrice: 0,
  reportDiscountEndDate: "",
};

/**
 * GET /config — public site config (live exchange rates, report pricing).
 *
 * Two layers of caching, and both are load-bearing: React `cache` collapses
 * repeated reads within one render, and Next's data cache holds the response
 * for an hour across requests. Every value here moves at most once a day, and
 * the layout reads this on every page, so per-request fetching bought nothing.
 * `skipAuth` keeps the bearer token off the request — otherwise the cache would
 * key on it and every logged-in visitor would get a private entry. Revalidate
 * early with `revalidateTag("config")`.
 *
 * Failures degrade gracefully to zeroes so callers stay renderable.
 */
export const getConfig = cache(async (): Promise<SiteConfig> => {
  try {
    const { data } = await ServerApi.get<{ data: Record<string, string> }>(
      "/config",
      {},
      { skipAuth: true, next: { revalidate: 3600, tags: ["config"] } },
    );
    return {
      JPY: Number(data?.JPY) || 0,
      USD: Number(data?.USD) || 0,
      KRW: Number(data?.KRW) || 0,
      reportPrice: Number(data?.["report-price"]) || 0,
      reportDiscountPrice: Number(data?.["report-discount-price"]) || 0,
      reportDiscountEndDate: data?.["report-discount-end-date"] ?? "",
    };
  } catch {
    return EMPTY_CONFIG;
  }
});

export type ReportPricing = {
  /** List price, MNT — what a report costs when no promo is running. */
  listPrice: number;
  /** Price the customer is charged right now, MNT. */
  price: number;
  /** True while a promo is running, i.e. `price` is below `listPrice`. */
  discounted: boolean;
  /** Whole percent off, e.g. `50`. Zero when no promo is running. */
  percentOff: number;
  /** Promo deadline as an ISO instant; empty string when no promo is running. */
  endsAt: string;
};

/**
 * Ulaanbaatar is GMT+8 year-round (no DST), so a fixed offset is enough — the
 * same anchoring `auctionTime` needs for Japan's +09:00.
 */
const UB_OFFSET = "+08:00";

/**
 * What a report costs the customer today, and whether that is a promo price.
 *
 * ⚠️ Mirrors `Customer\ReportController@store` in the API. The backend stays
 * authoritative and recomputes the charge at purchase time; this copy exists
 * only so the page can show a price before the order is placed. Never send it
 * to the API, and if the backend rule changes, change it here too.
 *
 * Every number the customer sees comes from `GET /config` — `report-price`,
 * `report-discount-price` and `report-discount-end-date` — so a promo starts
 * and ends from the admin panel with no deploy, and the page falls back to the
 * list price on its own the moment the deadline passes.
 */
export function reportPricing(config: SiteConfig): ReportPricing {
  const { reportPrice, reportDiscountPrice, reportDiscountEndDate } = config;

  const listOnly: ReportPricing = {
    listPrice: reportPrice,
    price: reportPrice,
    discounted: false,
    percentOff: 0,
    endsAt: "",
  };

  // A discount at or above the list price is a misconfiguration, not a promo.
  // Bailing here also keeps `percentOff` off zero/negative list prices — the
  // shape `getConfig` degrades to when /config fails.
  if (
    reportDiscountPrice <= 0 ||
    reportDiscountPrice >= reportPrice ||
    !reportDiscountEndDate
  ) {
    return listOnly;
  }

  // The backend compares against end-of-day, so a promo runs through its last
  // date. Anchor that to Ulaanbaatar rather than the server's clock: on a UTC
  // host a bare `T23:59:59` would keep the promo alive until 08:00 the next
  // morning, local time.
  const endsAt = new Date(`${reportDiscountEndDate}T23:59:59${UB_OFFSET}`);
  if (Number.isNaN(endsAt.getTime()) || Date.now() > endsAt.getTime()) {
    return listOnly;
  }

  return {
    listPrice: reportPrice,
    price: reportDiscountPrice,
    discounted: true,
    percentOff: Math.round(
      ((reportPrice - reportDiscountPrice) / reportPrice) * 100,
    ),
    endsAt: endsAt.toISOString(),
  };
}
