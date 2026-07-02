// Korea vehicle catalogue served by the backend `/api/korea` module (CARAPIS
// catalog API). Shape mirrors App\Http\Resources\Korea\KoreaListingResource — a
// pass-through of the CARAPIS vehicle row plus a server-computed `price_mnt`.

// `original_url` (source CDN) is stripped by the backend so the provider stays
// hidden; only the aggregator-hosted `url` reaches the client.
export type KoreaPhoto = {
  url?: string;
  thumb_url?: string;
  is_main?: boolean;
};

/**
 * One vehicle from `GET /api/korea` (`data[]`) or `/api/korea/{id}` (`data`).
 * Source-revealing fields (`source_code`, `listing_url`) are stripped server-side.
 */
export type KoreaListing = {
  id: string;
  brand_name?: string;
  brand_slug?: string;
  model_name?: string;
  model_slug?: string;
  trim?: string;
  generation?: string;
  year?: number;
  /** Normalized USD price. */
  price_usd?: number;
  /** Server-computed MNT price (USD × live rate); mirrors Japan `PRICE_MNT`. */
  price_mnt?: number;
  price_original?: number;
  price_original_currency?: string;
  mileage?: number;
  engine_cc?: number;
  fuel_type?: string;
  transmission?: string;
  body_type?: string;
  color?: string;
  drive_type?: string;
  region?: string;
  has_accident?: boolean | null;
  is_verified?: boolean;
  owner_count?: number;
  features?: string[];
  description?: string;
  vin?: string;
  thumb?: KoreaPhoto;
  photos?: KoreaPhoto[];
  photos_count?: number;
};

export type KoreaFilterValues = {
  make: string | null;
  model: string | null;
  yearFrom: number | null;
  yearTo: number | null;
  /** USD bounds (CARAPIS normalizes every price to USD). */
  priceFrom: number | null;
  priceTo: number | null;
  mileageTo: number | null;
};

export const EMPTY_KOREA_FILTERS: KoreaFilterValues = {
  make: null,
  model: null,
  yearFrom: null,
  yearTo: null,
  priceFrom: null,
  priceTo: null,
  mileageTo: null,
};

export function isKoreaFiltersEmpty(f: KoreaFilterValues): boolean {
  return (
    !f.make &&
    !f.model &&
    f.yearFrom == null &&
    f.yearTo == null &&
    f.priceFrom == null &&
    f.priceTo == null &&
    f.mileageTo == null
  );
}

/** CARAPIS `brand`/`model` filters take slug values (hyundai, ioniq-5). */
function slug(v: string): string {
  return v.trim().toLowerCase().replace(/\s+/g, "-");
}

/**
 * Map UI filters to the `GET /api/korea` backend param names, which mirror the
 * upstream CARAPIS `/vehicles/` contract (brand/model slugs, min_/max_ ranges;
 * price is USD). Empty values are omitted; pagination is added by the caller.
 */
export function koreaFiltersToQuery(
  f: KoreaFilterValues,
): Record<string, string | number> {
  const q: Record<string, string | number> = {};
  if (f.make) q.brand = slug(f.make);
  if (f.model) q.model = slug(f.model);
  if (f.yearFrom != null) q.min_year = f.yearFrom;
  if (f.yearTo != null) q.max_year = f.yearTo;
  if (f.priceFrom != null) q.min_price = f.priceFrom;
  if (f.priceTo != null) q.max_price = f.priceTo;
  if (f.mileageTo != null) q.max_mileage = f.mileageTo;
  return q;
}

type SearchParamRecord = Record<string, string | string[] | undefined>;

function pickString(p: SearchParamRecord, key: string): string | null {
  const v = p[key];
  const s = Array.isArray(v) ? v[0] : v;
  return s && s.trim() ? s : null;
}

function pickInt(p: SearchParamRecord, key: string): number | null {
  const s = pickString(p, key);
  if (s == null) return null;
  const n = Number.parseInt(s, 10);
  return Number.isFinite(n) ? n : null;
}

/** Parse the URL search params (backend param names) back into UI filters. */
export function queryToKoreaFilters(p: SearchParamRecord): KoreaFilterValues {
  return {
    make: pickString(p, "brand"),
    model: pickString(p, "model"),
    yearFrom: pickInt(p, "min_year"),
    yearTo: pickInt(p, "max_year"),
    priceFrom: pickInt(p, "min_price"),
    priceTo: pickInt(p, "max_price"),
    mileageTo: pickInt(p, "max_mileage"),
  };
}
