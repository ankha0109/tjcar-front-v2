"use client";

import { useQuery } from "@tanstack/react-query";
import Api from "@/services/Api";
import type { KoreaCategory, KoreaModelGroup } from "@/types/korea";

/**
 * Model groups of the selected Korea brand via `GET /korea/models?brand=`
 * (Encar facet counts, backend-cached ~1h). Disabled until a brand is picked —
 * the model select needs a brand to mean anything. `category` picks the
 * catalogue (car vs. truck) the brand slug belongs to.
 */
export function useKoreaModels(brand: string | null, category: KoreaCategory) {
  return useQuery<KoreaModelGroup[]>({
    queryKey: ["korea-models", category, brand],
    queryFn: async () => {
      const { data } = await Api.get<{ data: KoreaModelGroup[] }>(
        "/korea/models",
        { brand: brand as string, category },
      );
      return data;
    },
    enabled: !!brand,
    staleTime: 60 * 60_000,
  });
}
