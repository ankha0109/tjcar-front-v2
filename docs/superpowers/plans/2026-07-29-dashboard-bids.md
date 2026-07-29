# Dashboard Bids Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire the three unwired customer bid endpoints (`GET /bids`, `GET /bids/{id}`, `PATCH /bids/{id}`) into the tjcar dashboard, and close the price-edit hole the API currently leaves open.

**Architecture:** Three backend changes in `tjcar-api-v2` (a `scope` filter, a price-edit gate in `BidService`, a `requests_pending` stat), then a frontend feature in `tjcar-front-v2` built as service → react-query hook → small client components, mirroring the existing reports feature.

**Tech Stack:** Laravel 13 + Pest 4 (API, PHP 8.3) · Next.js 16 App Router + TypeScript 5 (strict) + antd 6 + TanStack Query 5 + next-intl (frontend)

## Global Constraints

- Two repos. Backend paths are relative to `/Users/ankhbayar/Herd/tjcar-api-v2`; frontend paths are relative to `/Users/ankhbayar/Projects/Front/tjcar-front-v2`. Every task states which repo it is in.
- Frontend branch is `feat/dashboard-bids` (already created). Backend work goes on a new `feat/bid-scope-and-edit-gate` branch cut from `main`.
- The frontend working tree has unrelated uncommitted work. **Only `git add` the exact paths a task names** — never `git add -A` or `git add .`.
- Backend: after touching any PHP file run `vendor/bin/pint --dirty --format agent` before committing.
- Frontend: there is no test framework. The gate for every frontend task is `npx tsc --noEmit` followed by `npm run lint`.
- All three locale files (`messages/mn.json`, `messages/en.json`, `messages/ru.json`) must be updated together in the same task. Mongolian is the primary language.
- Status label text always comes from the API's `status_label` field. Never hardcode status names in the frontend.
- The `scope` query values are exactly `active` and `closed`.
- The bid cutoff is 2 hours before the auction start (`BID_CUTOFF_HOURS` in `src/lib/bidConfig.ts`).

---

## File Structure

**Backend (`tjcar-api-v2`)**

| File | Change | Responsibility |
| --- | --- | --- |
| `app/Enums/BidStatus.php` | modify | Add `openCases()` / `closedCases()` — the single definition of "active" vs "closed" |
| `app/Http/Controllers/Customer/BidController.php` | modify | Validate + apply `scope`; delegate price update to `BidService` |
| `app/Services/Bid/BidService.php` | modify | Own the bid window rule; add `updatePrice()` |
| `app/Http/Controllers/Customer/StatsController.php` | modify | Add `requests_pending` |
| `tests/Feature/Customer/BidTest.php` | modify | Scope filter + edit gate coverage |
| `tests/Feature/Customer/StatsTest.php` | modify | `requests_pending` coverage |

**Frontend (`tjcar-front-v2`)**

| File | Change | Responsibility |
| --- | --- | --- |
| `src/types/bid.ts` | create | Bid/BidLog shapes, status constants, `isBidEditable()` |
| `src/services/bids.ts` | create | Three thin API calls |
| `src/services/Api.ts` | modify | Add `patch()` |
| `src/hooks/useBids.ts` | create | Query keys + list/detail/mutation hooks |
| `src/components/bid/BidStatusTag.tsx` | create | Status → tag colour |
| `src/components/bid/BidRow.tsx` | create | One list row |
| `src/components/bid/BidList.tsx` | create | Tabs, pagination, empty/error states |
| `src/components/bid/BidTimeline.tsx` | create | Bid logs → antd Timeline |
| `src/components/bid/BidPriceEditModal.tsx` | create | Price edit form + 422 surfacing |
| `src/components/bid/BidDetail.tsx` | create | Detail composition |
| `src/components/dashboard/DashboardStats.tsx` | create | Overview counts |
| `src/app/[locale]/dashboard/bids/page.tsx` | modify | Server shell → `BidList` |
| `src/app/[locale]/dashboard/bids/[id]/page.tsx` | create | Server shell → `BidDetail` |
| `src/app/[locale]/dashboard/page.tsx` | modify | Hardcoded stats → `DashboardStats` |
| `messages/{mn,en,ru}.json` | modify | `dashboard.bids.*` copy |

---

## Task 1: Backend — `scope` filter on `GET /bids`

**Repo:** `tjcar-api-v2`

**Files:**
- Modify: `app/Enums/BidStatus.php`
- Modify: `app/Http/Controllers/Customer/BidController.php:20-28`
- Test: `tests/Feature/Customer/BidTest.php`

**Interfaces:**
- Consumes: nothing.
- Produces: `BidStatus::openCases(): array<int, BidStatus>` returning `[Pending, Processing]`; `BidStatus::closedCases(): array<int, BidStatus>` returning `[Win, Lose, Canceled, Unsold]`. Task 2 consumes `openCases()`. The frontend consumes the `scope=active|closed` query contract from Task 4 onward.

- [ ] **Step 1: Create the backend branch**

```bash
cd /Users/ankhbayar/Herd/tjcar-api-v2
git checkout main
git checkout -b feat/bid-scope-and-edit-gate
```

- [ ] **Step 2: Write the failing tests**

Append to `tests/Feature/Customer/BidTest.php`, directly after the `it('rejects unauthenticated access to the bid list', ...)` block:

```php
it('filters the bid list to the active scope', function () {
    $customer = actingAsCustomer();
    CustomerBid::factory()->count(2)->for($customer)->create(['status' => BidStatus::Pending]);
    CustomerBid::factory()->for($customer)->create(['status' => BidStatus::Processing]);
    CustomerBid::factory()->for($customer)->create(['status' => BidStatus::Win]);

    $this->getJson('/api/bids?scope=active')
        ->assertOk()
        ->assertJsonCount(3, 'data');
});

it('filters the bid list to the closed scope', function () {
    $customer = actingAsCustomer();
    CustomerBid::factory()->for($customer)->create(['status' => BidStatus::Pending]);
    CustomerBid::factory()->for($customer)->create(['status' => BidStatus::Win]);
    CustomerBid::factory()->for($customer)->create(['status' => BidStatus::Lose]);
    CustomerBid::factory()->for($customer)->create(['status' => BidStatus::Canceled]);
    CustomerBid::factory()->for($customer)->create(['status' => BidStatus::Unsold]);

    $this->getJson('/api/bids?scope=closed')
        ->assertOk()
        ->assertJsonCount(4, 'data');
});

it('returns every bid when no scope is given', function () {
    $customer = actingAsCustomer();
    CustomerBid::factory()->for($customer)->create(['status' => BidStatus::Pending]);
    CustomerBid::factory()->for($customer)->create(['status' => BidStatus::Win]);

    $this->getJson('/api/bids')
        ->assertOk()
        ->assertJsonCount(2, 'data');
});

it('rejects an unknown scope', function () {
    actingAsCustomer();

    $this->getJson('/api/bids?scope=archived')
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['scope']);
});
```

- [ ] **Step 3: Run the tests to verify they fail**

```bash
cd /Users/ankhbayar/Herd/tjcar-api-v2
php artisan test --compact --filter='scope'
```

Expected: the three filtering tests fail on count assertions (the filter is ignored, so every bid comes back) and `rejects an unknown scope` fails because a 200 is returned instead of a 422.

- [ ] **Step 4: Add the status grouping helpers**

In `app/Enums/BidStatus.php`, add these two methods after `label()`:

```php
    /**
     * Statuses a bid can still move out of — the customer's "active" bucket.
     *
     * @return array<int, self>
     */
    public static function openCases(): array
    {
        return [self::Pending, self::Processing];
    }

    /**
     * Terminal statuses — the customer's "closed" bucket.
     *
     * @return array<int, self>
     */
    public static function closedCases(): array
    {
        return [self::Win, self::Lose, self::Canceled, self::Unsold];
    }
```

- [ ] **Step 5: Apply the filter in the controller**

In `app/Http/Controllers/Customer/BidController.php`, replace the `index` method with:

```php
    /**
     * GET /bids — OLD: CustomerController@bidHistory (unpaginated; now paginated per INDEX).
     *
     * `scope` groups statuses for the dashboard tabs: `active` (still in play)
     * or `closed` (terminal). Omit it for everything.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $request->validate(['scope' => ['sometimes', Rule::in(['active', 'closed'])]]);

        $scope = $request->string('scope')->toString();

        $bids = CustomerBid::query()
            ->where('customer_id', $request->user()->id)
            ->when($scope !== '', fn (Builder $query) => $query->whereIn(
                'status',
                $scope === 'active' ? BidStatus::openCases() : BidStatus::closedCases(),
            ))
            ->latest('created_at')
            ->paginate($request->integer('per_page', 20));

        return BidResource::collection($bids);
    }
```

Add these imports to the same file's `use` block:

```php
use App\Enums\BidStatus;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Validation\Rule;
```

- [ ] **Step 6: Run the tests to verify they pass**

```bash
cd /Users/ankhbayar/Herd/tjcar-api-v2
php artisan test --compact tests/Feature/Customer/BidTest.php
```

Expected: PASS, all 17 tests (13 pre-existing + 4 new).

- [ ] **Step 7: Format and commit**

```bash
cd /Users/ankhbayar/Herd/tjcar-api-v2
vendor/bin/pint --dirty --format agent
git add app/Enums/BidStatus.php app/Http/Controllers/Customer/BidController.php tests/Feature/Customer/BidTest.php
git commit -m "feat(bids): filter the customer bid list by active/closed scope"
```

---

## Task 2: Backend — price-edit gate

**Repo:** `tjcar-api-v2`

**Files:**
- Modify: `app/Services/Bid/BidService.php`
- Modify: `app/Http/Controllers/Customer/BidController.php:57-70`
- Test: `tests/Feature/Customer/BidTest.php`

**Interfaces:**
- Consumes: `BidStatus::openCases()` from Task 1.
- Produces: `BidService::updatePrice(CustomerBid $bid, int|float $bidPrice): CustomerBid` — throws `ValidationException` (422) keyed on `bid_price`. The frontend's `isBidEditable()` in Task 4 mirrors these two rules.

- [ ] **Step 1: Write the failing tests**

Append to `tests/Feature/Customer/BidTest.php`, at the end of the file:

```php
it('rejects a price edit on a closed bid', function () {
    $customer = actingAsCustomer();
    $bid = CustomerBid::factory()->win()->for($customer)->create(['bid_price' => 10_000_000]);

    $this->patchJson("/api/bids/{$bid->id}", ['bid_price' => 12_000_000])
        ->assertUnprocessable()
        ->assertJsonPath('message', 'Энэ саналын үнийг өөрчлөх боломжгүй');

    expect($bid->refresh()->bid_price)->toEqual(10_000_000);
});

it('rejects a price edit when the auction starts in less than 2 hours', function () {
    $customer = actingAsCustomer();
    $bid = CustomerBid::factory()->for($customer)->create([
        'bid_price' => 10_000_000,
        'car_data' => ajesCarRow(['AUCTION_DATE' => now('Asia/Tokyo')->addHour()->format('Y-m-d H:i:s')]),
    ]);

    $this->patchJson("/api/bids/{$bid->id}", ['bid_price' => 12_000_000])
        ->assertUnprocessable()
        ->assertJsonPath('message', 'Дуудлага худалдаа эхлэхээс 2 цагийн өмнө үнээ өөрчлөх боломжтой');

    expect($bid->refresh()->bid_price)->toEqual(10_000_000);
});

it('rejects a price edit when the snapshot has no auction date', function () {
    $customer = actingAsCustomer();
    $carData = ajesCarRow();
    unset($carData['AUCTION_DATE']);
    $bid = CustomerBid::factory()->for($customer)->create([
        'bid_price' => 10_000_000,
        'car_data' => $carData,
    ]);

    $this->patchJson("/api/bids/{$bid->id}", ['bid_price' => 12_000_000])
        ->assertUnprocessable()
        ->assertJsonPath('message', 'Дуудлага худалдаа эхлэхээс 2 цагийн өмнө үнээ өөрчлөх боломжтой');

    expect($bid->refresh()->bid_price)->toEqual(10_000_000);
});

it('allows a price edit on a processing bid with a distant auction', function () {
    $customer = actingAsCustomer();
    $bid = CustomerBid::factory()->processing()->for($customer)->create(['bid_price' => 10_000_000]);

    $this->patchJson("/api/bids/{$bid->id}", ['bid_price' => 12_000_000])
        ->assertOk()
        ->assertJsonPath('data.bid_price', 12_000_000);
});

it('exposes the operator on a bid log', function () {
    $customer = actingAsCustomer();
    $operator = User::factory()->create();
    $bid = CustomerBid::factory()->for($customer)->create(['user_id' => $operator->id]);
    $bid->update(['status' => BidStatus::Processing]);

    $this->getJson("/api/bids/{$bid->id}")
        ->assertOk()
        ->assertJsonPath('data.bid_logs.1.user.name', $operator->name);
});
```

The last test pins existing behaviour: `CustomerBidLog` declares `protected $with = ['user']`, so the operator is always loaded. It needs no production change — if it fails, the `$with` was removed and that is a regression worth catching. The observer writes a `Pending` log on create (index 0) and a `Processing` log on the status change (index 1).

- [ ] **Step 2: Run the tests to verify they fail**

```bash
cd /Users/ankhbayar/Herd/tjcar-api-v2
php artisan test --compact --filter='price edit|operator on a bid log'
```

Expected: the three rejection tests fail (200 returned, price changed). `allows a price edit on a processing bid` and `exposes the operator on a bid log` should already pass.

- [ ] **Step 3: Extract the bid window rule and add `updatePrice`**

In `app/Services/Bid/BidService.php`, replace the inline cutoff block inside `placeBid` — these five lines:

```php
        // Дуудлага худалдаа эхлэхээс 2 цагийн өмнө л хүсэлт авна (Tokyo → Ulaanbaatar, -2h)
        $auctionDate = Carbon::parse($car['AUCTION_DATE'], 'Asia/Tokyo')
            ->setTimezone('Asia/Ulaanbaatar')
            ->subHours(2);

        if (! $auctionDate->gt(Carbon::now())) {
```

with:

```php
        if (! $this->isWithinBidWindow($car)) {
```

Then add these two methods after `placeBid`:

```php
    /**
     * Update the customer's own bid price.
     *
     * Two rules, both absent from OLD: the bid must still be in play, and its
     * auction must still be outside the 2-hour cutoff. Without them a settled
     * bid's price could be rewritten after the auction ran.
     */
    public function updatePrice(CustomerBid $bid, int|float $bidPrice): CustomerBid
    {
        if (! in_array($bid->status, BidStatus::openCases(), true)) {
            throw ValidationException::withMessages(['bid_price' => 'Энэ саналын үнийг өөрчлөх боломжгүй']);
        }

        if (! $this->isWithinBidWindow($bid->car_data ?? [])) {
            throw ValidationException::withMessages(['bid_price' => 'Дуудлага худалдаа эхлэхээс 2 цагийн өмнө үнээ өөрчлөх боломжтой']);
        }

        $bid->update(['bid_price' => $bidPrice]);

        return $bid;
    }

    /**
     * Дуудлага худалдаа эхлэхээс 2 цагийн өмнө л хүсэлт авна (Tokyo → Ulaanbaatar, -2h).
     *
     * A missing or unparseable AUCTION_DATE returns false on purpose: if the
     * window cannot be evaluated we treat the lot as closed rather than
     * guessing in the customer's favour.
     *
     * @param  array<string, mixed>  $car
     */
    private function isWithinBidWindow(array $car): bool
    {
        $raw = $car['AUCTION_DATE'] ?? null;

        if (! is_string($raw) || $raw === '') {
            return false;
        }

        try {
            $auctionDate = Carbon::parse($raw, 'Asia/Tokyo')->setTimezone('Asia/Ulaanbaatar');
        } catch (InvalidFormatException) {
            return false;
        }

        return $auctionDate->subHours(2)->gt(Carbon::now());
    }
```

Add these imports to the file's `use` block:

```php
use Carbon\Exceptions\InvalidFormatException;
```

`BidStatus` and `CustomerBid` are already imported in this file.

- [ ] **Step 4: Delegate from the controller**

In `app/Http/Controllers/Customer/BidController.php`, replace the `update` method with:

```php
    /** PATCH /bids/{bid} — OLD: POST /bids/update-price (CustomerController@updateBidPrice). */
    public function update(UpdateBidPriceRequest $request, int $bid, BidService $bids): JsonResponse
    {
        $customerBid = CustomerBid::query()
            ->where('customer_id', $request->user()->id)
            ->findOrFail($bid);

        $bids->updatePrice($customerBid, $request->validated('bid_price'));

        return response()->json([
            'message' => 'Үнэ амжилттай шинэчлэгдлээ.',
            'data' => new BidResource($customerBid),
        ]);
    }
```

`BidService` is already imported in this file (the `store` method uses it).

- [ ] **Step 5: Run the full bid suite to verify it passes**

```bash
cd /Users/ankhbayar/Herd/tjcar-api-v2
php artisan test --compact tests/Feature/Customer/BidTest.php
```

Expected: PASS, all 22 tests. The pre-existing `updates the bid price, logs it and notifies the assigned operator` test must still pass — `CustomerBidFactory` sets `status: Pending` and an `AUCTION_DATE` three days out, so it clears both new gates.

- [ ] **Step 6: Run the wider suites that touch bids**

```bash
cd /Users/ankhbayar/Herd/tjcar-api-v2
php artisan test --compact tests/Feature/Admin/BidTest.php tests/Feature/Observers/BidObserverTest.php tests/Feature/Models/CustomerBidModelTest.php
```

Expected: PASS. The admin bid flow does not go through `BidService::updatePrice`, so nothing there should move.

- [ ] **Step 7: Format and commit**

```bash
cd /Users/ankhbayar/Herd/tjcar-api-v2
vendor/bin/pint --dirty --format agent
git add app/Services/Bid/BidService.php app/Http/Controllers/Customer/BidController.php tests/Feature/Customer/BidTest.php
git commit -m "fix(bids): gate customer price edits on open status and the 2h cutoff"
```

---

## Task 3: Backend — `requests_pending` on `GET /stats`

**Repo:** `tjcar-api-v2`

**Files:**
- Modify: `app/Http/Controllers/Customer/StatsController.php:20-28`
- Test: `tests/Feature/Customer/StatsTest.php:14-23`

**Interfaces:**
- Consumes: nothing.
- Produces: `GET /stats` → `{ data: { requests: int, requests_win: int, requests_pending: int } }`. Task 9's `DashboardStats` consumes all three.

- [ ] **Step 1: Update the failing test**

In `tests/Feature/Customer/StatsTest.php`, replace the `it('returns the customer request and win counts', ...)` block with:

```php
it('returns the customer request, win and pending counts', function () {
    $customer = actingAsCustomer();
    CustomerBid::factory()->count(2)->for($customer)->create();
    CustomerBid::factory()->win()->for($customer)->create();
    CustomerBid::factory()->processing()->for($customer)->create();
    CustomerBid::factory()->win()->create(); // another customer — must not leak

    $this->getJson('/api/stats')
        ->assertOk()
        ->assertExactJson([
            'data' => ['requests' => 4, 'requests_win' => 1, 'requests_pending' => 2],
        ]);
});
```

The factory default is `Pending`, so the two plain bids are the pending pair; the `processing()` bid is counted in `requests` but not in `requests_pending`.

- [ ] **Step 2: Run the test to verify it fails**

```bash
cd /Users/ankhbayar/Herd/tjcar-api-v2
php artisan test --compact tests/Feature/Customer/StatsTest.php
```

Expected: FAIL — the response has no `requests_pending` key, so `assertExactJson` reports a mismatch.

- [ ] **Step 3: Add the count**

In `app/Http/Controllers/Customer/StatsController.php`, add a third entry inside the `data` array, after `requests_win`:

```php
                'requests_pending' => CustomerBid::query()
                    ->where('customer_id', $customerId)
                    ->where('status', BidStatus::Pending)
                    ->count(),
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
cd /Users/ankhbayar/Herd/tjcar-api-v2
php artisan test --compact tests/Feature/Customer/StatsTest.php
```

Expected: PASS, 2 tests.

- [ ] **Step 5: Format and commit**

```bash
cd /Users/ankhbayar/Herd/tjcar-api-v2
vendor/bin/pint --dirty --format agent
git add app/Http/Controllers/Customer/StatsController.php tests/Feature/Customer/StatsTest.php
git commit -m "feat(stats): add the pending bid count to customer stats"
```

---

## Task 4: Frontend — bid types and service

**Repo:** `tjcar-front-v2`

**Files:**
- Create: `src/types/bid.ts`
- Create: `src/services/bids.ts`
- Modify: `src/services/Api.ts:108-114`

**Interfaces:**
- Consumes: the `scope` contract from Task 1, the edit-gate rules from Task 2, `FeaturedCar` from `src/types/featured.ts`, `Paginated<T>` from `src/types/api.ts`, `BID_CUTOFF_HOURS` from `src/lib/bidConfig.ts`.
- Produces:
  - `BID_STATUS` const object, `BidStatus` union, `BidOperator`, `BidLog`, `Bid`, `BidScope` types
  - `bidAuctionStart(bid: Bid): Date | null`
  - `isBidEditable(bid: Bid): boolean`
  - `listBids(scope: BidScope | undefined, page?: number, perPage?: number): Promise<Paginated<Bid>>`
  - `getBid(id: string): Promise<Bid>`
  - `updateBidPrice(id: number, bidPrice: number): Promise<Bid>`
  - `Api.patch<T>(url, body, options?)`

- [ ] **Step 1: Write the types**

Create `src/types/bid.ts`:

```ts
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
```

- [ ] **Step 2: Add `patch` to the API client**

In `src/services/Api.ts`, add a `patch` entry to the returned object, directly after `put`:

```ts
    patch: <T = unknown>(
      url: string,
      body: unknown,
      options: RequestOptions = {},
    ) => request<T>(url, { ...options, method: "PATCH", body }),
```

The `/api/v1` proxy already exports a `PATCH` handler (`src/app/api/v1/[...path]/route.ts:51`), so nothing else is needed.

- [ ] **Step 3: Write the service**

Create `src/services/bids.ts`:

```ts
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
```

- [ ] **Step 4: Type-check and lint**

```bash
cd /Users/ankhbayar/Projects/Front/tjcar-front-v2
npx tsc --noEmit && npm run lint
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
cd /Users/ankhbayar/Projects/Front/tjcar-front-v2
git add src/types/bid.ts src/services/bids.ts src/services/Api.ts
git commit -m "feat(bids): add bid types, service and an Api.patch helper"
```

---

## Task 5: Frontend — react-query hooks

**Repo:** `tjcar-front-v2`

**Files:**
- Create: `src/hooks/useBids.ts`

**Interfaces:**
- Consumes: `listBids`, `getBid`, `updateBidPrice` from Task 4.
- Produces: `BIDS_KEY` (`["bids"]`), `BIDS_PER_PAGE` (`10`), `useBidList(scope, page)`, `useBid(id)`, `useUpdateBidPrice(id)`.

- [ ] **Step 1: Write the hooks**

Create `src/hooks/useBids.ts`:

```ts
"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getBid, listBids, updateBidPrice } from "@/services/bids";
import type { BidScope } from "@/types/bid";

/** Root key — invalidating it refreshes every list page and every open detail. */
export const BIDS_KEY = ["bids"] as const;

export const BIDS_PER_PAGE = 10;

/**
 * One page of the customer's bids. Bids settle while the page is open, so this
 * refetches on focus rather than trusting the first render (same reasoning as
 * `ReportList`).
 */
export function useBidList(scope: BidScope | undefined, page: number) {
  return useQuery({
    queryKey: [...BIDS_KEY, scope ?? "all", page],
    queryFn: () => listBids(scope, page, BIDS_PER_PAGE),
    staleTime: 15_000,
    refetchOnWindowFocus: true,
  });
}

export function useBid(id: string) {
  return useQuery({
    queryKey: [...BIDS_KEY, "detail", id],
    queryFn: () => getBid(id),
    staleTime: 15_000,
    refetchOnWindowFocus: true,
  });
}

/**
 * Price edit. No optimistic update: the API owns two gates the client can only
 * approximate, so the server's reply is what gets rendered.
 */
export function useUpdateBidPrice(id: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (bidPrice: number) => updateBidPrice(id, bidPrice),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: BIDS_KEY });
    },
  });
}
```

- [ ] **Step 2: Type-check and lint**

```bash
cd /Users/ankhbayar/Projects/Front/tjcar-front-v2
npx tsc --noEmit && npm run lint
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
cd /Users/ankhbayar/Projects/Front/tjcar-front-v2
git add src/hooks/useBids.ts
git commit -m "feat(bids): add bid list, detail and price mutation hooks"
```

---

## Task 6: Frontend — bid list

**Repo:** `tjcar-front-v2`

**Files:**
- Create: `src/components/bid/BidStatusTag.tsx`
- Create: `src/components/bid/BidRow.tsx`
- Create: `src/components/bid/BidList.tsx`
- Modify: `src/app/[locale]/dashboard/bids/page.tsx`
- Modify: `messages/mn.json`, `messages/en.json`, `messages/ru.json`

**Interfaces:**
- Consumes: `useBidList`, `BIDS_PER_PAGE` from Task 5; `Bid`, `BidScope`, `BidStatus`, `BID_STATUS` from Task 4; `fromFeaturedCar` from `src/types/car.ts`; `formatJpy`, `formatMnt` from `src/lib/bidConfig.ts`; `EmptyState`, `DashboardHeader`, `SectionMast` from `src/components/dashboard/`.
- Produces: `<BidStatusTag status label />` and `<BidRow bid />` — both reused by Task 7's detail view.

- [ ] **Step 1: Write the status tag**

Create `src/components/bid/BidStatusTag.tsx`:

```tsx
"use client";

import { Tag } from "antd";
import { BID_STATUS, type BidStatus } from "@/types/bid";

/** Text always comes from the API's `status_label`; only the colour is ours. */
const COLORS: Record<BidStatus, string> = {
  [BID_STATUS.Pending]: "orange",
  [BID_STATUS.Processing]: "blue",
  [BID_STATUS.Win]: "green",
  [BID_STATUS.Lose]: "red",
  [BID_STATUS.Canceled]: "default",
  [BID_STATUS.Unsold]: "default",
};

type Props = {
  status: BidStatus;
  label: string;
};

export default function BidStatusTag({ status, label }: Props) {
  return (
    <Tag color={COLORS[status] ?? "default"} className="m-0!">
      {label}
    </Tag>
  );
}
```

- [ ] **Step 2: Write the row**

Create `src/components/bid/BidRow.tsx`:

```tsx
"use client";

import { Link } from "@/i18n/navigation";
import { formatJpy, formatMnt } from "@/lib/bidConfig";
import { fromFeaturedCar } from "@/types/car";
import type { Bid } from "@/types/bid";
import BidStatusTag from "./BidStatusTag";

/** Bids can be placed in MNT or JPY; the row prints whichever was sent. */
export function formatBidPrice(bid: Bid): string {
  return bid.currency === "JPY"
    ? formatJpy(bid.bid_price)
    : formatMnt(bid.bid_price);
}

export default function BidRow({ bid }: { bid: Bid }) {
  // `car_data` is the raw AJES row, structurally identical to FeaturedCar, so
  // the existing adapter handles images/marka/model/year with no new mapping.
  const car = fromFeaturedCar(bid.car_data);
  const title = [car.marka, car.model, car.year].filter(Boolean).join(" ");

  return (
    <li>
      <Link
        href={`/dashboard/bids/${bid.id}`}
        className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-neutral-200 bg-white px-4 py-3 transition-colors hover:border-primary/50 dark:border-neutral-800 dark:bg-neutral-900"
      >
        <div className="flex min-w-0 items-center gap-3">
          {car.images[0] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={car.images[0]}
              alt=""
              className="h-12 w-16 shrink-0 rounded-md object-cover"
            />
          ) : null}
          <div className="min-w-0">
            <p className="truncate text-[13.5px] font-medium text-neutral-900 dark:text-neutral-100">
              {title}
            </p>
            <p className="mt-0.5 text-[12px] text-neutral-500">
              {bid.created_at}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="text-[13px] tabular-nums text-neutral-600 dark:text-neutral-300">
            {formatBidPrice(bid)}
          </span>
          <BidStatusTag status={bid.status} label={bid.status_label} />
        </div>
      </Link>
    </li>
  );
}
```

- [ ] **Step 3: Write the list**

Create `src/components/bid/BidList.tsx`:

```tsx
"use client";

import { useState } from "react";
import { Pagination, Skeleton, Tabs } from "antd";
import { useTranslations } from "next-intl";
import EmptyState from "@/components/dashboard/EmptyState";
import { BIDS_PER_PAGE, useBidList } from "@/hooks/useBids";
import type { BidScope } from "@/types/bid";
import BidRow from "./BidRow";

type TabKey = "all" | BidScope;

/**
 * The customer's bids, grouped by the API's `scope` param.
 *
 * Filtering happens server-side so each tab paginates over its own result set —
 * splitting one page client-side would give tabs uneven, shifting page sizes.
 */
export default function BidList() {
  const t = useTranslations("dashboard.bids");
  const [tab, setTab] = useState<TabKey>("all");
  const [page, setPage] = useState(1);

  const query = useBidList(tab === "all" ? undefined : tab, page);

  const changeTab = (key: string) => {
    setTab(key as TabKey);
    setPage(1);
  };

  const bids = query.data?.data ?? [];
  const total = query.data?.meta.total ?? 0;

  return (
    <div className="space-y-4">
      <Tabs
        activeKey={tab}
        onChange={changeTab}
        items={[
          { key: "all", label: t("tabAll") },
          { key: "active", label: t("tabActive") },
          { key: "closed", label: t("tabClosed") },
        ]}
      />

      {query.isLoading ? <Skeleton active paragraph={{ rows: 5 }} /> : null}

      {query.isError ? (
        <EmptyState title={t("loadErrorTitle")} description={t("loadErrorBody")} />
      ) : null}

      {!query.isLoading && !query.isError && bids.length === 0 ? (
        <EmptyState
          title={t("emptyTitle")}
          description={t("emptyDescription")}
          cta={{ label: t("emptyCta"), href: "/japan" }}
        />
      ) : null}

      {bids.length > 0 ? (
        <div className="space-y-3">
          <ul className="space-y-2">
            {bids.map((bid) => (
              <BidRow key={bid.id} bid={bid} />
            ))}
          </ul>

          {total > BIDS_PER_PAGE ? (
            <Pagination
              current={page}
              pageSize={BIDS_PER_PAGE}
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

- [ ] **Step 4: Replace the static page**

Replace the whole contents of `src/app/[locale]/dashboard/bids/page.tsx` with:

```tsx
import { getTranslations, setRequestLocale } from "next-intl/server";
import BidList from "@/components/bid/BidList";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import SectionMast from "@/components/dashboard/SectionMast";

export default async function BidsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("dashboard.bids");

  return (
    <>
      <DashboardHeader title={t("title")} description={t("description")} />

      <section className="space-y-4">
        <SectionMast title={t("listHeading")} />
        {/* Client component: bids settle Pending → Processing → Win/Lose while
            the page is open, so the list refetches instead of rendering once. */}
        <BidList />
      </section>
    </>
  );
}
```

- [ ] **Step 5: Replace the `dashboard.bids` copy in all three locales**

In `messages/mn.json`, replace the whole `dashboard.bids` object with:

```json
    "bids": {
      "title": "Миний саналууд",
      "description": "Илгээсэн саналуудыг хянах, удирдах.",
      "listHeading": "Илгээсэн саналууд",
      "tabAll": "Бүгд",
      "tabActive": "Идэвхтэй",
      "tabClosed": "Дууссан",
      "emptyTitle": "Санал алга",
      "emptyDescription": "Дуудлагаас машин сонгож саналаа илгээж эхлээрэй.",
      "emptyCta": "Дуудлага үзэх",
      "loadErrorTitle": "Жагсаалт ачаалж чадсангүй",
      "loadErrorBody": "Сүлжээгээ шалгаад хуудсаа шинэчилнэ үү."
    },
```

In `messages/en.json`:

```json
    "bids": {
      "title": "My bids",
      "description": "Track and manage the bids you have sent.",
      "listHeading": "Sent bids",
      "tabAll": "All",
      "tabActive": "Active",
      "tabClosed": "Closed",
      "emptyTitle": "No bids yet",
      "emptyDescription": "Pick a car from the auction and send your first bid.",
      "emptyCta": "Browse auctions",
      "loadErrorTitle": "Could not load the list",
      "loadErrorBody": "Check your connection and refresh the page."
    },
```

In `messages/ru.json`:

```json
    "bids": {
      "title": "Мои ставки",
      "description": "Отслеживайте и управляйте отправленными ставками.",
      "listHeading": "Отправленные ставки",
      "tabAll": "Все",
      "tabActive": "Активные",
      "tabClosed": "Завершённые",
      "emptyTitle": "Ставок пока нет",
      "emptyDescription": "Выберите автомобиль на аукционе и отправьте первую ставку.",
      "emptyCta": "Смотреть аукционы",
      "loadErrorTitle": "Не удалось загрузить список",
      "loadErrorBody": "Проверьте соединение и обновите страницу."
    },
```

The old `activeHeading`, `activeEmptyTitle`, `activeEmptyDescription`, `activeEmptyCta`, `historyHeading`, `historySubheading`, `historyEmptyTitle` and `historyEmptyDescription` keys are removed — the tab layout replaces them and nothing else references them.

- [ ] **Step 6: Verify no stale message keys remain**

```bash
cd /Users/ankhbayar/Projects/Front/tjcar-front-v2
grep -rn "activeHeading\|historyHeading\|activeEmptyCta\|historyEmptyTitle" src/ messages/
```

Expected: no output.

- [ ] **Step 7: Type-check and lint**

```bash
cd /Users/ankhbayar/Projects/Front/tjcar-front-v2
npx tsc --noEmit && npm run lint
```

Expected: no errors.

- [ ] **Step 8: Commit**

```bash
cd /Users/ankhbayar/Projects/Front/tjcar-front-v2
git add src/components/bid/BidStatusTag.tsx src/components/bid/BidRow.tsx src/components/bid/BidList.tsx "src/app/[locale]/dashboard/bids/page.tsx" messages/mn.json messages/en.json messages/ru.json
git commit -m "feat(bids): wire the dashboard bid list to GET /bids"
```

---

## Task 7: Frontend — bid detail page

**Repo:** `tjcar-front-v2`

**Files:**
- Create: `src/components/bid/BidTimeline.tsx`
- Create: `src/components/bid/BidDetail.tsx`
- Create: `src/app/[locale]/dashboard/bids/[id]/page.tsx`
- Modify: `messages/mn.json`, `messages/en.json`, `messages/ru.json`

**Interfaces:**
- Consumes: `useBid` from Task 5; `Bid`, `BidLog`, `bidAuctionStart` from Task 4; `formatBidPrice` and `BidStatusTag` from Task 6; `fromFeaturedCar` from `src/types/car.ts`; `formatJpy` from `src/lib/bidConfig.ts`.
- Produces: `<BidDetail id />`. Task 8 adds the edit button inside it.

- [ ] **Step 1: Write the timeline**

Create `src/components/bid/BidTimeline.tsx`:

```tsx
"use client";

import { Timeline } from "antd";
import type { BidLog } from "@/types/bid";

/**
 * Status history. Logs arrive oldest-first from the API and each carries its
 * operator automatically (CustomerBidLog declares `$with = ['user']`).
 */
export default function BidTimeline({ logs }: { logs: BidLog[] }) {
  return (
    <Timeline
      items={logs.map((log) => ({
        key: log.id,
        children: (
          <div>
            <p className="text-[13.5px] font-medium text-neutral-900 dark:text-neutral-100">
              {log.status_label}
            </p>
            <p className="mt-0.5 text-[12px] text-neutral-500">
              {log.created_at}
              {log.user ? ` · ${log.user.name}` : ""}
            </p>
            {log.comment ? (
              <p className="mt-1 text-[13px] text-neutral-600 dark:text-neutral-300">
                {log.comment}
              </p>
            ) : null}
          </div>
        ),
      }))}
    />
  );
}
```

- [ ] **Step 2: Write the detail view**

Create `src/components/bid/BidDetail.tsx`:

```tsx
"use client";

import { Skeleton } from "antd";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import EmptyState from "@/components/dashboard/EmptyState";
import SectionMast from "@/components/dashboard/SectionMast";
import { useBid } from "@/hooks/useBids";
import { formatJpy } from "@/lib/bidConfig";
import { ApiError } from "@/services/Api";
import { fromFeaturedCar } from "@/types/car";
import BidStatusTag from "./BidStatusTag";
import BidTimeline from "./BidTimeline";
import { formatBidPrice } from "./BidRow";

export default function BidDetail({ id }: { id: string }) {
  const t = useTranslations("dashboard.bidDetail");
  const query = useBid(id);

  if (query.isLoading) {
    return <Skeleton active paragraph={{ rows: 6 }} />;
  }

  if (query.isError) {
    const notFound =
      query.error instanceof ApiError && query.error.status === 404;

    return (
      <EmptyState
        title={notFound ? t("notFoundTitle") : t("loadErrorTitle")}
        description={notFound ? t("notFoundBody") : t("loadErrorBody")}
        cta={{ label: t("backToList"), href: "/dashboard/bids" }}
      />
    );
  }

  const bid = query.data!;
  const car = fromFeaturedCar(bid.car_data);
  const title = [car.marka, car.model, car.year].filter(Boolean).join(" ");
  const logs = bid.bid_logs ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4 rounded-lg border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
        <div className="flex min-w-0 items-start gap-4">
          {car.images[0] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={car.images[0]}
              alt=""
              className="h-20 w-28 shrink-0 rounded-md object-cover"
            />
          ) : null}
          <div className="min-w-0 space-y-1">
            <p className="truncate text-base font-semibold text-neutral-900 dark:text-neutral-100">
              {title}
            </p>
            <p className="text-[13px] text-neutral-500">
              {t("sentAt", { date: bid.created_at ?? "" })}
            </p>
            <Link
              href={`/japan/${bid.car_data.ID}`}
              className="inline-block text-[13px] font-medium text-primary hover:underline"
            >
              {t("viewCar")}
            </Link>
          </div>
        </div>

        <div className="space-y-2 text-right">
          <BidStatusTag status={bid.status} label={bid.status_label} />
          <p className="text-xl font-semibold tabular-nums text-neutral-900 dark:text-neutral-100">
            {formatBidPrice(bid)}
          </p>
          <p className="text-[12px] text-neutral-500">
            {t("startPrice", { price: formatJpy(bid.start_price) })}
          </p>
        </div>
      </div>

      {bid.user ? (
        <p className="text-[13px] text-neutral-600 dark:text-neutral-300">
          {t("operator", { name: bid.user.name, phone: bid.user.phone ?? "-" })}
        </p>
      ) : null}

      <section className="space-y-4">
        <SectionMast title={t("timelineHeading")} />
        {logs.length > 0 ? (
          <BidTimeline logs={logs} />
        ) : (
          <EmptyState title={t("timelineEmpty")} />
        )}
      </section>
    </div>
  );
}
```

- [ ] **Step 3: Write the route**

Create `src/app/[locale]/dashboard/bids/[id]/page.tsx`:

```tsx
import { getTranslations, setRequestLocale } from "next-intl/server";
import BidDetail from "@/components/bid/BidDetail";
import DashboardHeader from "@/components/dashboard/DashboardHeader";

export default async function BidDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("dashboard.bidDetail");

  return (
    <>
      <DashboardHeader title={t("title")} description={t("description")} />
      {/* Ownership is enforced by the API (another customer's id 404s), so the
          shell renders unconditionally and BidDetail handles the 404 state. */}
      <BidDetail id={id} />
    </>
  );
}
```

- [ ] **Step 4: Add the `dashboard.bidDetail` copy in all three locales**

In `messages/mn.json`, add a `bidDetail` object immediately after the `bids` object inside `dashboard`:

```json
    "bidDetail": {
      "title": "Саналын дэлгэрэнгүй",
      "description": "Санал болон түүний явцын түүх.",
      "sentAt": "Илгээсэн: {date}",
      "viewCar": "Машины мэдээлэл үзэх",
      "startPrice": "Эхлэх үнэ: {price}",
      "operator": "Хариуцсан ажилтан: {name} · {phone}",
      "timelineHeading": "Явцын түүх",
      "timelineEmpty": "Бүртгэл алга",
      "backToList": "Жагсаалт руу буцах",
      "notFoundTitle": "Санал олдсонгүй",
      "notFoundBody": "Энэ санал устсан эсвэл танд хамаарахгүй байна.",
      "loadErrorTitle": "Ачаалж чадсангүй",
      "loadErrorBody": "Сүлжээгээ шалгаад хуудсаа шинэчилнэ үү."
    },
```

In `messages/en.json`:

```json
    "bidDetail": {
      "title": "Bid detail",
      "description": "The bid and its progress history.",
      "sentAt": "Sent: {date}",
      "viewCar": "View car details",
      "startPrice": "Start price: {price}",
      "operator": "Assigned agent: {name} · {phone}",
      "timelineHeading": "Progress history",
      "timelineEmpty": "No entries yet",
      "backToList": "Back to the list",
      "notFoundTitle": "Bid not found",
      "notFoundBody": "This bid was removed or does not belong to you.",
      "loadErrorTitle": "Could not load",
      "loadErrorBody": "Check your connection and refresh the page."
    },
```

In `messages/ru.json`:

```json
    "bidDetail": {
      "title": "Детали ставки",
      "description": "Ставка и история её обработки.",
      "sentAt": "Отправлено: {date}",
      "viewCar": "Смотреть автомобиль",
      "startPrice": "Стартовая цена: {price}",
      "operator": "Ответственный: {name} · {phone}",
      "timelineHeading": "История обработки",
      "timelineEmpty": "Записей пока нет",
      "backToList": "Вернуться к списку",
      "notFoundTitle": "Ставка не найдена",
      "notFoundBody": "Эта ставка удалена или принадлежит другому пользователю.",
      "loadErrorTitle": "Не удалось загрузить",
      "loadErrorBody": "Проверьте соединение и обновите страницу."
    },
```

- [ ] **Step 5: Type-check and lint**

```bash
cd /Users/ankhbayar/Projects/Front/tjcar-front-v2
npx tsc --noEmit && npm run lint
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
cd /Users/ankhbayar/Projects/Front/tjcar-front-v2
git add src/components/bid/BidTimeline.tsx src/components/bid/BidDetail.tsx "src/app/[locale]/dashboard/bids/[id]/page.tsx" messages/mn.json messages/en.json messages/ru.json
git commit -m "feat(bids): add the bid detail page with its status timeline"
```

---

## Task 8: Frontend — price edit

**Repo:** `tjcar-front-v2`

**Files:**
- Create: `src/components/bid/BidPriceEditModal.tsx`
- Modify: `src/components/bid/BidDetail.tsx`
- Modify: `messages/mn.json`, `messages/en.json`, `messages/ru.json`

**Interfaces:**
- Consumes: `useUpdateBidPrice` from Task 5; `isBidEditable`, `Bid` from Task 4; `ApiError` from `src/services/Api.ts`; `formatJpy`, `formatMnt` from `src/lib/bidConfig.ts`.
- Produces: `<BidPriceEditModal bid open onClose />`.

- [ ] **Step 1: Write the modal**

Create `src/components/bid/BidPriceEditModal.tsx`:

```tsx
"use client";

import { App, Form, InputNumber, Modal } from "antd";
import { useTranslations } from "next-intl";
import { useUpdateBidPrice } from "@/hooks/useBids";
import { formatJpy, formatMnt } from "@/lib/bidConfig";
import { ApiError } from "@/services/Api";
import type { Bid } from "@/types/bid";

type FormValues = { bid_price: number };

type Props = {
  bid: Bid;
  open: boolean;
  onClose: () => void;
};

/**
 * Change the offered price on an open bid.
 *
 * The API re-checks both gates (open status, 2-hour cutoff) and answers 422 with
 * a Mongolian message, so failures are surfaced verbatim rather than
 * re-worded here.
 */
export default function BidPriceEditModal({ bid, open, onClose }: Props) {
  const t = useTranslations("dashboard.bidEdit");
  const { modal } = App.useApp();
  const [form] = Form.useForm<FormValues>();
  const mutation = useUpdateBidPrice(bid.id);

  const isJpy = bid.currency === "JPY";
  const format = isJpy ? formatJpy : formatMnt;

  const submit = async (values: FormValues) => {
    try {
      await mutation.mutateAsync(values.bid_price);
      onClose();
      modal.success({
        title: t("successTitle"),
        content: t("successBody"),
        okText: t("ok"),
        centered: true,
      });
    } catch (err) {
      modal.error({
        title: t("errorTitle"),
        content: err instanceof ApiError ? err.message : t("errorFallback"),
        okText: t("ok"),
        centered: true,
      });
    }
  };

  return (
    <Modal
      open={open}
      title={t("title")}
      okText={t("submit")}
      cancelText={t("cancel")}
      confirmLoading={mutation.isPending}
      onOk={() => form.submit()}
      onCancel={onClose}
      destroyOnHidden
      centered
    >
      <Form<FormValues>
        form={form}
        layout="vertical"
        onFinish={submit}
        initialValues={{ bid_price: bid.bid_price }}
        requiredMark={false}
      >
        <Form.Item
          name="bid_price"
          label={t("priceLabel")}
          rules={[
            { required: true, message: t("required") },
            {
              validator: (_, value) => {
                if (value == null || value === "") return Promise.resolve();
                return Number(value) > 0
                  ? Promise.resolve()
                  : Promise.reject(new Error(t("mustBePositive")));
              },
            },
          ]}
        >
          <InputNumber<number>
            className="w-full"
            size="large"
            min={0}
            controls={false}
            prefix={
              <span className="pr-1 text-neutral-400">{isJpy ? "¥" : "₮"}</span>
            }
            formatter={(value) =>
              `${value ?? ""}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
            }
            parser={(value) => (value ? Number(value.replace(/[^\d]/g, "")) : 0)}
          />
        </Form.Item>

        <p className="text-[12px] text-neutral-500">
          {t("currentPrice", { price: format(bid.bid_price) })}
        </p>
      </Form>
    </Modal>
  );
}
```

- [ ] **Step 2: Add the edit button to the detail view**

In `src/components/bid/BidDetail.tsx`, add these imports alongside the existing ones:

```tsx
import { useState } from "react";
import { Button, Skeleton } from "antd";
import { isBidEditable } from "@/types/bid";
import BidPriceEditModal from "./BidPriceEditModal";
```

(The existing `import { Skeleton } from "antd";` line is replaced by the `Button, Skeleton` import above.)

Add this state declaration directly under `const query = useBid(id);`:

```tsx
  const [editing, setEditing] = useState(false);
```

Then, inside the right-hand price block, add the button after the start-price paragraph:

```tsx
          {isBidEditable(bid) ? (
            <Button size="small" onClick={() => setEditing(true)}>
              {t("editPrice")}
            </Button>
          ) : null}
```

And render the modal as the last child of the outermost `<div className="space-y-6">`:

```tsx
      {editing ? (
        <BidPriceEditModal
          bid={bid}
          open={editing}
          onClose={() => setEditing(false)}
        />
      ) : null}
```

React requires hooks to run unconditionally, and `useState` is already declared above the early returns, so the loading and error branches are unaffected.

- [ ] **Step 3: Add the copy in all three locales**

In `messages/mn.json`, add `"editPrice": "Үнэ засах",` to the existing `dashboard.bidDetail` object, and add a `bidEdit` object right after `bidDetail`:

```json
    "bidEdit": {
      "title": "Саналын үнэ засах",
      "priceLabel": "Шинэ үнэ",
      "currentPrice": "Одоогийн үнэ: {price}",
      "required": "Үнээ оруулна уу",
      "mustBePositive": "Үнэ 0-ээс их байх ёстой",
      "submit": "Хадгалах",
      "cancel": "Болих",
      "ok": "Ойлголоо",
      "successTitle": "Үнэ шинэчлэгдлээ",
      "successBody": "Таны шинэ үнийг хүлээн авлаа.",
      "errorTitle": "Үнэ шинэчлэгдсэнгүй",
      "errorFallback": "Дахин оролдоно уу."
    },
```

In `messages/en.json`, add `"editPrice": "Edit price",` to `dashboard.bidDetail` and:

```json
    "bidEdit": {
      "title": "Edit bid price",
      "priceLabel": "New price",
      "currentPrice": "Current price: {price}",
      "required": "Enter a price",
      "mustBePositive": "The price must be greater than 0",
      "submit": "Save",
      "cancel": "Cancel",
      "ok": "Got it",
      "successTitle": "Price updated",
      "successBody": "Your new price has been recorded.",
      "errorTitle": "Price not updated",
      "errorFallback": "Please try again."
    },
```

In `messages/ru.json`, add `"editPrice": "Изменить цену",` to `dashboard.bidDetail` and:

```json
    "bidEdit": {
      "title": "Изменить цену ставки",
      "priceLabel": "Новая цена",
      "currentPrice": "Текущая цена: {price}",
      "required": "Укажите цену",
      "mustBePositive": "Цена должна быть больше 0",
      "submit": "Сохранить",
      "cancel": "Отмена",
      "ok": "Понятно",
      "successTitle": "Цена обновлена",
      "successBody": "Ваша новая цена принята.",
      "errorTitle": "Цена не обновлена",
      "errorFallback": "Попробуйте ещё раз."
    },
```

- [ ] **Step 4: Type-check and lint**

```bash
cd /Users/ankhbayar/Projects/Front/tjcar-front-v2
npx tsc --noEmit && npm run lint
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
cd /Users/ankhbayar/Projects/Front/tjcar-front-v2
git add src/components/bid/BidPriceEditModal.tsx src/components/bid/BidDetail.tsx messages/mn.json messages/en.json messages/ru.json
git commit -m "feat(bids): let customers edit an open bid price from the detail page"
```

---

## Task 9: Frontend — dashboard overview counts

**Repo:** `tjcar-front-v2`

**Files:**
- Create: `src/components/dashboard/DashboardStats.tsx`
- Modify: `src/app/[locale]/dashboard/page.tsx:21-25` and its `StatCard` block

**Interfaces:**
- Consumes: `GET /stats` from Task 3; `listReports` from `src/services/reports.ts`; `StatCard` from `src/components/dashboard/StatCard.tsx`.
- Produces: `<DashboardStats />` — self-contained; nothing else consumes it.

- [ ] **Step 1: Write the stats island**

Create `src/components/dashboard/DashboardStats.tsx`:

```tsx
"use client";

import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import Api from "@/services/Api";
import { listReports } from "@/services/reports";
import StatCard from "./StatCard";

type StatsResponse = {
  data: {
    requests: number;
    requests_win: number;
    requests_pending: number;
  };
};

/**
 * Overview counts.
 *
 * Two calls: `GET /stats` owns the bid numbers, and the reports total is read
 * from the paginator meta of a single-row `GET /reports` page — cheaper than
 * adding a second server-side count for one figure.
 */
export default function DashboardStats() {
  const t = useTranslations("dashboard.home");
  const { status } = useSession();
  const isAuthenticated = status === "authenticated";

  const bidStats = useQuery({
    queryKey: ["stats", "bids"],
    queryFn: () => Api.get<StatsResponse>("/stats"),
    enabled: isAuthenticated,
    staleTime: 30_000,
  });

  const reportCount = useQuery({
    queryKey: ["stats", "reports"],
    queryFn: () => listReports(1, 1),
    enabled: isAuthenticated,
    staleTime: 30_000,
  });

  const bids = bidStats.data?.data;

  // Same wrapper element and classes the server page used, so the grid does not shift.
  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <StatCard
        label={t("stats.bidsLabel")}
        value={bids?.requests ?? 0}
        hint={t("stats.bidsHint", { count: bids?.requests_pending ?? 0 })}
        href="/dashboard/bids"
      />
      <StatCard
        label={t("stats.reportsLabel")}
        value={reportCount.data?.meta.total ?? 0}
        hint={t("stats.reportsHint")}
        href="/dashboard/reports"
      />
    </section>
  );
}
```

- [ ] **Step 2: Replace the hardcoded stats object**

In `src/app/[locale]/dashboard/page.tsx`, delete these five lines (currently at `:21-25`):

```tsx
  // TODO: wire APIs for personal counts (bids/reports)
  const stats = {
    bids: { count: 0, pending: 0 },
    reports: { count: 0 },
  };
```

- [ ] **Step 3: Replace the stat card section**

In the same file, replace this whole block:

```tsx
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <StatCard
            label={t("stats.bidsLabel")}
            value={stats.bids.count}
            hint={t("stats.bidsHint", { count: stats.bids.pending })}
            href="/dashboard/bids"
          />
          <StatCard
            label={t("stats.reportsLabel")}
            value={stats.reports.count}
            hint={t("stats.reportsHint")}
            href="/dashboard/reports"
          />
        </section>
```

with:

```tsx
      {/* Client island: the counts are per-customer and change as bids settle,
          so they are fetched rather than rendered into the server payload. */}
      <DashboardStats />
```

Then update the imports at the top of the file: add

```tsx
import DashboardStats from "@/components/dashboard/DashboardStats";
```

and delete

```tsx
import StatCard from "@/components/dashboard/StatCard";
```

- [ ] **Step 4: Type-check and lint**

```bash
cd /Users/ankhbayar/Projects/Front/tjcar-front-v2
npx tsc --noEmit && npm run lint
```

Expected: no errors. A leftover `StatCard` import would surface here as an unused-variable lint error.

- [ ] **Step 5: Run the production build**

```bash
cd /Users/ankhbayar/Projects/Front/tjcar-front-v2
npm run build
```

Expected: build succeeds, and the route list includes `/[locale]/dashboard/bids/[id]`.

- [ ] **Step 6: Commit**

```bash
cd /Users/ankhbayar/Projects/Front/tjcar-front-v2
git add src/components/dashboard/DashboardStats.tsx "src/app/[locale]/dashboard/page.tsx"
git commit -m "feat(dashboard): wire the overview counts to /stats and /reports"
```

---

## Task 10: Manual verification

**Repo:** both

There is no frontend test framework, so this pass is the acceptance gate. Do not mark the feature done until every line below has been observed.

- [ ] **Step 1: Confirm the backend suite is green**

```bash
cd /Users/ankhbayar/Herd/tjcar-api-v2
php artisan test --compact
```

Expected: PASS, no failures.

- [ ] **Step 2: Start the frontend against the local API**

```bash
cd /Users/ankhbayar/Projects/Front/tjcar-front-v2
npm run dev
```

The dev server listens on port 2500. The API is served by Herd at `https://tjcar-api-v2.test`.

- [ ] **Step 3: Walk the flow**

Log in as a customer that has at least one `Pending` bid on a future auction and one closed bid, then check each of these:

1. `/dashboard/bids` lists bids newest-first with image, title, price and status tag.
2. The **Идэвхтэй** tab shows only pending/processing bids; **Дууссан** shows only terminal ones; **Бүгд** shows both. Switching tabs resets to page 1.
3. With more than 10 bids in a tab, the pager appears and page 2 loads a different set.
4. Clicking a row opens `/dashboard/bids/{id}` with the car header, prices, operator line (when assigned) and the status timeline.
5. **Машины мэдээлэл үзэх** navigates to `/japan/{lot id}`.
6. On an editable bid, **Үнэ засах** opens the modal; saving a new price shows the success dialog and the new figure appears in both the detail and the list.
7. On a closed bid, the edit button is absent.
8. Requesting `/dashboard/bids/{id}` for another customer's bid id shows the "Санал олдсонгүй" state with a working back link.
9. `/dashboard` shows real bid and report counts, and the bid card links to `/dashboard/bids`.

- [ ] **Step 4: Verify the server-side gate independently of the UI**

Confirm the API rejects an edit the UI would not offer. With a valid bearer token for a customer owning a `Win` bid:

```bash
curl -s -X PATCH https://tjcar-api-v2.test/api/bids/{winBidId} \
  -H "Authorization: Bearer {token}" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -d '{"bid_price": 999}'
```

Expected: HTTP 422 with `"message": "Энэ саналын үнийг өөрчлөх боломжгүй"`.

- [ ] **Step 5: Report the result**

Summarise what was observed, naming any step that did not behave as described. Do not claim the feature works if a step was skipped.

---

## Notes for the implementer

- **Do not run `git add -A` in the frontend repo.** It has substantial unrelated uncommitted work (`src/components/cards/*`, `src/types/car.ts`, a `carCountdown.ts → auctionMoment.ts` rename and pending `messages/*.json` edits). Add only the paths each task names.
- `src/types/car.ts` and `messages/*.json` are already modified in that working tree. Expect to be editing files with unrelated pending changes — leave those changes alone.
- The `messages/*.json` edits are inside the top-level `dashboard` object. Keep JSON valid; `npx tsc --noEmit` will not catch a malformed message file, but `npm run dev` fails loudly on it.
