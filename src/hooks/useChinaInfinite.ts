"use client";

import { useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import Api from "@/services/Api";
import { CHINA_PER_PAGE } from "@/lib/chinaConstants";
import type { Paginated } from "@/types/api";
import type { ChinaListing } from "@/types/china";
import { type ChinaFilterValues, chinaFiltersToQuery } from "@/types/china";

export type ChinaPage = Paginated<ChinaListing>;

/**
 * Infinite China listing feed. Hydrates page 1 from the server (`initialPage`)
 * when the active filters still match the URL's, then fetches later pages
 * client-side through the proxy. Mirrors `useKoreaInfinite`.
 */
export function useChinaInfinite(
  filters: ChinaFilterValues,
  initialPage?: ChinaPage,
) {
  const query = chinaFiltersToQuery(filters);
  const queryStr = JSON.stringify(query);

  const [firstQuery] = useState(queryStr);
  const useInitial = !!initialPage && queryStr === firstQuery;

  return useInfiniteQuery<ChinaPage>({
    queryKey: ["china", query],
    queryFn: ({ pageParam }) =>
      Api.get<ChinaPage>("/china", {
        ...query,
        page: pageParam as number,
        per_page: CHINA_PER_PAGE,
      }),
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.meta.current_page < last.meta.last_page
        ? last.meta.current_page + 1
        : undefined,
    initialData: useInitial
      ? { pages: [initialPage as ChinaPage], pageParams: [1] }
      : undefined,
    staleTime: 5 * 60_000,
  });
}
