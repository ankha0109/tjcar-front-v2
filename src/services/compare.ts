import "server-only";
import { cache } from "react";
import ServerApi, { ServerApiError } from "@/services/ServerApi";
import type { CompareEntry } from "@/types/compare";

/**
 * `GET /compare` — batch fresh fetch of mixed japan/korea cars by id. `items`
 * is the raw `japan:1,korea:x` param (the page re-canonicalizes it via
 * `parseCompareParam` first, so a backend 422 only means a hand-crafted URL —
 * treated as "nothing to compare" rather than an error page).
 */
export const getCompare = cache(
  async (items: string): Promise<CompareEntry[]> => {
    try {
      const res = await ServerApi.get<{ data: CompareEntry[] }>(
        "/compare",
        { items },
        { cache: "no-store" },
      );
      return res.data;
    } catch (err) {
      if (err instanceof ServerApiError && err.status === 422) return [];
      throw err;
    }
  },
);
