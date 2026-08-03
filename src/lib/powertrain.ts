import type { Powertrain } from "@/types/vehicleCost";

/**
 * Encar reports a fuel type; the calculator wants an excise-tax class.
 *
 * The two used not to line up. `hybrid` covers 하이브리드, 가솔린+전기 and
 * 디젤+전기 alike, so a listing could be HEV, PHEV or MHEV, and because those
 * were taxed differently the buyer had to pick one before we could quote
 * anything; EV, LPG and hydrogen had no excise rule at all and got an
 * explanation instead of a number. Operations settled it on 2026-08-03: only
 * plain petrol and diesel pay the full rate, and every other class — HEV,
 * PHEV, MHEV, EV, LPG, hydrogen — is assessed on the same half-rate hybrid
 * grid. The distinction stopped mattering, so the picker is gone and every
 * listing prices itself.
 *
 * Backend `EncarListingService::FUEL_MAP` normalises every Korean label into
 * one of these six values, and each now maps to exactly one class.
 */
const BY_FUEL_TYPE: Record<string, Powertrain> = {
  petrol: "GASOLINE",
  diesel: "DIESEL",
  hybrid: "HEV",
  electric: "EV",
  lpg: "LPG",
  hydrogen: "HYDROGEN",
};

/**
 * @param fuelType backend-normalised value: petrol | diesel | hybrid |
 *   electric | hydrogen | lpg.
 * @returns the excise class, or `null` when the listing states no fuel type we
 *   recognise — that could be either excise mode, and half the excise tax is
 *   too wide a gap to guess across, so the card explains itself instead.
 */
export function resolvePowertrain(
  fuelType: string | null | undefined,
): Powertrain | null {
  return (fuelType ? BY_FUEL_TYPE[fuelType] : null) ?? null;
}
