import "server-only";
import { cache } from "react";
import ServerApi, { ServerApiError } from "@/services/ServerApi";
import type { Paginated, ResourceObject } from "@/types/api";
import type { FeaturedCar } from "@/types/featured";
import type { QueryParams } from "@/utils/buildQuery";

export { AUCTIONS_PER_PAGE } from "@/lib/auctionConstants";

/**
 * GET /japan — live AJES auction catalogue, paginated. The lot shape matches
 * `FeaturedCar` minus `PRICE_MNT`. Filter param names are mapped via
 * `filtersToAuctionQuery` by the caller. Wrapped in React `cache` so repeated
 * reads in one request hit the API once.
 */
export const getAuctions = cache(
  (params: QueryParams = {}): Promise<Paginated<FeaturedCar>> =>
    ServerApi.get<Paginated<FeaturedCar>>("/japan", params, {
      cache: "no-store",
    }),
);

/**
 * GET /japan/{id} — a single auction lot, or `null` when the id is unknown
 * (404). Other failures (network, 5xx) still throw.
 */
export const getAuction = cache(
  async (id: string): Promise<FeaturedCar | null> => {
    try {
      const { data } = await ServerApi.get<ResourceObject<FeaturedCar>>(
        `/japan/${id}`,
        {},
        { cache: "no-store" },
      );
      return data;
    } catch (err) {
      if (err instanceof ServerApiError && err.status === 404) return null;
      throw err;
    }
  },
);

/**
 * GET /japan/history — up to 10 comparable lots that actually SOLD, newest
 * first, from the AJES `stats` table. Rows carry the same UPPERCASE keys as a
 * `main` lot, so `FeaturedCar` describes them too (`FINISH` is the hammer
 * price, only ever filled in on sold rows), plus `PRICE_MNT`, the landed price
 * the API computes from each row's own FINISH.
 *
 * Filters — all optional: `mark_name`, `model_name`, `year`, `chassis`, `rate`.
 * Send `chassis` and `rate` whenever the caller knows them: the upstream applies
 * its 10-row limit AFTER filtering, so narrowing costs no sample size and keeps
 * a rate 5 car from being compared against a rate R one.
 */
export const getAuctionHistory = cache(
  async (params: QueryParams = {}): Promise<FeaturedCar[]> => {
    const { data } = await ServerApi.get<ResourceObject<FeaturedCar[]>>(
      "/japan/history",
      params,
      { cache: "no-store" },
    );
    return data;
  },
);
