/**
 * Bid / deposit constants and helpers for the auction bid panel.
 *
 * Ported from v1 (`AuctionBid.js` + `carUtils.calculatePrePayment`). The advance
 * payment tiers are frontend-only — the v2 backend does not compute them.
 */

/** Minimum wallet balance (MNT) a customer must hold before the bid form unlocks. */
export const MINIMUM_BALANCE = 2_000_000;

/** Bid must be placed at least this many hours before the auction starts. */
export const BID_CUTOFF_HOURS = 2;

type AdvanceTier = {
  /** Up-front advance payment percentage. */
  percent: number;
  /** Remainder paid after the car lands in Mongolia. */
  remainderPercent: number;
};

/**
 * Tiered advance payment based on the total bid price (MNT):
 *  - ≤ 30M   → 20% up front
 *  - ≤ 120M  → 30% up front
 *  - else    → 60% up front
 */
export function advanceTier(bidMnt: number): AdvanceTier {
  if (bidMnt <= 30_000_000) return { percent: 20, remainderPercent: 80 };
  if (bidMnt <= 120_000_000) return { percent: 30, remainderPercent: 70 };
  return { percent: 60, remainderPercent: 40 };
}

export function formatMnt(value: number): string {
  return new Intl.NumberFormat("mn-MN").format(Math.round(value || 0)) + "₮";
}

export function formatJpy(value: number): string {
  return new Intl.NumberFormat("ja-JP").format(Math.round(value || 0)) + "¥";
}
