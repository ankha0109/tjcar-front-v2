import type { CarCurrency, CarSource } from "./car";

/**
 * Compact, self-contained copy of a saved car. It carries everything the
 * wishlist grid needs so an entry still renders after its source auction is
 * deleted upstream — no live re-fetch required. Kept lean on purpose (a single
 * thumbnail, not the full image list) to bound the row size stored in the DB /
 * localStorage. Builders live in `src/lib/wishlist.ts`.
 */
export type WishlistItem = {
  source: CarSource;
  /** `CarItem.id` — AJES lot id (Japan) or stringified stock id (Korea). */
  id: string;

  marka: string;
  model: string;
  grade?: string;
  year?: string;

  /**
   * The car photo. Image index 0 is the auction evaluation (inspection) sheet
   * whenever more than one image exists, so this holds index 1 in that case.
   */
  thumbnail?: string;
  /** The evaluation (inspection) sheet — image index 0 when a car photo remains. */
  evaluationImage?: string;

  priceMnt: number;
  priceOriginal?: { amount: number; currency: CarCurrency };

  auctionDate?: string;
  auctionGrade?: string;
  lot?: string;

  /** ISO timestamp; drives newest-first ordering. */
  savedAt: string;
};

/** Stable identity used for dedupe/lookup across both sources. */
export function wishlistKey(source: CarSource, id: string): string {
  return `${source}:${id}`;
}

/**
 * Detail-page route for a saved car. Japan lots live under `/japan/{id}`;
 * everything else (stock/Korea) is served by `/korea/{id}` and `/cars/{id}`
 * alike, so we route non-Japan sources to `/korea`.
 */
export function wishlistHref(source: CarSource, id: string): string {
  const segment = source === "japan" ? "japan" : "korea";
  return `/${segment}/${id}`;
}
