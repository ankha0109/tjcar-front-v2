import "server-only";
import { cache } from "react";
import ServerApi, { ServerApiError } from "@/services/ServerApi";
import type { ResourceObject } from "@/types/api";
import type {
  CalculateVehicleCostRequest,
  VehicleCost,
  VehicleCostResult,
} from "@/types/vehicleCost";

/** The calculator lives under `/v1`; `API_URL` already ends in `/api`. */
const CALCULATE_PATH = "/v1/vehicle-cost/calculate";

/**
 * POST /v1/vehicle-cost/calculate — the landed MNT cost with its display
 * breakdown.
 *
 * Never throws on a calculator refusal. Several §15 codes are ordinary
 * outcomes for a particular listing (`INVALID_MANUFACTURE_DATE` when Encar
 * never stated the month) and a missing exchange rate is an operations
 * problem, not a broken page — the detail page must still render with the
 * asking price. Callers get a discriminated result and show an explanation in
 * the card. Network and 5xx-other failures still throw.
 */
export const calculateVehicleCost = cache(
  async (payload: CalculateVehicleCostRequest): Promise<VehicleCostResult> => {
    try {
      const { data } = await ServerApi.post<ResourceObject<VehicleCost>>(
        CALCULATE_PATH,
        payload,
        { cache: "no-store" },
      );

      return { ok: true, cost: data };
    } catch (err) {
      if (err instanceof ServerApiError && isCalculatorRefusal(err.status)) {
        const details = err.details as { code?: string } | undefined;

        return {
          ok: false,
          code: details?.code ?? "VALIDATION_ERROR",
          message: err.message,
        };
      }

      throw err;
    }
  },
);

/**
 * 422 carries every domain rejection and Laravel's own validation failures;
 * 404 is an unknown listing; 503 is a missing exchange rate. Anything else
 * (network, 500) is a real fault and propagates.
 */
function isCalculatorRefusal(status: number): boolean {
  return status === 422 || status === 404 || status === 503;
}
