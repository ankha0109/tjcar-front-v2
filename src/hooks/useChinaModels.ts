"use client";

import { useQuery } from "@tanstack/react-query";
import Api from "@/services/Api";
import type { ChinaCatalogEntry } from "@/types/china";

/** Models the server already read for the brand in the URL (see `getChinaModels`). */
export type ChinaInitialModels = {
  brandId: number;
  models: ChinaCatalogEntry[];
};

/**
 * Models of the selected China brand via `GET /china/models?brand_id=`
 * (listing counts from the local mirror, backend-cached until the next sync).
 * Disabled until a brand is picked — the model select needs a brand to mean
 * anything. `initial` seeds the brand the page was loaded with, so its model
 * label is there on the first paint.
 */
export function useChinaModels(
  brandId: number | null,
  initial?: ChinaInitialModels,
) {
  return useQuery<ChinaCatalogEntry[]>({
    queryKey: ["china-models", brandId],
    queryFn: async () => {
      const { data } = await Api.get<{ data: ChinaCatalogEntry[] }>(
        "/china/models",
        { brand_id: brandId as number },
      );
      return data;
    },
    enabled: brandId != null,
    initialData:
      initial && initial.brandId === brandId ? initial.models : undefined,
    staleTime: 60 * 60_000,
  });
}
