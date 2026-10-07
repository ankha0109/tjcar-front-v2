export type GradeTier =
  | "pristine"
  | "good"
  | "average"
  | "poor"
  | "repaired"
  | "damaged"
  | "unknown";

export type GradeInfo = {
  raw: string;
  symbol: string;
  tier: GradeTier;
  numeric?: number;
  classes: {
    badgeBg: string;
    badgeRing: string;
    badgeText: string;
    dot: string;
    /** Standalone coloured text (RateCard's big number) — carries dark variants. */
    text: string;
  };
};

const TIER_CLASSES: Record<GradeTier, GradeInfo["classes"]> = {
  pristine: {
    badgeBg: "bg-emerald-50",
    badgeRing: "ring-emerald-200/80",
    badgeText: "text-emerald-700",
    dot: "bg-emerald-500",
    text: "text-emerald-600 dark:text-emerald-400",
  },
  good: {
    badgeBg: "bg-sky-50",
    badgeRing: "ring-sky-200/80",
    badgeText: "text-sky-700",
    dot: "bg-sky-500",
    text: "text-emerald-600 dark:text-emerald-400",
  },
  average: {
    badgeBg: "bg-amber-50",
    badgeRing: "ring-amber-200/80",
    badgeText: "text-amber-700",
    dot: "bg-amber-500",
    text: "text-amber-600 dark:text-amber-400",
  },
  poor: {
    badgeBg: "bg-rose-50",
    badgeRing: "ring-rose-200/80",
    badgeText: "text-rose-700",
    dot: "bg-rose-500",
    text: "text-rose-600 dark:text-rose-400",
  },
  repaired: {
    badgeBg: "bg-orange-50",
    badgeRing: "ring-orange-200/80",
    badgeText: "text-orange-700",
    dot: "bg-orange-500",
    text: "text-orange-600 dark:text-orange-400",
  },
  damaged: {
    badgeBg: "bg-neutral-900",
    badgeRing: "ring-neutral-800",
    badgeText: "text-white",
    dot: "bg-neutral-900",
    text: "text-red-600 dark:text-red-500",
  },
  unknown: {
    badgeBg: "bg-neutral-100",
    badgeRing: "ring-neutral-200",
    badgeText: "text-neutral-600",
    dot: "bg-neutral-400",
    text: "text-neutral-500 dark:text-neutral-400",
  },
};

const EMPTY_MARKERS = new Set(["-", "--", "—", "N/A", "NA", "?"]);

/**
 * "Grounded" markers. Every Japanese auction house uses one of these for a lot
 * that was never repaired after a crash or engine failure — the WORST thing an
 * inspection sheet can say, not a missing grade.
 */
const GROUNDED = new Set(["***", "**", "*", "X", "XX", "0"]);

/** `R`, `RA`, `RB`, `RC`, `R1`, `R2`, `R?` — accident/repair history. */
const REPAIRED_CODE = /^R[A-C0-9?]?$/;

/** A grade, optionally trailing the interior letter our own stock types in ("4C", "3.5BB"). */
const NUMERIC_GRADE = /^(\d+(?:[.,]\d+)?)\s*([A-Z]{0,2})$/;

/**
 * The overall grade only ever runs 1–9: 1–6 is the real spread, and the rare
 * 7/8/9 (like `S`) mean delivery mileage. A number outside that band is NOT a
 * better-than-perfect car — it is one more grounded marker, which is how a lot
 * graded `99` used to come out emerald: `Number("99") >= 5` read as pristine.
 */
const MIN_GRADE = 1;
const MAX_GRADE = 9;

export function getGradeInfo(raw: string | undefined | null): GradeInfo | null {
  if (raw == null) return null;
  const trimmed = String(raw).trim();
  if (!trimmed) return null;

  const upper = trimmed.toUpperCase();
  if (EMPTY_MARKERS.has(upper)) return null;

  if (GROUNDED.has(upper)) {
    // `***` in a 7×7 badge is unreadable; every other marker prints as sent.
    return makeInfo(upper.startsWith("*") ? "XX" : upper, "damaged", trimmed);
  }
  if (upper === "S") {
    return makeInfo("S", "pristine", trimmed);
  }
  if (upper === "A" || REPAIRED_CODE.test(upper)) {
    return makeInfo(upper, "repaired", trimmed);
  }

  const numeric = NUMERIC_GRADE.exec(upper);
  if (numeric) {
    const n = Number(numeric[1].replace(",", "."));
    if (n < MIN_GRADE || n > MAX_GRADE) {
      return makeInfo(upper, "damaged", trimmed);
    }
    const tier: GradeTier =
      n >= 5 ? "pristine" : n >= 4 ? "good" : n >= 3 ? "average" : "poor";
    // Interior letters ride along ("4C"); a bare number is normalised so a
    // "4.50" from one house lines up with the "4.5" from the next.
    const symbol = numeric[2]
      ? upper
      : Number.isInteger(n)
        ? String(n)
        : n.toFixed(1);
    return { ...makeInfo(symbol, tier, trimmed), numeric: n };
  }

  return makeInfo(upper, "unknown", trimmed);
}

function makeInfo(symbol: string, tier: GradeTier, raw = symbol): GradeInfo {
  return {
    raw,
    symbol,
    tier,
    classes: TIER_CLASSES[tier],
  };
}

/**
 * Overall auction grades, best → worst, shown in the rating legend — the info modal
 * on a lot and the grade table of the auction sheet guide.
 * `key` is the (dot-free) message key — next-intl forbids "." in keys — while
 * `code` is what the badge displays. `matches` lists every raw RATE the row
 * stands for, which is how the current lot's grade is highlighted: the houses
 * spell the same verdict several ways (`RB`/`RC` are still repair history,
 * `99`/`X`/`***` are all "grounded").
 */
export const RATE_GRADES = [
  { code: "S", key: "S", matches: ["S"] },
  { code: "6", key: "6", matches: ["6"] },
  { code: "5", key: "5", matches: ["5"] },
  { code: "4.5", key: "4_5", matches: ["4.5"] },
  { code: "4", key: "4", matches: ["4"] },
  { code: "3.5", key: "3_5", matches: ["3.5"] },
  { code: "3", key: "3", matches: ["3"] },
  { code: "2", key: "2", matches: ["2"] },
  { code: "1", key: "1", matches: ["1"] },
  { code: "RA", key: "RA", matches: ["RA"] },
  { code: "R", key: "R", matches: ["R", "RB", "RC", "R1", "R2", "R?", "A"] },
  {
    code: "99",
    key: "grounded",
    matches: ["99", "X", "XX", "0", "*", "**", "***"],
  },
] as const;

/** Legend badge fill per tier — the key to the colours the card itself uses. */
export const LEGEND_BADGE: Record<GradeTier, string> = {
  pristine: "bg-emerald-600",
  good: "bg-emerald-600",
  average: "bg-amber-500",
  poor: "bg-rose-500",
  repaired: "bg-orange-500",
  damaged: "bg-red-600",
  unknown: "bg-neutral-400",
};
