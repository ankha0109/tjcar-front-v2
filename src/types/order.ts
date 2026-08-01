import type { FeaturedCar } from "./featured";

/** Mirrors App\Enums\OrderStatus in tjcar-api-v2 (backed by int). */
export const ORDER_STATUS = { Pending: 10, Done: 1000 } as const;

export type OrderStatus = (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS];

/**
 * Payment split the admin entered, stored inside `car_data`. Every leaf is
 * nullable — `OrderService@create` writes whatever the admin's form held, and
 * `updatePrices` merges partially into it.
 */
export type OrderPriceData = {
  jpy?: {
    price?: number | null;
    fob?: number | null;
    total?: number | null;
    advance?: number | null;
    remaining?: number | null;
    exchange_rate?: number | null;
  };
  mnt?: {
    price?: number | null;
    sale_price?: number | null;
    advance?: number | null;
    remaining?: number | null;
  };
};

/**
 * `car_data` has two writers and therefore two shapes:
 *  - a won bid copies the whole AJES row verbatim (Admin\BidController@createOrder)
 *  - an admin-entered order writes 12 keys plus PRICE_DATA (OrderService@create)
 *
 * Everything is optional so the UI can render row-by-row on whatever is
 * present, instead of printing a grid of empty labels for admin orders.
 */
export type OrderCarData = Partial<FeaturedCar> & {
  PRICE_DATA?: OrderPriceData;
};

export type OrderTracking = {
  id: number;
  order_id: number;
  user_id: number | null;
  location_id: number;
  /** Free text the admin typed — NOT one of TRANSPORT_STOPS' titles. */
  location_name: string;
  date: string | null;
  created_at: string | null;
};

export type Order = {
  id: number;
  customer_id: number | null;
  customer_phone: string | null;
  customer_name: string | null;
  car_data: OrderCarData;
  price: number;
  images: string[];
  port: string | null;
  /** Pointer into TRANSPORT_STOPS. Null until the car actually moves. */
  location: number | null;
  arrival_date: string | null;
  departure_date: string | null;
  note: string | null;
  status: OrderStatus;
  /** Already localised by the API (OrderStatus::label()) — print as-is. */
  status_label: string;
  auction_purchase_date: string | null;
  user?: { id: number; name: string } | null;
  /** Only present on `GET /orders/{id}` — index does not eager-load it. */
  tracking?: OrderTracking[];
  created_at: string | null;
  updated_at: string | null;
};

/**
 * The shipping route, frontend-owned.
 *
 * The API models neither the stops nor their order: `location` is a bare
 * TINYINT pointer and `order_trackings.location_name` is free text. Titles are
 * looked up in `dashboard.transportStops.stop<id>`.
 */
export const TRANSPORT_STOPS = [0, 1, 2, 3] as const;

type StopId = (typeof TRANSPORT_STOPS)[number];

/** Index of the order's current stop, or -1 when it has not shipped yet. */
export function orderStopIndex(location: number | null): number {
  if (location === null) return -1;
  return TRANSPORT_STOPS.indexOf(location as StopId);
}

/**
 * Filled segments out of TRANSPORT_STOPS.length.
 *
 * `idx + 1`, not `idx`: v1 scored the first stop at 0%, so a customer whose car
 * had already left Japan saw an empty bar indistinguishable from "nothing has
 * happened". Only an unshipped order (`location === null`) reads zero here.
 */
export function orderStopsReached(location: number | null): number {
  const idx = orderStopIndex(location);
  return idx < 0 ? 0 : idx + 1;
}

/**
 * Latest recorded date per stop id. Tracking rows are appended, never updated
 * in place (OrderTimelineService::recordLocation), so the last match wins.
 */
export function orderStopDates(
  tracking: OrderTracking[] | undefined,
): Map<number, string> {
  const dates = new Map<number, string>();
  for (const row of tracking ?? []) {
    if (row.date) dates.set(row.location_id, row.date);
  }
  return dates;
}

/**
 * Tracking rows the four-stop model has no slot for. Surfaced verbatim rather
 * than dropped — an admin who logged a stop we do not model still logged it.
 */
export function extraTrackingRows(
  tracking: OrderTracking[] | undefined,
): OrderTracking[] {
  return (tracking ?? []).filter(
    (row) => !TRANSPORT_STOPS.includes(row.location_id as StopId),
  );
}

/**
 * Display price in MNT.
 *
 * `PRICE_DATA.mnt` is authoritative when the admin filled it. The bare `price`
 * column is only a fallback because its currency differs by write path:
 * `OrderService@create` stores `total_price_jpy` there, while bid→order stores
 * whatever the admin's form submitted. v1 printed both as ₮ and this preserves
 * that rather than silently restating existing orders' figures.
 */
export function orderTotalMnt(order: Order): number {
  const mnt = order.car_data?.PRICE_DATA?.mnt;
  return mnt?.sale_price ?? mnt?.price ?? order.price;
}
