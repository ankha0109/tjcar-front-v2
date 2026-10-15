// China dealer stock served by the backend `/api/china` module — a local mirror
// of the AJES `china` table (fixed-price che168-style listings, priced in yuan)
// that `china:sync` keeps. Shape mirrors App\Http\Resources\China\
// ChinaListingResource, which follows the `/korea` row's snake_case naming.

export type ChinaPhoto = {
  url: string;
};

/** One vehicle from `GET /api/china` (`data[]`) or `/api/china/{id}` (`data`). */
export type ChinaListing = {
  /** AJES id (mixed-case alphanumeric) — the id every route speaks. */
  id: string;
  lot?: string | null;
  brand_id?: number | null;
  brand_name?: string | null;
  model_id?: number | null;
  model_name?: string | null;
  grade?: string | null;
  year?: number | null;
  /** Null on electric cars, which carry `power` alone. */
  engine_cc?: number | null;
  /** Horsepower. */
  power?: number | null;
  /**
   * One of AutoHome's six fuel types. List rows carry the type the API derives
   * from the trim; a detail row carries the spec sheet's own when it has one.
   */
  fuel_type?: ChinaFuel | null;
  transmission?: ChinaTransmission | null;
  drive?: ChinaDrive | null;
  /** One of the eight AJES colour buckets (CHINA_COLORS). */
  color?: string | null;
  mileage?: number | null;
  /** Dealer's city, romanized ("Kunming Yunnan"). */
  city?: string | null;
  /** Full-size photos on the AJES image host (resizable via `&w=`). */
  photos?: ChinaPhoto[];
  /** First photo at card size (`&w=320`). */
  thumb?: string | null;
  /** Asking price in yuan. */
  price_cny?: number | null;
  /** Server-computed MNT price (CNY × config rate); absent while no rate is set. */
  price_mnt?: number | null;
  first_seen_at?: string | null;

  // Detail only — read from the upstream's full row, so every one of these is
  // null or empty when that read failed and the page fell back to the mirror.
  vin?: string | null;
  /** English body class from the spec sheet ("Compact SUV"). */
  body_type?: string | null;
  seats?: number | null;
  /** First registration, `2022-10-01` (or `2022-10`). */
  first_registered?: string | null;
  /** New-car (manufacturer's guide) price in yuan. */
  new_price_cny?: number | null;
  /** The che168 spec sheet, in the upstream's English. */
  specs?: ChinaSpecSection[];
  /** Highlighted equipment, English names. */
  options?: string[];
};

/** One section of the detail spec sheet; `title` is null for the untitled ones. */
export type ChinaSpecSection = {
  title: string | null;
  items: Array<{ label: string; value: string }>;
};

/** One row of `GET /china/brands` or `/china/models?brand_id=` (`data[]`). */
export type ChinaCatalogEntry = {
  id: number;
  name: string;
  /** Listings in the mirror. */
  count: number;
};

/** `transmission` values the backend accepts (ChinaListingService::TRANSMISSIONS). */
export const CHINA_TRANSMISSIONS = ["auto", "manual"] as const;
export type ChinaTransmission = (typeof CHINA_TRANSMISSIONS)[number];

/**
 * `fuel` values the backend accepts (App\Enums\ChinaFuelType) — the six
 * buttons of AutoHome's own fuel filter, in its order. Labels via `china.fuels.*`.
 */
export const CHINA_FUELS = [
  "petrol",
  "diesel",
  "electric",
  "range-extender",
  "plug-in-hybrid",
  "hybrid",
] as const;
export type ChinaFuel = (typeof CHINA_FUELS)[number];

/** `drive` values the backend accepts (ChinaListingService::DRIVES). */
export const CHINA_DRIVES = ["fwd", "rwd", "awd"] as const;
export type ChinaDrive = (typeof CHINA_DRIVES)[number];

/**
 * Every colour the AJES feed writes — eight fixed buckets that together cover
 * the whole table (measured against `meta.total`, 2026-10-14). The backend
 * filters on the exact string, so these travel as-is. Most-listed first.
 */
export const CHINA_COLORS = [
  "White",
  "Black",
  "Silver-Gray",
  "Blue",
  "Red-Purple",
  "Brown-Champagne",
  "Green",
  "Yellow-Orange",
] as const;
export type ChinaColor = (typeof CHINA_COLORS)[number];

/**
 * The `carDetail.colors.*` keys each bucket is labelled with. Two-colour
 * buckets read as both ("Мөнгөлөг / Саарал") so a grey car is not filed under
 * "silver" alone; the first key is the dominant colour, which the card's
 * single word and the swatch use. Champagne leads its bucket: the cars filed
 * there are mostly the pale beige-gold common in China, and a brown dot on
 * them read wrong.
 */
const CHINA_COLOR_KEYS: Record<ChinaColor, readonly string[]> = {
  White: ["white"],
  Black: ["black"],
  "Silver-Gray": ["silver", "gray"],
  Blue: ["blue"],
  "Red-Purple": ["red", "purple"],
  "Brown-Champagne": ["beige", "brown"],
  Green: ["green"],
  "Yellow-Orange": ["yellow", "orange"],
};

function isChinaColor(color: string): color is ChinaColor {
  return (CHINA_COLORS as readonly string[]).includes(color);
}

/** Resolves a `carDetail.colors.*` key — `t` from `useTranslations("carDetail")`. */
type ColorTranslator = (key: string) => string;

/** Full bucket label ("Мөнгөлөг / Саарал"); an unknown colour stays raw. */
export function chinaColorLabel(color: string, t: ColorTranslator): string {
  if (!isChinaColor(color)) return color;
  return CHINA_COLOR_KEYS[color].map((key) => t(`colors.${key}`)).join(" / ");
}

/** The bucket's dominant colour alone ("Мөнгөлөг"), for the compact card. */
export function chinaColorShortLabel(color: string, t: ColorTranslator): string {
  if (!isChinaColor(color)) return color;
  return t(`colors.${CHINA_COLOR_KEYS[color][0]}`);
}

/** English name of the dominant colour, which `getColorSwatch` paints. */
export function chinaColorSwatchName(color: string): string {
  return isChinaColor(color) ? CHINA_COLOR_KEYS[color][0] : color;
}

/**
 * Yuan steps for the price range filter (`min_price` / `max_price`). Spaced
 * against the stock's own spread: a quarter of it sits under ¥50k, half under
 * ¥80k, and only ~2% above ¥1M.
 */
export const CNY_PRICE_STEPS = [
  10_000, 20_000, 30_000, 50_000, 80_000, 100_000, 150_000, 200_000, 300_000,
  500_000, 1_000_000,
] as const;

/**
 * `ordering` values the backend accepts (anything else is a 422). `null` keeps
 * its default, most recently listed first.
 */
export const CHINA_ORDERINGS = [
  "price",
  "-price",
  "mileage",
  "-mileage",
  "year",
  "-year",
] as const;
export type ChinaOrdering = (typeof CHINA_ORDERINGS)[number];

export type ChinaFilterValues = {
  /** Id from `GET /china/brands`. */
  brandId: number | null;
  /** Id from `GET /china/models?brand_id=` — only kept alongside its brand. */
  modelId: number | null;
  yearFrom: number | null;
  yearTo: number | null;
  /** Yuan bounds (the mirror prices in CNY). */
  priceFrom: number | null;
  priceTo: number | null;
  mileageFrom: number | null;
  mileageTo: number | null;
  /** Displacement bounds in cc; an electric car has none, so any bound leaves it out. */
  engineFrom: number | null;
  engineTo: number | null;
  fuel: ChinaFuel | null;
  transmission: ChinaTransmission | null;
  drive: ChinaDrive | null;
  color: ChinaColor | null;
  /**
   * Sort key. It rides along with the filters for the same reason Korea's does
   * (URL sync, query key and server hydration carry them as one unit), but it
   * is not a filter: it adds no chip and survives "clear all".
   */
  ordering: ChinaOrdering | null;
};

export const EMPTY_CHINA_FILTERS: ChinaFilterValues = {
  brandId: null,
  modelId: null,
  yearFrom: null,
  yearTo: null,
  priceFrom: null,
  priceTo: null,
  mileageFrom: null,
  mileageTo: null,
  engineFrom: null,
  engineTo: null,
  fuel: null,
  transmission: null,
  drive: null,
  color: null,
  ordering: null,
};

/** `ordering` is deliberately excluded — a sort choice is not an active filter. */
export function isChinaFiltersEmpty(f: ChinaFilterValues): boolean {
  return (
    f.brandId == null &&
    f.modelId == null &&
    f.yearFrom == null &&
    f.yearTo == null &&
    f.priceFrom == null &&
    f.priceTo == null &&
    f.mileageFrom == null &&
    f.mileageTo == null &&
    f.engineFrom == null &&
    f.engineTo == null &&
    !f.fuel &&
    !f.transmission &&
    !f.drive &&
    !f.color
  );
}

/**
 * Map UI filters to the `GET /api/china` param names. Empty values are
 * omitted; pagination is added by the caller.
 */
export function chinaFiltersToQuery(
  f: ChinaFilterValues,
): Record<string, string | number> {
  const q: Record<string, string | number> = {};
  if (f.brandId != null) q.brand_id = f.brandId;
  if (f.brandId != null && f.modelId != null) q.model_id = f.modelId;
  if (f.yearFrom != null) q.min_year = f.yearFrom;
  if (f.yearTo != null) q.max_year = f.yearTo;
  if (f.priceFrom != null) q.min_price = f.priceFrom;
  if (f.priceTo != null) q.max_price = f.priceTo;
  if (f.mileageFrom != null) q.min_mileage = f.mileageFrom;
  if (f.mileageTo != null) q.max_mileage = f.mileageTo;
  if (f.engineFrom != null) q.min_engine_cc = f.engineFrom;
  if (f.engineTo != null) q.max_engine_cc = f.engineTo;
  if (f.fuel) q.fuel = f.fuel;
  if (f.transmission) q.transmission = f.transmission;
  if (f.drive) q.drive = f.drive;
  if (f.color) q.color = f.color;
  if (f.ordering) q.ordering = f.ordering;
  return q;
}

type SearchParamRecord = Record<string, string | string[] | undefined>;

function pickString(p: SearchParamRecord, key: string): string | null {
  const v = p[key];
  const s = Array.isArray(v) ? v[0] : v;
  return s && s.trim() ? s : null;
}

/**
 * An integer within the backend's own bounds, or null. A hand-edited value
 * outside them (`brand_id=0`, `min_year=1800`) would 422 the whole list.
 */
function pickInt(
  p: SearchParamRecord,
  key: string,
  min: number,
  max = Number.MAX_SAFE_INTEGER,
): number | null {
  const s = pickString(p, key);
  if (s == null || !/^\d+$/.test(s)) return null;
  const n = Number.parseInt(s, 10);
  return n >= min && n <= max ? n : null;
}

/** A hand-edited enum value would 422 the backend, so unknown ones drop out. */
function pickOneOf<T extends string>(
  p: SearchParamRecord,
  key: string,
  allowed: readonly T[],
): T | null {
  const s = pickString(p, key);
  return s && (allowed as readonly string[]).includes(s) ? (s as T) : null;
}

/** Parse the URL search params (backend param names) back into UI filters. */
export function queryToChinaFilters(p: SearchParamRecord): ChinaFilterValues {
  const brandId = pickInt(p, "brand_id", 1);

  return {
    brandId,
    // The model select needs its brand to resolve a label, so a stray
    // `model_id` without one is dropped rather than filtering invisibly.
    modelId: brandId != null ? pickInt(p, "model_id", 1) : null,
    yearFrom: pickInt(p, "min_year", 1950, 2100),
    yearTo: pickInt(p, "max_year", 1950, 2100),
    priceFrom: pickInt(p, "min_price", 0),
    priceTo: pickInt(p, "max_price", 0),
    mileageFrom: pickInt(p, "min_mileage", 0),
    mileageTo: pickInt(p, "max_mileage", 0),
    engineFrom: pickInt(p, "min_engine_cc", 0, 20_000),
    engineTo: pickInt(p, "max_engine_cc", 0, 20_000),
    fuel: pickOneOf(p, "fuel", CHINA_FUELS),
    transmission: pickOneOf(p, "transmission", CHINA_TRANSMISSIONS),
    drive: pickOneOf(p, "drive", CHINA_DRIVES),
    color: pickOneOf(p, "color", CHINA_COLORS),
    ordering: pickOneOf(p, "ordering", CHINA_ORDERINGS),
  };
}
