import type { HouseId } from "./types";

// Kept out of `index.ts` on purpose: the index imports all ten layouts, and the
// lot page only needs this lookup to build a link.

/** First word of an AJES `AUCTION` name → the form that hall prints. */
const PREFIX: Record<string, HouseId> = {
  USS: "uss",
  TAA: "taa",
  JU: "ju",
  CAA: "caa",
  MIRIVE: "mirive",
  BAYAUC: "bayauc",
  BAY: "bayauc",
  IAA: "iaa",
  HERO: "hero",
  ARAI: "arai",
  LAA: "laa",
};

/**
 * Which guide tab a lot belongs to: `"USS Niigata"` → `uss`, `"JU Gifu"` → `ju`.
 * `undefined` for the houses the guide does not draw (Honda, NAA, ORIX…) — the
 * caller then links to the guide without preselecting a tab.
 */
export function matchHouse(auctionName: string | undefined): HouseId | undefined {
  const first = auctionName?.trim().toUpperCase().split(/[\s/(-]+/)[0];
  return first ? PREFIX[first] : undefined;
}
