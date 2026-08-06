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

/**
 * Price the customer will actually be charged for a report.
 *
 * ⚠️ Mirrors `Customer\ReportController@store` in the API. The backend stays
 * authoritative and recomputes this at purchase time; this copy exists only so
 * the page can show a price before the order is placed. Never send it to the
 * API, and if the backend rule changes, change it here too.
 */
export function effectiveReportPrice(config: SiteConfig): number {
  const { reportPrice, reportDiscountPrice, reportDiscountEndDate } = config;

  if (reportDiscountPrice <= 0 || !reportDiscountEndDate) return reportPrice;

  // The backend compares against end-of-day, so a promo runs through its last date.
  const endOfDay = new Date(`${reportDiscountEndDate}T23:59:59`);
  if (Number.isNaN(endOfDay.getTime()) || Date.now() > endOfDay.getTime()) {
    return reportPrice;
  }

  return reportDiscountPrice;
}
