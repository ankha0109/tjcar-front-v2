import "server-only";
import { cache } from "react";
import ServerApi, { ServerApiError } from "@/services/ServerApi";
import type { Paginated, ResourceObject } from "@/types/api";
import type { CarResource } from "@/types/car";

export type GetCarsParams = {
  page?: number;
  per_page?: number;
};

/**
 * GET /cars — Active + Sold cars in stock, paginated (default 20/page).
 * Wrapped in React `cache` so repeated reads in one request hit the API once.
 */
export const getCars = cache(
  (params: GetCarsParams = {}): Promise<Paginated<CarResource>> =>
    ServerApi.get<Paginated<CarResource>>("/cars", params),
);

/**
 * GET /cars/{id} — a single car, or `null` when the id is unknown (404).
 * Other failures (network, 5xx) still throw.
 */
export const getCar = cache(
  async (id: string | number): Promise<CarResource | null> => {
    try {
      const { data } = await ServerApi.get<ResourceObject<CarResource>>(
        `/cars/${id}`,
      );
      return data;
    } catch (err) {
      if (err instanceof ServerApiError && err.status === 404) return null;
      throw err;
    }
  },
);
