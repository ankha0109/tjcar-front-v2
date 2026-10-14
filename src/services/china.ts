import "server-only";
import { cache } from "react";
import ServerApi, { ServerApiError } from "@/services/ServerApi";
import { CHINA_ID_RE } from "@/lib/chinaConstants";
import type { Paginated, ResourceObject } from "@/types/api";
import type { ChinaCatalogEntry, ChinaListing } from "@/types/china";
import type { QueryParams } from "@/utils/buildQuery";

export { CHINA_PER_PAGE } from "@/lib/chinaConstants";

/**
 * GET /china — China dealer listings from the backend's local mirror,
 * paginated. Filter param names are mapped via `chinaFiltersToQuery` by the
 * caller. Every read is served from our own database, never AJES.
 */
export const getChinaListings = cache(
  (params: QueryParams = {}): Promise<Paginated<ChinaListing>> =>
    ServerApi.get<Paginated<ChinaListing>>("/china", params, {
      cache: "no-store",
    }),
);

/**
 * GET /china/{id} — a single listing, or `null` when the id is unknown (404)
 * or not shaped like one. Other failures (network, 5xx) still throw.
 */
export const getChinaListing = cache(
  async (id: string): Promise<ChinaListing | null> => {
    if (!CHINA_ID_RE.test(id)) return null;
    try {
      const { data } = await ServerApi.get<ResourceObject<ChinaListing>>(
        `/china/${id}`,
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
 * GET /china/brands — every brand with listings, by name. The counts only move
 * when a sync sweep lands, so an hour of ISR is plenty; no token, so the cache
 * holds one entry rather than one per signed-in visitor.
 */
export const getChinaBrands = cache(
  (): Promise<ChinaCatalogEntry[]> =>
    ServerApi.get<ResourceObject<ChinaCatalogEntry[]>>(
      "/china/brands",
      {},
      { skipAuth: true, next: { revalidate: 3600 } },
    ).then((r) => r.data),
);

/**
 * GET /china/models?brand_id= — one brand's models. Read server-side only when
 * the URL already names a brand, so a shared `?model_id=` link paints the
 * model's name on first load instead of its bare id; the client hook fetches
 * every later brand through the proxy.
 */
export const getChinaModels = cache(
  (brandId: number): Promise<ChinaCatalogEntry[]> =>
    ServerApi.get<ResourceObject<ChinaCatalogEntry[]>>(
      "/china/models",
      { brand_id: brandId },
      { skipAuth: true, next: { revalidate: 3600 } },
    ).then((r) => r.data),
);
