// Korea vehicle catalogue served by the backend `/api/korea` module, which now
// proxies encar.com's own JSON API directly (CARAPIS was dropped 2026-07).
// Shape mirrors the normalized rows App\Services\Encar\EncarListingService
// builds — no upstream (Encar) field name ever reaches the client.

export type KoreaPhoto = {
  url?: string;
};

/** Standard options grouped by category, translated to English server-side. Detail only. */
export type KoreaOptionGroup = {
  category: string;
  items: string[];
};

/**
 * Normalized 성능점검 (government performance inspection), from
 * `GET /api/korea/{id}/inspection` (`data`). It is NOT part of the detail row:
 * the read costs Encar an upstream call, so it is made only when a buyer opens
 * the report. `null` means nothing to show — none on file, or unreachable.
 * Text values stay in Korean (the source).
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

/** One insurance claim for damage to this car (costs are full KRW). */
export type KoreaInsuranceAccident = {
  date: string | null;
  insurance_benefit: number | null;
  part_cost: number | null;
  labor_cost: number | null;
  painting_cost: number | null;
};

/**
 * Normalized 보험이력 (insurance history), from `GET /api/korea/{id}/insurance`
 * (`data`). On-demand for the same reason as KoreaInspection, and `null` on the
 * same cases. Costs are full KRW.
 */
export type KoreaInsurance = {
  first_registered: string | null;
  my_accident_count: number;
  my_accident_cost: number;
  other_accident_count: number;
  other_accident_cost: number;
  owner_change_count: number;
  plate_change_count: number;
  total_loss_count: number;
  theft_count: number;
  flood_count: number;
  government_use: boolean;
  business_use: boolean;
  accidents: KoreaInsuranceAccident[];
};

/** One model group from `GET /api/korea/models?brand=` (`data[]`). */
export type KoreaModelGroup = {
  /** Korean Encar name — this exact string is what the `model` filter takes. */
  name: string;
  /** English display name, null when untranslatable (show `name` instead). */
  english: string | null;
  /** Live listing count on Encar. */
  count: number;
};

/** Which Encar catalogue a listing or filter set belongs to. */
export type KoreaCategory = "car" | "truck";

/**
 * One vehicle from `GET /api/korea` (`data[]`) or `/api/korea/{id}` (`data`).
 * Detail-only fields are absent on list rows.
 */
export type KoreaListing = {
  id: string;
  brand_slug?: string | null;
  brand_name?: string;
  /** Model line, translated to English server-side when possible. */
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
  /** Official encar.com listing page (detail only) — the "view source" link. */
  listing_url?: string | null;
  thumb?: string | null;
  photos?: KoreaPhoto[];
  /** Which Encar catalogue this row came from. */
  category?: KoreaCategory;
  /** Truck body form slug (`cargo`, `camper`, …) — truck rows only. */
  form?: string | null;
  /** Encar's finer form name, in Korean (파워게이트) — truck rows only. */
  form_detail?: string | null;
  /** Rated payload in tonnes; null when Encar files it as 기타. */
  capacity_tons?: number | null;
};

/**
 * Brand slugs the backend accepts (mirrors EncarListingService::BRANDS — an
 * unknown slug is a 422). Labels are the English names the API returns.
 *
 * `logo` overrides the name handed to `brandLogoUrl`, which derives a
 * carlogos.org slug from the display name. Only two brands need it: the CDN
 * has no "renault-korea" entry, and no post-rename "kg-mobility" logo.
 */
export const KOREA_BRANDS: ReadonlyArray<{
  slug: string;
  label: string;
  logo?: string;
}> = [
  { slug: "hyundai", label: "Hyundai" },
  { slug: "kia", label: "Kia" },
  { slug: "genesis", label: "Genesis" },
  { slug: "chevrolet", label: "Chevrolet" },
  { slug: "renault-korea", label: "Renault Korea", logo: "Renault" },
  { slug: "kg-mobility", label: "KG Mobility", logo: "SsangYong" },
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

/**
 * Curated "popular" Korea makes, in display order. Nine of them, so the home
 * page's featured grid reads as 5×2 with the "browse all" card in the tenth
 * cell; the brands explorer shows the same nine above its A–Z list.
 */
export const FEATURED_KOREA_BRANDS: readonly string[] = [
  "hyundai",
  "kia",
  "genesis",
  "kg-mobility",
  "renault-korea",
  "chevrolet",
  "bmw",
  "mercedes-benz",
  "audi",
];

export function koreaBrand(slug: string) {
  return KOREA_BRANDS.find((b) => b.slug === slug);
}

export function koreaBrandLabel(slug: string): string {
  return koreaBrand(slug)?.label ?? slug;
}

/**
 * Truck-section makes. Mirrors `EncarListingService::TRUCK_BRANDS` — the slugs
 * overlap with KOREA_BRANDS where a make sells both, but the lists are not
 * interchangeable (the backend 422s a slug from the wrong catalogue).
 */
export const KOREA_TRUCK_BRANDS: ReadonlyArray<{
  slug: string;
  label: string;
  logo?: string;
}> = [
  { slug: "hyundai", label: "Hyundai" },
  { slug: "kia", label: "Kia" },
  { slug: "tata-daewoo", label: "Tata Daewoo" },
  { slug: "volvo", label: "Volvo" },
  { slug: "daewoo-bus", label: "Daewoo Bus" },
  { slug: "man", label: "MAN" },
  { slug: "kg-mobility", label: "KG Mobility", logo: "SsangYong" },
  { slug: "isuzu", label: "Isuzu" },
  { slug: "scania", label: "Scania" },
  { slug: "mercedes-benz", label: "Mercedes-Benz" },
  { slug: "renault-korea", label: "Renault Korea", logo: "Renault" },
  { slug: "iveco", label: "Iveco" },
  { slug: "byd", label: "BYD" },
  { slug: "chevrolet", label: "Chevrolet" },
  { slug: "ford", label: "Ford" },
];

export function koreaBrandsFor(category: KoreaCategory) {
  return category === "truck" ? KOREA_TRUCK_BRANDS : KOREA_BRANDS;
}

export function koreaBrandLabelFor(
  category: KoreaCategory,
  slug: string,
): string {
  return koreaBrandsFor(category).find((b) => b.slug === slug)?.label ?? slug;
}

/** Truck body forms the backend accepts (labels via `korea.forms.*`). */
export const KOREA_TRUCK_FORMS = [
  "cargo",
  "wing-body",
  "bus",
  "dump",
  "crane",
  "tank",
  "camper",
  "waste",
  "live-fish",
  "tow",
  "tractor",
  "trailer",
  "other",
] as const;

/** Tonnages the backend accepts for `capacity` (sent as-is). */
export const KOREA_TRUCK_CAPACITIES = [
  "1",
  "1.2",
  "2.5",
  "3.5",
  "4.5",
  "5",
  "8.5",
  "14",
  "25",
] as const;

/** `korea.forms.*` message key for a truck form slug. */
export function koreaFormLabelKey(slug: string): string {
  return `forms.${slug}`;
}

/** `fuel` filter values the backend accepts (labels via `carDetail.fuel.*`). */
export const KOREA_FUELS = [
  "petrol",
  "diesel",
  "hybrid",
  "electric",
  "hydrogen",
  "lpg",
] as const;

/** `transmission` filter values the backend accepts. */
export const KOREA_TRANSMISSIONS = [
  "auto",
  "manual",
  "semi-auto",
  "cvt",
] as const;

/**
 * Full-KRW steps for the price range filter (`min_price` / `max_price`).
 * Coarse at the top because Encar's volume sits under ₩50M — the same
 * shape as `MILEAGE_STEPS` / `ENG_V_STEPS` on the Japan side.
 */
export const KRW_PRICE_STEPS = [
  5_000_000, 10_000_000, 15_000_000, 20_000_000, 30_000_000, 40_000_000,
  50_000_000, 70_000_000, 100_000_000, 150_000_000, 200_000_000,
] as const;

/**
 * `ordering` values the backend accepts (anything else is a 422). Encar sorts
 * upstream, so this has to travel with the request — the whole result set is
 * ordered, not just the pages already loaded. `null` keeps Encar's own default
 * (most recently updated ads first).
 */
export const KOREA_ORDERINGS = ["price", "-price"] as const;

export type KoreaOrdering = (typeof KOREA_ORDERINGS)[number];

export type KoreaFilterValues = {
  /** Which catalogue to search. `car` is the default and stays out of the URL. */
  category: KoreaCategory;
  /** Brand slug from KOREA_BRANDS (the backend rejects anything else). */
  make: string | null;
  /** Korean model-group name exactly as `GET /korea/models` returns it. */
  model: string | null;
  /** Truck body form slug — only meaningful when `category` is `truck`. */
  form: string | null;
  /** Tonnage string as the backend lists it (`1`, `2.5`) — truck only. */
  capacity: string | null;
  yearFrom: number | null;
  yearTo: number | null;
  /** Full KRW bounds (Encar prices are KRW). */
  priceFrom: number | null;
  priceTo: number | null;
  mileageTo: number | null;
  fuel: string | null;
  transmission: string | null;
  /**
   * Sort key. It rides along with the filters because every consumer (URL sync,
   * react-query key, server hydration) already carries them as one unit — but
   * it is not a filter: it adds no chip and survives "clear all".
   */
  ordering: KoreaOrdering | null;
};

export const EMPTY_KOREA_FILTERS: KoreaFilterValues = {
  category: "car",
  make: null,
  model: null,
  form: null,
  capacity: null,
  yearFrom: null,
  yearTo: null,
  priceFrom: null,
  priceTo: null,
  mileageTo: null,
  fuel: null,
  transmission: null,
  ordering: null,
};

/** `ordering` is deliberately excluded — a sort choice is not an active filter. */
export function isKoreaFiltersEmpty(f: KoreaFilterValues): boolean {
  return (
    f.category === "car" &&
    !f.make &&
    !f.model &&
    !f.form &&
    !f.capacity &&
    f.yearFrom == null &&
    f.yearTo == null &&
    f.priceFrom == null &&
    f.priceTo == null &&
    f.mileageTo == null &&
    !f.fuel &&
    !f.transmission
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
  // `car` is the backend default; leaving it out keeps existing URLs identical.
  if (f.category === "truck") q.category = "truck";
  if (f.make) q.brand = f.make;
  if (f.model) q.model = f.model;
  if (f.category === "truck" && f.form) q.form = f.form;
  if (f.category === "truck" && f.capacity) q.capacity = f.capacity;
  if (f.yearFrom != null) q.min_year = f.yearFrom;
  if (f.yearTo != null) q.max_year = f.yearTo;
  if (f.priceFrom != null) q.min_price = f.priceFrom;
  if (f.priceTo != null) q.max_price = f.priceTo;
  if (f.mileageTo != null) q.max_mileage = f.mileageTo;
  if (f.fuel) q.fuel = f.fuel;
  if (f.transmission) q.transmission = f.transmission;
  if (f.ordering) q.ordering = f.ordering;
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

/** A hand-edited `?ordering=` would 422 the backend, so unknown keys drop out. */
function pickOrdering(p: SearchParamRecord): KoreaOrdering | null {
  const s = pickString(p, "ordering");
  return KOREA_ORDERINGS.includes(s as KoreaOrdering)
    ? (s as KoreaOrdering)
    : null;
}

/** A hand-edited `?form=` would 422 the backend, so unknown slugs drop out. */
function pickForm(p: SearchParamRecord): string | null {
  const s = pickString(p, "form");
  return s && (KOREA_TRUCK_FORMS as readonly string[]).includes(s) ? s : null;
}

/** A hand-edited `?capacity=` would 422 the backend, so unknown tonnages drop out. */
function pickCapacity(p: SearchParamRecord): string | null {
  const s = pickString(p, "capacity");
  return s && (KOREA_TRUCK_CAPACITIES as readonly string[]).includes(s)
    ? s
    : null;
}

/**
 * A hand-edited or stale `?brand=` — including one left over from switching
 * `category` — would 422 the backend, so a slug outside the requested
 * category's own catalogue drops out.
 */
function pickMake(p: SearchParamRecord, category: KoreaCategory): string | null {
  const s = pickString(p, "brand");
  return s && koreaBrandsFor(category).some((b) => b.slug === s) ? s : null;
}

/** Parse the URL search params (backend param names) back into UI filters. */
export function queryToKoreaFilters(p: SearchParamRecord): KoreaFilterValues {
  const category: KoreaCategory =
    pickString(p, "category") === "truck" ? "truck" : "car";

  return {
    category,
    make: pickMake(p, category),
    model: pickString(p, "model"),
    form: category === "truck" ? pickForm(p) : null,
    capacity: category === "truck" ? pickCapacity(p) : null,
    yearFrom: pickInt(p, "min_year"),
    yearTo: pickInt(p, "max_year"),
    priceFrom: pickInt(p, "min_price"),
    priceTo: pickInt(p, "max_price"),
    mileageTo: pickInt(p, "max_mileage"),
    fuel: pickString(p, "fuel"),
    transmission: pickString(p, "transmission"),
    ordering: pickOrdering(p),
  };
}
