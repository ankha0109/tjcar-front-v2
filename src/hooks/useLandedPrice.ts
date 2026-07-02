"use client";

import { useQuery } from "@tanstack/react-query";
import Api from "@/services/Api";

type Params = {
  /** AJES lot id — only used to scope the cache key. */
  auctionId: string;
  chassis: string;
  engineSize: string;
  year: string;
  rate: string;
  /**
   * JPY price basis for the calculation:
   *  - the START (opening) price → the minimum acceptable MNT bid (bid floor);
   *  - the AVG_PRICE (comparable) → the expected landed ("гар дээр ирэх") price.
   * Omit to let the backend estimate from specs alone.
   */
  price?: number;
  enabled?: boolean;
};

/**
 * POST /calculator → the landed MNT price for a lot. Returns `average` (0 on
 * failure or empty). Both the bid floor (price = START) and the "гар дээр ирэх
 * дундаж үнэ" card (price = AVG_PRICE) reuse this — the `price` basis is part of
 * the cache key, so the two coexist without clobbering each other.
 */
export function useLandedPrice({
  auctionId,
  chassis,
  engineSize,
  year,
  rate,
  price,
  enabled = true,
}: Params) {
  return useQuery({
    queryKey: ["calculator", auctionId, price ?? null],
    queryFn: () =>
      Api.post<{ data?: { average?: number } }>("/calculator", {
        chassis,
        engineSize,
        year,
        rate,
        ...(price != null ? { price } : {}),
      }).then((res) => Number(res?.data?.average) || 0),
    enabled,
    staleTime: Infinity,
  });
}
