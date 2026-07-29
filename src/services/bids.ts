import Api from "./Api";
import type { Paginated } from "@/types/api";
import type { Bid, BidScope } from "@/types/bid";

/**
 * Customer bids on Japan auction lots (tjcar-api-v2 `Customer\BidController`).
 *
 * Client-side on purpose: a bid moves Pending → Processing → Win/Lose while the
 * customer is watching, so these go through `Api`, which proxies via /api/v1 and
 * attaches the Sanctum bearer server-side.
 */

/** GET /bids — the authenticated customer's bids, newest first. */
export function listBids(
  scope: BidScope | undefined,
  page = 1,
  perPage = 10,
): Promise<Paginated<Bid>> {
  // `buildQuery` drops undefined, so an absent scope means "everything".
  return Api.get<Paginated<Bid>>("/bids", {
    scope,
    page,
    per_page: perPage,
  });
}

/** GET /bids/{id} — one owned bid, with its status log. Another customer's id 404s. */
export async function getBid(id: string): Promise<Bid> {
  const res = await Api.get<{ data: Bid }>(`/bids/${id}`);
  return res.data;
}

/**
 * PATCH /bids/{id} — change the offered price.
 *
 * Throws `ApiError` 422 when the bid is closed or its auction is inside the
 * 2-hour cutoff; `message` is already Mongolian and is meant to be shown as-is.
 */
export async function updateBidPrice(id: number, bidPrice: number): Promise<Bid> {
  const res = await Api.patch<{ data: Bid }>(`/bids/${id}`, {
    bid_price: bidPrice,
  });
  return res.data;
}
