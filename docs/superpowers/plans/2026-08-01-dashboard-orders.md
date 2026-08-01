# Dashboard Orders Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire the two unwired customer order endpoints (`GET /orders`, `GET /orders/{id}`) into the v2 dashboard so a customer can see the won-auction car they are waiting on, where it is on the Japan → Tianjin → Zamyn-Üüd → customs route, and what they still owe.

**Architecture:** Frontend-only port of v1's `/dashboard/cars` pages, built bottom-up as types → service → react-query hooks → small client components → server page shells, mirroring the existing `bid` feature exactly. The four-stop shipping route stays frontend-owned (the API models neither the stops nor their order); its titles move into `messages/*.json`.

**Tech Stack:** Next.js 16 App Router · TypeScript 5 (strict) · antd 6 · TanStack Query 5 · next-intl · Tailwind v4

**Spec:** `docs/superpowers/specs/2026-08-01-dashboard-orders-design.md`

## Global Constraints

- One repo. All paths are relative to `/Users/ankhbayar/Projects/Front/tjcar-front-v2`.
- Work happens on a new branch `feat/dashboard-orders`, cut from `main`. Task 1 creates it.
- **No backend change.** `Customer\OrderController` is read-only and already deployed. Do not edit anything under `/Users/ankhbayar/Herd/tjcar-api-v2`.
- There is **no test framework** in this project. The gate for every task is `npx tsc --noEmit` followed by `npm run lint`, both clean. Task 8 adds manual browser verification.
- **Only `git add` the exact paths a task names.** Never `git add -A` or `git add .`.
- All three locale files (`messages/mn.json`, `messages/en.json`, `messages/ru.json`) must be updated together, in the same task. Mongolian is the primary language.
- Status text always comes from the API's `status_label` field. Never hardcode "Хүлээгдэж байна" / "Дууссан" in the frontend — only the tag *colour* is derived from the numeric `status`.
- Locale-aware navigation comes from `@/i18n/navigation` (`Link`, `useRouter`, `usePathname`, `redirect`) — never `next/link` or `next/navigation` for routing.
- Never use `tracking-*` or `font-mono` utility classes (project-wide ban).
- Never use `dangerouslySetInnerHTML` for `car_data` values. AJES entity-encodes `GRADE` and `INFO`; decode with `decodeAuctionText` / `parseAuctionInfo` from `src/utils/auctionInfo.ts` and render as text.
- Page/section wrappers keep the shared container `mx-auto w-full max-w-7xl px-4 lg:px-6`. The dashboard layout already applies it — the new pages add none of their own.
- `ORDERS_PER_PAGE` is `10`.
- The four transport stop ids are exactly `0, 1, 2, 3`.

---

## File Structure

| File | Change | Responsibility |
| --- | --- | --- |
| `src/types/order.ts` | create | Order/OrderTracking shapes, status + stop constants, all derived-value helpers |
| `src/services/orders.ts` | create | Two thin API calls |
| `src/hooks/useOrders.ts` | create | Query keys + list/detail hooks |
| `src/components/order/OrderStatusTag.tsx` | create | Numeric status → antd Tag colour |
| `src/components/order/OrderProgress.tsx` | create | Four-segment shipping bar + stop caption |
| `src/components/order/OrderRow.tsx` | create | One list row; exports `orderTitle()` |
| `src/components/order/OrderList.tsx` | create | Pagination, empty/error states |
| `src/components/order/OrderTimeline.tsx` | create | Stops + tracking dates → antd Timeline |
| `src/components/order/OrderFieldCard.tsx` | create | Titled label/value card that self-hides when empty |
| `src/components/order/OrderDetail.tsx` | create | Detail composition |
| `src/app/[locale]/dashboard/orders/page.tsx` | create | Server shell → `OrderList` |
| `src/app/[locale]/dashboard/orders/[id]/page.tsx` | create | Server shell → `OrderDetail` |
| `src/components/dashboard/Sidebar.tsx` | modify | New `orders` nav entry |
| `src/components/dashboard/DashboardStats.tsx` | modify | Third stat card + 3-column grid |
| `src/app/[locale]/dashboard/page.tsx` | modify | `quickActions.track` href → `/dashboard/orders` |
| `messages/{mn,en,ru}.json` | modify | `dashboard.orders.*`, `dashboard.orderDetail.*`, `dashboard.transportStops.*`, sidebar + home keys |

**Deliberately NOT created:** an order gallery component. `OrderDetail` reuses `src/components/car-detail/CarGallery.tsx`.

---

## Task 1: Types, service and hooks

**Files:**
- Create: `src/types/order.ts`
- Create: `src/services/orders.ts`
- Create: `src/hooks/useOrders.ts`

**Interfaces:**
- Consumes: `Paginated<T>` from `src/types/api.ts`; `FeaturedCar` from `src/types/featured.ts`; the default export of `src/services/Api.ts`.
- Produces — every later task depends on these exact names:
  - `ORDER_STATUS` (`{ Pending: 10, Done: 1000 }`), type `OrderStatus`
  - types `OrderPriceData`, `OrderCarData`, `OrderTracking`, `Order`
  - `TRANSPORT_STOPS: readonly [0, 1, 2, 3]`
  - `orderStopIndex(location: number | null): number`
  - `orderStopsReached(location: number | null): number`
  - `orderStopDates(tracking: OrderTracking[] | undefined): Map<number, string>`
  - `extraTrackingRows(tracking: OrderTracking[] | undefined): OrderTracking[]`
  - `orderTotalMnt(order: Order): number`
  - `listOrders(page?: number, perPage?: number): Promise<Paginated<Order>>`
  - `getOrder(id: string): Promise<Order>`
  - `ORDERS_KEY`, `ORDERS_PER_PAGE` (`10`), `useOrderList(page: number)`, `useOrder(id: string)`

- [ ] **Step 1: Create the branch**

```bash
cd /Users/ankhbayar/Projects/Front/tjcar-front-v2
git checkout main
git checkout -b feat/dashboard-orders
```

- [ ] **Step 2: Create `src/types/order.ts`**

```ts
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
```

- [ ] **Step 3: Create `src/services/orders.ts`**

```ts
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
```

- [ ] **Step 4: Create `src/hooks/useOrders.ts`**

```ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { getOrder, listOrders } from "@/services/orders";

/** Root key — invalidating it refreshes every list page and every open detail. */
export const ORDERS_KEY = ["orders"] as const;

export const ORDERS_PER_PAGE = 10;

/**
 * One page of the customer's orders. A car's location advances while the page
 * is open, so this refetches on focus rather than trusting the first render
 * (same reasoning as `useBidList`).
 */
export function useOrderList(page: number) {
  return useQuery({
    queryKey: [...ORDERS_KEY, "list", page],
    queryFn: () => listOrders(page, ORDERS_PER_PAGE),
    staleTime: 15_000,
    refetchOnWindowFocus: true,
  });
}

export function useOrder(id: string) {
  return useQuery({
    queryKey: [...ORDERS_KEY, "detail", id],
    queryFn: () => getOrder(id),
    staleTime: 15_000,
    refetchOnWindowFocus: true,
  });
}
```

- [ ] **Step 5: Verify types and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: both exit 0, no output about the three new files.

- [ ] **Step 6: Commit**

```bash
git add src/types/order.ts src/services/orders.ts src/hooks/useOrders.ts
git commit -m "feat(orders): types, service and query hooks for GET /orders

car_data has two writers with different shapes (AJES row from a won bid vs
12 admin-entered keys), so every field is optional and the UI renders
row-by-row on what is present.

orderStopsReached() fills idx+1 of 4 rather than v1's idx/(len-1): v1 scored
the first stop at 0%, so a car that had left Japan showed an empty bar.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: Translations

**Files:**
- Modify: `messages/mn.json`
- Modify: `messages/en.json`
- Modify: `messages/ru.json`

**Interfaces:**
- Consumes: nothing.
- Produces: the namespaces `dashboard.orders`, `dashboard.orderDetail`, `dashboard.transportStops`, plus `dashboard.sidebar.orders`, `dashboard.home.stats.ordersLabel`, `dashboard.home.stats.ordersHint`, and rewritten `dashboard.home.quickActions.track.*`. Every later task reads these keys.

Note on stop keys: they are `stop0`…`stop3`, not bare `"0"`…`"3"` — a numeric segment in a next-intl dot path is an avoidable ambiguity for zero benefit.

- [ ] **Step 1: Add the three new namespaces to `messages/mn.json`**

Insert inside the existing `"dashboard"` object, after the `"bidEdit"` block:

```json
    "orders": {
      "title": "Захиалсан машин",
      "description": "Дуудлагад ялж захиалсан машинуудын явц.",
      "listHeading": "Миний захиалгууд",
      "orderNo": "Захиалга №{id}",
      "notShipped": "Хараахан хөдлөөгүй",
      "emptyTitle": "Захиалга алга",
      "emptyDescription": "Дуудлагад ялсан машин захиалга болмогц энд харагдана.",
      "emptyCta": "Дуудлага үзэх",
      "loadErrorTitle": "Жагсаалт ачаалж чадсангүй",
      "loadErrorBody": "Сүлжээгээ шалгаад хуудсаа шинэчилнэ үү."
    },
    "orderDetail": {
      "title": "Захиалгын дэлгэрэнгүй",
      "description": "Машины мэдээлэл, ачилтын явц, төлбөрийн задаргаа.",
      "orderNo": "Захиалга №{id}",
      "createdAt": "Захиалсан: {date}",
      "progressHeading": "Ачилтын явц",
      "orderHeading": "Захиалгын мэдээлэл",
      "paymentHeading": "Төлбөрийн мэдээлэл",
      "carHeading": "Машины мэдээлэл",
      "auctionHeading": "Дуудлага худалдааны мэдээлэл",
      "status": "Төлөв",
      "port": "Ачигдсан боомт",
      "departureDate": "Хөдөлсөн огноо",
      "arrivalDate": "Монголд ирэх хугацаа",
      "operatorLabel": "Хариуцсан ажилтан",
      "note": "Тайлбар",
      "total": "Нийт үнэ",
      "advance": "Урьдчилгаа",
      "remaining": "Үлдэгдэл",
      "jpyTotal": "Япон талын үнэ",
      "exchangeRate": "Ханш",
      "marka": "Үйлдвэрлэгч",
      "model": "Модел",
      "year": "Үйлдвэрлэсэн он",
      "kuzov": "Арлын дугаар",
      "color": "Өнгө",
      "engine": "Моторын багтаамж",
      "transmission": "Хурдны хайрцаг",
      "grade": "Зэрэглэл",
      "mileage": "Гүйлт",
      "rate": "Үнэлгээ",
      "rateExt": "Гадна талын үнэлгээ",
      "rateInt": "Дотор талын үнэлгээ",
      "auctionId": "ID дугаар",
      "lot": "LOT №",
      "auctionName": "Дуудлагын байршил",
      "auctionDate": "Дуудлагын огноо",
      "timelineEmpty": "Ачилтын бүртгэл алга",
      "backToList": "Жагсаалт руу буцах",
      "notFoundTitle": "Захиалга олдсонгүй",
      "notFoundBody": "Энэ захиалга устсан эсвэл танд хамаарахгүй байна.",
      "loadErrorTitle": "Ачаалж чадсангүй",
      "loadErrorBody": "Сүлжээгээ шалгаад хуудсаа шинэчилнэ үү."
    },
    "transportStops": {
      "stop0": "Японоос хөдөлсөн",
      "stop1": "Тянжинаас хөдөлсөн",
      "stop2": "Замын-Үүдээс хөдөлсөн",
      "stop3": "Гааль дээр буусан"
    },
```

- [ ] **Step 2: Add the same three namespaces to `messages/en.json`**

```json
    "orders": {
      "title": "My orders",
      "description": "Track the cars you won at auction.",
      "listHeading": "My orders",
      "orderNo": "Order #{id}",
      "notShipped": "Not shipped yet",
      "emptyTitle": "No orders yet",
      "emptyDescription": "Cars you win at auction appear here once the order is created.",
      "emptyCta": "Browse auctions",
      "loadErrorTitle": "Could not load the list",
      "loadErrorBody": "Check your connection and refresh the page."
    },
    "orderDetail": {
      "title": "Order details",
      "description": "Car information, shipping progress and payment breakdown.",
      "orderNo": "Order #{id}",
      "createdAt": "Ordered: {date}",
      "progressHeading": "Shipping progress",
      "orderHeading": "Order information",
      "paymentHeading": "Payment",
      "carHeading": "Car information",
      "auctionHeading": "Auction information",
      "status": "Status",
      "port": "Loading port",
      "departureDate": "Departure date",
      "arrivalDate": "Expected in Mongolia",
      "operatorLabel": "Assigned staff",
      "note": "Note",
      "total": "Total price",
      "advance": "Advance payment",
      "remaining": "Remaining balance",
      "jpyTotal": "Japan-side price",
      "exchangeRate": "Exchange rate",
      "marka": "Make",
      "model": "Model",
      "year": "Year",
      "kuzov": "Chassis number",
      "color": "Colour",
      "engine": "Engine displacement",
      "transmission": "Transmission",
      "grade": "Grade",
      "mileage": "Mileage",
      "rate": "Auction rating",
      "rateExt": "Exterior grade",
      "rateInt": "Interior grade",
      "auctionId": "ID",
      "lot": "Lot no.",
      "auctionName": "Auction house",
      "auctionDate": "Auction date",
      "timelineEmpty": "No shipping records yet",
      "backToList": "Back to orders",
      "notFoundTitle": "Order not found",
      "notFoundBody": "This order was removed or does not belong to you.",
      "loadErrorTitle": "Could not load",
      "loadErrorBody": "Check your connection and refresh the page."
    },
    "transportStops": {
      "stop0": "Departed Japan",
      "stop1": "Departed Tianjin",
      "stop2": "Departed Zamyn-Üüd",
      "stop3": "Arrived at customs"
    },
```

- [ ] **Step 3: Add the same three namespaces to `messages/ru.json`**

```json
    "orders": {
      "title": "Мои заказы",
      "description": "Отслеживание машин, выигранных на аукционе.",
      "listHeading": "Мои заказы",
      "orderNo": "Заказ №{id}",
      "notShipped": "Ещё не отправлено",
      "emptyTitle": "Заказов пока нет",
      "emptyDescription": "Машины, выигранные на аукционе, появятся здесь после оформления заказа.",
      "emptyCta": "Смотреть аукционы",
      "loadErrorTitle": "Не удалось загрузить список",
      "loadErrorBody": "Проверьте соединение и обновите страницу."
    },
    "orderDetail": {
      "title": "Детали заказа",
      "description": "Информация об автомобиле, ход доставки и разбивка платежей.",
      "orderNo": "Заказ №{id}",
      "createdAt": "Заказано: {date}",
      "progressHeading": "Ход доставки",
      "orderHeading": "Информация о заказе",
      "paymentHeading": "Оплата",
      "carHeading": "Информация об автомобиле",
      "auctionHeading": "Информация об аукционе",
      "status": "Статус",
      "port": "Порт отгрузки",
      "departureDate": "Дата отправления",
      "arrivalDate": "Ожидается в Монголии",
      "operatorLabel": "Ответственный сотрудник",
      "note": "Примечание",
      "total": "Общая сумма",
      "advance": "Предоплата",
      "remaining": "Остаток",
      "jpyTotal": "Цена в Японии",
      "exchangeRate": "Курс",
      "marka": "Марка",
      "model": "Модель",
      "year": "Год выпуска",
      "kuzov": "Номер кузова",
      "color": "Цвет",
      "engine": "Объём двигателя",
      "transmission": "Коробка передач",
      "grade": "Комплектация",
      "mileage": "Пробег",
      "rate": "Оценка аукциона",
      "rateExt": "Оценка кузова",
      "rateInt": "Оценка салона",
      "auctionId": "ID",
      "lot": "Лот №",
      "auctionName": "Аукционный дом",
      "auctionDate": "Дата аукциона",
      "timelineEmpty": "Записей о доставке пока нет",
      "backToList": "Назад к заказам",
      "notFoundTitle": "Заказ не найден",
      "notFoundBody": "Этот заказ удалён или не принадлежит вам.",
      "loadErrorTitle": "Не удалось загрузить",
      "loadErrorBody": "Проверьте соединение и обновите страницу."
    },
    "transportStops": {
      "stop0": "Отправлено из Японии",
      "stop1": "Отправлено из Тяньцзиня",
      "stop2": "Отправлено из Замын-Ууд",
      "stop3": "Прибыло на таможню"
    },
```

- [ ] **Step 4: Add the sidebar entry to all three files**

In `dashboard.sidebar`, after `"bids"`:

| File | Line to add |
| --- | --- |
| `messages/mn.json` | `"orders": "Захиалсан машин",` |
| `messages/en.json` | `"orders": "My orders",` |
| `messages/ru.json` | `"orders": "Мои заказы",` |

- [ ] **Step 5: Add the home stat keys to all three files**

In `dashboard.home.stats`, after `"reportsHint"`:

| File | Lines to add |
| --- | --- |
| `messages/mn.json` | `"ordersLabel": "Захиалсан машин",` / `"ordersHint": "нийт захиалга"` |
| `messages/en.json` | `"ordersLabel": "My orders",` / `"ordersHint": "orders in total"` |
| `messages/ru.json` | `"ordersLabel": "Мои заказы",` / `"ordersHint": "заказов всего"` |

- [ ] **Step 6: Rewrite `dashboard.home.quickActions.track` in all three files**

The card currently says "add to an order"; it will now link to the tracking page.

| File | `title` | `description` |
| --- | --- | --- |
| `messages/mn.json` | `Захиалга хянах` | `Ачилтын явц харах` |
| `messages/en.json` | `Track orders` | `See shipping progress` |
| `messages/ru.json` | `Отслеживать заказы` | `Посмотреть ход доставки` |

- [ ] **Step 7: Verify all three files are still valid JSON and structurally identical**

```bash
python3 - <<'PY'
import json
ref = None
for loc in ("mn", "en", "ru"):
    d = json.load(open(f"messages/{loc}.json"))
    def keys(o, p=""):
        out = set()
        for k, v in o.items():
            out.add(p + k)
            if isinstance(v, dict):
                out |= keys(v, p + k + ".")
        return out
    k = keys(d)
    if ref is None:
        ref = k
        print("mn keys:", len(k))
    else:
        assert k == ref, (loc, sorted(ref ^ k))
        print(loc, "OK")
for n in ("orders", "orderDetail", "transportStops"):
    assert n in json.load(open("messages/mn.json"))["dashboard"], n
print("new namespaces present")
PY
```

Expected: `mn keys: <n>` / `en OK` / `ru OK` / `new namespaces present`, no assertion error.

- [ ] **Step 8: Commit**

```bash
git add messages/mn.json messages/en.json messages/ru.json
git commit -m "i18n(orders): copy for the dashboard orders pages

The four transport stops were hardcoded Mongolian strings in v1's
utils/transportPorts.js; they live in messages now so en/ru get them too.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: `OrderStatusTag` and `OrderProgress`

**Files:**
- Create: `src/components/order/OrderStatusTag.tsx`
- Create: `src/components/order/OrderProgress.tsx`

**Interfaces:**
- Consumes: `ORDER_STATUS`, `OrderStatus`, `TRANSPORT_STOPS`, `orderStopIndex`, `orderStopsReached` from Task 1; `dashboard.orders.notShipped` and `dashboard.transportStops.*` from Task 2; `cn` from `@/utils`.
- Produces:
  - `OrderStatusTag` — default export, props `{ status: OrderStatus; label: string }`
  - `OrderProgress` — default export, props `{ location: number | null }`
  - `stopKey(id: number): StopKey` — **named** export from `OrderProgress.tsx`; Task 5's timeline imports it.

- [ ] **Step 1: Create `src/components/order/OrderStatusTag.tsx`**

```tsx
"use client";

import { Tag } from "antd";
import { ORDER_STATUS, type OrderStatus } from "@/types/order";

/** Text always comes from the API's `status_label`; only the colour is ours. */
const COLORS: Record<OrderStatus, string> = {
  [ORDER_STATUS.Pending]: "blue",
  [ORDER_STATUS.Done]: "green",
};

type Props = {
  status: OrderStatus;
  label: string;
};

export default function OrderStatusTag({ status, label }: Props) {
  return (
    <Tag color={COLORS[status] ?? "default"} className="m-0!">
      {label}
    </Tag>
  );
}
```

- [ ] **Step 2: Create `src/components/order/OrderProgress.tsx`**

```tsx
"use client";

import { useTranslations } from "next-intl";
import {
  TRANSPORT_STOPS,
  orderStopIndex,
  orderStopsReached,
} from "@/types/order";
import { cn } from "@/utils";

export type StopKey = "stop0" | "stop1" | "stop2" | "stop3";

/** `dashboard.transportStops` key for a stop id. */
export function stopKey(id: number): StopKey {
  return `stop${id}` as StopKey;
}

type Props = {
  location: number | null;
};

/**
 * Four-segment shipping bar.
 *
 * Plain divs rather than antd `Progress steps` — that component brings its own
 * sizing and colour tokens, which fight the Tailwind row it sits in. It is also
 * what let v1 render a negative percentage without complaining.
 */
export default function OrderProgress({ location }: Props) {
  const t = useTranslations("dashboard");
  const reached = orderStopsReached(location);
  const idx = orderStopIndex(location);
  const complete = reached === TRANSPORT_STOPS.length;

  return (
    <div className="space-y-1.5">
      <div className="flex gap-1">
        {TRANSPORT_STOPS.map((id, i) => (
          <span
            key={id}
            className={cn(
              "h-1.5 flex-1 rounded-full",
              i < reached
                ? complete
                  ? "bg-emerald-500"
                  : "bg-primary"
                : "bg-neutral-200 dark:bg-neutral-700",
            )}
          />
        ))}
      </div>
      <p className="text-[12px] text-neutral-500">
        {idx < 0 ? t("orders.notShipped") : t(`transportStops.${stopKey(idx)}`)}
      </p>
    </div>
  );
}
```

- [ ] **Step 3: Verify types and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: both exit 0.

- [ ] **Step 4: Commit**

```bash
git add src/components/order/OrderStatusTag.tsx src/components/order/OrderProgress.tsx
git commit -m "feat(orders): status tag and four-segment shipping bar

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: List row, list and the list page

**Files:**
- Create: `src/components/order/OrderRow.tsx`
- Create: `src/components/order/OrderList.tsx`
- Create: `src/app/[locale]/dashboard/orders/page.tsx`

**Interfaces:**
- Consumes: `Order`, `orderTotalMnt` (Task 1); `ORDERS_PER_PAGE`, `useOrderList` (Task 1); `OrderProgress`, `OrderStatusTag` (Task 3); `dashboard.orders.*` (Task 2); `formatMnt` from `@/lib/bidConfig`; `cdnImage` from `@/utils/cdnImage`; `decodeAuctionText` from `@/utils/auctionInfo`; `EmptyState`, `SectionMast`, `DashboardHeader` from `@/components/dashboard/*`.
- Produces: `orderTitle(order: Order): string` — **named** export from `OrderRow.tsx`; Task 6's detail imports it. Route `/{locale}/dashboard/orders`.

- [ ] **Step 1: Create `src/components/order/OrderRow.tsx`**

```tsx
"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { formatMnt } from "@/lib/bidConfig";
import { orderTotalMnt, type Order } from "@/types/order";
import { decodeAuctionText } from "@/utils/auctionInfo";
import { cdnImage } from "@/utils/cdnImage";
import OrderProgress from "./OrderProgress";
import OrderStatusTag from "./OrderStatusTag";

/**
 * "TOYOTA PRIUS 2018" from whichever of the three keys `car_data` carries. An
 * admin-entered order may have only two of them.
 */
export function orderTitle(order: Order): string {
  const { MARKA_NAME, MODEL_NAME, YEAR } = order.car_data ?? {};
  return [MARKA_NAME, MODEL_NAME, YEAR].filter(Boolean).join(" ");
}

export default function OrderRow({ order }: { order: Order }) {
  const t = useTranslations("dashboard.orders");
  // `images` are our own S3 uploads, which store a physical `_w320` sibling —
  // unlike the auction CDN, which resizes off a URL param.
  const cover = cdnImage(order.images?.[0] ?? null, "card");
  const grade = decodeAuctionText(order.car_data?.GRADE);

  return (
    <li>
      <Link
        href={`/dashboard/orders/${order.id}`}
        className="block rounded-lg border border-neutral-200 bg-white p-4 transition-colors hover:border-primary/50 dark:border-neutral-800 dark:bg-neutral-900"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            {cover ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={cover}
                alt=""
                className="h-14 w-20 shrink-0 rounded-md object-cover"
              />
            ) : null}
            <div className="min-w-0">
              <p className="truncate text-[13.5px] font-medium text-neutral-900 dark:text-neutral-100">
                {orderTitle(order)}
              </p>
              {grade ? (
                <p className="mt-0.5 truncate text-[12px] text-neutral-500">
                  {grade}
                </p>
              ) : null}
              <p className="mt-0.5 text-[12px] text-neutral-400">
                {t("orderNo", { id: order.id })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="text-[13px] tabular-nums text-neutral-600 dark:text-neutral-300">
              {formatMnt(orderTotalMnt(order))}
            </span>
            <OrderStatusTag status={order.status} label={order.status_label} />
          </div>
        </div>

        {/* `GET /orders` does not eager-load tracking, so the row's progress is
            driven by the scalar `location` alone. */}
        <div className="mt-3">
          <OrderProgress location={order.location} />
        </div>
      </Link>
    </li>
  );
}
```

- [ ] **Step 2: Create `src/components/order/OrderList.tsx`**

```tsx
"use client";

import { useState } from "react";
import { Pagination, Skeleton } from "antd";
import { useTranslations } from "next-intl";
import EmptyState from "@/components/dashboard/EmptyState";
import { ORDERS_PER_PAGE, useOrderList } from "@/hooks/useOrders";
import OrderRow from "./OrderRow";

/**
 * The customer's orders, newest first.
 *
 * No tabs: `OrderStatus` has two values and orders are few, so a
 * Pending/Done tab bar would be chrome without a job.
 */
export default function OrderList() {
  const t = useTranslations("dashboard.orders");
  const [page, setPage] = useState(1);
  const query = useOrderList(page);

  const orders = query.data?.data ?? [];
  const total = query.data?.meta.total ?? 0;
  // A background refetch (refetchOnWindowFocus) can fail after a successful
  // load without clearing `data`. Only treat it as a hard error when there is
  // no last-known-good page to fall back on; otherwise "loaded, zero rows"
  // still belongs to the empty state below, not blank space.
  const showLoadError = query.isError && !query.data;

  return (
    <div className="space-y-4">
      {query.isLoading ? <Skeleton active paragraph={{ rows: 5 }} /> : null}

      {showLoadError ? (
        <EmptyState
          title={t("loadErrorTitle")}
          description={t("loadErrorBody")}
        />
      ) : null}

      {!query.isLoading && !showLoadError && orders.length === 0 ? (
        <EmptyState
          title={t("emptyTitle")}
          description={t("emptyDescription")}
          cta={{ label: t("emptyCta"), href: "/japan" }}
        />
      ) : null}

      {orders.length > 0 ? (
        <div className="space-y-3">
          <ul className="space-y-2">
            {orders.map((order) => (
              <OrderRow key={order.id} order={order} />
            ))}
          </ul>

          {total > ORDERS_PER_PAGE ? (
            <Pagination
              current={page}
              pageSize={ORDERS_PER_PAGE}
              total={total}
              onChange={setPage}
              showSizeChanger={false}
              align="center"
            />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
```

- [ ] **Step 3: Create `src/app/[locale]/dashboard/orders/page.tsx`**

```tsx
import { getTranslations, setRequestLocale } from "next-intl/server";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import SectionMast from "@/components/dashboard/SectionMast";
import OrderList from "@/components/order/OrderList";

export default async function OrdersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("dashboard.orders");

  return (
    <>
      <DashboardHeader title={t("title")} description={t("description")} />

      <section className="space-y-4">
        <SectionMast title={t("listHeading")} />
        {/* Client component: a car's shipping location advances while the page
            is open, so the list refetches instead of rendering once. */}
        <OrderList />
      </section>
    </>
  );
}
```

- [ ] **Step 4: Verify types and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: both exit 0.

- [ ] **Step 5: Commit**

```bash
git add src/components/order/OrderRow.tsx src/components/order/OrderList.tsx "src/app/[locale]/dashboard/orders/page.tsx"
git commit -m "feat(orders): list page at /dashboard/orders

One responsive row replaces v1's BrowserView table + MobileView card fork.
Dropping the antd Table also sidesteps the project's scroll.x ban, which
v1's OrdersTable violated.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: Timeline and field card

**Files:**
- Create: `src/components/order/OrderTimeline.tsx`
- Create: `src/components/order/OrderFieldCard.tsx`

**Interfaces:**
- Consumes: `TRANSPORT_STOPS`, `extraTrackingRows`, `orderStopDates`, `orderStopIndex`, `OrderTracking` (Task 1); `stopKey` from `./OrderProgress` (Task 3); `dashboard.transportStops.*` (Task 2).
- Produces:
  - `OrderTimeline` — default export, props `{ location: number | null; tracking: OrderTracking[] | undefined }`
  - `OrderFieldCard` — default export, props `{ title: string; fields: OrderField[] }`
  - `OrderField` — **named** type export from `OrderFieldCard.tsx`: `{ label: string; value: React.ReactNode }`

- [ ] **Step 1: Create `src/components/order/OrderTimeline.tsx`**

```tsx
"use client";

import { Timeline } from "antd";
import { useTranslations } from "next-intl";
import {
  TRANSPORT_STOPS,
  extraTrackingRows,
  orderStopDates,
  orderStopIndex,
  type OrderTracking,
} from "@/types/order";
import { stopKey } from "./OrderProgress";

type Props = {
  location: number | null;
  tracking: OrderTracking[] | undefined;
};

/**
 * The four fixed stops carrying whatever dates `tracking` supplies, followed by
 * any tracking row whose `location_id` falls outside the model. Those extras are
 * printed with their own `location_name` rather than dropped — an admin who
 * logged a stop we do not model still logged it.
 */
export default function OrderTimeline({ location, tracking }: Props) {
  const t = useTranslations("dashboard");
  const current = orderStopIndex(location);
  const dates = orderStopDates(tracking);

  const stops = TRANSPORT_STOPS.map((id, i) => {
    const date = dates.get(id);
    return {
      key: `stop-${id}`,
      color: i < current ? "green" : i === current ? "blue" : "gray",
      children: (
        <div>
          <p
            className={
              i <= current
                ? "text-[13.5px] font-medium text-neutral-900 dark:text-neutral-100"
                : "text-[13.5px] text-neutral-400 dark:text-neutral-500"
            }
          >
            {t(`transportStops.${stopKey(id)}`)}
          </p>
          {date ? (
            <p className="mt-0.5 text-[12px] text-neutral-500">{date}</p>
          ) : null}
        </div>
      ),
    };
  });

  const extras = extraTrackingRows(tracking).map((row) => ({
    key: `extra-${row.id}`,
    color: "green",
    children: (
      <div>
        <p className="text-[13.5px] font-medium text-neutral-900 dark:text-neutral-100">
          {row.location_name}
        </p>
        {row.date ? (
          <p className="mt-0.5 text-[12px] text-neutral-500">{row.date}</p>
        ) : null}
      </div>
    ),
  }));

  return <Timeline items={[...stops, ...extras]} />;
}
```

- [ ] **Step 2: Create `src/components/order/OrderFieldCard.tsx`**

```tsx
"use client";

import type { ReactNode } from "react";

export type OrderField = {
  label: string;
  value: ReactNode;
};

type Props = {
  title: string;
  fields: OrderField[];
};

/**
 * A titled label/value card that filters its own empty rows and disappears
 * entirely when nothing is left.
 *
 * This is what keeps an admin-entered order (12 keys, no auction data) from
 * rendering a grid of labels with blanks beside them. Emptiness is decided per
 * field here rather than by each caller.
 */
export default function OrderFieldCard({ title, fields }: Props) {
  const rows = fields.filter(
    (f) => f.value !== null && f.value !== undefined && f.value !== "",
  );

  if (rows.length === 0) return null;

  return (
    <section className="rounded-lg border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
      <h3 className="mb-1 text-[13px] font-semibold text-neutral-900 dark:text-neutral-100">
        {title}
      </h3>
      <div>
        {rows.map((f) => (
          <div
            key={f.label}
            className="flex items-start justify-between gap-4 border-b border-neutral-100 py-2 last:border-0 dark:border-neutral-800"
          >
            <span className="shrink-0 text-[13px] text-neutral-500">
              {f.label}
            </span>
            <span className="text-right text-[13px] text-neutral-900 dark:text-neutral-100">
              {f.value}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Verify types and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: both exit 0.

- [ ] **Step 4: Commit**

```bash
git add src/components/order/OrderTimeline.tsx src/components/order/OrderFieldCard.tsx
git commit -m "feat(orders): shipping timeline and self-hiding field card

Tracking rows outside the four-stop model are appended rather than dropped.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

## Task 6: Detail composition and the detail page

**Files:**
- Create: `src/components/order/OrderDetail.tsx`
- Create: `src/app/[locale]/dashboard/orders/[id]/page.tsx`

**Interfaces:**
- Consumes: `useOrder` (Task 1); `orderTotalMnt` (Task 1); `OrderProgress`, `OrderStatusTag` (Task 3); `orderTitle` from `./OrderRow` (Task 4); `OrderTimeline`, `OrderFieldCard`, `OrderField` (Task 5); `dashboard.orderDetail.*` (Task 2); `CarGallery` from `@/components/car-detail/CarGallery`; `formatJpy`, `formatMnt` from `@/lib/bidConfig`; `ApiError` from `@/services/Api`; `decodeAuctionText`, `parseAuctionInfo` from `@/utils/auctionInfo`.
- Produces: route `/{locale}/dashboard/orders/{id}`.

- [ ] **Step 1: Create `src/components/order/OrderDetail.tsx`**

```tsx
"use client";

import { Skeleton } from "antd";
import { useTranslations } from "next-intl";
import CarGallery from "@/components/car-detail/CarGallery";
import EmptyState from "@/components/dashboard/EmptyState";
import SectionMast from "@/components/dashboard/SectionMast";
import { useOrder } from "@/hooks/useOrders";
import { formatJpy, formatMnt } from "@/lib/bidConfig";
import { ApiError } from "@/services/Api";
import { orderTotalMnt } from "@/types/order";
import { decodeAuctionText, parseAuctionInfo } from "@/utils/auctionInfo";
import OrderFieldCard, { type OrderField } from "./OrderFieldCard";
import OrderProgress from "./OrderProgress";
import OrderStatusTag from "./OrderStatusTag";
import OrderTimeline from "./OrderTimeline";
import { orderTitle } from "./OrderRow";

/** AJES stores MILEAGE as a bare km string; some admin orders leave it blank. */
function formatMileage(raw: string | undefined): string | null {
  const km = Number(raw);
  if (!raw || !Number.isFinite(km) || km <= 0) return null;
  return `${new Intl.NumberFormat("en-US").format(km)} km`;
}

export default function OrderDetail({ id }: { id: string }) {
  const t = useTranslations("dashboard.orderDetail");
  const query = useOrder(id);

  if (query.isError && !query.data) {
    const notFound =
      query.error instanceof ApiError && query.error.status === 404;

    return (
      <EmptyState
        title={notFound ? t("notFoundTitle") : t("loadErrorTitle")}
        description={notFound ? t("notFoundBody") : t("loadErrorBody")}
        cta={{ label: t("backToList"), href: "/dashboard/orders" }}
      />
    );
  }

  if (!query.data) {
    // Covers initial load and the offline-paused state (networkMode: 'online'
    // pauses the fetch, so isPending is true but isFetching/isLoading are false).
    return <Skeleton active paragraph={{ rows: 8 }} />;
  }

  const order = query.data;
  const car = order.car_data ?? {};
  const mnt = car.PRICE_DATA?.mnt;
  const jpy = car.PRICE_DATA?.jpy;
  // INFO is per-auction-house free text; parseAuctionInfo pulls the two graded
  // fields out of it. Printing the raw blob is what v1 did and it is unreadable.
  const info = parseAuctionInfo(car.INFO);
  const total = formatMnt(orderTotalMnt(order));

  const paymentFields: OrderField[] = [
    { label: t("total"), value: total },
    {
      label: t("advance"),
      value: mnt?.advance != null ? formatMnt(mnt.advance) : null,
    },
    {
      label: t("remaining"),
      value: mnt?.remaining != null ? formatMnt(mnt.remaining) : null,
    },
    {
      label: t("jpyTotal"),
      value: jpy?.total != null ? formatJpy(jpy.total) : null,
    },
    { label: t("exchangeRate"), value: jpy?.exchange_rate ?? null },
  ];

  const orderFields: OrderField[] = [
    { label: t("status"), value: order.status_label },
    { label: t("port"), value: order.port },
    { label: t("departureDate"), value: order.departure_date },
    { label: t("arrivalDate"), value: order.arrival_date },
    { label: t("operatorLabel"), value: order.user?.name ?? null },
    { label: t("note"), value: order.note },
  ];

  const carFields: OrderField[] = [
    { label: t("marka"), value: car.MARKA_NAME },
    { label: t("model"), value: car.MODEL_NAME },
    { label: t("year"), value: car.YEAR },
    {
      label: t("kuzov"),
      value: [car.KUZOV, car.SERIAL].filter(Boolean).join(" "),
    },
    { label: t("color"), value: car.COLOR },
    { label: t("engine"), value: car.ENG_V ? `${car.ENG_V} cc` : null },
    { label: t("transmission"), value: car.KPP },
    { label: t("grade"), value: decodeAuctionText(car.GRADE) },
    { label: t("mileage"), value: formatMileage(car.MILEAGE) },
    { label: t("rate"), value: car.RATE },
    { label: t("rateExt"), value: info.rateExt ?? null },
    { label: t("rateInt"), value: info.rateInt ?? null },
  ];

  const auctionFields: OrderField[] = [
    { label: t("auctionId"), value: car.ID },
    { label: t("lot"), value: car.LOT },
    { label: t("auctionName"), value: car.AUCTION },
    { label: t("auctionDate"), value: car.AUCTION_DATE },
  ];

  return (
    <div className="space-y-6">
      {order.images?.length ? (
        // Order photos live on our S3, which does NOT honour the auction CDN's
        // `&w=` suffix — sizeVariants={false} makes every image load untouched.
        <CarGallery
          images={order.images}
          alt={orderTitle(order)}
          sizeVariants={false}
        />
      ) : null}

      <div className="flex flex-wrap items-start justify-between gap-4 rounded-lg border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
        <div className="min-w-0 space-y-1">
          <p className="truncate text-base font-semibold text-neutral-900 dark:text-neutral-100">
            {orderTitle(order)}
          </p>
          <p className="text-[13px] text-neutral-500">
            {t("orderNo", { id: order.id })}
          </p>
          {order.created_at ? (
            <p className="text-[13px] text-neutral-500">
              {t("createdAt", { date: order.created_at })}
            </p>
          ) : null}
        </div>

        <div className="space-y-2 text-right">
          <OrderStatusTag status={order.status} label={order.status_label} />
          <p className="text-xl font-semibold tabular-nums text-neutral-900 dark:text-neutral-100">
            {total}
          </p>
        </div>
      </div>

      <section className="space-y-4">
        <SectionMast title={t("progressHeading")} />
        <div className="rounded-lg border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
          <OrderProgress location={order.location} />
          <div className="mt-5">
            {order.location !== null || (order.tracking?.length ?? 0) > 0 ? (
              <OrderTimeline
                location={order.location}
                tracking={order.tracking}
              />
            ) : (
              // A plain line, not EmptyState: this sits inside a bordered card
              // already, and EmptyState's dashed box + py-14 would nest a
              // second frame inside the first.
              <p className="text-[13px] text-neutral-500">
                {t("timelineEmpty")}
              </p>
            )}
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <OrderFieldCard title={t("paymentHeading")} fields={paymentFields} />
        <OrderFieldCard title={t("orderHeading")} fields={orderFields} />
        <OrderFieldCard title={t("carHeading")} fields={carFields} />
        {/* car_data.ID is always set (admin orders get a generated TJC-… code),
            so this card needs an explicit gate: without a lot or an auction
            house there was no auction to describe. */}
        {car.LOT || car.AUCTION ? (
          <OrderFieldCard title={t("auctionHeading")} fields={auctionFields} />
        ) : null}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create `src/app/[locale]/dashboard/orders/[id]/page.tsx`**

```tsx
import { getTranslations, setRequestLocale } from "next-intl/server";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import OrderDetail from "@/components/order/OrderDetail";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("dashboard.orderDetail");

  return (
    <>
      <DashboardHeader title={t("title")} description={t("description")} />
      {/* Ownership is enforced by the API (another customer's id 404s), so the
          shell renders unconditionally and OrderDetail handles the 404 state. */}
      <OrderDetail id={id} />
    </>
  );
}
```

- [ ] **Step 3: Verify types and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: both exit 0.

- [ ] **Step 4: Commit**

```bash
git add src/components/order/OrderDetail.tsx "src/app/[locale]/dashboard/orders/[id]/page.tsx"
git commit -m "feat(orders): detail page at /dashboard/orders/[id]

Every field renders only when present, so an admin-entered order does not
show a grid of empty labels. GRADE/INFO go through auctionInfo rather than
v1's dangerouslySetInnerHTML. The gallery reuses CarGallery with
sizeVariants=false — order photos are S3, not the auction CDN.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

## Task 7: Dashboard integration

**Files:**
- Modify: `src/components/dashboard/Sidebar.tsx`
- Modify: `src/components/dashboard/DashboardStats.tsx:44-61`
- Modify: `src/app/[locale]/dashboard/page.tsx:31-35`

**Interfaces:**
- Consumes: `listOrders` (Task 1); `dashboard.sidebar.orders`, `dashboard.home.stats.ordersLabel`, `dashboard.home.stats.ordersHint` (Task 2); route `/dashboard/orders` (Task 4).
- Produces: nothing new — this is the last wiring task.

- [ ] **Step 1: Add the nav entry to `Sidebar.tsx`**

Insert into `NAV_HREFS` **between** the `/dashboard/bids` entry and the `/dashboard/reports` entry (lucide's `truck` glyph):

```tsx
  {
    href: "/dashboard/orders",
    key: "orders",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 17h4V5H2v12h3" />
        <path d="M20 17h2v-3.34a4 4 0 0 0-1.17-2.83L19 9h-5v8h1" />
        <circle cx="7.5" cy="17.5" r="2.5" />
        <circle cx="17.5" cy="17.5" r="2.5" />
      </svg>
    ),
  },
```

- [ ] **Step 2: Extend the label cast in `Sidebar.tsx`**

The `NAV` map casts `item.key` to a literal union; add `"orders"` to it.

Find:

```tsx
    label: t(item.key as "overview" | "profile" | "bids" | "reports"),
```

Replace with:

```tsx
    label: t(item.key as "overview" | "profile" | "bids" | "orders" | "reports"),
```

- [ ] **Step 3: Add the orders count query to `DashboardStats.tsx`**

Add the import beside the existing `listReports` import:

```tsx
import { listOrders } from "@/services/orders";
```

Then add this query after the existing `reportCount` query:

```tsx
  // Same one-row-page trick as the reports card: read `meta.total` instead of
  // adding a server-side counter for a single figure.
  const orderCount = useQuery({
    queryKey: ["stats", "orders"],
    queryFn: () => listOrders(1, 1),
    enabled: isAuthenticated,
    staleTime: 30_000,
  });
```

- [ ] **Step 4: Add the third card and widen the grid in `DashboardStats.tsx`**

Find:

```tsx
    <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
```

Replace with:

```tsx
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
```

Then insert this card between the bids card and the reports card:

```tsx
      <StatCard
        label={t("stats.ordersLabel")}
        value={orderCount.data?.meta.total ?? "—"}
        hint={t("stats.ordersHint")}
        href="/dashboard/orders"
      />
```

- [ ] **Step 5: Repoint the "track" quick action in `src/app/[locale]/dashboard/page.tsx`**

Find:

```tsx
    {
      title: t("quickActions.track.title"),
      description: t("quickActions.track.description"),
      href: "/garage",
    },
```

Replace with:

```tsx
    {
      title: t("quickActions.track.title"),
      description: t("quickActions.track.description"),
      href: "/dashboard/orders",
    },
```

- [ ] **Step 6: Verify types and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: both exit 0.

- [ ] **Step 7: Commit**

```bash
git add src/components/dashboard/Sidebar.tsx src/components/dashboard/DashboardStats.tsx "src/app/[locale]/dashboard/page.tsx"
git commit -m "feat(dashboard): surface orders in the sidebar, stats and quick actions

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

## Task 8: Browser verification

**Files:** none — no code changes unless a defect turns up.

**Interfaces:**
- Consumes: everything above.
- Produces: a verified feature.

- [ ] **Step 1: Build**

Run: `npm run build`
Expected: exit 0. The two new routes appear in the route table as
`/[locale]/dashboard/orders` and `/[locale]/dashboard/orders/[id]`.

- [ ] **Step 2: Launch and drive the app**

Invoke the project's `verify` skill (`Skill` tool, `skill: "verify"`). It owns
how this app is started and driven locally. Do not hand-roll a dev server.

- [ ] **Step 3: Walk the list page**

Sign in as a customer who has at least one order, then visit
`/mn/dashboard/orders` and confirm:

1. Rows render with a photo, title, price and status tag.
2. The shipping bar shows filled segments matching the order's `location`, and
   the caption under it names that stop in Mongolian.
3. An order whose `location` is null shows an **empty** bar (no filled segment,
   no negative width) and the caption "Хараахан хөдлөөгүй".
4. The sidebar's "Захиалсан машин" entry is highlighted.
5. Switch to `/en/dashboard/orders` and `/ru/dashboard/orders` — the stop
   captions change language and no key renders as a raw path like
   `dashboard.transportStops.stop1`.

- [ ] **Step 4: Walk the detail page**

Click a row and confirm:

1. The gallery renders and its lightbox opens; thumbnails are not broken images
   (this is what `sizeVariants={false}` protects).
2. The timeline lists four stops; those already passed carry dates, later ones
   are grey.
3. The payment card shows Нийт үнэ, and Урьдчилгаа/Үлдэгдэл when the order has
   `PRICE_DATA.mnt`.
4. No card shows a label with a blank value beside it.
5. `GRADE` reads as normal text, not `&#65393;`-style entities and not HTML.

- [ ] **Step 5: Check the two negative paths**

1. Visit `/mn/dashboard/orders/999999` (an id that is not yours) — expect the
   "Захиалга олдсонгүй" empty state with a working back link, not a crash.
2. Visit `/mn/dashboard` — the third stat card shows a count and links to the
   orders list; the "Захиалга хянах" quick action goes there too.

- [ ] **Step 6: Report**

State plainly what was verified and what, if anything, failed. If a defect
turns up, fix it, re-run `npx tsc --noEmit && npm run lint`, and commit the fix
separately before declaring the feature done.

---

## Notes for the reviewer

- **No backend work.** Both endpoints already ship. If a field looks missing,
  check `app/Http/Resources/Order/OrderResource.php` in `tjcar-api-v2` before
  assuming the frontend dropped it.
- **`tracking` is detail-only.** Any list-level code reading `order.tracking`
  is a bug — `Customer\OrderController@index` does not eager-load it.
- **The `price` column's currency is not trustworthy.** `orderTotalMnt()` is the
  only place allowed to decide what to print; nothing else should read
  `order.price` directly. The spec documents why.
