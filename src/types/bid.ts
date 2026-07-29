import { BID_CUTOFF_HOURS } from "@/lib/bidConfig";
import type { FeaturedCar } from "./featured";

/** Mirrors App\Enums\BidStatus in tjcar-api-v2 (backed by int). */
export const BID_STATUS = {
  Pending: 0,
  Processing: 10,
  Win: 100,
  Lose: 200,
  Canceled: 300,
  Unsold: 400,
} as const;

export type BidStatus = (typeof BID_STATUS)[keyof typeof BID_STATUS];

/** Tab grouping understood by `GET /bids?scope=`. */
export type BidScope = "active" | "closed";

/** Assigned operator, as embedded by BidResource / BidLogResource. */
export type BidOperator = {
  id: number;
  name: string;
  phone: string | null;
};

export type BidLog = {
  id: number;
  bid_id: number;
  status: BidStatus;
  status_label: string;
  comment: string | null;
  user?: BidOperator | null;
  created_at: string | null;
};

export type Bid = {
  id: number;
  customer_id: number;
  /** Snapshot of the AJES lot taken when the bid was placed. */
  car_data: FeaturedCar;
  bid_price: number;
  currency: string;
  start_price: number;
  status: BidStatus;
  /** Localised label from the API — never build this client-side. */
  status_label: string;
  comment: string | null;
  user?: BidOperator | null;
  /** Only present on `GET /bids/{id}`. */
  bid_logs?: BidLog[];
  created_at: string | null;
  updated_at: string | null;
};

/**
 * Auction start as a real instant.
 *
 * `AUCTION_DATE` is a Tokyo-local `Y-m-d H:i:s` string with no offset, so a bare
 * `new Date(...)` would read it in the viewer's timezone. Japan has no DST, so
 * pinning +09:00 is always correct.
 */
export function bidAuctionStart(bid: Bid): Date | null {
  const raw = bid.car_data?.AUCTION_DATE;
  if (!raw) return null;
  const parsed = new Date(`${raw.replace(" ", "T")}+09:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * Mirrors the API's price-edit gate: the bid must still be in play and its
 * auction must be more than BID_CUTOFF_HOURS away. The API is the decider — this
 * only avoids offering an action that would come back 422.
 */
export function isBidEditable(bid: Bid): boolean {
  if (bid.status !== BID_STATUS.Pending && bid.status !== BID_STATUS.Processing) {
    return false;
  }
  const start = bidAuctionStart(bid);
  if (start === null) return false;
  return start.getTime() - BID_CUTOFF_HOURS * 3_600_000 > Date.now();
}
