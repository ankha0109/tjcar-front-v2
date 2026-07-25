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
   * JPY price basis for the calculation — the START (opening) price, giving the
   * minimum acceptable MNT bid. Omit to let the backend estimate from specs.
   */
  price?: number;
  enabled?: boolean;
};

/**
 * POST /calculator → the landed MNT price for a lot. Returns `average` (0 on
 * failure or empty).
 *
 * Only the bid floor uses this now: the "гар дээр ирэх дундаж үнэ" tile reads
 * `PRICE_MNT` straight off the lot payload, since fetching it here put a spinner
 * on the page's headline number. Keep this for CarBidSection — the floor is
 * derived from THIS lot's start price, which no comparable history can supply,
 * and it only fires for a logged-in customer with a deposit.
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
