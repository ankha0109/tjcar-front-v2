# Dashboard bids — wire `GET /bids`, `GET /bids/{id}`, `PATCH /bids/{id}`

**Date:** 2026-07-29
**Status:** approved, ready for implementation plan
**Repos:** `tjcar-front-v2` (bulk) + `tjcar-api-v2` (three backend changes)

## Problem

The v2 API exposes four customer bid endpoints. Only one is wired:

| Endpoint | Frontend state |
| --- | --- |
| `POST /bids` | Wired — `src/components/car-detail/CarBidForm.tsx:73` |
| `GET /bids` | Not wired — `src/app/[locale]/dashboard/bids/page.tsx` is two static `EmptyState` blocks |
| `GET /bids/{id}` | Not wired — no detail route exists |
| `PATCH /bids/{id}` | Not wired — no price-edit UI exists |

A customer can therefore send a bid and then never see it again. The dashboard
overview compounds this: `src/app/[locale]/dashboard/page.tsx:21` carries
`// TODO: wire APIs for personal counts (bids/reports)` and renders hardcoded
zeroes, so even the bid *count* is fiction.

## Backend changes (`tjcar-api-v2`)

### 1. `scope` filter on `GET /bids`

New optional query param on `Customer\BidController@index`:

| Value | Statuses |
| --- | --- |
| `active` | `Pending` (0), `Processing` (10) |
| `closed` | `Win` (100), `Lose` (200), `Canceled` (300), `Unsold` (400) |
| omitted | all |

Named `scope`, not `status`, because the values are not statuses — they are
groupings over statuses. An unrecognised value is a validation error (422), not a
silent full list.

This exists so the UI's three tabs paginate honestly. Filtering client-side
inside one page of 20 rows produces tabs whose page sizes wobble ("active 3,
closed 17"), and page 2 would re-shuffle.

### 2. Price-edit gate

Today `update` checks ownership and nothing else: a bid whose auction ended last
month, or one already marked `Win`, still accepts a new price. That is inherited
v1 behaviour and it is wrong — the price the operator bid with can be rewritten
after the fact.

Add `BidService::updatePrice()`, symmetric with the existing `placeBid()`, and
have the controller call it. It rejects with 422 when:

- the bid's status is not `Pending` or `Processing`; or
- `car_data['AUCTION_DATE']` is less than 2 hours away (the same cutoff
  `placeBid()` already enforces); or
- `car_data['AUCTION_DATE']` is absent or unparseable.

The third case is **fail-closed on purpose**: if the cutoff cannot be evaluated,
the bid is not editable. Allowing an edit we cannot time-check re-opens exactly
the hole the gate closes.

`car_data` is a snapshot taken at bid time and always carries `AUCTION_DATE`, so
no upstream AJES call is needed.

The 2-hour cutoff arithmetic (parse in `Asia/Tokyo`, convert to
`Asia/Ulaanbaatar`, subtract 2h, compare to now) currently lives inline in
`placeBid()`. Extract it to one private helper on `BidService` and call it from
both places rather than duplicating it.

### 3. `requests_pending` on `GET /stats`

`Customer\StatsController` returns `requests` and `requests_win`. Add
`requests_pending` — count of `BidStatus::Pending` only.

Pending-only (not Pending + Processing) because the dashboard copy already reads
"{count} хүлээгдэж байна" in all three locales; this keeps that text truthful and
untouched. It is deliberately a different number from the `active` tab's total.

### Operator on bid logs — no change needed

`BidLogResource` emits an operator block via `whenLoaded('user')` and
`BidController@show` never eager-loads `bidLogs.user`, which looks like a gap.
It is not: `CustomerBidLog` declares `protected $with = ['user']`, so every log
carries its operator automatically. The timeline can attribute status changes
today. A test pins this rather than changing code.

### Backend tests

Extend the existing Pest files — no new test files:

- `tests/Feature/Customer/BidTest.php`
  - `scope=active` returns only Pending/Processing; `scope=closed` returns only
    the four terminal statuses; omitted returns all; an invalid value 422s.
  - price edit is rejected (422) for a `Win` bid.
  - price edit is rejected (422) when the auction is under 2 hours away.
  - price edit is rejected (422) when `car_data` has no `AUCTION_DATE`.
  - price edit still succeeds for a `Pending` bid on a distant auction (the
    existing happy-path test must keep passing).
  - `show` exposes the operator on a bid log (pins the `$with` behaviour).
- `tests/Feature/Customer/StatsTest.php` — `requests_pending` counts only
  `Pending`.

## Frontend architecture (`tjcar-front-v2`)

Service → hook → small client components, mirroring the reports feature. The
list is client-rendered for the same reason `ReportList` is: a bid moves
Pending → Processing → Win/Lose while the customer is looking at it, so the page
refetches instead of being rendered once on the server.

### New files

| File | Responsibility |
| --- | --- |
| `src/types/bid.ts` | `Bid`, `BidLog`, `BidStatus` union (`0 \| 10 \| 100 \| 200 \| 300 \| 400`), `isBidEditable()` |
| `src/services/bids.ts` | `listBids(scope, page, perPage)`, `getBid(id)`, `updateBidPrice(id, bidPrice)` |
| `src/hooks/useBids.ts` | `BIDS_KEY`, `useBidList`, `useBid`, `useUpdateBidPrice` |
| `src/components/bid/BidList.tsx` | Tabs + pagination + loading/empty/error states |
| `src/components/bid/BidRow.tsx` | One row, links to `/dashboard/bids/{id}` |
| `src/components/bid/BidStatusTag.tsx` | Status → antd `Tag` colour; the text is the API's `status_label` |
| `src/components/bid/BidDetail.tsx` | Car snapshot, prices, edit entry point |
| `src/components/bid/BidTimeline.tsx` | `bid_logs` → antd `Timeline` |
| `src/components/bid/BidPriceEditModal.tsx` | Modal + `Form` for the new price |
| `src/app/[locale]/dashboard/bids/[id]/page.tsx` | Server shell around `BidDetail` |
| `src/components/dashboard/DashboardStats.tsx` | Client island for the overview counts |

### Modified files

- `src/app/[locale]/dashboard/bids/page.tsx` — drop the two static sections,
  render `<BidList />` under one `SectionMast`.
- `src/app/[locale]/dashboard/page.tsx` — replace the hardcoded `stats` object
  and its TODO with `<DashboardStats />`.
- `src/services/Api.ts` — add `patch()` alongside `put()`. The `/api/v1` proxy
  already exports a `PATCH` handler; only the client wrapper is missing.
- `messages/mn.json`, `messages/en.json`, `messages/ru.json` — new
  `dashboard.bids.*` keys; the current `activeHeading` / `historyHeading` /
  `*Empty*` set is replaced by the tab-based copy.

### Reuse — no new adapter

`car_data` is the raw AJES row, structurally identical to the existing
`FeaturedCar` type (`ID`, `MARKA_NAME`, `MODEL_NAME`, `GRADE`, `YEAR`, `IMAGES`,
`START`, `AUCTION_DATE`, …). `fromFeaturedCar()` in `src/types/car.ts` already
converts that shape to `CarItem`, so images, make, model and year come from it
directly. `formatMnt`, `formatJpy` and `BID_CUTOFF_HOURS` come from
`src/lib/bidConfig.ts`.

`car_data.ID` is the AJES lot id, so the detail page links out to
`/japan/{car_data.ID}` for the live lot.

### Data flow

| Interaction | Query key | Request |
| --- | --- | --- |
| List tab + page | `["bids", scope, page]` | `GET /bids?scope=&page=&per_page=10` |
| Detail | `["bids", "detail", id]` | `GET /bids/{id}` |
| Price edit | mutation | `PATCH /bids/{id}` |

The mutation invalidates the whole `["bids"]` prefix on success, so the list and
the open detail both re-read. No optimistic update: the server owns two 422 gates
that the client can only approximate, so the reply is what gets rendered.

`staleTime: 15_000` and `refetchOnWindowFocus: true`, matching `ReportList`.

### Edit affordance

The edit button renders only when `isBidEditable(bid)` — status is `Pending` or
`Processing` **and** `AUCTION_DATE` is more than `BID_CUTOFF_HOURS` away. This
mirrors the backend gate, but the backend stays the decider; the client check
exists to avoid offering an action that will 422.

### Error handling

- List or detail fetch fails → `EmptyState` with a load-error title/body, the
  same pattern as `ReportList`.
- Detail 404 (another customer's bid, scoped to 404 by the API) → a
  "not found" `EmptyState` plus a link back to `/dashboard/bids`.
- Price edit 422 → surface `ApiError.message` verbatim in `modal.error`. The API
  writes these messages in Mongolian already.

## Verification

Frontend has no test framework — `package.json` carries only `lint` — so the
frontend side is verified by lint, type-check and a manual pass. This is a known
gap, not an omission in this design.

- Backend: `php artisan test --compact tests/Feature/Customer/BidTest.php` and
  `php artisan test --compact tests/Feature/Customer/StatsTest.php`, then
  `vendor/bin/pint --dirty --format agent`.
- Frontend: `npm run lint` and `npm run build` (the build is the TypeScript
  gate).
- Manual on `npm run dev`: list loads → each tab paginates → row opens detail →
  timeline shows logs → edit succeeds on an editable bid → edit button is absent
  on a closed bid → a stale-auction edit surfaces the API's 422 message.

## Out of scope

- Cancelling a bid from the customer side (no endpoint exists).
- Any admin-side bid screen.
- Adding a report count to `GET /stats`. The dashboard reads the reports total
  from `GET /reports?per_page=1` → `meta.total` instead, which needs no backend
  change.
