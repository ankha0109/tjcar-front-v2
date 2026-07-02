import "server-only";
import { cache } from "react";
import ServerApi, { ServerApiError } from "@/services/ServerApi";
import type { Paginated, ResourceObject } from "@/types/api";
import type { KoreaListing } from "@/types/korea";
import type { QueryParams } from "@/utils/buildQuery";

export { KOREA_PER_PAGE } from "@/lib/koreaConstants";

/**
 * GET /korea — Encar listings via the CARAPIS aggregator, paginated. Real-time
 * proxy (backend caches briefly); `source=encar` is forced server-side. Filter
 * param names are mapped via `koreaFiltersToQuery` by the caller.
 */
export const getKoreaListings = cache(
  (params: QueryParams = {}): Promise<Paginated<KoreaListing>> =>
    ServerApi.get<Paginated<KoreaListing>>("/korea", params, {
      cache: "no-store",
    }),
);

/**
 * GET /korea/{id} — a single Encar listing, or `null` when the id is unknown
 * (404). Other failures (network, 5xx) still throw.
 */
export const getKoreaListing = cache(
  async (id: string): Promise<KoreaListing | null> => {
    try {
      const { data } = await ServerApi.get<ResourceObject<KoreaListing>>(
        `/korea/${id}`,
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
