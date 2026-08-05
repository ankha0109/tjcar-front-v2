# Premium Images Gallery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** On a USS (`AUCTION_TYPE === "1"`) Japan lot detail page, automatically fetch the premium photo set for a qualifying customer and prepend it to the gallery.

**Architecture:** A thin service module wraps the two backend endpoints; a React Query hook owns the POST → poll → settle state machine; the existing `PremiumGallery` component (which already implements the balance gate) consumes the hook and renders a status strip. `withImageSize` is narrowed so S3 premium URLs survive alongside AJES URLs in one gallery.

**Tech Stack:** Next.js 16 App Router, TypeScript, `@tanstack/react-query` v5, `next-auth` v5, `next-intl`, Tailwind v4.

**Spec:** `docs/superpowers/specs/2026-08-06-premium-images-design.md`

## Global Constraints

- **No test runner exists in this repo** (`package.json` scripts: `dev`, `build`, `start`, `lint`; no vitest/jest; zero test files). Do NOT add one — that is an explicit out-of-scope decision. Every task verifies with `npx tsc --noEmit` + `npm run lint`, and the final task adds a manual browser pass.
- **i18n:** every new message key goes into ALL THREE of `messages/mn.json`, `messages/en.json`, `messages/ru.json` (project CLAUDE.md rule). `mn` is the default locale.
- **Navigation imports:** use `Link`/`useRouter`/`usePathname` from `@/i18n/navigation`, never `next/link` or `next/navigation` for routing.
- **Client API calls** go through `Api` from `@/services/Api` (proxies via `/api/v1` and attaches the Sanctum bearer server-side). Never `fetch()` the backend directly from a client component.
- **Backend response envelope:** every read returns `{"data": ...}`. There is no `success` key.
- **Scope:** Japan/USS only. Do not touch Korea (`koreaAdapter`, `EncarDetail`), orders, garage or compare beyond the one `premium_images` type change they must satisfy.
- **Commit style:** conventional commits (`feat:`, `fix:`, `refactor:`), one commit per task.

---

## File Structure

| File | Action | Responsibility |
|---|---|---|
| `src/utils/auctionImage.ts` | modify | Restrict the AJES resize suffix to AJES hosts so foreign URLs pass through untouched. |
| `src/types/featured.ts` | modify | Add `premium_images?: string[] \| null` to the raw API lot shape. |
| `src/lib/carFixtures.ts` | modify | Retype `CarFixture.premium_images` to `string[] \| null`; map it in `auctionLotToFixture`. |
| `src/lib/koreaAdapter.ts` | modify | No behaviour change — its `premium_images: null` must still typecheck. |
| `src/services/premiumImages.ts` | create | The two endpoint calls + their types. No React. |
| `src/hooks/usePremiumImages.ts` | create | POST → poll → settle state machine. The only caller of the service. |
| `src/components/car-detail/PremiumGallery.tsx` | modify | Call the hook, render the status strip, prepend premium urls. |
| `src/components/car-detail/JapanCarDetail.tsx` | modify | Pass the lot fields the hook needs down to `PremiumGallery`. |
| `messages/{mn,en,ru}.json` | modify | `premiumLoading` + `premiumFailed` copy. |

Task order is dependency order: 1 (image host) and 2 (types) are independent leaves; 3 depends on 2; 4 depends on 3; 5 depends on 1+2+4.

---

### Task 1: Narrow the AJES resize suffix to AJES hosts

**Files:**
- Modify: `src/utils/auctionImage.ts:41-48`

**Interfaces:**
- Consumes: nothing.
- Produces: `withImageSize(url: string, size: AuctionImageSize): string` — unchanged signature. New behaviour: a URL whose host is neither `ci.encar.com` nor `*.ajes.com` is returned verbatim for every size.

**Why:** `withImageSize` currently appends `&w=320` to every non-Encar URL. AJES URLs have no `?`, and their CDN keys the resizer on that literal `&w=` suffix — so the odd-looking separator is correct and must stay for AJES. Premium images are our own S3 objects: appending `&w=320` to `https://s3.../a.jpg` produces `https://s3.../a.jpg&w=320`, which S3 reads as part of the object key and answers 404. Task 5 puts both hosts in one gallery, and `CarGallery`'s `sizeVariants` flag is per-gallery, so it cannot express the mix.

- [ ] **Step 1: Replace the export in `src/utils/auctionImage.ts`**

Replace lines 33-48 (the `withImageSize` JSDoc and body) with:

```ts
const AJES_HOST_RE = /(^|\.)ajes\.com$/i;

function isAjes(url: string): boolean {
  try {
    return AJES_HOST_RE.test(new URL(url).hostname);
  } catch {
    // Relative or malformed — no resizer applies either way.
    return false;
  }
}

/**
 * Resize a car photo URL to one of the three variants the detail UI uses.
 *
 * AJES CDN: the resizer is keyed to the literal `&w=`/`&h=` suffix even when
 * the URL has no `?` — a standards-correct `?w=320` is ignored and serves the
 * full-size image, so don't "fix" the separator.
 *
 * Any other host is returned untouched. That matters for the premium (scraped)
 * photos, which are plain S3 objects: appending `&w=320` to a URL with no query
 * string makes it part of the object key and the request 404s. The USS gallery
 * mixes AJES and S3 urls in one carousel, so the decision has to be per URL —
 * `CarGallery`'s `sizeVariants` prop is per gallery and cannot express it.
 */
export function withImageSize(url: string, size: AuctionImageSize): string {
  if (url.includes(ENCAR_HOST)) return withEncarSize(url, size);
  if (!isAjes(url)) return url;

  const clean = url.replace(SIZE_PARAM_RE, "").replace(/[?&]+$/, "");
  if (size === "original") return clean;
  if (size === "thumb") return `${clean}&h=50`;
  return `${clean}&w=320`;
}
```

- [ ] **Step 2: Typecheck and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: both clean.

- [ ] **Step 3: Sanity-check the branch behaviour in a node REPL**

Run:

```bash
npx tsx -e '
import { withImageSize } from "./src/utils/auctionImage.ts";
console.log(withImageSize("https://8.ajes.com/imgs/abc", "card"));
console.log(withImageSize("https://s3.ap-northeast-1.amazonaws.com/tjcar-scrapes/a.jpg", "card"));
console.log(withImageSize("https://ci.encar.com/carpicture/x.jpg", "card"));
'
```

Expected output, in order:

```
https://8.ajes.com/imgs/abc&w=320
https://s3.ap-northeast-1.amazonaws.com/tjcar-scrapes/a.jpg
https://ci.encar.com/carpicture/x.jpg?impolicy=heightRate&rh=180&cw=320&ch=180&cg=Center
```

If `npx tsx` is unavailable, skip this step — Task 5's manual pass covers it in the browser (premium photos must load, and their `src` must have no `&w=`).

- [ ] **Step 4: Commit**

```bash
git add src/utils/auctionImage.ts
git commit -m "fix(gallery): only apply the AJES resize suffix to AJES hosts"
```

---

### Task 2: Type `premium_images` as a url list

**Files:**
- Modify: `src/types/featured.ts:44` (add a field before the closing brace)
- Modify: `src/lib/carFixtures.ts:38` (retype), `:142` (map it)

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `FeaturedCar.premium_images?: string[] | null` — the raw `GET /japan/{id}` field.
  - `CarFixture.premium_images: string[] | null` — retyped from `string | null`.
  - `auctionLotToFixture(lot: FeaturedCar): CarFixture` — unchanged signature, now carries `premium_images` through instead of hardcoding `null`.

**Why:** `CarFixture` already declares `premium_images: string | null`, but the type is wrong (the API returns an array of urls, not a `#`-joined string) and all three construction sites hardcode `null`, so the field has never carried data. Only the Japan auction adapter gets a real value; the in-stock car adapter (`carFixtures.ts:99`) and `koreaAdapter.ts:92` keep `null` and only need to keep typechecking.

- [ ] **Step 1: Add the field to the raw API type**

In `src/types/featured.ts`, insert before the closing `};` (after the `INFO?: string;` line):

```ts
  /**
   * Completed premium (USS scraper) photo urls for this lot, or null when no
   * scrape has finished. Present on `GET /japan/{id}` only — the `/japan` list
   * and `/compare` never populate it.
   */
  premium_images?: string[] | null;
```

- [ ] **Step 2: Retype the fixture field**

In `src/lib/carFixtures.ts`, change line 38 from:

```ts
  premium_images: string | null;
```

to:

```ts
  /** Completed premium (USS) photo urls. Only ever non-null on Japan lots. */
  premium_images: string[] | null;
```

- [ ] **Step 3: Map it in the auction adapter**

In `src/lib/carFixtures.ts`, inside `auctionLotToFixture`, change line 142 from:

```ts
    premium_images: null,
```

to:

```ts
    premium_images: lot.premium_images ?? null,
```

Leave the other two `premium_images: null` sites (`carFixtures.ts:99`, `koreaAdapter.ts:92`) exactly as they are — an in-stock car and an Encar listing have no premium set.

- [ ] **Step 4: Typecheck and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: both clean. A failure here means some consumer was treating `premium_images` as a string — there are none today, so this should pass first time.

- [ ] **Step 5: Commit**

```bash
git add src/types/featured.ts src/lib/carFixtures.ts
git commit -m "feat(japan): carry premium_images through the lot fixture as a url list"
```

---

### Task 3: `premiumImages` service module

**Files:**
- Create: `src/services/premiumImages.ts`

**Interfaces:**
- Consumes: `Api` from `@/services/Api` (`Api.post<T>(url, body)`, `Api.get<T>(url, params?)`), `ApiError` from the same module.
- Produces:
  - `type ScrapeStatus = "pending" | "processing" | "completed" | "failed"`
  - `type ScrapeRequest = { uuid: string; auction_id: string; status: ScrapeStatus; status_label: string; image_urls?: string[]; error_message?: string; completed_at: string | null; created_at: string | null }`
  - `type PremiumImageFilters = { make: string; model: string; yearStart?: number; yearEnd?: number; mileageStart?: number; mileageEnd?: number; modelType?: string; gradeOrigin?: string; lotNumber?: string }`
  - `requestPremiumImages(auctionId: string, filters: PremiumImageFilters): Promise<ScrapeRequest>`
  - `getPremiumImage(uuid: string): Promise<ScrapeRequest>`
  - `isSettled(request: ScrapeRequest | undefined): boolean`

**Backend contract** (from `tjcar-api-v2` phase 15, documented in its `docs/frontend/premium-images.md`):

- `POST /premium-images` body `{ auction_id, make, model, ...optional filters }` → `{"data": ScrapeRequest}`. 201 for a newly created request, 200 when it deduped onto an existing one. 403 `{"message": "Insufficient balance."}` below the minimum balance; 422 on validation failure.
- `GET /premium-images/{uuid}` → `{"data": ScrapeRequest}`; 404 for an unknown uuid.
- `image_urls` is present only when `status === "completed"`; `error_message` only when `status === "failed"`.

- [ ] **Step 1: Create `src/services/premiumImages.ts`**

```ts
import Api from "./Api";

/**
 * Premium (USS) auction photos — tjcar-api-v2 `Customer\PremiumImageController`.
 *
 * Client-side on purpose: a scrape runs for up to two minutes while the customer
 * watches the lot page, so these go through `Api`, which proxies via /api/v1 and
 * attaches the Sanctum bearer server-side.
 *
 * Both endpoints sit behind `auth:sanctum`, and the POST additionally requires a
 * wallet balance at or above the configured minimum — the caller is responsible
 * for not asking when the gate is shut (see `PremiumGallery`).
 */

export type ScrapeStatus = "pending" | "processing" | "completed" | "failed";

export type ScrapeRequest = {
  uuid: string;
  auction_id: string;
  status: ScrapeStatus;
  /** Localised label the API renders for the status. */
  status_label: string;
  /** Present only when `status === "completed"`. */
  image_urls?: string[];
  /** Present only when `status === "failed"`. */
  error_message?: string;
  completed_at: string | null;
  created_at: string | null;
};

export type PremiumImageFilters = {
  make: string;
  model: string;
  yearStart?: number;
  yearEnd?: number;
  mileageStart?: number;
  mileageEnd?: number;
  modelType?: string;
  gradeOrigin?: string;
  lotNumber?: string;
};

/**
 * POST /premium-images — ask for this lot's premium photos.
 *
 * The backend dedupes globally by `auction_id`: an in-flight or completed
 * request for the same lot (whoever started it) comes back as-is with 200
 * instead of queueing a second scrape, so calling this is cheap and idempotent
 * in practice. Only a lot whose latest attempt FAILED starts a fresh job.
 */
export async function requestPremiumImages(
  auctionId: string,
  filters: PremiumImageFilters,
): Promise<ScrapeRequest> {
  const res = await Api.post<{ data: ScrapeRequest }>("/premium-images", {
    auction_id: auctionId,
    ...filters,
  });
  return res.data;
}

/** GET /premium-images/{uuid} — poll one request. 404s once the uuid is unknown. */
export async function getPremiumImage(uuid: string): Promise<ScrapeRequest> {
  const res = await Api.get<{ data: ScrapeRequest }>(`/premium-images/${uuid}`);
  return res.data;
}

/** A request that will never change again — stop polling. */
export function isSettled(request: ScrapeRequest | undefined): boolean {
  return request?.status === "completed" || request?.status === "failed";
}
```

- [ ] **Step 2: Typecheck and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: both clean.

- [ ] **Step 3: Commit**

```bash
git add src/services/premiumImages.ts
git commit -m "feat(premium-images): add the scrape request service module"
```

---

### Task 4: `usePremiumImages` hook

**Files:**
- Create: `src/hooks/usePremiumImages.ts`

**Interfaces:**
- Consumes: `requestPremiumImages`, `getPremiumImage`, `isSettled`, `PremiumImageFilters`, `ScrapeRequest` from `@/services/premiumImages` (Task 3).
- Produces:
  - `type UsePremiumImagesInput = { enabled: boolean; auctionId: string; seed: string[] | null; filters: PremiumImageFilters }`
  - `type PremiumImagesPhase = "idle" | "loading" | "completed" | "failed"`
  - `type UsePremiumImagesResult = { images: string[]; status: PremiumImagesPhase }`
  - `usePremiumImages(input: UsePremiumImagesInput): UsePremiumImagesResult`
  - `PREMIUM_IMAGES_KEY: readonly ["premium-images"]`

**Why React Query rather than timers:** `src/hooks/useReportProgress.ts` already establishes the project's poll-until-done pattern — a `useQuery` whose `refetchInterval` returns `false` once the payload settles. It unmounts with the component, so there is no manual `clearTimeout` bookkeeping and no "setState after unmount" hazard.

**Timing:** poll every 3 s and give up after 120 s. 120 s is the backend job's own `$timeout`, so the UI stops exactly when the job can no longer be running. (v1 gave up at 50 s, which could abandon a job that was still working — deliberately not carried over.)

- [ ] **Step 1: Create `src/hooks/usePremiumImages.ts`**

```ts
"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  getPremiumImage,
  isSettled,
  requestPremiumImages,
  type PremiumImageFilters,
  type ScrapeRequest,
} from "@/services/premiumImages";

export const PREMIUM_IMAGES_KEY = ["premium-images"] as const;

/** How often to ask whether the scrape has finished. */
const POLL_MS = 3_000;
/** Matches ScrapeAuctionImages::$timeout on the API — past this it cannot still be running. */
const GIVE_UP_MS = 120_000;

export type PremiumImagesPhase = "idle" | "loading" | "completed" | "failed";

export type UsePremiumImagesInput = {
  /** `isPremium && !locked`, as PremiumGallery already computes them. */
  enabled: boolean;
  auctionId: string;
  /** Urls already delivered by GET /japan/{id}. Non-empty means: ask for nothing. */
  seed: string[] | null;
  filters: PremiumImageFilters;
};

export type UsePremiumImagesResult = {
  /** Premium urls, or [] until they arrive. */
  images: string[];
  status: PremiumImagesPhase;
};

/**
 * Drives the premium (USS) photo scrape for one auction lot.
 *
 * Three ways this settles, cheapest first:
 *
 *  1. `seed` is non-empty — the API already returned completed photos with the
 *     lot itself. Nothing is requested.
 *  2. The POST comes back `completed` — the backend deduped onto a finished
 *     request for the same `auction_id`. No polling.
 *  3. The POST comes back `pending`/`processing` — poll its uuid until it
 *     settles or {@link GIVE_UP_MS} elapses.
 *
 * A `seed` of `[]` is NOT treated as done: an empty array means a scrape
 * finished and found no photos, and re-asking costs one round-trip that the
 * backend answers from the same completed row.
 *
 * Any error — 401, 403, 422, network — settles as `failed`. The caller is
 * expected to keep the ordinary auction photos on screen regardless, so a
 * failure degrades to "no extra photos", never to a blank gallery.
 */
export function usePremiumImages({
  enabled,
  auctionId,
  seed,
  filters,
}: UsePremiumImagesInput): UsePremiumImagesResult {
  const seeded = (seed?.length ?? 0) > 0;
  const shouldRun = enabled && !seeded;

  const [uuid, setUuid] = useState<string | null>(null);
  const [postResult, setPostResult] = useState<ScrapeRequest | null>(null);
  const [postFailed, setPostFailed] = useState(false);
  const [gaveUp, setGaveUp] = useState(false);
  /** The POST is fire-once per mounted lot; a re-render must never repeat it. */
  const requested = useRef(false);

  useEffect(() => {
    if (!shouldRun || requested.current) return;
    requested.current = true;

    let cancelled = false;

    requestPremiumImages(auctionId, filters)
      .then((request) => {
        if (cancelled) return;
        setPostResult(request);
        if (!isSettled(request)) setUuid(request.uuid);
      })
      .catch(() => {
        if (!cancelled) setPostFailed(true);
      });

    return () => {
      cancelled = true;
    };
    // `filters` is rebuilt each render by the caller; the lot is what identifies
    // the work, and the effect is fire-once anyway via `requested`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldRun, auctionId]);

  const pollQuery = useQuery({
    queryKey: [...PREMIUM_IMAGES_KEY, uuid],
    queryFn: () => getPremiumImage(uuid as string),
    enabled: uuid !== null && !gaveUp,
    refetchInterval: (query) => (isSettled(query.state.data) ? false : POLL_MS),
    refetchOnWindowFocus: true,
    retry: false,
  });

  // Stop pretending after the job's own timeout has passed.
  useEffect(() => {
    if (uuid === null) return;
    const timer = setTimeout(() => setGaveUp(true), GIVE_UP_MS);
    return () => clearTimeout(timer);
  }, [uuid]);

  if (seeded) {
    return { images: seed as string[], status: "completed" };
  }

  if (!enabled) {
    return { images: [], status: "idle" };
  }

  const settled = pollQuery.data ?? (isSettled(postResult) ? postResult : null);

  if (settled?.status === "completed") {
    return { images: settled.image_urls ?? [], status: "completed" };
  }

  if (postFailed || gaveUp || pollQuery.isError || settled?.status === "failed") {
    return { images: [], status: "failed" };
  }

  return { images: [], status: "loading" };
}
```

- [ ] **Step 2: Typecheck and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: both clean. The one `eslint-disable-next-line react-hooks/exhaustive-deps` is deliberate and commented — do not remove it, and do not add others.

- [ ] **Step 3: Commit**

```bash
git add src/hooks/usePremiumImages.ts
git commit -m "feat(premium-images): add the scrape request and polling hook"
```

---

### Task 5: Wire the hook into the gallery

**Files:**
- Modify: `src/components/car-detail/PremiumGallery.tsx` (whole component)
- Modify: `src/components/car-detail/JapanCarDetail.tsx:260-265` (the `<PremiumGallery>` call)
- Modify: `messages/mn.json` (near line 1601), `messages/en.json` (near 1604), `messages/ru.json` (near 1616)

**Interfaces:**
- Consumes: `usePremiumImages`, `UsePremiumImagesResult` from `@/hooks/usePremiumImages` (Task 4); `CarFixture.premium_images` (Task 2); `withImageSize`'s host-aware behaviour (Task 1).
- Produces: `PremiumGallery` gains eight props — `auctionId: string`, `premiumImages: string[] | null`, `make: string`, `model: string`, `year: string`, `mileage: string`, `modelType: string`, `gradeOrigin: string`. Existing props (`images`, `alt`, `isPremium`, `lot`) are unchanged.

> **`auctionId` and `lot` are NOT the same value.** `auction_id` is the lot's opaque
> `ID` (e.g. `5GTWjf9gt05B3Jb`) — the key the backend dedupes scrapes by and the same id
> `GET /japan/{id}` is fetched with. `lot` is the human auction lot number (e.g. `30143`),
> which travels separately as the `lotNumber` scrape filter and is printed on the locked
> teaser. v1 wires them as `auctionId={auction.ID}` / `lotNumber={auction.LOT}`; passing
> `LOT` as `auction_id` would create scrape rows that `AuctionController@show` can never
> find again.

- [ ] **Step 1: Add the two message keys to all three locales**

In `messages/mn.json`, inside `carDetail.gallery`, directly after the `"premiumBanner"` line:

```json
      "premiumLoading": "Premium зураг татаж байна, түр хүлээнэ үү",
      "premiumFailed": "Premium зураг татаж чадсангүй. Админд хандана уу",
```

In `messages/en.json`, same position:

```json
      "premiumLoading": "Fetching premium photos, please wait",
      "premiumFailed": "Could not fetch the premium photos. Please contact an administrator",
```

In `messages/ru.json`, same position:

```json
      "premiumLoading": "Загружаем premium-фото, подождите",
      "premiumFailed": "Не удалось загрузить premium-фото. Обратитесь к администратору",
```

- [ ] **Step 2: Rewrite `src/components/car-detail/PremiumGallery.tsx`**

Replace the file entirely with:

```tsx
"use client";

import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { useWalletBalance } from "@/hooks/useWalletBalance";
import { usePremiumImages } from "@/hooks/usePremiumImages";
import { MINIMUM_BALANCE } from "@/lib/bidConfig";
import { withImageSize } from "@/utils/auctionImage";
import BrandButton from "@/components/ui/BrandButton";
import CarGallery from "./CarGallery";

type Props = {
  images: string[];
  alt: string;
  /** AUCTION_TYPE === "1" — a paid USS (premium) lot. */
  isPremium: boolean;
  /** Human auction lot number — shown on the locked teaser, sent as `lotNumber`. */
  lot: string;
  /** The lot's opaque `ID` — what the scrape is keyed by. NOT the lot number. */
  auctionId: string;
  /** Completed premium urls already delivered with the lot, if any. */
  premiumImages: string[] | null;
  make: string;
  model: string;
  year: string;
  mileage: string;
  modelType: string;
  gradeOrigin: string;
};

/** The scraper takes numbers; the lot fixture stringifies everything. */
function num(value: string): number | undefined {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

/**
 * Gallery with the USS premium gate. Premium (AUCTION_TYPE "1") lots are a paid
 * source: their photos are only viewable by a signed-in customer whose wallet
 * balance clears {@link MINIMUM_BALANCE}. Otherwise the gallery is replaced with
 * a locked teaser (blurred first frame + how to unlock).
 *
 * For a customer who IS through the gate, the extra premium photo set is fetched
 * on mount — no button, matching v1 — and prepended to the carousel when it
 * lands. The auction's own photos stay on screen throughout, so a slow or failed
 * scrape costs a status strip, never the gallery.
 */
export default function PremiumGallery({
  images,
  alt,
  isPremium,
  lot,
  auctionId,
  premiumImages,
  make,
  model,
  year,
  mileage,
  modelType,
  gradeOrigin,
}: Props) {
  const t = useTranslations("carDetail");
  const { status } = useSession();
  const { balance } = useWalletBalance();
  const pathname = usePathname();

  const deposited = status === "authenticated" && balance >= MINIMUM_BALANCE;
  const locked = isPremium && !deposited;

  const premium = usePremiumImages({
    enabled: isPremium && !locked,
    auctionId,
    seed: premiumImages,
    filters: {
      make,
      model,
      yearStart: num(year),
      yearEnd: num(year),
      mileageStart: num(mileage),
      mileageEnd: num(mileage),
      modelType: modelType || undefined,
      gradeOrigin: gradeOrigin || undefined,
      lotNumber: lot || undefined,
    },
  });

  if (locked) {
    const teaser = images[0] ? withImageSize(images[0], "card") : undefined;
    return (
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-neutral-900 lg:rounded-2xl">
        {teaser && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={teaser}
            alt=""
            aria-hidden
            className="h-full w-full scale-110 object-cover opacity-25 blur-lg"
          />
        )}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white ring-1 ring-white/20">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <rect x="3" y="11" width="18" height="11" rx="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </span>
          <h3 className="text-[15px] font-semibold text-white">
            {t("gallery.premiumLockedTitle")}
          </h3>
          <p className="max-w-md text-[13px] leading-relaxed text-neutral-300">
            {t("gallery.premiumLockedBody")}
          </p>
          <div className="mt-1 flex items-center gap-2">
            {status !== "authenticated" ? (
              <Link
                href={`/auth/login?callbackUrl=${encodeURIComponent(pathname)}`}
              >
                <BrandButton size="middle">{t("bid.login")}</BrandButton>
              </Link>
            ) : (
              <Link href="/dashboard">
                <BrandButton size="middle">{t("bid.contact")}</BrandButton>
              </Link>
            )}
          </div>
          <p className="text-[12px] text-neutral-400">
            LOT: {lot || "-"} · {t("gallery.premiumContactLabel")}{" "}
            {t("gallery.premiumPhone")}
          </p>
        </div>
      </div>
    );
  }

  // Premium photos lead: they are the reason a customer paid to see this lot.
  const allImages = [...premium.images, ...images];

  return (
    <div className="flex flex-col gap-3">
      {isPremium && premium.status === "loading" && (
        <div className="mx-3 flex items-center gap-2 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 lg:mx-0 dark:border-blue-900/50 dark:bg-blue-950/30">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="shrink-0 animate-spin text-blue-600 dark:text-blue-400" aria-hidden>
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
          <span className="text-[12px] leading-snug text-blue-700 dark:text-blue-300">
            {t("gallery.premiumLoading")}
          </span>
        </div>
      )}

      {isPremium && premium.status === "failed" && (
        <div className="mx-3 flex items-center gap-2 rounded-lg border border-red-100 bg-red-50 px-3 py-2 lg:mx-0 dark:border-red-900/50 dark:bg-red-950/30">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-red-600 dark:text-red-400" aria-hidden>
            <circle cx="12" cy="12" r="10" />
            <path d="m15 9-6 6M9 9l6 6" />
          </svg>
          <span className="text-[12px] leading-snug text-red-700 dark:text-red-300">
            {t("gallery.premiumFailed")}
          </span>
        </div>
      )}

      {isPremium && premium.status === "completed" && (
        <div className="mx-3 flex items-center gap-2 rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 lg:mx-0 dark:border-emerald-900/50 dark:bg-emerald-950/30">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden>
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <path d="m9 11 3 3L22 4" />
          </svg>
          <span className="text-[12px] leading-snug text-emerald-700 dark:text-emerald-300">
            {t("gallery.premiumBanner")}
          </span>
        </div>
      )}

      <CarGallery images={allImages} alt={alt} />
    </div>
  );
}
```

Note the one behaviour change to the unlocked branch: the green banner now renders only once photos have actually arrived (`status === "completed"`), instead of on every premium lot. A lot that is still scraping shows the blue strip, and a failed one shows the red strip — never two strips at once.

- [ ] **Step 3: Pass the new props from `JapanCarDetail`**

In `src/components/car-detail/JapanCarDetail.tsx`, replace the `<PremiumGallery ... />` block (around line 260) with:

```tsx
          <PremiumGallery
            images={images}
            alt={title}
            isPremium={car.AUCTION_TYPE === "1"}
            lot={car.LOT}
            auctionId={car.ID}
            premiumImages={car.premium_images}
            make={car.MARKA_NAME}
            model={car.MODEL_NAME}
            year={car.YEAR}
            mileage={car.MILEAGE}
            modelType={car.KUZOV}
            gradeOrigin={car.RATE}
          />
```

- [ ] **Step 4: Typecheck, lint and build**

Run: `npx tsc --noEmit && npm run lint && npm run build`
Expected: all three clean.

- [ ] **Step 5: Manual browser pass**

Start the dev server (`npm run dev`, port 2500) and open a real USS lot (`AUCTION_TYPE === "1"`) at `/mn/japan/{id}`. With the network tab open, confirm each of:

- [ ] Signed out → blurred locked teaser; NO request to `/premium-images`.
- [ ] Signed in with balance below 2,000,000 → still the locked teaser; still no request.
- [ ] Signed in with balance at or above 2,000,000, on a lot never scraped → blue "татаж байна" strip, one `POST /api/v1/premium-images`, then `GET /api/v1/premium-images/{uuid}` every ~3 s. The AJES photos stay visible the whole time.
- [ ] When it completes → premium photos appear FIRST in the carousel, strip turns green.
- [ ] Reload the same lot → photos are there immediately, and there is NO `POST /premium-images` (the seed path).
- [ ] Inspect a premium `<img src>` — it must be the plain S3 url with no `&w=320` appended (Task 1).
- [ ] Open a NON-premium Japan lot (`AUCTION_TYPE !== "1"`) → no strip, no request, gallery unchanged.
- [ ] Navigate away mid-poll → no further `/premium-images` requests in the network tab.

- [ ] **Step 6: Commit**

```bash
git add src/components/car-detail/PremiumGallery.tsx \
        src/components/car-detail/JapanCarDetail.tsx \
        messages/mn.json messages/en.json messages/ru.json
git commit -m "feat(japan): fetch and show premium USS photos on the lot gallery"
```

---

## Definition of Done

- [ ] All Task 1–5 checkboxes ticked.
- [ ] `npx tsc --noEmit`, `npm run lint` and `npm run build` all clean.
- [ ] Every manual check in Task 5 Step 5 passes.
- [ ] `premiumLoading` and `premiumFailed` exist in all three of `messages/{mn,en,ru}.json`.
- [ ] No test framework was added; no new runtime dependency was added.
- [ ] Korea, orders, garage and compare galleries are visually unchanged.
