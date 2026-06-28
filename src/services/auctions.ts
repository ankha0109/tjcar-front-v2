import "server-only";
import { cache } from "react";
import ServerApi, { ServerApiError } from "@/services/ServerApi";
import type { Paginated, ResourceObject } from "@/types/api";
import type { FeaturedCar } from "@/types/featured";
import type { QueryParams } from "@/utils/buildQuery";

export { AUCTIONS_PER_PAGE } from "@/lib/auctionConstants";

/**
 * GET /auctions — live AJES auction catalogue, paginated. The lot shape matches
 * `FeaturedCar` minus `PRICE_MNT`. Filter param names are mapped via
 * `filtersToAuctionQuery` by the caller. Wrapped in React `cache` so repeated
 * reads in one request hit the API once.
 */
export const getAuctions = cache(
  (params: QueryParams = {}): Promise<Paginated<FeaturedCar>> =>
    ServerApi.get<Paginated<FeaturedCar>>("/auctions", params, {
      cache: "no-store",
    }),
);

/**
 * GET /auctions/{id} — a single auction lot, or `null` when the id is unknown
 * (404). Other failures (network, 5xx) still throw.
 */
export const getAuction = cache(
  async (id: string): Promise<FeaturedCar | null> => {
    try {
      const { data } = await ServerApi.get<ResourceObject<FeaturedCar>>(
        `/auctions/${id}`,
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
