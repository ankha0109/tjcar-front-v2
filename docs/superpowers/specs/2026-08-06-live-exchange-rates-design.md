# Live exchange rates in the header, drawer and footer

**Date:** 2026-08-06
**Status:** approved, ready to implement

## Problem

`src/lib/exchangeRates.ts` hard-codes the rates the site shows:

```ts
// TODO: Replace static rates with a Mongolbank API hook later.
export const EXCHANGE_RATES = {
  USD: { value: 3450, updatedAt: "2026-05-25T10:00:00Z" },
  JPY: { value: 23.1, updatedAt: "2026-05-25T10:00:00Z" },
} as const;
```

Three places render it — `DesktopFooter`, `DesktopHeader`'s menu card and
`MobileDrawer` — so every visitor sees a JPY rate frozen on 2026-05-25 while the
car pages convert prices with the live rate from `GET /config` (22.5 today).
Two different rates on one page.

Korean won is missing entirely even though `/korea` sells KRW-priced cars.

## Goals

1. Every rate the site prints comes from `GET /config`.
2. KRW joins USD and JPY.
3. The footer's separate full-width rate strip folds into the main footer body.
4. `GET /config` is fetched about once an hour, not once per request.

## Non-goals

- No admin UI for editing rates. That already exists in the API's admin panel.
- No "last updated" timestamp. The `header.topbar.rates.updated` message key
  stays unused, as it is today.
- No automatic KRW feed. `app:khanbank-rate` refreshes JPY and USD on a
  schedule; KRW is admin-entered and stays that way.

## Design

### 1. Backend — expose KRW (`~/Herd/tjcar-api-v2`)

`app/Http/Controllers/Public/ConfigController.php` serves a name→value map from
a six-name allowlist that does not include `KRW`, even though the row exists
(2.48 in dev) and `KrwRateResolver` reads it to convert Encar prices.

Add `'KRW'` to the allowlist and update the doc comment. The comment's real
guardrail — never expose `jpstat-token`, `autobox-token` or `transport` —
is unaffected: KRW is a public rate already visible through `price_mnt` on every
Encar listing.

`tests/Feature/Public/ConfigTest.php` asserts the exact opposite today:

```php
->assertJsonCount(6, 'data')
expect(array_keys($data))->not->toContain('jpstat-token', 'autobox-token', 'transport', 'KRW');
```

Bump the count to 7 and move `KRW` from the deny assertion into the
`toHaveKeys` list.

### 2. `src/services/config.ts` — KRW and an hourly cache

- `SiteConfig` gains `KRW: number`, parsed like the others.
- `cache: "no-store"` becomes `next: { revalidate: 3600, tags: ["config"] }`.
  Rates change at most once a day; the report price changes even less often. The
  tag lets a future webhook call `revalidateTag("config")` for an instant flush.
- The React `cache()` wrapper stays. It dedupes reads inside one render; the
  Next data cache dedupes across requests.

### 3. `src/services/ServerApi.ts` — `skipAuth`

Next keys the data cache on the fetch arguments, headers included. `ServerApi`
attaches `Authorization: Bearer …` whenever a session cookie exists, so a cached
`/config` would get one entry per logged-in user.

Add `skipAuth?: boolean` to `RequestOptions`, strip it before it reaches
`fetch`, and skip the token when set. `/config` is public, so it passes
`skipAuth: true` and every visitor shares one cache entry. `Accept-Language`
still varies, giving three entries (mn/en/ru) — acceptable and inherent.

### 4. `src/lib/exchangeRates.ts` — formatting only

`EXCHANGE_RATES` goes away. `formatRate` stays but widens from
`maximumFractionDigits: 1` to `2`: KRW is 2.48 and would otherwise print as
"2.5". USD (3,594) and JPY (22.5) are unchanged by the wider cap.

### 5. `src/components/providers/RatesProvider.tsx` — new

A client context holding `{ USD, JPY, KRW }` plus a `useRates()` hook.

Why a context rather than props: `MobileDrawer` sits inside `MobileHeader`,
which is rendered from roughly ten files under the `@mobileHeader` parallel
route. Threading rates as props would touch every one of them. `DesktopShell`
could take props easily, but one mechanism for both shells is simpler than two.

Mounted in `src/app/[locale]/layout.tsx`, wrapping `AppShell`, seeded from
`await getConfig()`. The layout already awaits several request-scoped reads, and
with the hourly cache this adds an API call once an hour rather than per page.

### 6. `src/components/layout/ExchangeRateList.tsx` — new

`DollarIcon` and `YenIcon` are currently copy-pasted into `DesktopFooter`,
`DesktopHeader` and `MobileDrawer`. Adding a won icon would make six duplicated
icon definitions, so the rate row becomes one component instead:

- Reads `useRates()`; takes `variant: "footer" | "menu"`.
- `"footer"` is the dark inline row that lands in the footer's brand column.
  `"menu"` is the light/dark card shared by the desktop menu and the drawer.
- Owns the dollar, yen and won icons; the three local copies are deleted.
- A currency whose rate is `0` is skipped — that is what `getConfig` returns
  when the API call fails. When all three are `0` the component renders
  nothing rather than an empty labelled box.

### 7. `DesktopFooter` — fold the strip in

Delete the `border-b` strip above the main footer body. The rate list moves into
the brand column, below the social icons, under a small "ХАНШ" label:

```
┌──────────── footer ──────────────────────────┐
│ [LOGO]           Машин    Компани   Холбоо   │
│ Тайлбар...       Япон     Бидний    7511…    │
│ ◎ ◎ ◎ ◎          Солонгос Блог      info@    │
│ ─────────────    Бэлэн    Холбоо    Хаяг     │
│ ХАНШ                                         │
│ $3,594  ¥22.5  ₩2.48                         │
├──────────────────────────────────────────────┤
│ © 2026 TJ Car                       Нөхцөл   │
└──────────────────────────────────────────────┘
```

### 8. Translations

Add `header.topbar.rates.krw: "KRW"` to `messages/{mn,en,ru}.json`. The existing
`usd` and `jpy` values are bare tickers, so all three locales share the string.

## Error handling

`getConfig` already swallows failures and returns zeroes. That propagates
naturally: `ExchangeRateList` drops zero-valued currencies and renders nothing
when the whole config is empty, so a dead API costs the site a footer row rather
than a crash. Nothing else in the header or drawer depends on the rates.

## Follow-up: the report price (same day)

`GET /config` also carries `report-price`, and `/report/page.tsx` already read it
— but only for the hero's lookup modal. Three other places quoted 20,000₮ from a
string:

- `ReportJsonLd` hard-coded `price: "20000"` in the Service offer, which is what
  a search result snippet quotes.
- `reportLanding.steps.items.pay.body` spelled the number out in all three
  locales.
- `homeV2.services.report.m1.value` did the same on the `/home-v2` demo.

All three now take the price as a prop from their page, and the two message keys
use `{price, number}` so each locale groups digits its own way. `/report`
computes `effectiveReportPrice` once and hands the same number to the hero, the
JSON-LD and the steps — a promo can no longer move one and leave the others.

Still hard-coded, but rendered by nothing: `reportLanding.hero.badges.price` and
`reportLanding.finalCta.subheading` (only `ReportFinalCta`, which no page
imports), `homeBento.report.priceBadge` (only `BentoGrid`, likewise unused), and
`reportLanding.trustRow.*`, which has no consumer at all.

## Verification

- `tests/Feature/Public/ConfigTest.php` passes in the API repo.
- `npx tsc --noEmit` and the project's lint pass.
- The dev site is loaded and the footer, desktop menu card and mobile drawer are
  screenshotted, confirming three live currencies and no leftover strip.
