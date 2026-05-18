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
  };
};

const TIER_CLASSES: Record<GradeTier, GradeInfo["classes"]> = {
  pristine: {
    badgeBg: "bg-emerald-50",
    badgeRing: "ring-emerald-200/80",
    badgeText: "text-emerald-700",
    dot: "bg-emerald-500",
  },
  good: {
    badgeBg: "bg-sky-50",
    badgeRing: "ring-sky-200/80",
    badgeText: "text-sky-700",
    dot: "bg-sky-500",
  },
  average: {
    badgeBg: "bg-amber-50",
    badgeRing: "ring-amber-200/80",
    badgeText: "text-amber-700",
    dot: "bg-amber-500",
  },
  poor: {
    badgeBg: "bg-rose-50",
    badgeRing: "ring-rose-200/80",
    badgeText: "text-rose-700",
    dot: "bg-rose-500",
  },
  repaired: {
    badgeBg: "bg-orange-50",
    badgeRing: "ring-orange-200/80",
    badgeText: "text-orange-700",
    dot: "bg-orange-500",
  },
  damaged: {
    badgeBg: "bg-neutral-900",
    badgeRing: "ring-neutral-800",
    badgeText: "text-white",
    dot: "bg-neutral-900",
  },
  unknown: {
    badgeBg: "bg-neutral-100",
    badgeRing: "ring-neutral-200",
    badgeText: "text-neutral-600",
    dot: "bg-neutral-400",
  },
};

const EMPTY_MARKERS = new Set(["-", "--", "—", "N/A", "NA", "?"]);

export function getGradeInfo(raw: string | undefined | null): GradeInfo | null {
  if (raw == null) return null;
  const trimmed = String(raw).trim();
  if (!trimmed) return null;

  const upper = trimmed.toUpperCase();
  if (EMPTY_MARKERS.has(upper)) return null;

  if (upper === "XX" || upper === "***" || upper === "0") {
    return makeInfo(upper === "0" ? "0" : "XX", "damaged");
  }
  if (upper === "S") {
    return makeInfo("S", "pristine");
  }
  if (upper === "R" || upper === "RA" || upper === "A") {
    return makeInfo(upper, "repaired");
  }

  const n = Number(upper.replace(",", "."));
  if (Number.isFinite(n)) {
    const tier: GradeTier =
      n >= 5 ? "pristine" : n >= 4 ? "good" : n >= 3 ? "average" : "poor";
    const symbol = Number.isInteger(n) ? String(n) : n.toFixed(1);
    return { ...makeInfo(symbol, tier), numeric: n, raw: trimmed };
  }

  return makeInfo(upper, "unknown");
}

function makeInfo(symbol: string, tier: GradeTier): GradeInfo {
  return {
    raw: symbol,
    symbol,
    tier,
    classes: TIER_CLASSES[tier],
  };
}
