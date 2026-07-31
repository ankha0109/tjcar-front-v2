/**
 * `POST /v1/vehicle-cost/calculate` — the landed-cost calculator that prices a
 * Korean or Japanese import (backend `App\Services\VehicleCost`).
 *
 * Contract: `docs/frontend/vehicle-cost-integration.md` in the API repo.
 */

export type VehicleCountry = "JAPAN" | "KOREA";

/**
 * The excise-tax classes the backend recognises. Encar's `fuel_type` does not
 * map onto these one-for-one — see `@/lib/powertrain`.
 */
export type Powertrain =
  | "GASOLINE"
  | "DIESEL"
  | "HEV"
  | "PHEV"
  | "MHEV"
  | "EV";

export type VerificationStatus = "VERIFIED" | "UNVERIFIED" | "REVIEW_REQUIRED";

export type AgeBucket = "AGE_0_3" | "AGE_4_6" | "AGE_7_9" | "AGE_10_PLUS";

export type AdditionalCost = {
  code: string;
  name: string;
  amountMNT: number;
};

export type CalculateVehicleCostRequest = {
  country: VehicleCountry;
  powertrain: Powertrain;

  /** Korea — omit the rest and the backend prefills them from the listing. */
  koreaListingId?: number;
  purchasePriceKRW?: number;
  domesticCostKRW?: number;

  /** Japan */
  purchasePriceJPY?: number;
  auctionName?: string;

  freightUSD?: number;
  manufactureYear?: number;
  manufactureMonth?: number;
  engineCc?: number;

  /** YYYY-MM-DD; defaults to today server-side. */
  calculationDate?: string;
  vinOrChassis?: string;
  vendor?: string;

  additionalCostsMNT?: AdditionalCost[];
};

/**
 * One display row. `amount` is a whole currency unit. The rows whose
 * `currency` is `MNT` sum to `total.amount` exactly — the backend guarantees
 * it, so never re-derive the total here.
 */
export type CostLine = {
  code: string;
  label: string;
  amount: number;
  currency: "MNT" | "KRW" | "JPY";
  /** Ready-made tooltip text, e.g. "1,300 USD × 3,594₮". */
  hint?: string;
};

export type VehicleCost = {
  country: VehicleCountry;
  lines: CostLine[];
  total: { label: string; amount: number; currency: "MNT" };
  verification: {
    status: VerificationStatus;
    manufactureYear: number;
    manufactureMonth: number;
    engineCc: number;
    powertrain: Powertrain;
    exciseMode: "HYBRID" | "NON_HYBRID";
    /** Ready-made Mongolian notices, e.g. VIN could not be verified. */
    warnings: string[];
  };
  age: { completedYears: number; bucket: AgeBucket };
  /** Raw figures — kept for audit/debug, not for rendering the breakdown. */
  detail: {
    rates: {
      source: string;
      rateDate: string;
      jpyToMnt: number | null;
      krwToMnt: number | null;
      usdToMnt: number;
    };
    origin: Record<string, number | string>;
    freight: { freightUSD: number; freightMNT: number };
    tax: {
      customsValueMNT: number;
      customsDutyMNT: number;
      exciseTaxMNT: number;
      vatBaseMNT: number;
      vatMNT: number;
      totalTaxMNT: number;
    };
    additionalCostsMNT: AdditionalCost[];
    /** §9.4 landed cost — excludes any caller-supplied additional costs. */
    result: { landedCostMNT: number };
  };
};

/**
 * The calculator answers with a §15 `code` on failure. Several of those are
 * ordinary outcomes for a given car (an EV has no excise table yet), so the
 * caller renders them as an explanation rather than an error.
 */
export type VehicleCostFailure = {
  code: string;
  /** Backend message — Mongolian only, so prefer a translated string by code. */
  message: string;
};

export type VehicleCostResult =
  | { ok: true; cost: VehicleCost }
  | ({ ok: false } & VehicleCostFailure);
