import Api from "./Api";
import type { Paginated } from "@/types/api";
import type { Order } from "@/types/order";

/**
 * Car orders — the won-auction cars a customer is waiting on (tjcar-api-v2
 * `Customer\OrderController`). Read-only: the API exposes no customer write
 * path, so there is no mutation counterpart to `services/bids.ts`.
 *
 * Client-side on purpose: a car's shipping location advances while the customer
 * watches, so these go through `Api`, which proxies via /api/v1 and attaches
 * the Sanctum bearer server-side.
 */

/**
 * GET /orders — the authenticated customer's orders, newest first.
 *
 * `tracking` is NOT included: `index` does not eager-load the relation, only
 * `show` does. Drive list-level progress from the scalar `location` alone.
 */
export function listOrders(page = 1, perPage = 10): Promise<Paginated<Order>> {
  return Api.get<Paginated<Order>>("/orders", { page, per_page: perPage });
}

/**
 * GET /orders/{id} — one owned order, with its tracking rows.
 *
 * The query is ownership-scoped server-side, so another customer's id comes
 * back 404 rather than 403.
 */
export async function getOrder(id: string): Promise<Order> {
  const res = await Api.get<{ data: Order }>(`/orders/${id}`);
  return res.data;
}
