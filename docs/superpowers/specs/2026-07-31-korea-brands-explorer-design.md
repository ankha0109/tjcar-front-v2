# Korea brands explorer (`/korea/brands`)

## Goal

Give the Korea (Encar) catalogue the same manufacturers explorer that
`/japan/brands` already provides: a two-level browse — pick a brand on the
left, see its models on the right, click through to the filtered listing page.

## Why the Japan page can't just be reused as-is

`BrandsExplorer` is currently welded to Japan:

- reads the `japanBrands` translation namespace
- ranks with `TOP_JAPAN_MAKES`
- expects a complete `BrandsCatalog` (`brands[]` + `modelsByBrand` map) fetched
  server-side
- builds `/japan?marka=…&model=…` hrefs
- treats the brand name as both the identity and the display label

Korea differs on every one of those points. The decisive one is data shape:
Japan's `/filters` + `/filters/models` return the **whole** brand→model map in
one cached call, while Korea's only model endpoint is per-brand
(`GET /korea/models?brand=<slug>`). There is no Korea catalogue endpoint.

## Data sources (both already exist — no backend work)

| Need | Source |
| --- | --- |
| Brands | `KOREA_BRANDS` in `src/types/korea.ts` — 21 static `{ slug, label }` pairs mirroring the backend's `EncarListingService::BRANDS`. An unknown slug is a 422. |
| Models | `useKoreaModels(brand)` in `src/hooks/useKoreaModels.ts` → `GET /korea/models?brand=` → `{ name, english, count }[]`, backend-cached ~1h. |
| Listing query contract | `/korea?brand=<slug>&model=<encar name>` (see `koreaFiltersToQuery`). |

## Decisions

### Models load lazily, per brand (client)

The page server-renders the 21-brand list instantly with zero network calls;
models fetch on brand select through the existing `useKoreaModels` hook.

Rejected alternatives: fanning out 21 server-side requests (slow first paint on
a cold cache, since `/korea` is a real-time Encar proxy), and adding a
`/korea/brands` catalogue endpoint to the Laravel API (cleanest long-term, but
blocks this work on backend changes).

Accepted cost: models are absent from the initial HTML, so model names are not
indexable on this page, and each brand select shows a brief loading state.

### `BrandsExplorer` becomes a presentational shell with two adapters

| File | Responsibility |
| --- | --- |
| `src/components/brands/BrandsExplorer.tsx` | UI only. No routing or data knowledge. |
| `src/components/brands/JapanBrandsExplorer.tsx` | `BrandsCatalog` → shell props (synchronous) |
| `src/components/brands/KoreaBrandsExplorer.tsx` | `KOREA_BRANDS` + `useKoreaModels` → shell props (asynchronous) |

Shell contract:

```ts
type BrandItem = { key: string; label: string; logo?: string };
type ModelItem = { value: string; label: string; count?: number };

type Props = {
  brands: BrandItem[];
  featuredKeys: string[];
  selected: string;
  onSelect: (key: string) => void;
  models: ModelItem[];
  modelsLoading?: boolean;
  brandHref: (key: string) => string;
  modelHref: (brand: string, model: string) => string;
  namespace: "japanBrands" | "koreaBrands";
};
```

Selection state — reading `useSearchParams`, resolving the requested brand,
writing the choice back to the URL — stays in each **adapter**, not the shell.
The Korea adapter cannot run its models query without owning `selected`, so
pushing that responsibility down would force the shell to call the hook and
re-couple it to a domain. The shell only invokes `onSelect` and, below `lg`,
scrolls the models pane into view.

The shell keeps the existing layout verbatim: sticky brand sidebar with a
search input, featured group then A–Z groups (`groupByInitial`), and a models
pane grouped by first letter. It renders the `unavailable` empty state whenever
`brands` is empty — generic behaviour that only Japan can actually trigger.

`featuredKeys` holds brand keys the shell matches exactly. Resolving the
curated `TOP_JAPAN_MAKES` names to real `/filters` brand values via `norm()`
stays in the Japan adapter; the Korea adapter passes the nine featured slugs
straight through.

### Model rows show a count

When `ModelItem.count` is present, render it right-aligned beside the name in a
muted tone, thousands-separated via `Intl.NumberFormat`. The Japan adapter
passes no `count`, so `/japan/brands` renders exactly as it does today.

The Korea label is `english ?? name`, but `modelHref` always carries the
Korean `name` — the `/korea` filter matches that exact string.

### Brand logos gain an override

`brandLogoUrl` derives the carlogos.org slug from a display name. Nineteen of
the 21 Korea brands resolve correctly; two do not:

- `Renault Korea` → must use `Renault`
- `KG Mobility` → must use `SsangYong` (the CDN has no post-rename logo)

Add an optional `logo` field to `KOREA_BRANDS` entries. `CarSearchSection`'s
`FEATURED_KOREA_MAKES` currently carries a duplicate of exactly this mapping
for its nine featured makes — delete that duplicate and read from
`KOREA_BRANDS`, so the twelve non-featured brands get correct logos too.

## Files touched

**New**

- `src/app/[locale]/korea/brands/page.tsx` — server component. `setRequestLocale`,
  `generateMetadata` from `koreaBrands.metadata`, resolves `?brand=` against
  `KOREA_BRANDS` and defaults to `hyundai`. No data fetching.
- `src/app/[locale]/korea/brands/loading.tsx` — mirrors the Japan skeleton.
- `src/components/brands/JapanBrandsExplorer.tsx`
- `src/components/brands/KoreaBrandsExplorer.tsx`

**Changed**

- `src/components/brands/BrandsExplorer.tsx` — reduced to the shell.
- `src/app/[locale]/japan/brands/page.tsx` — renders `JapanBrandsExplorer`.
- `src/types/korea.ts` — optional `logo` on `KOREA_BRANDS` entries.
- `src/components/home/CarSearchSection.tsx` — `FEATURED_KOREA_MAKES` drops its
  `logo` field and reads from `KOREA_BRANDS`; `BROWSE_ALL_HREF.korea` changes
  from `/korea` to `/korea/brands`.
- `messages/{mn,en,ru}.json` — new `koreaBrands` namespace with the same keys as
  `japanBrands`, Korea-appropriate copy, added to all three locales.

## Error and empty states

- Unknown or missing `?brand=` → falls back to `hyundai`. `KOREA_BRANDS` is
  static, so the brand list can never be empty and the Japan page's
  "catalogue unavailable" state has no Korea equivalent.
- `useKoreaModels` pending → skeleton rows in the models pane.
- `useKoreaModels` errored or returned an empty array → the existing
  `noModels` empty state. A failed fetch is not distinguished from a genuinely
  empty brand; both are rare and the recovery is the same (pick another brand
  or reload).

## Verification

- `/mn/korea/brands`, `/en/korea/brands`, `/ru/korea/brands` render the brand
  list server-side with Hyundai preselected.
- Selecting a brand updates `?brand=`, is reload- and share-safe, and loads that
  brand's models with counts.
- A model link lands on `/korea` pre-filtered to that brand and model, with the
  matching filter chips shown.
- `KG Mobility` and `Renault Korea` show real logos in the sidebar.
- `/japan/brands` is visually and behaviourally unchanged, including the
  featured ordering and the absence of counts.
- Home page Korea tab's "browse all" card now opens `/korea/brands`.
