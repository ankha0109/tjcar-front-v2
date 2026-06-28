"use client";

import { useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import Api from "@/services/Api";
import { AUCTIONS_PER_PAGE } from "@/lib/auctionConstants";
import type { Paginated } from "@/types/api";
import type { FeaturedCar } from "@/types/featured";
import { type FilterValues, filtersToAuctionQuery } from "@/types/filters";

export type AuctionPage = Paginated<FeaturedCar>;

/**
 * Infinite auction list. Hydrates page 1 from the server (`initialPage`) when the
 * active filters still match the URL's filters, then fetches later pages client-
 * side through the proxy. `staleTime` keeps the accumulated pages around so a trip
 * to a detail page and back doesn't refetch or jump the scroll.
 */
export function useAuctionsInfinite(
  filters: FilterValues,
  initialPage?: AuctionPage,
) {
  const query = filtersToAuctionQuery(filters);
  const queryStr = JSON.stringify(query);

  // initialData is a static option that React Query would otherwise apply to ANY
  // uncached key — pin it to the first (URL) filter set only. The lazy useState
  // captures the mount-time query string once.
  const [firstQuery] = useState(queryStr);
  const useInitial = !!initialPage && queryStr === firstQuery;

  return useInfiniteQuery<AuctionPage>({
    queryKey: ["auctions", query],
    queryFn: ({ pageParam }) =>
      Api.get<AuctionPage>("/auctions", {
        ...query,
        page: pageParam as number,
        per_page: AUCTIONS_PER_PAGE,
      }),
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.meta.current_page < last.meta.last_page
        ? last.meta.current_page + 1
        : undefined,
    initialData: useInitial
      ? { pages: [initialPage as AuctionPage], pageParams: [1] }
      : undefined,
    staleTime: 5 * 60_000,
  });
}
