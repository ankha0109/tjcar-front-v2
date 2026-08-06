# Japan lot detail — auction result state

**Date:** 2026-08-06
**Scope:** `/japan/[id]` (`JapanCarDetail`) only. Korea and garage detail pages are untouched.

## Problem

`JapanCarDetail` always renders `CarBidSection` — countdown, venue/lot, bid form, mobile
sticky CTA — as if every lot were still to come. It is not: `/japan` does not filter by
`STATUS` (see `applyPublicFilters` in the API), so lots that have already been through
the auction stay in the list and are one tap away. On those the page invites a bid on a
car that has already sold, and hides the one fact a visitor wants: what it fetched.

## Upstream data

`main.STATUS` and `main.FINISH`, sampled live 2026-08-06:

| `STATUS`                     | Meaning                    | `FINISH`                          |
| ---------------------------- | -------------------------- | --------------------------------- |
| `""`                         | Not yet auctioned          | `0`                               |
| `Sold`, `sold`               | Sold                       | hammer price, > 0                 |
| `Sold By Nego`               | Sold by negotiation        | > 0                               |
| `Not Sold`, `not sold`       | Did not sell               | **usually > 0** — top bid reached |
| `Cancelled`                  | Lot withdrawn              | sometimes > 0                     |
| `removed`                    | Lot removed                | usually `0`                       |

Two facts drive the design:

1. **Case is not stable.** The upstream ships `Sold` and `sold` in the same result set.
   Every comparison normalises.
2. **`FINISH > 0` does not mean sold.** 30 of 33 sampled `Not Sold` rows carried a
   non-zero `FINISH` — the highest bid that failed to meet reserve. Presenting that as a
   sale price would be wrong, so `STATUS` is the source of truth and `FINISH` is labelled
   by state.

## Design

### 1. `src/utils/auctionStatus.ts` (new)

```ts
export type AuctionResultState =
  | "upcoming" | "sold" | "unsold" | "cancelled" | "other";

export function auctionResultState(status: string): AuctionResultState;
```

Trim + lowercase, then: empty → `upcoming`; starts with `sold` → `sold`; `not sold` →
`unsold`; `cancelled`/`canceled`/`removed` → `cancelled`; any other non-empty →
`other`. `other` still counts as finished (the user's rule: a non-empty `STATUS` means
the auction has happened) and takes the cautious price label.

`CarBidSection`'s `isAuctionClosed` switches to this helper. It currently tests
`["SOLD", "Sold"].includes(status)`, so `sold`, `Sold By Nego` and `Not Sold` all read as
open until the clock passes. The Japan page will no longer route finished lots there, but
the guard should still be correct on its own.

### 2. `src/components/car-detail/AuctionMeta.tsx` (extracted)

The schedule + venue/lot/town block is inline inside `CarBidSection` today. Both cards
must show it identically, so it moves into its own client component. Markup and classes
move verbatim — no visual change.

### 3. `src/components/car-detail/AuctionResultSection.tsx` (new, server component)

Same card shell as `CarBidSection` (`rounded-2xl border border-neutral-200 p-4`,
`flex flex-col gap-4`), one copy at all widths — with no drawer there is nothing to
duplicate across the breakpoint.

```
quick specs
────────────────────────────────
ДУУДЛАГА ХУДАЛДААНЫ ДҮН
  ЗАРАГДСАН ҮНЭ
  1,265,000¥              ● Зарагдсан
────────────────────────────────
AuctionMeta  (schedule / venue / lot / town)
```

- Price row is omitted entirely when `FINISH` is `0`; only the status pill remains.
- Price label: `sold` → "Зарагдсан үнэ"; `unsold` / `cancelled` / `other` → "Хүрсэн
  хамгийн өндөр дүн".
- Pill: `sold` emerald, `unsold` neutral, `cancelled` amber, `other` neutral with the raw
  `STATUS` text as its label.
- Formatting via `formatJpy` from `@/lib/bidConfig` — the same `1,265,000¥` the bid form
  uses. **No ₮ conversion**: the hammer price excludes shipping, fees and duty, and a bare
  conversion beside it would read as a landed price.
- No countdown.

Mobile sticky bar (`lg:hidden`), replacing the bid CTA bar: status pill + `FINISH` on the
left, `actions` (wishlist + compare) on the right. It keeps the current bar's
`md:pr-24` (clearance for the AI chat FAB) and `pb-[calc(env(safe-area-inset-bottom)+0.75rem)]`.

Because this path is a server component, `useSession`, `useWalletBalance`,
`useLandedPrice`, antd `Drawer` and `CarBidForm` never load on a finished lot.

### 4. `JapanCarDetail` branch

```tsx
const state = auctionResultState(car.STATUS);
…
{state === "upcoming"
  ? <CarBidSection … />
  : <AuctionResultSection state={state} rawStatus={car.STATUS}
      finishJpy={Number(car.FINISH) || 0} … />}
```

`quickSpecs` and `actions` are passed through unchanged. Both branches render a mobile
sticky bar, so the trailing `h-20 lg:hidden` spacer stays.

### 5. Translations — `carDetail.result` in `mn`, `en`, `ru`

`title`, `soldPrice`, `topBid`, `sold`, `unsold`, `cancelled`.

## Deliberately unchanged

- **`LandedPriceCard` stays as it is on finished lots.** `PRICE_MNT` for a `main` row is
  computed from `AVG_PRICE` / comparable sales (`LandedPriceEstimator::forListedLot`), not
  from this lot's own `FINISH`, so it can differ from the hammer price by ~30% (LOT 3029:
  `FINISH` ¥1,265,000 vs `AVG_PRICE` ¥1,647,000). The tile is labelled "Гар дээр ирэх
  **дундаж** үнэ" and is honest as a market estimate; recomputing it off `FINISH` would put
  a spinner back on the page's headline number, which commit history shows was removed on
  purpose.
- **Headline tiles, evaluation sheet, comparable-price chart, breadcrumb, gallery.**
- **The `/japan` list.** Hiding finished lots there is a backend `applyPublicFilters`
  change and is out of scope here.

## Verification

- A `Sold` lot shows the hammer price and an emerald "Зарагдсан" pill; no bid form, no
  countdown, no bid CTA.
- A `Not Sold` lot with `FINISH > 0` shows that figure under "Хүрсэн хамгийн өндөр дүн",
  never under "Зарагдсан үнэ".
- A `removed` lot with `FINISH = 0` shows the pill alone, with no price row.
- An upcoming lot (`STATUS = ""`) is byte-for-byte what it is today.
- Mobile: the sticky bar shows the result and still reaches wishlist + compare; nothing is
  covered by the AI chat FAB at 768–1023px.
