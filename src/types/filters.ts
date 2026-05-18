export type FilterValues = {
  marka: string | null;
  model: string | null;
  body: string | null;
  rate: string | null;
  lot: string;
  yearFrom: number | null;
  yearTo: number | null;
  mileageFrom: number | null;
  mileageTo: number | null;
  location: string | null;
  date: string | null;
};

export const EMPTY_FILTERS: FilterValues = {
  marka: null,
  model: null,
  body: null,
  rate: null,
  lot: "",
  yearFrom: null,
  yearTo: null,
  mileageFrom: null,
  mileageTo: null,
  location: null,
  date: null,
};

// `date` is intentionally excluded — it's primary day-tab navigation, not a chip-style filter.
export function isFiltersEmpty(f: FilterValues): boolean {
  return (
    !f.marka &&
    !f.model &&
    !f.body &&
    !f.rate &&
    !f.lot &&
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
  if (f.body) q.body = f.body;
  if (f.rate) q.rate = f.rate;
  if (f.lot.trim()) q.lot = f.lot.trim();
  if (f.yearFrom != null) q.yearFrom = f.yearFrom;
  if (f.yearTo != null) q.yearTo = f.yearTo;
  if (f.mileageFrom != null) q.mileageFrom = f.mileageFrom;
  if (f.mileageTo != null) q.mileageTo = f.mileageTo;
  if (f.location) q.location = f.location;
  if (f.date) q.date = f.date;
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
    body: pickString(p, "body"),
    rate: pickString(p, "rate"),
    lot: pickString(p, "lot") ?? "",
    yearFrom: pickInt(p, "yearFrom"),
    yearTo: pickInt(p, "yearTo"),
    mileageFrom: pickInt(p, "mileageFrom"),
    mileageTo: pickInt(p, "mileageTo"),
    location: pickString(p, "location"),
    date: pickDate(p, "date"),
  };
}

export type FilterOptions = {
  markas: string[];
  models: { name: string; marka?: string }[];
  bodies: string[];
  locations: string[];
};

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

export const YEAR_OPTIONS = (() => {
  const cur = new Date().getFullYear();
  const years: number[] = [];
  for (let y = cur; y >= 2000; y--) years.push(y);
  return years;
})();
