# Japan lot landed MNT under the auction result — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show, in small text under a finished Japanese lot's ¥ hammer price, what that car costs to land in Mongolia in tugrik — computed by the v1 vehicle-cost calculator.

**Architecture:** The API prices the lot on `GET /japan/{id}` and ships one extra field, `FINISH_LANDED_MNT`. A new `FinishLandedPrice` service builds the v1 calculator's input from the AJES row; the chassis→freight rule it needs already exists twice in the codebase and is extracted first into a shared `JapanFreightResolver`. The front end only formats the number.

**Tech Stack:** Laravel 12 + Pest (`tjcar-api-v2`), Next.js 16 App Router + next-intl + Tailwind v4 (`tjcar-front-v2`).

**Spec:** `docs/superpowers/specs/2026-08-06-japan-finish-landed-price-design.md` (in the front-end repo).

## Global Constraints

- Two repos. Backend = `/Users/ankhbayar/Herd/tjcar-api-v2`. Frontend = `/Users/ankhbayar/Projects/Front/tjcar-front-v2`. Tasks 1–3 are backend, Tasks 4–5 are frontend. Commit in the repo the task names.
- **The front-end working tree has unrelated uncommitted work**: `messages/{mn,en,ru}.json`, `src/components/car-detail/CarBidSection.tsx`, `src/components/car-detail/AuctionResultSection.tsx` (a prettier reflow), and untracked `src/app/[locale]/terms/`, `src/components/terms/`. Never `git add -A` / `git add .`; stage only the exact paths each step lists. `messages/*.json` in particular already carries the user's edits — add keys, never rewrite the file.
- Backend tests: `php artisan test --filter='<name>'` from the API repo root. All Feature tests use `RefreshDatabase`.
- Frontend has **no test runner** (`package.json` scripts are `dev`, `build`, `start`, `lint`). Verification there is `npx tsc --noEmit` + `npm run lint` + looking at the page.
- Every new translation key goes into **all three** locales: `messages/mn.json`, `messages/en.json`, `messages/ru.json`.
- Never use `tracking-*` or `font-mono` utility classes in this project.
- Backend PHP files start with `<?php\n\ndeclare(strict_types=1);`.

---

### Task 1: `JapanFreightResolver` — one implementation of the chassis→freight rule

The v1 calculator requires `freightUSD` for Japan (`CalculateVehicleCostRequest.php:29`; only Korea has a default). That number is the legacy calculator's transport cost, and its lookup is already written **twice** — `CalculatorService::transportUsd` and `CompareJapanVehicleCost::legacyFreightUsd`. Extract before adding a third caller.

**Files:**
- Create: `app/Services/VehicleCost/JapanFreightResolver.php`
- Modify: `app/Services/Auction/CalculatorService.php` (constructor; `transportUsd`; drop the `TransportCost`/`TransportType` imports and the `$transportUsd` memo property)
- Modify: `app/Console/Commands/CompareJapanVehicleCost.php` (drop `legacyFreightUsd` and its two model imports; call the resolver)
- Test: `tests/Feature/Services/VehicleCost/JapanFreightResolverTest.php`

**Interfaces:**
- Consumes: `App\Models\Config`, `App\Models\TransportCost`, `App\Models\TransportType` (existing).
- Produces: `JapanFreightResolver::freightUsd(string $chassis, ?string $transportMode = null): float` and `JapanFreightResolver::transportMode(): string`. Task 2 calls `freightUsd($chassis)` with one argument.

- [ ] **Step 1: Write the failing test**

Create `tests/Feature/Services/VehicleCost/JapanFreightResolverTest.php`:

```php
<?php

declare(strict_types=1);

use App\Models\Config;
use App\Models\TransportCost;
use App\Models\TransportType;
use App\Services\VehicleCost\JapanFreightResolver;

beforeEach(function () {
    Config::factory()->create(['name' => 'transport', 'value' => 'regular']);

    // id 1 is the TransportCost row's type; id 2 is the hardcoded fallback the
    // legacy calculator relies on (TransportTypeSeeder guarantees it exists).
    TransportType::factory()->create(['regular' => 2000, 'express' => 3000]);
    TransportType::factory()->create(['regular' => 750, 'express' => 1100]);

    TransportCost::factory()->create(['value' => 'ZVW30', 'type_id' => 1]);
});

it('reads the chassis row when one exists', function () {
    expect(app(JapanFreightResolver::class)->freightUsd('ZVW30'))->toBe(2000.0);
});

it('falls back to transport type 2 for an unknown chassis', function () {
    expect(app(JapanFreightResolver::class)->freightUsd('NOSUCH'))->toBe(750.0);
});

it('picks the column named by the transport config', function () {
    Config::query()->where('name', 'transport')->update(['value' => 'express']);

    expect(app(JapanFreightResolver::class)->freightUsd('ZVW30'))->toBe(3000.0);
});

it('honours an explicitly passed transport mode over the config', function () {
    expect(app(JapanFreightResolver::class)->freightUsd('ZVW30', 'express'))->toBe(3000.0);
});

it('memoizes so a repeated chassis costs no extra query', function () {
    $resolver = app(JapanFreightResolver::class);
    $resolver->freightUsd('ZVW30');

    DB::enableQueryLog();
    $resolver->freightUsd('ZVW30');

    expect(DB::getQueryLog())->toBeEmpty();
});
```

Add `use Illuminate\Support\Facades\DB;` to the import block.

- [ ] **Step 2: Run the test to verify it fails**

```bash
cd /Users/ankhbayar/Herd/tjcar-api-v2 && php artisan test --filter=JapanFreightResolver
```

Expected: FAIL — `Target class [App\Services\VehicleCost\JapanFreightResolver] does not exist.`

- [ ] **Step 3: Write the resolver**

Create `app/Services/VehicleCost/JapanFreightResolver.php`:

```php
<?php

declare(strict_types=1);

namespace App\Services\VehicleCost;

use App\Models\Config;
use App\Models\TransportCost;
use App\Models\TransportType;

/**
 * Shipping cost in USD for a Japanese lot, keyed by chassis.
 *
 * The rule is the legacy calculator's, verbatim: a `transport_costs` row for
 * the chassis names a TransportType, and the active `transport` config
 * ('regular' | 'express') picks the column. No row means TransportType id 2 —
 * OLD Auction::calculator line 165, an id TransportTypeSeeder guarantees.
 *
 * Extracted so three callers share one implementation: CalculatorService (the
 * legacy formula), the vehicle-cost:compare-japan command, and
 * FinishLandedPrice — the v1 calculator demands `freightUSD` for Japan and has
 * no default, so every Japanese v1 call needs this number.
 *
 * Memoized per chassis + mode: pricing a list hits the same chassis repeatedly.
 * Not a container singleton, so nothing survives a request or a test.
 */
final class JapanFreightResolver
{
    /** @var array<string, float> keyed "chassis|mode" */
    private array $memo = [];

    private ?string $transportMode = null;

    /** The active 'regular' | 'express' column, read once per instance. */
    public function transportMode(): string
    {
        return $this->transportMode ??= (string) Config::query()
            ->where('name', 'transport')
            ->value('value');
    }

    public function freightUsd(string $chassis, ?string $transportMode = null): float
    {
        $mode = $transportMode ?? $this->transportMode();

        return $this->memo[$chassis.'|'.$mode] ??= $this->lookup($chassis, $mode);
    }

    private function lookup(string $chassis, string $mode): float
    {
        $row = TransportCost::query()->where('value', $chassis)->first();

        if ($row !== null) {
            return (float) $row->transportType->{$mode};
        }

        return (float) TransportType::query()->findOrFail(2)->{$mode};
    }
}
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
cd /Users/ankhbayar/Herd/tjcar-api-v2 && php artisan test --filter=JapanFreightResolver
```

Expected: PASS, 5 tests.

- [ ] **Step 5: Point `CalculatorService` at the resolver**

In `app/Services/Auction/CalculatorService.php`:

Add the import `use App\Services\VehicleCost\JapanFreightResolver;` and remove `use App\Models\TransportCost;` and `use App\Models\TransportType;`.

Replace the constructor:

```php
    public function __construct(
        private readonly AjesClient $ajes,
        private readonly JapanFreightResolver $freight,
    ) {}
```

Delete the `$transportUsd` memo property and its docblock line:

```php
    /** @var array<string, float> keyed "chassis|transportConfig" */
    private array $transportUsd = [];
```

Replace the whole `transportUsd` method with:

```php
    /**
     * Shipping cost in USD for a chassis. The rule (and its per-chassis memo)
     * lives in JapanFreightResolver — the v1 calculator needs the same number,
     * and one copy is enough.
     */
    private function transportUsd(string $chassis, string $transportConfig): float
    {
        return $this->freight->freightUsd($chassis, $transportConfig);
    }
```

Also update the class docblock's memoization paragraph — the line reading `* @var array<string, float> keyed "chassis|transportConfig"` is gone, and the paragraph above the memo fields that says "The rows share every lookup except the transport cost, so they are read once and reused" should now read:

```php
    /**
     * Reference data memoized for the life of this instance. Pricing a list —
     * sold history, compare, featured — used to re-read all of it per row, ~7
     * queries each. The rows share every lookup, so each is read once and
     * reused (the transport cost is memoized by JapanFreightResolver instead).
     *
     * Safe because the class is NOT a container singleton (AppServiceProvider
     * binds only the two HTTP clients): each `app(CalculatorService::class)`
     * hands back a fresh instance, so nothing survives a request or a test.
     *
     * @var list<string>|null
     */
```

- [ ] **Step 6: Point the compare command at the resolver**

In `app/Console/Commands/CompareJapanVehicleCost.php`:

Remove `use App\Models\TransportCost;` and `use App\Models\TransportType;`; add `use App\Services\VehicleCost\JapanFreightResolver;`.

Delete the whole `legacyFreightUsd` method (including its `/** Mirrors CalculatorService::transportUsd — chassis row, else TransportType 2. */` docblock).

Change the `freightUSD` line inside `compareLot`'s `$base` array from:

```php
            'freightUSD' => $this->legacyFreightUsd($chassis, $transportConfig),
```

to:

```php
            'freightUSD' => app(JapanFreightResolver::class)->freightUsd($chassis, $transportConfig),
```

Update the class docblock's Freight bullet to name the shared resolver:

```php
 * - **Freight.** Both sides are fed the SAME figure, resolved by
 *   JapanFreightResolver — the chassis row in `transport_costs`, else
 *   TransportType id 2. That is what the legacy calculator uses internally and
 *   what the lot endpoint hands v1, so the comparison isolates the formula.
```

- [ ] **Step 7: Run the affected suites**

```bash
cd /Users/ankhbayar/Herd/tjcar-api-v2 && php artisan test --filter='JapanFreightResolver|CalculatorService|CompareJapanVehicleCost|Auction'
```

Expected: PASS, no regressions. `CalculatorServiceTest` exercises both the chassis row (`ZVW30`) and the id-2 fallback, so it is the real guard that the extraction changed no behaviour.

- [ ] **Step 8: Commit**

```bash
cd /Users/ankhbayar/Herd/tjcar-api-v2 && git add app/Services/VehicleCost/JapanFreightResolver.php app/Services/Auction/CalculatorService.php app/Console/Commands/CompareJapanVehicleCost.php tests/Feature/Services/VehicleCost/JapanFreightResolverTest.php && git commit -m "refactor(vehicle-cost): extract the Japan chassis freight lookup"
```

---

### Task 2: `FinishLandedPrice` — a lot's own FINISH, priced by the v1 calculator

**Files:**
- Create: `app/Services/Auction/FinishLandedPrice.php`
- Test: `tests/Feature/Services/Auction/FinishLandedPriceTest.php`

**Interfaces:**
- Consumes: `JapanFreightResolver::freightUsd(string $chassis): float` (Task 1); `VehicleCostCalculator::calculate(array $input): array`, whose return carries `['result']['landedCostMNT']`.
- Produces: `FinishLandedPrice::forLot(array $row): ?int` — Task 3 calls it with the raw AJES lot row.

- [ ] **Step 1: Write the failing test**

Create `tests/Feature/Services/Auction/FinishLandedPriceTest.php`:

```php
<?php

declare(strict_types=1);

use App\Models\AuctionFob;
use App\Models\Config;
use App\Models\TransportCost;
use App\Models\TransportType;
use App\Services\Auction\FinishLandedPrice;
use Illuminate\Support\Facades\Log;

beforeEach(function () {
    Config::factory()->create(['name' => 'JPY', 'value' => '23']);
    Config::factory()->create(['name' => 'USD', 'value' => '3400']);
    Config::factory()->create(['name' => 'transport', 'value' => 'regular']);

    TransportType::factory()->create(['regular' => 2000, 'express' => 3000]);
    TransportType::factory()->create(['regular' => 750, 'express' => 1100]);
    TransportCost::factory()->create(['value' => 'ZVW30', 'type_id' => 1]);

    AuctionFob::factory()->create(['auction_name' => 'USS OSAKA', 'fob_jpy' => 82_000]);
});

/** A finished AJES row: hammer price published, STATUS says it sold. */
function soldLotRow(array $overrides = []): array
{
    return array_merge([
        'ID' => '7abc',
        'AUCTION' => 'USS Osaka',
        'KUZOV' => 'ZVW30',
        'YEAR' => '2016',
        'ENG_V' => '1800',
        'FINISH' => '1000000',
        'STATUS' => 'Sold',
    ], $overrides);
}

it('prices a sold lot off its own FINISH', function () {
    expect(app(FinishLandedPrice::class)->forLot(soldLotRow()))
        ->toBeInt()
        ->toBeGreaterThan(0);
});

it('matches the v1 calculator fed the same inputs', function () {
    $priced = app(FinishLandedPrice::class)->forLot(soldLotRow());

    $direct = app(App\Services\VehicleCost\VehicleCostCalculator::class)->calculate([
        'country' => 'JAPAN',
        'auctionName' => 'USS Osaka',
        'purchasePriceJPY' => 1_000_000,
        'freightUSD' => 2000.0,
        'manufactureYear' => 2016,
        'engineCc' => 1800,
        'chassis' => 'ZVW30',
    ]);

    expect($priced)->toEqual((int) round((float) $direct['result']['landedCostMNT']));
});

it('returns null for an upcoming lot with no FINISH', function () {
    expect(app(FinishLandedPrice::class)->forLot(soldLotRow(['FINISH' => '0'])))->toBeNull();
});

it('returns null when the lot states no build year', function () {
    expect(app(FinishLandedPrice::class)->forLot(soldLotRow(['YEAR' => ''])))->toBeNull();
});

it('returns null when the lot states no engine size', function () {
    expect(app(FinishLandedPrice::class)->forLot(soldLotRow(['ENG_V' => ''])))->toBeNull();
});

it('logs and returns null when the auction has no FOB row', function () {
    Log::shouldReceive('warning')->once();

    expect(app(FinishLandedPrice::class)->forLot(soldLotRow(['AUCTION' => 'NOWHERE AUCTION'])))
        ->toBeNull();
});

it('logs and returns null when the exchange rate is missing', function () {
    Config::query()->where('name', 'JPY')->delete();
    Log::shouldReceive('warning')->once();

    expect(app(FinishLandedPrice::class)->forLot(soldLotRow()))->toBeNull();
});

it('matches the auction name case-insensitively', function () {
    // AJES sends "USS Osaka"; Appendix A holds "USS OSAKA".
    expect(app(FinishLandedPrice::class)->forLot(soldLotRow(['AUCTION' => 'uss osaka'])))
        ->toBeGreaterThan(0);
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
cd /Users/ankhbayar/Herd/tjcar-api-v2 && php artisan test --filter=FinishLandedPrice
```

Expected: FAIL — `Target class [App\Services\Auction\FinishLandedPrice] does not exist.`

- [ ] **Step 3: Write the service**

Create `app/Services/Auction/FinishLandedPrice.php`:

```php
<?php

declare(strict_types=1);

namespace App\Services\Auction;

use App\Services\VehicleCost\JapanFreightResolver;
use App\Services\VehicleCost\VehicleCostCalculator;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * What THIS lot's own hammer price lands at in tugrik, priced by the v1
 * calculator (App\Services\VehicleCost).
 *
 * Deliberately not a method on LandedPriceEstimator. That class is documented
 * as the single implementation behind the LEGACY calculator's landed price, and
 * the two formulas must not blur into one class — but they also answer
 * different questions. LandedPriceEstimator::forListedLot prices a lot off
 * comparable sales, an AVERAGE for a car that has not sold yet; this prices the
 * FINISH the room actually paid for this exact car.
 */
class FinishLandedPrice
{
    public function __construct(
        private readonly VehicleCostCalculator $calculator,
        private readonly JapanFreightResolver $freight,
    ) {}

    /**
     * Null whenever no trustworthy figure exists — the lot page then omits the
     * line rather than printing a placeholder.
     *
     * `manufactureMonth` is deliberately absent: an AJES row carries a build
     * year only. The calculator falls back to the legacy age rule (year
     * difference, with exactly 10 counted as 9) and marks `age.source` as
     * ASSUMED — the same age basis the legacy tile on this page already uses,
     * so the two numbers are not aged differently.
     *
     * @param  array<string, mixed>  $row
     */
    public function forLot(array $row): ?int
    {
        $finishJpy = (float) ($row['FINISH'] ?? 0);

        if ($finishJpy <= 0.0) {
            return null;
        }

        $year = (int) ($row['YEAR'] ?? 0);
        $engineCc = (int) ($row['ENG_V'] ?? 0);

        // The calculator rejects both of these outright. A lot missing them is
        // an upstream data gap, not an incident, so it takes the quiet exit
        // rather than filling the log.
        if ($year <= 0 || $engineCc <= 0) {
            return null;
        }

        // KUZOV, not the VIN: the calculator uses it only to decide whether the
        // chassis is on the hybrid list, and the freight lookup keys off it too.
        $chassis = trim((string) ($row['KUZOV'] ?? ''));

        try {
            $result = $this->calculator->calculate([
                'country' => 'JAPAN',
                'auctionName' => trim((string) ($row['AUCTION'] ?? '')),
                'purchasePriceJPY' => (int) round($finishJpy),
                'freightUSD' => $this->freight->freightUsd($chassis),
                'manufactureYear' => $year,
                'engineCc' => $engineCc,
                'chassis' => $chassis,
            ]);
        } catch (Throwable $e) {
            // One unpriceable lot must never fail the whole response — but it
            // must not vanish silently either. AUCTION_NOT_FOUND is routine
            // (the live board trades houses Appendix A does not list);
            // EXCHANGE_RATE_UNAVAILABLE is an operations problem someone has to
            // find in the log.
            Log::warning('Finish landed price failed', [
                'lot' => $row['ID'] ?? null,
                'auction' => $row['AUCTION'] ?? null,
                'chassis' => $chassis,
                'exception' => $e::class,
                'message' => $e->getMessage(),
            ]);

            return null;
        }

        // No additionalCostsMNT are sent, so landedCostMNT is exactly what
        // CostBreakdownBuilder would publish as `total.amount`. Building the
        // display breakdown just to read its total would be wasted work.
        $landed = (int) round((float) ($result['result']['landedCostMNT'] ?? 0));

        return $landed > 0 ? $landed : null;
    }
}
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
cd /Users/ankhbayar/Herd/tjcar-api-v2 && php artisan test --filter=FinishLandedPrice
```

Expected: PASS, 8 tests.

- [ ] **Step 5: Commit**

```bash
cd /Users/ankhbayar/Herd/tjcar-api-v2 && git add app/Services/Auction/FinishLandedPrice.php tests/Feature/Services/Auction/FinishLandedPriceTest.php && git commit -m "feat(japan): price a finished lot's FINISH with the v1 calculator"
```

---

### Task 3: ship `FINISH_LANDED_MNT` on `GET /japan/{id}`

**Files:**
- Modify: `app/Http/Controllers/Public/AuctionController.php` (constructor + `show`)
- Test: `tests/Feature/Public/AuctionTest.php` (append three tests near the existing `PRICE_MNT` ones, after `it('leaves the lot price null when no comparable sale exists', ...)`)

**Interfaces:**
- Consumes: `FinishLandedPrice::forLot(array $row): ?int` (Task 2).
- Produces: `data.FINISH_LANDED_MNT` on the lot payload — `int` or `null`. Task 4 types it.

- [ ] **Step 1: Write the failing tests**

Append to `tests/Feature/Public/AuctionTest.php`, immediately after the `leaves the lot price null when no comparable sale exists` test:

```php
// The result card shows this under the lot's ¥ hammer price. Unlike PRICE_MNT —
// a comparable-sales average from the legacy calculator — it is THIS car's own
// FINISH run through the v1 vehicle-cost calculator.
it('prices a finished lot from its own FINISH with the v1 calculator', function () {
    seedLandedPriceReferences();
    AuctionFob::factory()->create(['auction_name' => 'USS OSAKA', 'fob_jpy' => 82_000]);

    Http::fake(fn (ClientRequest $request) => str_contains(urldecode($request->url()), 'stats')
        ? Http::response('[]')
        : Http::response(json_encode([[
            'ID' => '7abc', 'AUCTION_TYPE' => '2', 'AUCTION' => 'USS Osaka',
            'KUZOV' => 'MB4164T', 'ENG_V' => '1595', 'YEAR' => '2013',
            'FINISH' => '1000000', 'STATUS' => 'Sold', 'AVG_PRICE' => '0',
        ]])));

    $landed = $this->getJson('/api/japan/7abc')->assertOk()->json('data.FINISH_LANDED_MNT');

    expect($landed)->toBeInt()->toBeGreaterThan(0);
});

it('leaves the finished-lot price null on an upcoming lot', function () {
    seedLandedPriceReferences();
    AuctionFob::factory()->create(['auction_name' => 'USS OSAKA', 'fob_jpy' => 82_000]);

    Http::fake(fn (ClientRequest $request) => str_contains(urldecode($request->url()), 'stats')
        ? Http::response('[]')
        : Http::response(json_encode([[
            'ID' => '7abc', 'AUCTION_TYPE' => '2', 'AUCTION' => 'USS Osaka',
            'KUZOV' => 'MB4164T', 'ENG_V' => '1595', 'YEAR' => '2013',
            'FINISH' => '0', 'STATUS' => '', 'AVG_PRICE' => '0',
        ]])));

    $this->getJson('/api/japan/7abc')->assertOk()
        ->assertJsonPath('data.FINISH_LANDED_MNT', null);
});

// The live board trades auction houses Appendix A does not list. That must cost
// the caller a null field, not a 500.
it('serves the lot with a null finished price when the auction has no FOB row', function () {
    seedLandedPriceReferences();

    Http::fake(fn (ClientRequest $request) => str_contains(urldecode($request->url()), 'stats')
        ? Http::response('[]')
        : Http::response(json_encode([[
            'ID' => '7abc', 'AUCTION_TYPE' => '2', 'AUCTION' => 'NOWHERE AUCTION',
            'KUZOV' => 'MB4164T', 'ENG_V' => '1595', 'YEAR' => '2013',
            'FINISH' => '1000000', 'STATUS' => 'Sold', 'AVG_PRICE' => '0',
        ]])));

    $this->getJson('/api/japan/7abc')->assertOk()
        ->assertJsonPath('data.FINISH_LANDED_MNT', null);
});
```

Add `use App\Models\AuctionFob;` to the file's import block (it sits alphabetically before `use App\Models\Config;`).

- [ ] **Step 2: Run the tests to verify they fail**

```bash
cd /Users/ankhbayar/Herd/tjcar-api-v2 && php artisan test --filter=AuctionTest
```

Expected: the three new tests FAIL, every pre-existing one still passes. `FINISH_LANDED_MNT` is missing from the payload, so the first new test gets `null` where it wants an int and the two `assertJsonPath` tests fail on a missing path.

- [ ] **Step 3: Wire the service into the controller**

In `app/Http/Controllers/Public/AuctionController.php`:

Add `use App\Services\Auction\FinishLandedPrice;` (alphabetically after `use App\Services\Auction\AuctionService;`).

Extend the constructor:

```php
    public function __construct(
        private readonly AuctionService $auctions,
        private readonly AuctionHistoryService $history,
        private readonly LandedPriceEstimator $estimateLandedPrice,
        private readonly FinishLandedPrice $finishLandedPrice,
    ) {}
```

In `show`, directly under the existing `$row['PRICE_MNT'] = ...` line, add:

```php
        // The result card's small tugrik line, for lots that have already sold.
        // Different question from PRICE_MNT above, and a different calculator:
        // that one averages comparable sales with the legacy formula, this one
        // runs THIS lot's own FINISH through vehicle-cost v1. Null on an
        // upcoming lot, and on any lot v1 declines to price.
        $row['FINISH_LANDED_MNT'] = $this->finishLandedPrice->forLot($row);
```

Note there is no upstream round trip here — `auction_fobs`, `transport_costs`, `configs` and `hybrid_chassis` are all local tables — so the `Http::assertSentCount(2)` in `serves USS lots to guests without premium data` still holds.

- [ ] **Step 4: Run the tests to verify they pass**

```bash
cd /Users/ankhbayar/Herd/tjcar-api-v2 && php artisan test --filter=AuctionTest
```

Expected: PASS, the whole file including the three new tests.

- [ ] **Step 5: Run the full backend suite**

```bash
cd /Users/ankhbayar/Herd/tjcar-api-v2 && composer test
```

Expected: PASS. If anything else asserts on the exact key set of a lot payload, fix that assertion here.

- [ ] **Step 6: Commit**

```bash
cd /Users/ankhbayar/Herd/tjcar-api-v2 && git add app/Http/Controllers/Public/AuctionController.php tests/Feature/Public/AuctionTest.php && git commit -m "feat(japan): ship FINISH_LANDED_MNT on the lot endpoint"
```

- [ ] **Step 7: Confirm against the running API**

With Herd serving `tjcar-api-v2.test`, fetch a lot that has already sold (pick an ID from `/api/japan?per_page=100` whose `STATUS` is non-empty and `FINISH` non-zero):

```bash
curl -s 'http://tjcar-api-v2.test/api/japan/<ID>' | python3 -c 'import json,sys; d=json.load(sys.stdin)["data"]; print(d["AUCTION"], d["FINISH"], d["PRICE_MNT"], d["FINISH_LANDED_MNT"])'
```

Expected: a non-null `FINISH_LANDED_MNT` in the same order of magnitude as `PRICE_MNT`. If it is null, check `storage/logs/laravel.log` for the `Finish landed price failed` warning — the reason is in it.

---

### Task 4: carry the field through the front-end types

**Files:**
- Modify: `src/types/featured.ts` (`FeaturedCar`)
- Modify: `src/lib/carFixtures.ts` (`CarFixture` type; `carResourceToFixture`; `auctionLotToFixture`)
- Modify: `src/lib/koreaAdapter.ts` (`koreaListingToFixture`)

**Interfaces:**
- Consumes: `data.FINISH_LANDED_MNT` from Task 3.
- Produces: `CarFixture.FINISH_LANDED_MNT: number | null`, read by Task 5 in `JapanCarDetail`.

- [ ] **Step 1: Add the field to `FeaturedCar`**

In `src/types/featured.ts`, immediately after the `PRICE_MNT?: number | null;` line and its docblock:

```ts
  /**
   * This lot's OWN hammer price (`FINISH`) run through the v1 vehicle-cost
   * calculator — the total MNT to land THIS car. `GET /japan/{id}` only; null
   * on an upcoming lot and on any lot the calculator declines (an auction with
   * no FOB row, a missing exchange rate).
   *
   * Not a second opinion on `PRICE_MNT`: that is a comparable-sales AVERAGE
   * from the legacy calculator, this is what this exact car fetched.
   */
  FINISH_LANDED_MNT?: number | null;
```

- [ ] **Step 2: Add it to `CarFixture` and every builder**

In `src/lib/carFixtures.ts`, after the `PRICE_MNT: number | null;` field in the `CarFixture` type:

```ts
  /**
   * Landed MNT for this lot's own FINISH, from the v1 calculator. Japan auction
   * lots only — null everywhere else, and null on a lot that has not sold yet.
   */
  FINISH_LANDED_MNT: number | null;
```

In `carResourceToFixture` (the in-stock/garage builder), beside its `PRICE_MNT: null,` line:

```ts
    FINISH_LANDED_MNT: null, // in-stock cars never went through an auction here
```

In `auctionLotToFixture`, beside its `PRICE_MNT: lot.PRICE_MNT ?? null,` line:

```ts
    FINISH_LANDED_MNT: lot.FINISH_LANDED_MNT ?? null,
```

In `src/lib/koreaAdapter.ts`, beside its `PRICE_MNT: null,` line:

```ts
    FINISH_LANDED_MNT: null, // Korea listings are not auction lots
```

- [ ] **Step 3: Verify the types compile**

```bash
cd /Users/ankhbayar/Projects/Front/tjcar-front-v2 && npx tsc --noEmit
```

Expected: no errors. A missing builder shows up here as "Property 'FINISH_LANDED_MNT' is missing in type ...".

- [ ] **Step 4: Commit**

```bash
cd /Users/ankhbayar/Projects/Front/tjcar-front-v2 && git add src/types/featured.ts src/lib/carFixtures.ts src/lib/koreaAdapter.ts && git commit -m "feat(japan): carry FINISH_LANDED_MNT through the car fixture"
```

---

### Task 5: render the tugrik line under the auction result

**Files:**
- Modify: `messages/mn.json`, `messages/en.json`, `messages/ru.json` (`carDetail.result`)
- Modify: `src/components/car-detail/AuctionResultSection.tsx`
- Modify: `src/components/car-detail/JapanCarDetail.tsx` (the `<AuctionResultSection>` call)

**Interfaces:**
- Consumes: `CarFixture.FINISH_LANDED_MNT` (Task 4); `formatMnt` from `@/lib/bidConfig`.
- Produces: nothing downstream.

- [ ] **Step 1: Add the translation key to all three locales**

These files carry unrelated uncommitted edits — add the one key, change nothing else.

`messages/mn.json`, inside `carDetail.result`, after `"cancelled": "Цуцлагдсан"`:

```json
      "landed": "Гар дээр ирэхэд ≈ {price}"
```

`messages/en.json`, same place:

```json
      "landed": "≈ {price} landed in Mongolia"
```

`messages/ru.json`, same place:

```json
      "landed": "≈ {price} с доставкой и растаможкой"
```

Remember the comma on the now-not-last `"cancelled"` line.

- [ ] **Step 2: Render it in `AuctionResultSection`**

In `src/components/car-detail/AuctionResultSection.tsx`:

Widen the `bidConfig` import:

```ts
import { formatJpy, formatMnt } from "@/lib/bidConfig";
```

Add to `Props`, after `finishJpy`:

```ts
  /**
   * `FINISH` priced into tugrik by the v1 vehicle-cost calculator — auction
   * price, Japan-side costs, freight and every Mongolian import tax. Null when
   * the API could not price it, and then the line simply does not render: the
   * yen figure above is already the answer to "what did it go for", so there is
   * nothing a placeholder would stand in for.
   */
  landedMnt?: number | null;
```

Add `landedMnt,` to the destructured parameter list, after `finishJpy,`.

Under the `priceLabel` assignment, add:

```ts
  const landed = landedMnt ?? 0;
```

In the card, directly after the `{formatJpy(finishJpy)}` `<span>` (still inside the same `flex flex-col` wrapper), add:

```tsx
                {landed > 0 && (
                  <span className="truncate text-[12px] font-medium text-neutral-500 dark:text-neutral-400">
                    {t("landed", { price: formatMnt(landed) })}
                  </span>
                )}
```

In the mobile sticky bar, directly after its `{formatJpy(finishJpy)}` `<span>`, add:

```tsx
          {landed > 0 && (
            <span className="truncate text-[11px] font-semibold leading-tight text-neutral-500 dark:text-neutral-400">
              {`≈ ${formatMnt(landed)}`}
            </span>
          )}
```

The bar repeats the card, so it carries the figure without the label — the words are two thumb-lengths up the page, and a 56px bar has no room for them.

- [ ] **Step 3: Pass it from `JapanCarDetail`**

In `src/components/car-detail/JapanCarDetail.tsx`, in the `<AuctionResultSection ... />` call, after the `finishJpy={Number(car.FINISH) || 0}` line:

```tsx
              landedMnt={car.FINISH_LANDED_MNT}
```

- [ ] **Step 4: Verify types and lint**

```bash
cd /Users/ankhbayar/Projects/Front/tjcar-front-v2 && npx tsc --noEmit && npm run lint
```

Expected: both clean.

- [ ] **Step 5: Verify the locale files are still valid JSON**

```bash
cd /Users/ankhbayar/Projects/Front/tjcar-front-v2 && for l in mn en ru; do python3 -c "
import json;d=json.load(open('messages/$l.json'));print('$l', d['carDetail']['result']['landed'])
"; done
```

Expected: three lines, each printing the new string. A parse error here means the comma was missed in Step 1.

- [ ] **Step 6: Look at it in the browser**

Use the project's `verify` skill (or `npm run dev`, port 2500). Open a Japanese lot that has already sold — find one from `/mn/japan` whose card shows a finished status — and check:

1. Desktop: the tugrik line sits under the ¥ figure in the result card, smaller and grey, and does not push the status pill out of alignment.
2. Phone width: the same figure appears in the bottom sticky bar under the ¥ figure, and the bar still clears the AI chat FAB.
3. A lot that is still upcoming shows the bid panel as before, with no tugrik line anywhere new.
4. Dark mode: both new lines stay legible.

- [ ] **Step 7: Commit**

**Check first** — `messages/*.json` and `AuctionResultSection.tsx` carried the user's own uncommitted edits before this task started, and staging them commits that work too:

```bash
cd /Users/ankhbayar/Projects/Front/tjcar-front-v2 && git diff -- messages/mn.json messages/en.json messages/ru.json src/components/car-detail/AuctionResultSection.tsx src/components/car-detail/JapanCarDetail.tsx
```

Read that diff. If it holds only this task's changes plus the harmless prettier reflow already in `AuctionResultSection.tsx`, commit:

```bash
cd /Users/ankhbayar/Projects/Front/tjcar-front-v2 && git add messages/mn.json messages/en.json messages/ru.json src/components/car-detail/AuctionResultSection.tsx src/components/car-detail/JapanCarDetail.tsx && git commit -m "feat(japan): show the landed tugrik price under the auction result"
```

If it also holds unrelated work of the user's, stop and ask them how they want it split rather than bundling it into this commit.
