import "server-only";
import { cache } from "react";
import ServerApi from "@/services/ServerApi";

export type SiteConfig = {
  /** JPY → MNT exchange rate. */
  JPY: number;
  /** USD → MNT exchange rate. */
  USD: number;
};

/**
 * GET /config — public site config (live exchange rates, etc). Wrapped in React
 * `cache` so repeated reads in one request hit the API once. Failures degrade
 * gracefully to zeroed rates so callers stay renderable.
 */
export const getConfig = cache(async (): Promise<SiteConfig> => {
  try {
    const { data } = await ServerApi.get<{ data: Record<string, string> }>(
      "/config",
      {},
      { cache: "no-store" },
    );
    return {
      JPY: Number(data?.JPY) || 0,
      USD: Number(data?.USD) || 0,
    };
  } catch {
    return { JPY: 0, USD: 0 };
  }
});
