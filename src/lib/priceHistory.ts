import type { CarFixture } from "@/lib/carFixtures";
import { formatEngine } from "@/utils/carFormat";

/** One comparable car that sold in the recent window. */
export type ComparableSale = {
  /** ISO date (e.g. "2026-06-20"). */
  date: string;
  /** Hammer price in Japanese yen. */
  jpy: number;
  /** Hammer price converted to Mongolian tugrik. */
  mnt: number;
  year?: string;
  mileageKm?: number;
  grade?: string;
};

/**
 * Static placeholder conversion rate (incl. landed cost) used to derive the MNT
 * figure from JPY. The real value will come from the backend list once wired.
 * Tuned so a typical ¥850,000 hammer ≈ 60,000,000₮.
 */
const JPY_TO_MNT = 70.6;

const FALLBACK_BASE_JPY = 850_000;
const SALE_COUNT = 10;
const WINDOW_DAYS = 14;

/** Deterministic string hash → 32-bit seed (so the same car always renders the same data). */
function hashSeed(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** mulberry32 PRNG — deterministic, no Math.random (stable across server/client renders). */
function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Round to the nearest `step` (keeps prices visually clean). */
const roundTo = (value: number, step: number) => Math.round(value / step) * step;

/**
 * Build a deterministic list of comparable sales over the last {@link WINDOW_DAYS}
 * days. STATIC placeholder — the production data will arrive from the backend as a
 * list keyed off the car's make/model/year/engine. Called from the server
 * component, so date math here is safe (no hydration mismatch).
 */
export function getComparableSales(car: CarFixture): ComparableSale[] {
  const baseJpy =
    Number(car.AVG_PRICE) || Number(car.START) || FALLBACK_BASE_JPY;
  const rng = mulberry32(hashSeed(car.ID || car.LOT || "tjcar"));
  const baseMileage = Number(car.MILEAGE) || 0;

  const today = new Date();
  const sales: ComparableSale[] = [];

  for (let i = 0; i < SALE_COUNT; i++) {
    // Oldest first → spread offsets across the window (i=0 → 13 days ago, last → today).
    const daysAgo = Math.round(
      ((WINDOW_DAYS - 1) * (SALE_COUNT - 1 - i)) / (SALE_COUNT - 1),
    );
    const d = new Date(today);
    d.setDate(d.getDate() - daysAgo);

    const variation = (rng() - 0.5) * 0.24; // ±12%
    const jpy = roundTo(baseJpy * (1 + variation), 1_000);
    const mnt = roundTo(jpy * JPY_TO_MNT, 100_000);
    const mileageKm = baseMileage
      ? roundTo(baseMileage * (1 + (rng() - 0.5) * 0.3), 1_000)
      : undefined;

    sales.push({
      date: d.toISOString().slice(0, 10),
      jpy,
      mnt,
      year: car.YEAR || undefined,
      mileageKm,
      grade: car.GRADE || undefined,
    });
  }

  return sales;
}

/** Short spec descriptor, e.g. "Toyota Prius · 2018 · 1.8L". */
export function sameSpecLabel(car: CarFixture): string {
  const name = `${car.MARKA_NAME ?? ""} ${car.MODEL_NAME ?? ""}`.trim();
  return [name, car.YEAR, formatEngine(Number(car.ENG_V) || undefined)]
    .filter(Boolean)
    .join(" · ");
}

/** "850000" → "¥850,000". */
export function formatJpy(value: number): string {
  return `¥${new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value)}`;
}

/** "60000000" → "60,000,000₮". */
export function formatMnt(value: number): string {
  return `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value)}₮`;
}
