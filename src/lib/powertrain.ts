import type { Powertrain } from "@/types/vehicleCost";

/**
 * Encar reports a fuel type; the calculator wants an excise-tax class. The two
 * do not line up, and the backend deliberately refuses to guess — picking HEV
 * where the car is really MHEV silently selects the wrong tax table.
 *
 * Backend `EncarListingService::FUEL_MAP` normalises every Korean label into
 * one of six values, and three of them cannot be resolved here:
 *
 * - `hybrid` covers 하이브리드, 가솔린+전기 and 디젤+전기 alike, so it could be
 *   HEV, PHEV or MHEV. The buyer picks.
 * - `lpg` and `hydrogen` have no `Powertrain` case at all — the source
 *   specification (§4) only defines six, none of them LPG or hydrogen.
 * - `electric` maps to `EV`, which the specification lists but leaves without
 *   an excise table, so the API answers `EXCISE_TAX_NOT_CONFIGURED`.
 *
 * For those, we show an explanation instead of a number rather than quote a
 * price we cannot stand behind.
 */
export type PowertrainResolution =
  /** Unambiguous — calculate immediately. */
  | { kind: "resolved"; powertrain: Powertrain }
  /** Ambiguous — the buyer must choose before we can price it. */
  | { kind: "choice"; options: readonly Powertrain[] }
  /** No excise rule exists for this fuel; explain rather than price. */
  | { kind: "unsupported"; reason: UnsupportedReason };

export type UnsupportedReason = "electric" | "lpg" | "hydrogen" | "unknown";

/**
 * Only two options, not three: §4.2 puts HEV and PHEV in the same `HYBRID`
 * excise mode, so both produce an identical total (verified against the live
 * API — a Grand Koleos prices at 119,239,131₮ either way). Offering the buyer
 * a choice that cannot change the answer is noise, so `HEV` stands for both
 * and the label says so. MHEV is the one that genuinely differs: the API
 * refuses it with `POWERTRAIN_REVIEW_REQUIRED` pending a manual ruling.
 *
 * If the excise rules ever split HEV from PHEV, add `PHEV` back here.
 */
const HYBRID_CHOICES = ["HEV", "MHEV"] as const;

/**
 * @param fuelType backend-normalised value: petrol | diesel | hybrid |
 *   electric | hydrogen | lpg. Anything else (including null) is `unknown`.
 */
export function resolvePowertrain(
  fuelType: string | null | undefined,
): PowertrainResolution {
  switch (fuelType) {
    case "petrol":
      return { kind: "resolved", powertrain: "GASOLINE" };
    case "diesel":
      return { kind: "resolved", powertrain: "DIESEL" };
    case "hybrid":
      return { kind: "choice", options: HYBRID_CHOICES };
    case "electric":
      return { kind: "unsupported", reason: "electric" };
    case "lpg":
      return { kind: "unsupported", reason: "lpg" };
    case "hydrogen":
      return { kind: "unsupported", reason: "hydrogen" };
    default:
      return { kind: "unsupported", reason: "unknown" };
  }
}
