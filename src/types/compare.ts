import type { CarSource } from "./car";
import type { FeaturedCar } from "./featured";
import type { KoreaListing } from "./korea";
import type { WishlistItem } from "./wishlist";
import { wishlistHref, wishlistKey } from "./wishlist";

/**
 * The compare tray stores the same lean snapshot as the wishlist — enough for
 * the header dropdown to render (thumb, name, price) without a fetch. The
 * `/compare` page itself re-fetches full fresh data by id from the backend.
 * Alias so a future divergence stays a one-line change.
 */
export type CompareItem = WishlistItem;

export const MAX_COMPARE = 4;

/** Only upstream-fetchable sources can be compared (`GET /compare` fan-out). */
export type CompareSource = Extract<CarSource, "japan" | "korea">;

export function isComparableSource(source: CarSource): source is CompareSource {
  return source === "japan" || source === "korea";
}

export const compareKey = wishlistKey;
export const compareHref = wishlistHref;

export type CompareRef = { source: CompareSource; id: string };

// Mirrors the backend CompareRequest rule (and the per-source route constraints).
const ITEM_RE = /^(japan:[A-Za-z0-9]+|korea:[A-Za-z0-9_-]+)$/;

/** `japan:123,korea:uuid` → validated, deduped, max-4 refs (order kept). */
export function parseCompareParam(value: string | undefined): CompareRef[] {
  if (!value) return [];

  const seen = new Set<string>();
  const refs: CompareRef[] = [];

  for (const raw of value.split(",")) {
    if (!ITEM_RE.test(raw) || seen.has(raw)) continue;
    seen.add(raw);
    const [source, id] = raw.split(":", 2) as [CompareSource, string];
    refs.push({ source, id });
    if (refs.length === MAX_COMPARE) break;
  }

  return refs;
}

export function buildCompareParam(
  items: ReadonlyArray<Pick<CompareItem, "source" | "id">>,
): string {
  return items.map((item) => `${item.source}:${item.id}`).join(",");
}

// ── `GET /api/compare` response (App\Http\Controllers\Public\CompareController) ──

/** Japan entries add a nullable landed-price estimate to the AJES row. */
export type CompareJapanCar = Omit<FeaturedCar, "PRICE_MNT"> & {
  PRICE_MNT?: number | null;
};

/**
 * One `data[]` entry. Upstream misses come back as `found: false` (the request
 * as a whole never fails on a dead id); request order is preserved.
 */
export type CompareEntry =
  | { source: "japan"; id: string; found: true; car: CompareJapanCar }
  | { source: "korea"; id: string; found: true; car: KoreaListing }
  | { source: CompareSource; id: string; found: false; car: null };
