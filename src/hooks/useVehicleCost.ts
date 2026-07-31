"use client";

import { useQuery } from "@tanstack/react-query";
import Api, { ApiError } from "@/services/Api";
import type {
  CalculateVehicleCostRequest,
  VehicleCost,
  VehicleCostResult,
} from "@/types/vehicleCost";

/**
 * POST /v1/vehicle-cost/calculate from the client.
 *
 * The page computes the cost server-side whenever the powertrain is
 * unambiguous, so this only runs for the hybrid case, where the buyer has to
 * pick HEV / PHEV / MHEV before the car can be priced at all.
 *
 * Mirrors `services/vehicleCost.ts`: a calculator refusal resolves to a
 * failure result rather than rejecting, so the card explains itself instead of
 * showing an error boundary. `staleTime: Infinity` because the answer only
 * moves when the exchange rate does, and the buyer is toggling between a
 * handful of choices.
 */
export function useVehicleCost(
  payload: CalculateVehicleCostRequest | null,
  cacheKey: string,
) {
  return useQuery<VehicleCostResult>({
    queryKey: ["vehicle-cost", cacheKey, payload?.powertrain ?? null],
    enabled: payload !== null,
    staleTime: Infinity,
    queryFn: async () => {
      try {
        const res = await Api.post<{ data: VehicleCost }>(
          "/v1/vehicle-cost/calculate",
          payload,
        );

        return { ok: true, cost: res.data };
      } catch (err) {
        if (err instanceof ApiError && isCalculatorRefusal(err.status)) {
          const details = err.details as
            | { code?: string; message?: string }
            | undefined;

          return {
            ok: false,
            code: details?.code ?? "VALIDATION_ERROR",
            message: details?.message ?? err.message,
          };
        }

        throw err;
      }
    },
  });
}

function isCalculatorRefusal(status: number): boolean {
  return status === 422 || status === 404 || status === 503;
}
