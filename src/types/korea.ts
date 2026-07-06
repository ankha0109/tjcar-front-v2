// Korea vehicle catalogue served by the backend `/api/korea` module, which now
// proxies encar.com's own JSON API directly (CARAPIS was dropped 2026-07).
// Shape mirrors the normalized rows App\Services\Encar\EncarListingService
// builds — no upstream (Encar) field name ever reaches the client.

export type KoreaPhoto = {
  url?: string;
};

/** Standard options grouped by Encar category (names are Korean). Detail only. */
export type KoreaOptionGroup = {
  category: string;
  items: string[];
};

/**
 * Normalized 성능점검 (government performance inspection). Detail only; null when
 * the car has no inspection on file. Text values stay in Korean (the source).
 */
export type KoreaInspection = {
  state: string | null;
  mileage: number | null;
  mileage_state: string | null;
  tuning: boolean;
  flood: boolean;
  guaranty: string | null;
  vin: string | null;
  paint_panels: string[];
  serious_issues: string[];
  repair_panels: Array<{ part: string; status: string }>;
};

/**
 * One vehicle from `GET /api/korea` (`data[]`) or `/api/korea/{id}` (`data`).
 * Detail-only fields are absent on list rows.
 */
export type KoreaListing = {
  id: string;
  brand_slug?: string | null;
  brand_name?: string;
  /** List rows carry the Encar (Korean) model line; detail is English. */
  model_name?: string | null;
  /** Full Encar model line, e.g. 더 뉴 그랜저 IG (detail only). */
  model_detail?: string | null;
  trim?: string | null;
  year?: number | null;
  /** YYYYMM registration month (detail only). */
  year_month?: string | null;
  /** Full KRW asking price. */
  price_krw?: number | null;
  /** Server-computed MNT price (KRW × config rate); mirrors Japan `PRICE_MNT`. */
  price_mnt?: number | null;
  /** New-car (factory) KRW price (detail only). */
  new_price_krw?: number | null;
  mileage?: number | null;
  /** Engine displacement in cc (detail only). */
  displacement?: number | null;
  seat_count?: number | null;
  fuel_type?: string | null;
  transmission?: string | null;
  color?: string | null;
  body_type?: string | null;
  region?: string | null;
  option_count?: number | null;
  /** Standard options grouped by category (detail only). */
  options?: KoreaOptionGroup[];
  /** Government performance-inspection summary (detail only, may be null). */
  inspection?: KoreaInspection | null;
  /** Official encar.com listing page (detail only) — the "view source" link. */
  listing_url?: string | null;
  thumb?: string | null;
  photos?: KoreaPhoto[];
};

/**
 * Brand slugs the backend accepts (mirrors EncarListingService::BRANDS — an
 * unknown slug is a 422). Labels are the English names the API returns.
 */
export const KOREA_BRANDS: ReadonlyArray<{ slug: string; label: string }> = [
  { slug: "hyundai", label: "Hyundai" },
  { slug: "kia", label: "Kia" },
  { slug: "genesis", label: "Genesis" },
  { slug: "chevrolet", label: "Chevrolet" },
  { slug: "renault-korea", label: "Renault Korea" },
  { slug: "kg-mobility", label: "KG Mobility" },
  { slug: "bmw", label: "BMW" },
  { slug: "mercedes-benz", label: "Mercedes-Benz" },
  { slug: "audi", label: "Audi" },
  { slug: "volkswagen", label: "Volkswagen" },
  { slug: "volvo", label: "Volvo" },
  { slug: "lexus", label: "Lexus" },
  { slug: "toyota", label: "Toyota" },
  { slug: "honda", label: "Honda" },
  { slug: "nissan", label: "Nissan" },
  { slug: "ford", label: "Ford" },
  { slug: "jeep", label: "Jeep" },
  { slug: "land-rover", label: "Land Rover" },
  { slug: "porsche", label: "Porsche" },
  { slug: "mini", label: "Mini" },
  { slug: "tesla", label: "Tesla" },
];

export function koreaBrandLabel(slug: string): string {
  return KOREA_BRANDS.find((b) => b.slug === slug)?.label ?? slug;
}

export type KoreaFilterValues = {
  /** Brand slug from KOREA_BRANDS (the backend rejects anything else). */
  make: string | null;
  yearFrom: number | null;
  yearTo: number | null;
  /** Full KRW bounds (Encar prices are KRW). */
  priceFrom: number | null;
  priceTo: number | null;
  mileageTo: number | null;
};

export const EMPTY_KOREA_FILTERS: KoreaFilterValues = {
  make: null,
  yearFrom: null,
  yearTo: null,
  priceFrom: null,
  priceTo: null,
  mileageTo: null,
};

export function isKoreaFiltersEmpty(f: KoreaFilterValues): boolean {
  return (
    !f.make &&
    f.yearFrom == null &&
    f.yearTo == null &&
    f.priceFrom == null &&
    f.priceTo == null &&
    f.mileageTo == null
  );
}

/**
 * Map UI filters to the `GET /api/korea` backend param names (brand slug,
 * min_/max_ ranges; price is full KRW). Empty values are omitted; pagination
 * is added by the caller.
 */
export function koreaFiltersToQuery(
  f: KoreaFilterValues,
): Record<string, string | number> {
  const q: Record<string, string | number> = {};
  if (f.make) q.brand = f.make;
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
    yearFrom: pickInt(p, "min_year"),
    yearTo: pickInt(p, "max_year"),
    priceFrom: pickInt(p, "min_price"),
    priceTo: pickInt(p, "max_price"),
    mileageTo: pickInt(p, "max_mileage"),
  };
}
