"use client";

import { useQuery } from "@tanstack/react-query";
import Api from "@/services/Api";
import type { KoreaModelGroup } from "@/types/korea";

/**
 * Model groups of the selected Korea brand via `GET /korea/models?brand=`
 * (Encar facet counts, backend-cached ~1h). Disabled until a brand is picked —
 * the model select needs a brand to mean anything.
 */
export function useKoreaModels(brand: string | null) {
  return useQuery<KoreaModelGroup[]>({
    queryKey: ["korea-models", brand],
    queryFn: async () => {
      const { data } = await Api.get<{ data: KoreaModelGroup[] }>(
        "/korea/models",
        { brand: brand as string },
      );
      return data;
    },
    enabled: !!brand,
    staleTime: 60 * 60_000,
  });
}
