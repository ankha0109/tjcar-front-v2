# Premium images on the Japan lot gallery — design

**Date:** 2026-08-06
**Scope:** `tjcar-front-v2` only. The backend vertical shipped in `tjcar-api-v2` phase 15.

## Problem

USS lots (`AUCTION_TYPE === "1"`) carry only a handful of AJES photos. The backend can
fetch a much larger premium set through the scraper microservice, and phase 15 exposed
it:

- `POST /api/premium-images` — request a scrape (auth + `balance >= 2,000,000` required)
- `GET /api/premium-images/{uuid}` — poll it
- `GET /api/japan/{id}` — now returns `data.premium_images` (string array, or `null`)

Nothing on the v2 frontend calls any of it, so the feature is dark. v1
(`tjcar-front/src/components/auction/PremiumAuctionGallery.js`) has it working and is
the behavioural reference.

## Non-goals

- Korea (Encar) lots, orders, garage, compare — premium images are Japan/USS only.
- Any change to the balance gate itself. `PremiumGallery` already implements it.
- A "fetch premium images" button. The scrape fires automatically, matching v1.
- `/api/compare` — its `premium_images` is hardcoded `null` server-side (documented
  follow-up in the backend phase-15 plan). Out of scope here.

## What already exists

`src/components/car-detail/PremiumGallery.tsx` owns the USS gate today:

- `locked = isPremium && !(authenticated && balance >= MINIMUM_BALANCE)` → blurred
  teaser with a login / contact CTA.
- unlocked premium → green "handle with care" banner above `<CarGallery>`.

So the gate, the teaser and the banner are done. **Only the scrape half is missing.**

`ServerApi` attaches the Sanctum bearer, so `getAuction()` already receives
`premium_images` server-side for a qualifying customer — a lot scraped earlier needs no
client request at all.

## Design

### Components

| File | Status | Responsibility |
|---|---|---|
| `src/services/premiumImages.ts` | new | `requestPremiumImages(input)` → `POST /premium-images`; `getPremiumImage(uuid)` → `GET /premium-images/{uuid}`. Unwraps the `{data: ...}` envelope, exports `ScrapeRequest` / `ScrapeStatus` types. Follows `src/services/bids.ts`. |
| `src/hooks/usePremiumImages.ts` | new | The state machine: seed → POST → poll → settle. Returns `{ images, status }`. Nothing else touches the endpoints. |
| `src/components/car-detail/PremiumGallery.tsx` | modify | Calls the hook when premium and unlocked; renders the status strip; passes merged images to `CarGallery`. |
| `src/types/featured.ts`, `src/lib/carFixtures.ts` | modify | Add `premium_images: string[] \| null` to `FeaturedCar` / `CarFixture` and map it in `auctionLotToFixture`. |
| `src/components/car-detail/JapanCarDetail.tsx` | modify | Pass the new fields (`premiumImages`, `make`, `model`, `year`, `mileage`, `modelType`, `gradeOrigin`) to `PremiumGallery`. |
| `src/utils/auctionImage.ts` | modify | Restrict the AJES resize suffix to AJES hosts (see below). |
| `messages/{mn,en,ru}.json` | modify | Three new `carDetail.gallery.*` keys. |

### Hook contract

```ts
type UsePremiumImagesInput = {
  /** `isPremium && !locked` as PremiumGallery already computes them. */
  enabled: boolean;
  auctionId: string;
  /** Already-scraped urls from GET /japan/{id}. Skips the request entirely. */
  seed: string[] | null;
  filters: {
    make: string; model: string;
    yearStart?: number; yearEnd?: number;
    mileageStart?: number; mileageEnd?: number;
    modelType?: string; gradeOrigin?: string; lotNumber?: string;
  };
};

type UsePremiumImagesResult = {
  images: string[];                                        // [] until completed
  status: "idle" | "loading" | "completed" | "failed";
};
```

`enabled: false` → `{ images: [], status: "idle" }` and zero network calls. A non-empty
`seed` → `{ images: seed, status: "completed" }`, also zero calls. `seed` of `null` **or
`[]`** falls through to the request path: an empty array means a scrape completed with no
photos, and the backend's dedupe answers that POST immediately with the same empty
`completed` row, so the cost is one round-trip and the UI settles without polling.

### Polling

Built on `@tanstack/react-query`, the project's established poll-until-done pattern
(`src/hooks/useReportProgress.ts`), not hand-rolled timers:

- `useMutation` fires the POST once on mount (guarded by `enabled` + no `seed`).
- `useQuery` on `["premium-images", uuid]` with
  `refetchInterval: (q) => isSettled(q.state.data) ? false : 3_000`.
- Cap the wait at **120 s** — the backend job's own `$timeout`. Past that the UI reports
  failure even though no `failed` row exists yet. v1 gave up at 50 s, which could
  abandon a job that was still running; that is deliberately not carried over.
- React Query unmounts the query with the component, so no manual cleanup is needed.

A POST that 200s with `status: "completed"` (the backend's dedupe hit) short-circuits —
no polling.

Errors: any thrown `ApiError` (401 / 403 / 422 / network) settles as `failed`. The gate
already prevents the 403 path in practice, so no bespoke per-status copy.

### Image host fix

`withImageSize()` currently appends the AJES `&w=320` suffix to every URL that is not
Encar. Premium images are our own S3 objects with no query string, so
`https://s3.../a.jpg` becomes `https://s3.../a.jpg&w=320` — part of the object key, and
a 404. Two hosts must coexist in one gallery, and `CarGallery`'s `sizeVariants` flag is
per-gallery, so it cannot express the mix.

Fix: apply the AJES branch only to AJES hosts (`*.ajes.com`, e.g. `8.ajes.com`) and
return unknown hosts untouched. Existing `sizeVariants={false}` callers (orders, garage)
stay correct — that flag becomes belt-and-braces rather than load-bearing.

### Rendering

Premium urls are prepended, matching v1's `[...premiumImages, ...auctionImages]`:

```tsx
const images = [...premium.images, ...auctionImages];
```

| `status` | UI |
|---|---|
| `idle` | Existing behaviour, unchanged. |
| `loading` | Existing AJES gallery stays on screen. In the banner slot, a thin blue strip with a spinner: `gallery.premiumLoading`. |
| `completed` | Premium urls first in the carousel, plus today's green `gallery.premiumBanner`. |
| `failed` | Thin red strip: `gallery.premiumFailed`. AJES photos remain visible — never a blank gallery. |

New keys in all three locales:

- `carDetail.gallery.premiumLoading` — "Premium зураг татаж байна, түр хүлээнэ үү"
- `carDetail.gallery.premiumFailed` — "Premium зураг татаж чадсангүй. Админд хандана уу"

### Failure modes

| Case | Behaviour |
|---|---|
| Not signed in / balance short | Locked teaser. No request — unchanged. |
| Not a USS lot | Hook disabled. No request. |
| Scrape already done (`premium_images` present) | Rendered immediately, no request. |
| Another customer's scrape in flight | Backend dedupes by `auction_id`; we poll their uuid and show the result. |
| Job fails | Red strip, AJES photos intact. Reloading the page retries (the backend creates a fresh request when the latest one failed). |
| 120 s elapsed | Red strip. The job may still finish; a later page load will pick it up via `premium_images`. |
| Navigate away mid-poll | React Query drops the query on unmount. |

## Verification

The project has no test runner (`package.json` scripts: dev / build / start / lint) and
adding one is out of scope for this change. Verification is therefore:

1. `npx tsc --noEmit`
2. `npm run lint`
3. `npm run build`
4. Manual pass on `npm run dev`, against a real USS lot:
   - signed out → locked teaser, no `/premium-images` call in the network tab;
   - signed in below `MINIMUM_BALANCE` → locked teaser, still no call;
   - signed in above it, lot never scraped → blue strip, POST fires, polling every 3 s,
     photos prepend on completion;
   - reload the same lot → photos present immediately, no POST;
   - premium photo URLs load unmodified (no `&w=320` appended).
