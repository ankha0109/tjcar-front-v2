"use client";

import { useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import Api from "@/services/Api";
import { KOREA_PER_PAGE } from "@/lib/koreaConstants";
import type { Paginated } from "@/types/api";
import type { KoreaListing } from "@/types/korea";
import { type KoreaFilterValues, koreaFiltersToQuery } from "@/types/korea";

export type KoreaPage = Paginated<KoreaListing>;

/**
 * Infinite Encar listing feed. Hydrates page 1 from the server (`initialPage`)
 * when the active filters still match the URL's, then fetches later pages client-
 * side through the proxy. Mirrors `useAuctionsInfinite`.
 */
export function useKoreaInfinite(
  filters: KoreaFilterValues,
  initialPage?: KoreaPage,
) {
  const query = koreaFiltersToQuery(filters);
  const queryStr = JSON.stringify(query);

  const [firstQuery] = useState(queryStr);
  const useInitial = !!initialPage && queryStr === firstQuery;

  return useInfiniteQuery<KoreaPage>({
    queryKey: ["korea", query],
    queryFn: ({ pageParam }) =>
      Api.get<KoreaPage>("/korea", {
        ...query,
        page: pageParam as number,
        per_page: KOREA_PER_PAGE,
      }),
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.meta.current_page < last.meta.last_page
        ? last.meta.current_page + 1
        : undefined,
    initialData: useInitial
      ? { pages: [initialPage as KoreaPage], pageParams: [1] }
      : undefined,
    staleTime: 5 * 60_000,
  });
}
