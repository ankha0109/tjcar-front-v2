/**
 * AJES lot lifecycle, read off `main.STATUS`.
 *
 * The upstream spells the same verdict several ways — `Sold` and `sold` arrive
 * in one result set, and a lot pulled from the sale reads `Cancelled` or
 * `removed` depending on the house. Normalise once here so no caller ever
 * compares a raw status string.
 *
 * An empty STATUS is the ONLY "still to come" value: the field stays blank
 * until the lot has been through the auction.
 */
export type AuctionResultState =
  | "upcoming"
  | "sold"
  | "unsold"
  | "cancelled"
  /** Non-empty but unrecognised — the sale happened, the verdict is unknown. */
  | "other";

export function auctionResultState(status: string): AuctionResultState {
  const s = String(status ?? "").trim().toLowerCase().replace(/\s+/g, " ");

  if (!s) return "upcoming";
  // Checked before `sold` so "not sold" cannot fall through to a sale.
  if (s.startsWith("not sold")) return "unsold";
  // "sold", "Sold", "Sold By Nego" — a negotiated sale is still a sale. Any
  // future upstream status beginning with "sold" is treated as one too, so
  // do not widen this prefix without checking what it would now claim.
  if (s.startsWith("sold")) return "sold";
  if (s === "cancelled" || s === "canceled" || s === "removed") {
    return "cancelled";
  }

  return "other";
}

/**
 * True once the lot has been through the auction, whatever the outcome — no bid
 * can be placed on any of those states.
 */
export function isAuctionFinished(status: string): boolean {
  return auctionResultState(status) !== "upcoming";
}
