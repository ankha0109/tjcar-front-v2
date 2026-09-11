export type FilterValues = {
  marka: string | null;
  model: string | null;
  chassis: string | null;
  rate: string | null;
  lot: string;
  color: string | null;
  engVFrom: number | null;
  engVTo: number | null;
  yearFrom: number | null;
  yearTo: number | null;
  mileageFrom: number | null;
  mileageTo: number | null;
  location: string | null;
  date: string | null;
  /**
   * USS premium lots included in the list. True by default: a guest lands on
   * the whole board and opts out, rather than discovering a filter hid rows.
   * False maps to `auction_type=2` — see `PremiumLotsToggle`.
   */
  showPremium: boolean;
};

export const EMPTY_FILTERS: FilterValues = {
  marka: null,
  model: null,
  chassis: null,
  rate: null,
  lot: "",
  color: null,
  engVFrom: null,
  engVTo: null,
  yearFrom: null,
  yearTo: null,
  mileageFrom: null,
  mileageTo: null,
  location: null,
  date: null,
  showPremium: true,
};

// `date` and `showPremium` are intentionally excluded — the first is primary day-tab navigation
// and the second a viewing scope that sits beside the view-mode switcher. Both
// survive "clear filters" for the same reason: neither is a search criterion.
export function isFiltersEmpty(f: FilterValues): boolean {
  return (
    !f.marka &&
    !f.model &&
    !f.chassis &&
    !f.rate &&
    !f.lot &&
    !f.color &&
    f.engVFrom == null &&
    f.engVTo == null &&
    f.yearFrom == null &&
    f.yearTo == null &&
    f.mileageFrom == null &&
    f.mileageTo == null &&
    !f.location
  );
}

export function filtersToQuery(
  f: FilterValues,
): Record<string, string | number> {
  const q: Record<string, string | number> = {};
  if (f.marka) q.marka = f.marka;
  if (f.model) q.model = f.model;
  if (f.chassis) q.chassis = f.chassis;
  if (f.rate) q.rate = f.rate;
  if (f.lot.trim()) q.lot = f.lot.trim();
  if (f.color) q.color = f.color;
  if (f.engVFrom != null) q.engVFrom = f.engVFrom;
  if (f.engVTo != null) q.engVTo = f.engVTo;
  if (f.yearFrom != null) q.yearFrom = f.yearFrom;
  if (f.yearTo != null) q.yearTo = f.yearTo;
  if (f.mileageFrom != null) q.mileageFrom = f.mileageFrom;
  if (f.mileageTo != null) q.mileageTo = f.mileageTo;
  if (f.location) q.location = f.location;
  if (f.date) q.date = f.date;
  // Only the non-default is serialised, so the common URL stays clean.
  if (!f.showPremium) q.premium = 0;
  return q;
}

/**
 * Map UI `FilterValues` to the `GET /api/japan` backend param names, which
 * differ from the `/featured` contract (`filtersToQuery`). Empty values are
 * omitted. Pagination (`page`, `per_page`) is added by the caller.
 */
export function filtersToAuctionQuery(
  f: FilterValues,
): Record<string, string | number> {
  const q: Record<string, string | number> = {};
  if (f.marka) q.brand = f.marka;
  if (f.model) q.model_name = f.model;
  if (f.chassis) q.chassis = f.chassis;
  if (f.rate) q.rating = f.rate;
  if (f.lot.trim()) q.lotnumber = f.lot.trim();
  if (f.color) q.color = f.color;
  if (f.engVFrom != null) q.eng_v_min = f.engVFrom;
  if (f.engVTo != null) q.eng_v_max = f.engVTo;
  if (f.yearFrom != null) q.start_year = f.yearFrom;
  if (f.yearTo != null) q.end_year = f.yearTo;
  if (f.mileageFrom != null) q.millage_start = f.mileageFrom;
  if (f.mileageTo != null) q.millage_end = f.mileageTo;
  if (f.location) q.auction = f.location;
  if (f.date) q.start_date = f.date;
  // Premium on is the unfiltered board, so it sends nothing at all; only the
  // opt-out narrows the query, to the free (non-USS) lots.
  if (!f.showPremium) q.auction_type = 2;
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

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function pickDate(p: SearchParamRecord, key: string): string | null {
  const s = pickString(p, key);
  return s && DATE_RE.test(s) ? s : null;
}

export function queryToFilters(p: SearchParamRecord): FilterValues {
  return {
    marka: pickString(p, "marka"),
    model: pickString(p, "model"),
    chassis: pickString(p, "chassis"),
    rate: pickString(p, "rate"),
    lot: pickString(p, "lot") ?? "",
    color: pickString(p, "color"),
    engVFrom: pickInt(p, "engVFrom"),
    engVTo: pickInt(p, "engVTo"),
    yearFrom: pickInt(p, "yearFrom"),
    yearTo: pickInt(p, "yearTo"),
    mileageFrom: pickInt(p, "mileageFrom"),
    mileageTo: pickInt(p, "mileageTo"),
    location: pickString(p, "location"),
    date: pickDate(p, "date"),
    // Anything but an explicit "0" is the default-on board, so a malformed or
    // absent param can never silently hide rows.
    showPremium: pickString(p, "premium") !== "0",
  };
}

// ── Raw `/filters*` contract (backend wraps each in `{ data: ... }`) ──
// Catalog refreshes hourly from the AJES feed; see docs/frontend/auction-filters-integration.md.

/** `GET /filters` → brands[].manuf_id is the cascade key into models. */
export type Brand = { manuf_name: string; manuf_id: number };

/** `GET /filters/models` → joined to a brand via `manuf_id`. */
export type CarModel = { model_name: string; manuf_id: number };

/** `GET /filters/chassis` → joined to a model via `model_name` (text, not id). */
export type Chassis = { model_name: string; chassis: string; car_count: number };

/** `GET /filters/colors` → distinct raw COLOR values from the AJES feed. */
export type Color = { color: string };

/** `GET /filters` payload. */
export type FiltersData = { auctions: string[]; brands: Brand[] };

/**
 * UI-facing shape assembled from the three `/filters*` endpoints
 * (see `getFilterOptions` in `@/services/filters`). The cascade is
 * marka → model (filtered by marka) → chassis (filtered by model).
 */
export type FilterOptions = {
  markas: string[];
  models: { name: string; marka: string }[];
  chassis: { code: string; model: string; count: number }[];
  colors: string[];
  auctions: string[];
};

export type MarkaSource = "japan" | "korea" | "ready";

export const RATE_OPTIONS = [
  "S",
  "6",
  "5",
  "4.5",
  "4",
  "3.5",
  "3",
  "2",
  "R",
  "X",
  "RA",
  "G",
] as const;

export const MILEAGE_STEPS = [
  0, 10_000, 25_000, 50_000, 75_000, 100_000, 150_000, 200_000,
] as const;

// Engine displacement steps in cc, used by the ENG_V range selects.
export const ENG_V_STEPS = [
  660, 1000, 1300, 1500, 1800, 2000, 2400, 2500, 3000, 3500, 4000, 4500, 5000,
] as const;

export const YEAR_OPTIONS = (() => {
  const cur = new Date().getFullYear();
  const years: number[] = [];
  for (let y = cur; y >= 2000; y--) years.push(y);
  return years;
})();
