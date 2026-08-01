# Dashboard orders — port v1's won-auction car tracking onto `GET /orders`

**Date:** 2026-08-01
**Status:** approved, ready for implementation plan
**Repos:** `tjcar-front-v2` only — no backend change

## Problem

When a customer's bid wins, an admin converts it into a `CarOrder`
(`Admin\BidController@createOrder`) and from then on the car is physically
moving: Japan → Tianjin → Zamyn-Üüd → customs. v1 exposed that journey to the
customer at `/dashboard/cars` (list) and `/dashboard/cars/{id}` (detail).

v2 has nothing. `grep -r orders src/` returns two unrelated hits. The customer's
bid goes to `Win` in `/dashboard/bids` and then the trail ends — the order it
became, its shipping progress, its arrival date and its payment breakdown are
all invisible.

The API side is already done and unused:

| Endpoint | Controller | Frontend state |
| --- | --- | --- |
| `GET /orders` | `Customer\OrderController@index` | not wired |
| `GET /orders/{order}` | `Customer\OrderController@show` | not wired |

Both are ownership-scoped (`where customer_id = user()->id`), so another
customer's id 404s and the UI needs no guard of its own.

## What v1 had

| v1 file | Lines | Fate in v2 |
| --- | --- | --- |
| `app/dashboard/cars/page.js` | 24 | → `dashboard/orders/page.tsx` |
| `app/dashboard/cars/[id]/page.js` | 18 | → `dashboard/orders/[id]/page.tsx` |
| `components/dashboard/OrdersTable.js` | 332 | → `OrderList` + `OrderRow` (antd `Table` dropped) |
| `components/dashboard/cars/OrderCarInfo.js` | 187 | → `OrderDetail` (antd `Descriptions` dropped) |
| `components/dashboard/cars/OrderPics.js` | 117 | **deleted** — reuse `CarGallery` |
| `components/dashboard/cars/RenderCarOrderItem.js` | 71 | folded into `OrderRow` (one responsive row, no `MobileView` fork) |
| `components/cars/RenderTransportStep.js` | 31 | → `OrderProgress` |
| `components/render/RenderOrderStatus.js` | 14 | → `OrderStatusTag` |
| `utils/transportPorts.js` | 21 | → `TRANSPORT_STOPS` in `types/order.ts` + i18n |

## Decisions taken during brainstorming

1. **Restyle, don't transcribe.** The port follows `BidList` / `BidDetail` —
   Tailwind cards, antd only for `Skeleton` / `Pagination` / `Timeline` /
   `Image`. v1's `<BrowserView>` table + `<MobileView>` card fork collapses into
   one responsive row; this also sidesteps the project's standing ban on
   `scroll.x` in antd tables (v1's `OrdersTable` used `scroll={{ x: true }}`).
2. **Scope:** two pages + a sidebar entry + a third `StatCard` on the dashboard
   home, and `quickActions.track` repointed from `/garage` to
   `/dashboard/orders`.
3. **Show the payment breakdown.** v1 printed a single price; `car_data.PRICE_DATA`
   already carries the MNT advance/remainder split, which is the customer's most
   common question.

## Routes and files

```
src/app/[locale]/dashboard/orders/page.tsx        server shell → <OrderList/>
src/app/[locale]/dashboard/orders/[id]/page.tsx   server shell → <OrderDetail id/>

src/types/order.ts        Order, OrderTracking, ORDER_STATUS, TRANSPORT_STOPS, helpers
src/services/orders.ts    listOrders(page, perPage) · getOrder(id)
src/hooks/useOrders.ts    useOrderList · useOrder · ORDERS_KEY · ORDERS_PER_PAGE

src/components/order/OrderList.tsx
src/components/order/OrderRow.tsx
src/components/order/OrderProgress.tsx
src/components/order/OrderDetail.tsx
src/components/order/OrderTimeline.tsx
src/components/order/OrderStatusTag.tsx
```

Both page shells are server components: `setRequestLocale(locale)`,
`getTranslations(...)`, `DashboardHeader`, then the client island — identical to
`dashboard/bids/page.tsx` and `dashboard/bids/[id]/page.tsx`.

**Edited files:** `components/dashboard/Sidebar.tsx` (new `orders` entry, after
`bids`), `components/dashboard/DashboardStats.tsx` (third card, grid becomes
`sm:grid-cols-2 lg:grid-cols-3`), `app/[locale]/dashboard/page.tsx`
(`quickActions.track.href`), `messages/{mn,en,ru}.json`.

**No new gallery.** `OrderDetail` renders the existing
`components/car-detail/CarGallery` with `sizeVariants={false}`. Order images are
S3 URLs from `ImageUploadService::storeFromUrl`; they do not honour the auction
CDN's `&w=` suffix, and passing `true` would append a param that yields a 404 on
every thumbnail. v1's Swiper-based `OrderPics` is not ported — v2 has no Swiper
dependency (it uses `embla-carousel-react`).

## Data contract

### `GET /orders?page=&per_page=`

Returns `Paginated<Order>` (`{ data, links, meta }`). **`tracking` is absent** —
`index` does not eager-load the relation, only `show` does. `OrderList` must
therefore drive its progress bar from the scalar `location` alone, never from
`tracking`.

### `GET /orders/{id}`

Returns `{ data: Order }` with `tracking: OrderTracking[]`.

### Types

```ts
/** Mirrors App\Enums\OrderStatus in tjcar-api-v2 (backed by int). */
export const ORDER_STATUS = { Pending: 10, Done: 1000 } as const;
export type OrderStatus = (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS];

export type OrderTracking = {
  id: number;
  order_id: number;
  user_id: number | null;
  location_id: number;
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
  location: number | null;
  arrival_date: string | null;
  departure_date: string | null;
  note: string | null;
  status: OrderStatus;
  status_label: string;
  auction_purchase_date: string | null;
  user?: { id: number; name: string } | null;
  tracking?: OrderTracking[];   // GET /orders/{id} only
  created_at: string | null;
  updated_at: string | null;
};
```

### `car_data` is a union in practice

Two writers, two shapes — the type must accommodate both:

| Origin | Writer | Shape |
| --- | --- | --- |
| Won bid | `Admin\BidController@createOrder` | the AJES row copied verbatim from `bid.car_data` — full `FeaturedCar`, incl. `LOT`, `AUCTION`, `AUCTION_DATE`, `INFO`, `IMAGES` |
| Admin-entered | `OrderService@create` | 12 hand-written keys + `PRICE_DATA`; `LOT`/`AUCTION` may be null, no `INFO` |

```ts
export type OrderPriceData = {
  jpy?: { price: number | null; fob: number | null; total: number | null;
          advance: number | null; remaining: number | null;
          exchange_rate: number | null };
  mnt?: { price: number | null; sale_price: number | null;
          advance: number | null; remaining: number | null };
};

export type OrderCarData = Partial<FeaturedCar> & { PRICE_DATA?: OrderPriceData };
```

Consequence for the UI: **every detail row renders only when its value exists**,
and the whole "Auction information" card is omitted when neither `LOT` nor
`AUCTION` is present. An admin-entered order must not show a grid of empty
labels.

`GRADE` and `INFO` pass through `decodeAuctionText()` from
`src/utils/auctionInfo.ts` — AJES entity-encodes them, and v1 papered over it
with `dangerouslySetInnerHTML`. No raw HTML is injected anywhere in this feature.

### Images

`images[]` are absolute URLs. Three physical variants exist per upload
(`<uuid>.jpg`, `<uuid>_w320.jpg`, `<uuid>_h50.jpg`). `OrderRow` uses
`cdnImage(url, "card")` from `src/utils/cdnImage.ts`; the detail gallery uses the
originals.

## Shipping progress

The four stops stay frontend-owned. The backend does not model them — an
`OrderTracking` row carries a free-text `location_name` the admin typed, and
`location` is a bare `TINYINT` pointer.

```ts
export const TRANSPORT_STOPS = [0, 1, 2, 3] as const;
```

Titles live in `messages/*.json` under `dashboard.transportStops`:

| id | mn | en | ru |
| --- | --- | --- | --- |
| 0 | Японоос хөдөлсөн | Departed Japan | Отправлено из Японии |
| 1 | Тянжинаас хөдөлсөн | Departed Tianjin | Отправлено из Тяньцзиня |
| 2 | Замын-Үүдээс хөдөлсөн | Departed Zamyn-Üüd | Отправлено из Замын-Ууд |
| 3 | Гааль дээр буусан | Arrived at customs | Прибыло на таможню |

### Two v1 bugs fixed on purpose

**1. `location: null` produced a negative bar.** `location` is nullable and is
null for every admin-entered order (`OrderService@create` never sets it). v1 ran
`TransportPorts.findIndex(p => p.id === record.location)` → `-1`, then
`Math.floor(-1 / 3 * 100)` → `-34`, and handed `-34` to antd `Progress`. v2:

```ts
/** Index into TRANSPORT_STOPS, or -1 when the order has not shipped. */
export function orderStopIndex(location: number | null): number;

/** Filled segments out of TRANSPORT_STOPS.length. */
export function orderStopsReached(location: number | null): number;
```

`-1` renders zero filled segments and the label `dashboard.orders.notShipped`
("Хараахан хөдлөөгүй").

**2. Reaching stop 0 left the bar empty.** v1's percentage was `idx / (len - 1)`,
so `location = 0` ("Departed Japan") scored 0% — a customer whose car had left
Japan saw a blank bar indistinguishable from "nothing has happened". v2 fills
`idx + 1` of 4: `0 → 1/4`, `3 → 4/4`. Only `null` yields an empty bar. The final
segment turns green at 4/4; the rest use the primary colour.

`OrderProgress` is four flex divs, not antd `Progress` — `Progress steps` brings
its own sizing and colour tokens that fight the Tailwind row.

### Timeline (detail only)

Rows are built from `TRANSPORT_STOPS`, each joined to `tracking` on
`location_id` to pick up a `date`. If a stop has several tracking rows, the last
one wins (rows are appended, never updated in place, by
`OrderTimelineService::recordLocation`).

Dot state: index `< orderStopIndex` = done, `===` = current, `>` = pending.

A tracking row whose `location_id` falls outside 0–3 is **appended at the end**
using its own `location_name` and date. Admin-entered history is never silently
dropped just because it does not fit the four-stop model.

## Payment

When `car_data.PRICE_DATA.mnt` is present, `OrderDetail` renders a payment card:

| Row | Source |
| --- | --- |
| Нийт үнэ | `mnt.sale_price ?? mnt.price` |
| Урьдчилгаа | `mnt.advance` |
| Үлдэгдэл | `mnt.remaining` |

When `jpy.total` is present, a secondary line shows it alongside
`jpy.exchange_rate`. Nothing is computed client-side — these are display-only
reads of what the admin entered.

The hero price resolves as `mnt.sale_price ?? mnt.price ?? price`, formatted with
`formatMnt` from `src/lib/bidConfig.ts`.

### Known backend ambiguity (documented, not fixed here)

The `price` column's currency is inconsistent:

- `OrderService@create` writes `total_price_jpy` into it (`'price' => $data['total_price_jpy']`)
- `Admin\BidController@createOrder` writes whatever the admin's form submitted

v1 formatted both as `₮`. This spec preserves that fallback because changing it
would silently alter displayed figures for existing orders, but the fallback is
only reached when `PRICE_DATA.mnt` is absent. Cleaning up the column's semantics
belongs to a backend task, not this port.

## States and behaviour

`OrderList` and `OrderDetail` mirror `BidList` / `BidDetail` exactly:

- `Skeleton active` while the first page loads.
- Load error → `EmptyState`, but **only when `!query.data`** — a failed
  focus-refetch after a good load must not blank the page.
- Zero rows → `EmptyState` with a CTA to `/japan`.
- 404 on detail (`ApiError.status === 404`) → "Захиалга олдсонгүй" + a link back
  to `/dashboard/orders`.
- React Query: `staleTime: 15_000`, `refetchOnWindowFocus: true`. Shipping
  location changes while the page sits open, which is the same reasoning
  `useBids` documents.
- `ORDERS_PER_PAGE = 10`; antd `Pagination` renders only when
  `meta.total > ORDERS_PER_PAGE`.

No tabs. `OrderStatus` has two values and orders are few — a tab bar over
Pending/Done would be chrome without a job.

Status display uses the API's `status_label` verbatim (`OrderStatus::label()`
already returns Mongolian). Only the tag *colour* is derived from the numeric
`status`: 10 → blue, 1000 → green.

## Dashboard home integration

`DashboardStats` gains a third card. Its count comes from `listOrders(1, 1)` and
reads `meta.total`, the same one-row-page trick the reports card already uses —
no new server-side counter for a single figure. The card links to
`/dashboard/orders`.

`quickActions.track.href` moves from `/garage` to `/dashboard/orders`; the
existing copy ("Машин хянах" / "Захиалгад нэмэх") is rewritten to describe
tracking rather than adding.

## Translations

New keys, added to all three of `messages/{mn,en,ru}.json`:

- `dashboard.sidebar.orders`
- `dashboard.orders.*` — title, description, listHeading, empty/error states,
  `notShipped`, column-ish labels used by the row
- `dashboard.orderDetail.*` — title, description, section headings, field
  labels, notFound/loadError, backToList
- `dashboard.transportStops.0` … `.3`
- `dashboard.home.stats.ordersLabel`, `dashboard.home.stats.ordersHint`

Dates are printed from the API's preformatted strings (`Y-m-d H:i:s`); no dayjs
formatting is introduced. `arrival_date` and `tracking[].date` are date-only
columns and print as-is.

## Out of scope

- Cancelling an order, uploading documents, or any write path — `Customer\OrderController`
  is read-only and stays that way.
- v1's `/dashboard/deposit`, `/dashboard/wallet`, `/dashboard/history` pages.
- Realtime push. Focus-refetch is sufficient for a journey measured in weeks.
