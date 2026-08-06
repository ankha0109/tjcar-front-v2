# Google Analytics 4 pageview tracking

**Date:** 2026-08-06
**Status:** approved, ready to implement

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

### Why not `@next/third-parties`

The obvious move is Vercel's `<GoogleAnalytics gaId>` component. Reading its
source (`@next/third-parties@16.2.6`, `dist/google/ga.js`) shows the whole
component is two `<Script>` tags:

```js
gtag('js', new Date());
gtag('config', '<gaId>');
```

It never sends a `page_view` on a client-side navigation. In an App Router SPA
that leaves route-change pageviews to GA4's Enhanced Measurement setting
("Page changes based on browser history events") — a toggle living in the GA
console, outside this repo, that also races Next's `document.title` update.

So the package solves the ten easy lines and none of the hard one. We write the
hard one ourselves and skip the dependency.

### `src/components/analytics/GoogleAnalytics.tsx`

One client component, the only new file.

```
const GA_ID = process.env.NEXT_PUBLIC_GA_ID;
```

Unset → the component returns `null`, and since `NEXT_PUBLIC_*` is inlined at
build time the whole thing is dead-code-eliminated. That is the dev/staging
off-switch.

It renders exactly one tag:

```tsx
<Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive" />
```

**No inline init script.** Everything else is pushed to `window.dataLayer` from
effects, because ordering matters and mixing the two sources cannot guarantee
it. `gtag.js` drains whatever is already queued when it loads, and it drops an
`event` that arrives before its `config`. Two `<Script>` tags plus a hydration
effect gives three writers with no defined order; effects in one component give
a guaranteed one.

The push helper is the same three lines gtag's own snippet uses — a `function`,
not an arrow, so `arguments` is available:

```ts
function push() {
  (window.dataLayer = window.dataLayer || []).push(arguments);
}
```

Two effects, in order:

1. **On mount, once:** `push("js", new Date())` then
   `push("config", GA_ID, { send_page_view: false })`. Turning the automatic
   pageview off is what stops the first load being counted twice.
2. **Keyed on `[pathname, searchParams]`:** `push("event", "page_view", {
   page_location: window.location.href, page_title: document.title })`. This
   fires on mount too, which is where the initial pageview comes from.

`useSearchParams()` opts the subtree out of static rendering, so the effect half
lives in an inner component wrapped in `<Suspense fallback={null}>`. It is
included deliberately: `/japan` and `/japan/brands` keep their filters and
paging in the query string, so without it a visitor paging through auction
results registers a single pageview. The cost is that filter fiddling inflates
the pageview count; for a car-listing site that is closer to the truth than the
alternative.

A module-level `declare global` types `window.dataLayer`.

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

## Testing

Manual, because the assertion is "a request left the browser":

1. `NEXT_PUBLIC_GA_ID` unset → `npm run dev`, confirm no
   `googletagmanager.com` request in the network panel.
2. Set it in `.env.local`, restart, and confirm on first load: one `gtag/js`
   request and one `collect` request with `en=page_view`.
3. Navigate home → `/japan` → a lot detail → back. One further `collect` per
   navigation, each with the right `dl` (page_location).
4. On `/japan`, change a filter. One more `page_view`.
5. Switch locale. `dl` shows the new prefix.

## Risks

- **Ad blockers.** A meaningful share of visitors block `googletagmanager.com`
  outright. GA4 numbers will undercount and that is expected; this is not a
  billing-grade counter.
- **`page_title` staleness.** `document.title` is read in the effect. If Next
  applies a route's metadata after the commit, a pageview can carry the
  previous title. `page_location` is always correct, so reports keyed on path
  are unaffected.
