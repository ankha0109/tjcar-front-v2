# Japan Auction Result State Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** On `/japan/[id]`, a lot that has already been through the auction stops showing the bid panel and shows its result instead — the `FINISH` hammer price in yen plus a `STATUS` pill.

**Architecture:** One normaliser (`auctionResultState`) turns the upstream's inconsistently-spelled `STATUS` into a five-value union. `JapanCarDetail` branches on it: `upcoming` keeps today's `CarBidSection`, anything else renders a new server-component `AuctionResultSection` built from the same card shell. The schedule/venue/lot block both cards need is extracted into a shared `AuctionMeta`.

**Tech Stack:** Next.js 16 App Router (React server components), TypeScript, `next-intl`, antd v6, Tailwind v4.

**Spec:** `docs/superpowers/specs/2026-08-06-japan-auction-result-design.md`

## Global Constraints

- **No test runner exists in this repo** (`package.json` scripts: `dev`, `build`, `start`, `lint`; no vitest/jest; zero test files). Do NOT add one. Every task verifies with `npx tsc --noEmit` + `npm run lint`; the last task adds a manual browser pass.
- **i18n:** every new message key goes into ALL THREE of `messages/mn.json`, `messages/en.json`, `messages/ru.json` (project CLAUDE.md rule). `mn` is the default locale.
- **Server vs client components:** `AuctionResultSection` is a **server** component (`getTranslations` from `next-intl/server`). Do not add `"use client"` to it — keeping the finished-lot path server-only is the reason `useSession`, `useWalletBalance`, `useLandedPrice`, antd `Drawer` and `CarBidForm` never load there.
- **Banned utility classes:** never use `tracking-*` or `font-mono` anywhere in this project.
- **`cn()` strips `leading-*`** when a later argument carries `text-[…]`. Where both are needed, write the size utility as `text-[10px]/tight`. (Not needed by any snippet below — they keep `leading-tight`/`leading-normal` on elements whose class list has no `cn()` merge.)
- **`messages/*.json` and several `src/` files carry the user's uncommitted WIP.** Line numbers in those files may have drifted; anchor every edit on the quoted surrounding text, not on the line number alone. Stage only the files a task names — never `git add -A`.
- **Commit style:** conventional commits (`feat:`, `refactor:`), one commit per task.

---

## File Structure

| File | Action | Responsibility |
|---|---|---|
| `src/utils/auctionStatus.ts` | create | Normalise `main.STATUS` into a lifecycle union. The only place a raw status string is compared. |
| `src/components/car-detail/CarBidSection.tsx` | modify | Use the normaliser for its closed check; render the extracted `AuctionMeta` instead of an inline copy. |
| `src/components/car-detail/AuctionMeta.tsx` | create | Schedule + venue/lot/town — the sale's own facts, shared by the bid panel and the result panel. |
| `src/components/car-detail/AuctionResultSection.tsx` | create | The finished-lot card: quick specs, hammer price + status pill, `AuctionMeta`, mobile sticky result bar. |
| `src/components/car-detail/JapanCarDetail.tsx` | modify | Branch between the two panels; hoist the shared `quickSpecs`/`actions` nodes. |
| `messages/{mn,en,ru}.json` | modify | `carDetail.result` copy. |

Task order is dependency order: 1 is a leaf; 2 is an independent refactor; 3 depends on 1 + 2; 4 depends on 3.

---

## Reference: live lot ids for manual verification

Sampled from the AJES `main` table on 2026-08-06. **AJES rolls its data over, so these will expire.** If a URL 404s, re-derive fresh ids with:

```bash
cd /Users/ankhbayar/Herd/tjcar-api-v2 && php artisan tinker --execute="
\$c = App\Services\Ajes\AjesClient::fromConfig();
\$sql = Illuminate\Support\Facades\DB::table('main')->select('ID','LOT','STATUS','FINISH')->where('STATUS','<>','')->limit(60)->toRawSql();
echo json_encode(\$c->get(\$sql), JSON_PRETTY_PRINT);
"
```

| Case | Lot id | `STATUS` | `FINISH` |
|---|---|---|---|
| Sold, priced | `YMFvtbBaBDMek0` | `Sold` | `1265000` |
| Sold by negotiation | `tpfVjYhuVF8ubw` | `Sold By Nego` | `1180000` |
| Not sold, top bid present | `3h9o32msZ3jLBbn` | `Not Sold` | `451000` |
| Not sold, no figure | `4QMtvxLpVklb1B` | `Not Sold` | `0` |
| Cancelled, figure present | `jCVp3j8lsAkZgO6` | `Cancelled` | `1309000` |
| Removed, no figure | `kVpJlHUzlnSsv9F` | `removed` | `0` |

URL shape: `http://localhost:2500/mn/japan/<id>`.

---

### Task 1: Normalise the lot lifecycle

**Files:**
- Create: `src/utils/auctionStatus.ts`
- Modify: `src/components/car-detail/CarBidSection.tsx` (the `isAuctionClosed` helper, ~lines 52-64)

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `type AuctionResultState = "upcoming" | "sold" | "unsold" | "cancelled" | "other"`
  - `auctionResultState(status: string): AuctionResultState`
  - `isAuctionFinished(status: string): boolean`

**Why:** `CarBidSection.isAuctionClosed` tests `["SOLD", "Sold"].includes(status)`. The upstream ships `Sold` **and** `sold` in the same result set, plus `Sold By Nego`, `Not Sold`, `not sold`, `Cancelled` and `removed` — every one of those currently reads as an open auction until the clock passes. Tasks 3 and 4 need the same classification, so it belongs in one helper rather than three inline comparisons.

- [ ] **Step 1: Create `src/utils/auctionStatus.ts`**

```ts
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
  const s = status.trim().toLowerCase().replace(/\s+/g, " ");

  if (!s) return "upcoming";
  // Checked before `sold` so "not sold" cannot fall through to a sale.
  if (s.startsWith("not sold")) return "unsold";
  // "sold", "Sold", "Sold By Nego" — a negotiated sale is still a sale.
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
```

- [ ] **Step 2: Import the helper in `src/components/car-detail/CarBidSection.tsx`**

Find the import block near the top and add the new line after the `parseJapanAuctionDate` import:

```ts
import { parseJapanAuctionDate } from "@/utils/auctionTime";
import { isAuctionFinished } from "@/utils/auctionStatus";
```

- [ ] **Step 3: Rewrite the `isAuctionClosed` helper**

Replace the whole JSDoc + function (it begins with `/**\n * Best-effort closed check.`) with:

```ts
/**
 * Best-effort closed check. The backend is the source of truth (it rejects bids
 * placed less than {@link BID_CUTOFF_HOURS} hours before the auction); here we
 * only surface an obviously-closed state: the lot has been through the auction,
 * or its time has passed. Status spellings vary upstream, so the verdict comes
 * from {@link isAuctionFinished} rather than a literal comparison. The auction
 * time is Japan (GMT+9); {@link parseJapanAuctionDate} anchors it and returns
 * null for the 00:00:00 "not scheduled" sentinel, so those stay open.
 */
function isAuctionClosed(status: string, auctionDate: string): boolean {
  if (isAuctionFinished(status)) return true;
  const d = parseJapanAuctionDate(auctionDate);
  if (!d) return false;
  return Date.now() > d.getTime();
}
```

- [ ] **Step 4: Typecheck and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: both clean. If `tsc` reports pre-existing errors in files this task did not touch, note them and move on — do not fix unrelated files.

- [ ] **Step 5: Commit**

```bash
git add src/utils/auctionStatus.ts src/components/car-detail/CarBidSection.tsx
git commit -m "fix(japan): close bidding on every finished lot status"
```

---

### Task 2: Extract `AuctionMeta`

**Files:**
- Create: `src/components/car-detail/AuctionMeta.tsx`
- Modify: `src/components/car-detail/CarBidSection.tsx`

**Interfaces:**
- Consumes: `AuctionScheduleTimes` from `./AuctionSchedule`.
- Produces: default export `AuctionMeta`, props
  `{ schedule: AuctionScheduleTimes | null; auctionLocation: string; town?: string; lot: string }`.

**Why:** The bid panel and the result panel must show the sale's own facts identically — a lot should read the same before and after the hammer falls. The block is inline inside `CarBidSection` today, so Task 3 would otherwise copy 40 lines of markup.

**This is a pure refactor: the rendered output must not change.** Move the markup verbatim.

- [ ] **Step 1: Create `src/components/car-detail/AuctionMeta.tsx`**

```tsx
"use client";

import { Typography } from "antd";
import { useTranslations } from "next-intl";
import AuctionSchedule, { type AuctionScheduleTimes } from "./AuctionSchedule";

type Props = {
  /** Japan + Ulaanbaatar clocks for the lot's AUCTION_DATE, formatted server-side. */
  schedule: AuctionScheduleTimes | null;
  /** Auction house / venue (AUCTION). */
  auctionLocation: string;
  /** Location town/region (TOWN) — often empty; shown only when present. */
  town?: string;
  /** Lot number (LOT). */
  lot: string;
};

/**
 * Everything you need to know about the SALE rather than the car: both clocks,
 * then venue, lot number and town. Grouped away from the car specs because
 * these describe the auction, and shared by the bid panel (upcoming lots) and
 * the result panel (finished ones) so one lot reads the same either side of the
 * hammer. Always visible, even to guests.
 */
export default function AuctionMeta({
  schedule,
  auctionLocation,
  town,
  lot,
}: Props) {
  const tSpecs = useTranslations("carDetail.specs");

  return (
    <div className="flex flex-col gap-3">
      <AuctionSchedule schedule={schedule} />
      {/* Same label/value recipe as the quick specs above: 11px uppercase
          label, 13px semibold value, gap-0 + leading-normal, value truncates. */}
      <dl className="grid grid-cols-2 gap-x-3 gap-y-4">
        <div className="flex min-w-0 flex-col gap-0 leading-normal">
          <dt className="text-[11px] font-medium uppercase text-neutral-400 dark:text-neutral-500">
            {tSpecs("auction")}
          </dt>
          <dd className="truncate text-[13px] font-semibold text-neutral-900 dark:text-neutral-100">
            {auctionLocation || "-"}
          </dd>
        </div>
        <div className="flex min-w-0 flex-col gap-0 leading-normal">
          <dt className="text-[11px] font-medium uppercase text-neutral-400 dark:text-neutral-500">
            {tSpecs("lot")}
          </dt>
          <dd className="flex items-center gap-1 text-[13px] font-semibold text-neutral-900 dark:text-neutral-100">
            <span className="truncate">{lot || "-"}</span>
            {/* Bare antd copy control — the number keeps its own typography and
                only the button comes from antd. Its tooltip ("Хуулбарлах" /
                "Хуулсан") ships with the ConfigProvider locale, so mn/en/ru all
                read correctly without extra message keys. */}
            {lot ? <Typography.Text copyable={{ text: lot }} /> : null}
          </dd>
        </div>
        {town && (
          <div className="flex min-w-0 flex-col gap-0 leading-normal">
            <dt className="text-[11px] font-medium uppercase text-neutral-400 dark:text-neutral-500">
              {tSpecs("location")}
            </dt>
            <dd className="truncate text-[13px] font-semibold text-neutral-900 dark:text-neutral-100">
              {town}
            </dd>
          </div>
        )}
      </dl>
    </div>
  );
}
```

- [ ] **Step 2: Fix the imports in `CarBidSection.tsx`**

`Typography` and `AuctionSchedule` are now used only by `AuctionMeta`; the `AuctionScheduleTimes` **type** is still needed for `CarBidSection`'s own props.

Replace:

```tsx
import { Drawer, Typography } from "antd";
```

with:

```tsx
import { Drawer } from "antd";
```

Replace:

```tsx
import AuctionSchedule, { type AuctionScheduleTimes } from "./AuctionSchedule";
```

with:

```tsx
import type { AuctionScheduleTimes } from "./AuctionSchedule";
import AuctionMeta from "./AuctionMeta";
```

- [ ] **Step 3: Delete the inline `auctionMeta` const and its `tSpecs` hook**

Delete this line from the component body:

```tsx
  const tSpecs = useTranslations("carDetail.specs");
```

Then delete the entire `const auctionMeta = ( … );` declaration — it starts at the comment

```tsx
  // Everything you need before bidding — both clocks, then venue/lot/town.
```

and ends with the `);` that closes the JSX. Leave `const t = useTranslations("carDetail.bid");` in place.

- [ ] **Step 4: Render the component at both call sites**

There are exactly two `{auctionMeta}` expressions — one in the `hidden … lg:flex` desktop `<section>`, one in the `lg:hidden` mobile `<section>`. Replace **each** with:

```tsx
        <AuctionMeta
          schedule={schedule}
          auctionLocation={auctionLocation}
          town={town}
          lot={lot}
        />
```

- [ ] **Step 5: Typecheck and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: both clean. A leftover unused-import error means Step 2 was applied incompletely.

- [ ] **Step 6: Commit**

```bash
git add src/components/car-detail/AuctionMeta.tsx src/components/car-detail/CarBidSection.tsx
git commit -m "refactor(car-detail): extract AuctionMeta from CarBidSection"
```

---

### Task 3: Build `AuctionResultSection` + its copy

**Files:**
- Create: `src/components/car-detail/AuctionResultSection.tsx`
- Modify: `messages/mn.json`, `messages/en.json`, `messages/ru.json`

**Interfaces:**
- Consumes: `AuctionResultState` from `@/utils/auctionStatus` (Task 1); `AuctionMeta` (Task 2); `formatJpy` from `@/lib/bidConfig`; `cn` from `@/utils`.
- Produces: default export `AuctionResultSection` (async server component), props
  ```ts
  {
    state: Exclude<AuctionResultState, "upcoming">;
    rawStatus: string;
    finishJpy: number;
    schedule: AuctionScheduleTimes | null;
    auctionLocation: string;
    town?: string;
    lot: string;
    quickSpecs?: React.ReactNode;
    actions?: React.ReactNode;
  }
  ```

**Why the price caption is conditional:** 30 of 33 sampled `Not Sold` rows carried a non-zero `FINISH` — that is the highest bid reached, not a sale. Only `state === "sold"` may caption it "Зарагдсан үнэ"; everything else says "Хүрсэн хамгийн өндөр дүн".

**No ₮ conversion anywhere in this component.** The hammer price excludes shipping, fees and duty; a bare `× jpyRate` figure beside it would read as a landed price. The `LandedPriceCard` tile above already carries the MNT estimate.

- [ ] **Step 1: Add the `carDetail.result` block to `messages/mn.json`**

Find the end of the `carDetail.bid` object — the line `"closedBody": "Дуудлага худалдааны цаг дууссан. Хугацаа дуусахаас {hours} цагийн өмнө оролцох боломжтой."` followed by `    },` and then `    "gallery": {`. Insert the new object between the `},` and `"gallery"`:

```json
    "result": {
      "title": "Дуудлага худалдааны дүн",
      "soldPrice": "Зарагдсан үнэ",
      "topBid": "Хүрсэн хамгийн өндөр дүн",
      "sold": "Зарагдсан",
      "unsold": "Зараагүй",
      "cancelled": "Цуцлагдсан"
    },
```

- [ ] **Step 2: Add the same block to `messages/en.json`**

Same position — after the `carDetail.bid` object's closing `},`, before `"gallery": {`:

```json
    "result": {
      "title": "Auction result",
      "soldPrice": "Sold for",
      "topBid": "Highest bid reached",
      "sold": "Sold",
      "unsold": "Not sold",
      "cancelled": "Cancelled"
    },
```

- [ ] **Step 3: Add the same block to `messages/ru.json`**

Same position:

```json
    "result": {
      "title": "Итог аукциона",
      "soldPrice": "Цена продажи",
      "topBid": "Максимальная ставка",
      "sold": "Продан",
      "unsold": "Не продан",
      "cancelled": "Отменён"
    },
```

- [ ] **Step 4: Verify all three files are still valid JSON and carry the key**

Run:

```bash
python3 -c "
import json
for l in ('mn','en','ru'):
    d = json.load(open(f'messages/{l}.json'))['carDetail']['result']
    assert set(d) == {'title','soldPrice','topBid','sold','unsold','cancelled'}, (l, sorted(d))
    print(l, 'ok', d['sold'])
"
```

Expected: three `ok` lines, no traceback.

- [ ] **Step 5: Create `src/components/car-detail/AuctionResultSection.tsx`**

```tsx
import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import AuctionMeta from "./AuctionMeta";
import type { AuctionScheduleTimes } from "./AuctionSchedule";
import { formatJpy } from "@/lib/bidConfig";
import type { AuctionResultState } from "@/utils/auctionStatus";
import { cn } from "@/utils";

/** Every lifecycle state except the one that still takes bids. */
type FinishedState = Exclude<AuctionResultState, "upcoming">;

type Props = {
  state: FinishedState;
  /** Raw STATUS — the pill label when `state` is "other" and we have no word for it. */
  rawStatus: string;
  /** FINISH in yen. 0 means the upstream published no figure at all. */
  finishJpy: number;
  /** Japan + Ulaanbaatar clocks for AUCTION_DATE, formatted server-side. */
  schedule: AuctionScheduleTimes | null;
  auctionLocation: string;
  town?: string;
  lot: string;
  /** Quick-spec grid rendered at the top of the card, above a divider. */
  quickSpecs?: ReactNode;
  /** Wishlist + compare for the mobile sticky bar; desktop puts them in the title header. */
  actions?: ReactNode;
};

const PILL: Record<FinishedState, string> = {
  sold: "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/30",
  unsold:
    "bg-neutral-100 text-neutral-600 ring-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:ring-neutral-700",
  cancelled:
    "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/30",
  other:
    "bg-neutral-100 text-neutral-600 ring-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:ring-neutral-700",
};

const DOT: Record<FinishedState, string> = {
  sold: "bg-emerald-500",
  unsold: "bg-neutral-400",
  cancelled: "bg-amber-500",
  other: "bg-neutral-400",
};

/**
 * The finished-lot counterpart to {@link CarBidSection}: same card shell, same
 * quick specs, same {@link AuctionMeta} — but the countdown and bid form are
 * replaced by what the lot actually fetched. `/japan` does not filter finished
 * lots out of its list, so this is a routine screen, not an edge case.
 *
 * A server component on purpose: nothing here needs a session, a wallet balance
 * or a drawer, so a sold lot ships none of that JavaScript.
 *
 * One card at every width — with no drawer there is nothing to duplicate across
 * the breakpoint, unlike the bid panel.
 */
export default async function AuctionResultSection({
  state,
  rawStatus,
  finishJpy,
  schedule,
  auctionLocation,
  town,
  lot,
  quickSpecs,
  actions,
}: Props) {
  const t = await getTranslations("carDetail.result");

  // "other" means the upstream sent a verdict we have no word for; showing it
  // verbatim beats inventing one.
  const statusLabel = state === "other" ? rawStatus : t(state);

  // FINISH on an unsold or cancelled lot is the highest bid the room reached,
  // NOT a sale price — 30 of 33 sampled "Not Sold" rows carry one. Only a sold
  // lot may caption it as what the car fetched.
  const priceLabel = state === "sold" ? t("soldPrice") : t("topBid");

  const pill = (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-semibold ring-1 ring-inset",
        PILL[state],
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", DOT[state])} aria-hidden />
      {statusLabel}
    </span>
  );

  return (
    <>
      <section className="flex flex-col gap-4 rounded-2xl border border-neutral-200 p-4 dark:border-neutral-800">
        {quickSpecs && (
          <>
            {quickSpecs}
            <div className="h-px bg-neutral-100 dark:bg-neutral-800" />
          </>
        )}

        <div className="flex flex-col gap-3">
          <h2 className="text-[15px] font-semibold text-neutral-900 dark:text-neutral-100">
            {t("title")}
          </h2>
          {/* Price left, verdict right. With no price the pill simply starts the
              row — no placeholder, no empty column. */}
          <div className="flex flex-wrap items-end justify-between gap-x-3 gap-y-2">
            {finishJpy > 0 && (
              <div className="flex min-w-0 flex-col gap-0 leading-normal">
                <span className="text-[11px] font-medium uppercase text-neutral-400 dark:text-neutral-500">
                  {priceLabel}
                </span>
                <span className="truncate text-[26px] font-extrabold leading-tight text-neutral-900 dark:text-neutral-100">
                  {formatJpy(finishJpy)}
                </span>
              </div>
            )}
            {pill}
          </div>
        </div>

        <div className="h-px bg-neutral-100 dark:bg-neutral-800" />
        <AuctionMeta
          schedule={schedule}
          auctionLocation={auctionLocation}
          town={town}
          lot={lot}
        />
      </section>

      {/* Mobile sticky bar — the bid CTA's slot, now carrying the result so it
          stays readable while scrolling. `md:pr-24` reserves the rightmost
          ~96px for the AI chat FAB, which otherwise covers the actions between
          768px and 1023px. */}
      <div className="fixed inset-x-0 bottom-0 z-30 flex items-center gap-3 border-t border-neutral-100 bg-white/95 px-4 md:pr-24 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-3 backdrop-blur-xl lg:hidden dark:border-neutral-900 dark:bg-neutral-950/95">
        <div className="flex min-w-0 flex-1 flex-col items-start gap-1">
          {pill}
          {finishJpy > 0 && (
            <span className="truncate text-[17px] font-extrabold leading-tight text-neutral-900 dark:text-neutral-100">
              {formatJpy(finishJpy)}
            </span>
          )}
        </div>
        {actions}
      </div>
    </>
  );
}
```

- [ ] **Step 6: Typecheck and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: both clean. The component is not rendered anywhere yet — Task 4 wires it up.

- [ ] **Step 7: Commit**

```bash
git add src/components/car-detail/AuctionResultSection.tsx messages/mn.json messages/en.json messages/ru.json
git commit -m "feat(japan): add the finished-lot auction result panel"
```

> **Note on staging:** `messages/*.json` also carry the user's unrelated WIP. `git add <file>` stages the whole file including that WIP. If the working tree still shows unrelated message changes at this point, stage them together and say so in the handoff rather than trying to split the file.

---

### Task 4: Branch `JapanCarDetail` and verify in the browser

**Files:**
- Modify: `src/components/car-detail/JapanCarDetail.tsx`

**Interfaces:**
- Consumes: `auctionResultState` (Task 1), `AuctionResultSection` (Task 3).
- Produces: nothing new.

- [ ] **Step 1: Add the two imports**

After `import CarBidSection from "./CarBidSection";` add:

```tsx
import AuctionResultSection from "./AuctionResultSection";
```

And alongside the other `@/utils/*` imports (next to `import { parseAuctionInfo } from "@/utils/auctionInfo";`) add:

```tsx
import { auctionResultState } from "@/utils/auctionStatus";
```

- [ ] **Step 2: Derive the lifecycle state**

Directly after the `const schedule = auctionSchedule(car.AUCTION_DATE);` line and its comment block, add:

```tsx
  // Lot lifecycle. An empty STATUS is the only "still to come" value; anything
  // else means the sale has happened. `/japan` does not filter finished lots
  // out of its list, so this branch is routine — yesterday's lots are one tap
  // from the browser.
  const resultState = auctionResultState(car.STATUS);
```

- [ ] **Step 3: Hoist the two nodes both panels need**

Both branches pass the same quick-spec grid and the same bar actions, so lift them out beside the existing `chassisVerify` const. Add immediately **after** the `const chassisVerify = ( … );` declaration:

```tsx
  // Passed to whichever panel renders — the bid card or the result card.
  const quickSpecGrid = (
    <div className="grid grid-cols-3 gap-x-3 gap-y-4">
      {quickSpecs.map(({ label, value, icon }) => (
        <div key={label} className="flex items-center gap-1.25">
          {icon ? (
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-neutral-0 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
              {icon}
            </span>
          ) : (
            // Invisible spacer — keeps the columns lined up until the
            // remaining icons land.
            <span className="h-6 w-6 shrink-0" aria-hidden />
          )}
          <div className="flex min-w-0 flex-col gap-0 leading-normal">
            <span className="text-[11px] font-medium uppercase text-neutral-400 dark:text-neutral-500">
              {label}
            </span>
            <span className="truncate text-[13px] font-semibold text-neutral-900 dark:text-neutral-100">
              {value || "-"}
            </span>
          </div>
        </div>
      ))}
    </div>
  );

  // Mobile-only in practice: the `lg` layout puts these in the title header.
  const barActions = (
    <CarActionButtons item={wishlistItem} enableCompare variant="bar" />
  );
```

- [ ] **Step 4: Replace the `<CarBidSection …>` element with the branch**

In the info column, replace the whole element — it opens with the comment

```tsx
          {/* Auction action card — quick specs, then countdown + venue/lot + gated bid form, split by dividers */}
```

and runs to the `/>` that closes `<CarBidSection`, including its inline `actions={…}` and `quickSpecs={…}` props — with:

```tsx
          {/* Auction panel. Upcoming: quick specs, countdown, venue/lot and the
              gated bid form. Finished: the same shell with the hammer price and
              a status pill where the countdown and form were. */}
          {resultState === "upcoming" ? (
            <CarBidSection
              auctionId={car.ID}
              startPrice={startNum || 0}
              status={car.STATUS}
              auctionDate={car.AUCTION_DATE}
              schedule={schedule}
              auctionLocation={car.AUCTION}
              town={car.TOWN}
              lot={car.LOT}
              chassis={car.KUZOV}
              engineSize={car.ENG_V}
              year={car.YEAR}
              rate={car.RATE}
              jpyRate={jpyRate}
              actions={barActions}
              quickSpecs={quickSpecGrid}
            />
          ) : (
            <AuctionResultSection
              state={resultState}
              rawStatus={car.STATUS}
              finishJpy={Number(car.FINISH) || 0}
              schedule={schedule}
              auctionLocation={car.AUCTION}
              town={car.TOWN}
              lot={car.LOT}
              actions={barActions}
              quickSpecs={quickSpecGrid}
            />
          )}
```

The `h-20 lg:hidden` spacer at the end of the article stays as it is — both branches render a mobile sticky bar.

- [ ] **Step 5: Typecheck and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: both clean. If `tsc` complains that `resultState` is not assignable to `Exclude<AuctionResultState, "upcoming">`, the ternary was written as an `if` or the const was re-assigned — TypeScript only narrows a `const` inside a ternary/`if` on the same expression.

- [ ] **Step 6: Browser verification**

Use the `verify` skill to launch the app (`npm run dev`, port 2500) and walk these URLs. Take a screenshot of each. For mobile widths use CDP `setDeviceMetricsOverride` — `--window-size` below ~485px lies on macOS.

| URL | Expect |
|---|---|
| `/mn/japan/YMFvtbBaBDMek0` | "ЗАРАГДСАН ҮНЭ" + `1,265,000¥`, emerald "Зарагдсан" pill. No countdown, no bid form, no "Үнийн санал илгээх" button. |
| `/mn/japan/3h9o32msZ3jLBbn` | `451,000¥` captioned "ХҮРСЭН ХАМГИЙН ӨНДӨР ДҮН" — **never** "Зарагдсан үнэ". Grey "Зараагүй" pill. |
| `/mn/japan/4QMtvxLpVklb1B` | Grey "Зараагүй" pill alone, no price row, no empty gap where it would be. |
| `/mn/japan/jCVp3j8lsAkZgO6` | Amber "Цуцлагдсан" pill + `1,309,000¥` under "Хүрсэн хамгийн өндөр дүн". |
| any lot with `STATUS = ""` (open `/mn/japan` and click the first card) | Unchanged: countdown, bid gate card, sticky "Үнийн санал илгээх" bar. |
| `/en/japan/YMFvtbBaBDMek0` and `/ru/japan/YMFvtbBaBDMek0` | English / Russian copy, no raw message keys on screen. |

At 390px wide on a sold lot, confirm: the sticky bar shows the pill over the price with wishlist + compare still tappable on the right, and the last page content is not hidden behind it.

At 768px wide, confirm the AI chat FAB does not cover the wishlist/compare buttons.

- [ ] **Step 7: Commit**

```bash
git add src/components/car-detail/JapanCarDetail.tsx
git commit -m "feat(japan): show the auction result instead of the bid panel on finished lots"
```

---

## Self-review notes

- Spec §1 → Task 1. §2 → Task 2. §3 → Task 3. §4 → Task 4. §5 → Task 3 steps 1-4.
- Spec's "deliberately unchanged" list is honoured: no task touches `LandedPriceCard`, the headline tiles, the evaluation sheet, the price-history chart, or the API's `applyPublicFilters`.
- Names are consistent across tasks: `auctionResultState` / `isAuctionFinished` (Task 1) are the exact identifiers imported in Tasks 1 and 4; `AuctionMeta`'s four props (Task 2) match both call sites in Tasks 2 and 3; `AuctionResultSection`'s nine props (Task 3) match the nine passed in Task 4.
