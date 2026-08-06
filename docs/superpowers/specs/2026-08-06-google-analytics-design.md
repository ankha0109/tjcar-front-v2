# Google Analytics 4 pageview tracking

**Date:** 2026-08-06
**Status:** implemented. Revised after verification — see "What the first design
got wrong".

## Problem

The site has no analytics. Nobody knows how many people look at a lot, which
locale they browse in, or whether the Japan filters get used.

The v1 frontend (`~/Projects/Front/tjcar-front`) was supposed to have it, but
never did:

```js
// src/app/layout.js:95
{/* <GoogleAnalytics gaId="G-NZPS67G2NB" /> */}
```

Fetching `https://tjcar.mn/` confirms it — the production HTML references no
host other than `cdn.tjcar.mn`. No gtag, no Tag Manager, no pixel. The GA4
property `G-NZPS67G2NB` exists but has never received a hit, so pointing v2 at
it mixes nothing.

Two other third-party pieces sit in v1, both also dead, and neither is in scope
here:

- `CustomChat` from `react-facebook` — imported in `DesktopLayout.js:7`, never
  rendered. v2 already has `AiChatWidget` in that corner of the screen.
- The Facebook page-plugin iframe in `FacebookPageModal.js` — commented out at
  its call site.

(The Google Maps embed on v1's contact page is a real, live third-party iframe,
but v2 has no contact page yet. Out of scope.)

## Goals

1. Every page load and every client-side route change reaches GA4.
2. The measurement ID is configuration, not code, and analytics stays off in
   local development.
3. No new npm dependency.

## Non-goals

- **No custom events.** No car-view, search, bid, wishlist or chat tracking.
  Pageviews only.
- **No Google Tag Manager.** GA4 direct.
- **No Meta Pixel, Hotjar, Clarity or chat widget.**
- **No cookie-consent banner.** Not required for the Mongolian market, and
  adding one is a separate product decision.

## Design

### `src/components/analytics/GoogleAnalytics.tsx`

One component, the only new file, and a server component — it has no state and
no hooks. Its whole body is the standard gtag snippet behind an env check:

```tsx
const GA_ID = process.env.NEXT_PUBLIC_GA_ID;
if (!GA_ID) return null;
```

`NEXT_PUBLIC_*` is inlined at build time, so an unset ID removes the tag from
the bundle entirely rather than merely skipping it at runtime. That is the
dev/staging off-switch.

It renders two `afterInteractive` `<Script>` tags: the `gtag/js` loader, and the
inline init that declares `window.dataLayer`, defines `gtag()` and calls
`gtag('js', …)` + `gtag('config', GA_ID)`. `send_page_view` is left at its
default, so the config call itself sends the first pageview.

**Route changes are not tracked from React.** gtag.js watches browser history
events on its own — that is GA4 Enhanced Measurement's "Page changes based on
browser history events", on by default — and sends a `page_view` for every
client-side navigation without help. This file therefore depends on that data
stream setting staying on; turning it off would leave only the initial pageview.

### Why not `@next/third-parties`

Vercel's `<GoogleAnalytics gaId>` does the same thing in the same way — its
source (`@next/third-parties@16.2.6`, `dist/google/ga.js`) is two `<Script>`
tags and the same `js` + `config` pair. Our version is fifteen lines and carries
a comment explaining the Enhanced Measurement dependency, which is the part
worth writing down. Adding a package to save fifteen lines is not a trade worth
making, and Goal 3 rules it out anyway.

### Mount point

`src/app/[locale]/layout.tsx`, inside `<body>` alongside `<ScrollState />` and
`<ScrollToTop />`. The root `src/app/layout.tsx` is a pass-through with no
`<body>`, so the locale layout is the only place it can go.

Because every route is locale-prefixed, `page_location` carries `/mn/…`,
`/en/…` or `/ru/…` and GA breaks traffic down by language for free.

### Configuration

```
# .env.production
NEXT_PUBLIC_GA_ID=G-NZPS67G2NB
```

`.env*` is gitignored, so this file is not in the repo — the deploy host needs
the variable set there as well, or the built bundle ships with GA compiled out.

`.env.local` gets the key as a commented-out line documenting the switch;
leaving it unset keeps `localhost:2500` out of the report.

## What the first design got wrong

The design this file originally carried sent the `page_view` itself, from an
effect keyed on `usePathname()` and `useSearchParams()`, with
`send_page_view: false` to stop the initial hit being counted twice. It was
built, and then measured with a CDP driver that recorded every request to
`googletagmanager.com` across a six-navigation walk of the app.

It sent **ten** hits for six navigations. Dumping `window.dataLayer` located the
extra ones: the queue held exactly one `page_view` per navigation — ours — while
the network showed two `/collect` requests. The second came from gtag.js itself.

`send_page_view: false` suppresses only the **initial** pageview. It does
nothing to the history-event listener, which keeps firing on every client-side
navigation. Two independent trackers, one page.

Removing the manual half took `useSearchParams`, its `<Suspense>` boundary, the
`"use client"` directive and the effect-ordering argument with it. The same walk
now sends six hits for six navigations.

The one thing the manual version would have done better is `page_title`: gtag
fires before Next commits the new title, so a route change reports the title of
the page being left. `page_location` is always correct, so anything keyed on the
path is unaffected. The measured alternative was not better — our own effect
sent an **empty** title, because at the moment it ran `document.title` had been
cleared and not yet replaced.

The alternative to living with this is turning "Page changes based on browser
history events" off in the GA4 data stream and going back to manual tracking.
That trades a stale title for a console setting no one can see from the repo,
and it silently double-counts the moment someone re-enables it.

## Verification

Driven headlessly through CDP, recording every `googletagmanager.com` request:

| Step | Expected |
|---|---|
| `NEXT_PUBLIC_GA_ID` unset | zero requests; `window.dataLayer` undefined |
| Initial load `/mn` | one `page_view`, `dl=…/mn` |
| SPA click to `/mn/japan` | one |
| Filter change (`?page=2`) | one, query string included |
| Open a lot detail | one |
| Browser Back | one |
| Language switch to `/en` | one, `dl=…/en/japan` |

Total: six navigations, six hits. gtag delivers each a beat after the history
event, so a hit lands one step later than the action that caused it — count the
totals, not the per-step alignment.

## Risks

- **Enhanced Measurement is load-bearing.** Route-change pageviews come from the
  GA4 data stream setting, not from this repo. If it is switched off, only full
  page loads are counted and nothing in the codebase will say why.
- **`page_title` lags by one page on route changes.** Reports keyed on path are
  unaffected.
- **Ad blockers.** A meaningful share of visitors block `googletagmanager.com`
  outright. GA4 numbers will undercount and that is expected; this is not a
  billing-grade counter.
