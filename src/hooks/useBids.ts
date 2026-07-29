"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getBid, listBids, updateBidPrice } from "@/services/bids";
import type { BidScope } from "@/types/bid";

/** Root key — invalidating it refreshes every list page and every open detail. */
export const BIDS_KEY = ["bids"] as const;

export const BIDS_PER_PAGE = 10;

/**
 * One page of the customer's bids. Bids settle while the page is open, so this
 * refetches on focus rather than trusting the first render (same reasoning as
 * `ReportList`).
 */
export function useBidList(scope: BidScope | undefined, page: number) {
  return useQuery({
    queryKey: [...BIDS_KEY, scope ?? "all", page],
    queryFn: () => listBids(scope, page, BIDS_PER_PAGE),
    staleTime: 15_000,
    refetchOnWindowFocus: true,
  });
}

export function useBid(id: string) {
  return useQuery({
    queryKey: [...BIDS_KEY, "detail", id],
    queryFn: () => getBid(id),
    staleTime: 15_000,
    refetchOnWindowFocus: true,
  });
}

/**
 * Price edit. No optimistic update: the API owns two gates the client can only
 * approximate, so the server's reply is what gets rendered.
 */
export function useUpdateBidPrice(id: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (bidPrice: number) => updateBidPrice(id, bidPrice),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: BIDS_KEY });
    },
  });
}
