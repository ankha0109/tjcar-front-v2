# Korea Brands Explorer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship `/korea/brands` — a two-level manufacturer → model browser for the Korean (Encar) catalogue — by turning the existing `/japan/brands` explorer into a shared presentational shell with one adapter per country.

**Architecture:** `BrandsExplorer` is reduced to a domain-agnostic presentational component driven entirely by props. Two thin client adapters feed it: `JapanBrandsExplorer` (synchronous, from the server-fetched `BrandsCatalog`) and `KoreaBrandsExplorer` (asynchronous, from the static `KOREA_BRANDS` list plus the per-brand `useKoreaModels` query). Each adapter owns its own URL query contract and selection state; the shell owns layout only. No backend work.

**Tech Stack:** Next.js 16 (App Router, `[locale]` segment), React 19, TypeScript, antd v6, Tailwind v4, next-intl, TanStack Query.

**Spec:** [docs/superpowers/specs/2026-07-31-korea-brands-explorer-design.md](../specs/2026-07-31-korea-brands-explorer-design.md)

## Global Constraints

- **There is no test framework in this repo.** `package.json` scripts are `dev`, `build`, `start`, `lint` only — no vitest, jest, or playwright, and zero `*.test.*` files exist. **Do not add one**; it is outside the approved scope. Every task's verification gate is instead: `npx tsc --noEmit` clean, `npm run lint` clean, and the browser check written into that task.
- **Commit by explicit path only:** `git commit -m "…" -- <paths>`. The working tree AND the git index routinely hold the user's unrelated WIP (an in-progress about-page refactor, a `report/ → ui/` rename). A bare `git commit` swallows it. Run `git status --short` after each commit and confirm nothing beyond your own files was included.
- **Locale routing:** import `Link`, `useRouter`, `usePathname`, `redirect` from `@/i18n/navigation` — never from `next/link` or `next/navigation`. `useSearchParams` and `notFound` still come from `next/navigation`.
- **Page container:** every top-level page wrapper uses `mx-auto w-full max-w-7xl px-4 lg:px-6`. Vertical padding is free; the horizontal scale is fixed.
- **Translations:** every new key goes into all three of `messages/{mn,en,ru}.json`.
- **Banned utilities:** never use `tracking-*` or `font-mono` classes (existing `tracking-*` occurrences in copied code must be dropped, not carried over).
- **Dev server:** `npm run dev` serves on port **2500**. URLs are locale-prefixed: `/mn/...`, `/en/...`, `/ru/...`.
- **Korea query contract:** `/korea` reads `brand` (a `KOREA_BRANDS` slug — anything else is a backend 422) and `model` (the raw Korean Encar `name`). `/japan` reads `marka` and `model`.

## File Structure

| File | Responsibility |
| --- | --- |
| `src/lib/alphabet.ts` (modify) | `groupByInitial` becomes generic over item type via a label accessor. |
| `src/types/korea.ts` (modify) | `KOREA_BRANDS` entries gain optional `logo`; add `FEATURED_KOREA_BRANDS` + `koreaBrand()`. Single source of truth for Korea brand identity. |
| `src/components/home/CarSearchSection.tsx` (modify) | Drops its duplicated featured-brand/logo table; points "browse all" at the new page. |
| `src/components/brands/BrandsExplorer.tsx` (rewrite) | Presentational shell. No routing, no data fetching, no domain knowledge. |
| `src/components/brands/JapanBrandsExplorer.tsx` (create) | Japan adapter: `BrandsCatalog` + `?make=` → shell props. |
| `src/components/brands/KoreaBrandsExplorer.tsx` (create) | Korea adapter: `KOREA_BRANDS` + `useKoreaModels` + `?brand=` → shell props. |
| `src/app/[locale]/japan/brands/page.tsx` (modify) | Renders the Japan adapter instead of the shell. |
| `src/app/[locale]/korea/brands/page.tsx` (create) | Server component; resolves `?brand=`, no data fetching. |
| `src/app/[locale]/korea/brands/loading.tsx` (create) | Route skeleton. |
| `messages/{mn,en,ru}.json` (modify) | `koreaBrands` namespace. |

---

### Task 1: Make `groupByInitial` generic

The shell must group `BrandItem[]` and `ModelItem[]` objects, not bare strings. `BrandsExplorer` is the only consumer, so the signature can change outright rather than gaining a parallel function.

**Files:**
- Modify: `src/lib/alphabet.ts`
- Modify: `src/components/brands/BrandsExplorer.tsx:57,64,71`

**Interfaces:**
- Consumes: nothing.
- Produces: `groupByInitial<T>(items: T[], label: (item: T) => string): LetterGroup<T>[]` and `type LetterGroup<T> = { letter: string; items: T[] }`. Tasks 3 and 5 rely on both.

- [ ] **Step 1: Rewrite `src/lib/alphabet.ts`**

Replace the whole file:

```ts
// Group a list into A–Z buckets keyed by the first letter of a derived label.

export type LetterGroup<T> = { letter: string; items: T[] };

/**
 * Bucket `items` by the uppercased first character of `label(item)`
 * ("Camry" → "C"); anything not starting with A–Z (digits, symbols, Hangul)
 * lands under "#". Assumes `items` is already sorted by that same label, so
 * buckets and their contents stay ordered; the "#" bucket is pushed last.
 */
export function groupByInitial<T>(
  items: T[],
  label: (item: T) => string,
): LetterGroup<T>[] {
  const order: string[] = [];
  const buckets = new Map<string, T[]>();

  for (const item of items) {
    const first = label(item).trim().charAt(0).toUpperCase();
    const letter = first >= "A" && first <= "Z" ? first : "#";
    let bucket = buckets.get(letter);
    if (!bucket) {
      bucket = [];
      buckets.set(letter, bucket);
      order.push(letter);
    }
    bucket.push(item);
  }

  return order
    .sort((a, b) => (a === "#" ? 1 : b === "#" ? -1 : a.localeCompare(b)))
    .map((letter) => ({ letter, items: buckets.get(letter)! }));
}
```

- [ ] **Step 2: Update the three call sites in `BrandsExplorer.tsx`**

These currently pass `string[]`. Add the identity accessor so the file compiles unchanged in behaviour (Task 3 rewrites this file properly):

```tsx
  const restGroups = useMemo(
    () => groupByInitial(brands.filter((b) => !featuredSet.has(b)), (b) => b),
    [brands, featuredSet],
  );

  const filteredGroups = useMemo(
    () =>
      q
        ? groupByInitial(
            brands.filter((b) => b.toLowerCase().includes(q)),
            (b) => b,
          )
        : [],
    [brands, q],
  );

  // Level 2 — selected make's models, grouped by first letter.
  const modelGroups = useMemo(
    () => groupByInitial(catalog?.modelsByBrand[selected] ?? [], (m) => m),
    [catalog, selected],
  );
```

- [ ] **Step 3: Verify types and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: both exit 0. If `tsc` reports an unused `LetterGroup` import anywhere, remove it.

- [ ] **Step 4: Verify `/japan/brands` still works**

Run `npm run dev`, open `http://localhost:2500/mn/japan/brands`.
Expected: identical to before — featured makes on top, A–Z groups below, clicking a make swaps the model grid.

- [ ] **Step 5: Commit**

```bash
git commit -m "refactor(alphabet): make groupByInitial generic over item type" -- src/lib/alphabet.ts src/components/brands/BrandsExplorer.tsx
git status --short
```

---

### Task 2: Make `KOREA_BRANDS` the single source of brand identity

`brandLogoUrl` derives a carlogos.org slug from a display name. Nineteen of the 21 Korea brands resolve; `Renault Korea` and `KG Mobility` do not. `CarSearchSection` already hardcodes exactly these two overrides for its nine featured makes — that table moves into `KOREA_BRANDS` so the other twelve brands get correct logos on the new page too.

> **Scope correction (2026-07-31, during execution).** This task was written
> by reading the *working tree*, not the committed file. The committed
> `CarSearchSection.tsx` has no Korea integration at all — it still uses a
> hardcoded `DEMO_KOREA_BRANDS` list behind a "backend not wired yet" comment.
> The `@/types/korea` import, `FEATURED_KOREA_MAKES`, `useKoreaModels`, and the
> Korea filter selects all live in the user's uncommitted WIP, so Steps 2–5
> cannot be committed without committing that WIP too.
>
> **Ruling:** this branch commits only the `src/types/korea.ts` half (Step 1).
> Steps 2–5 are still applied to the working tree — they are correct and
> verified — but they ride along with the user's own Korea-filters commit
> rather than this branch. Later tasks are unaffected: every other file they
> touch is committed. Judge this task's diff on Step 1 alone.

**Files:**
- Modify: `src/types/korea.ts:116-146` — **committed by this branch**
- Modify: `src/components/home/CarSearchSection.tsx` (imports, `BROWSE_ALL_HREF`, `FEATURED_KOREA_MAKES`, `featuredMakes`) — **working tree only, not committed here** (see scope correction above)

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `KOREA_BRANDS: ReadonlyArray<{ slug: string; label: string; logo?: string }>`
  - `FEATURED_KOREA_BRANDS: readonly string[]` — nine slugs in curated order
  - `koreaBrand(slug: string): { slug: string; label: string; logo?: string } | undefined`
  - `koreaBrandLabel(slug: string): string` (unchanged signature)

  Task 5 consumes `KOREA_BRANDS`, `FEATURED_KOREA_BRANDS`, and `koreaBrand`.

- [ ] **Step 1: Replace the `KOREA_BRANDS` block in `src/types/korea.ts`**

Replace lines 116–146 (from the `/**` above `KOREA_BRANDS` through the closing brace of `koreaBrandLabel`) with:

```ts
/**
 * Brand slugs the backend accepts (mirrors EncarListingService::BRANDS — an
 * unknown slug is a 422). Labels are the English names the API returns.
 *
 * `logo` overrides the name handed to `brandLogoUrl`, which derives a
 * carlogos.org slug from the display name. Only two brands need it: the CDN
 * has no "renault-korea" entry, and no post-rename "kg-mobility" logo.
 */
export const KOREA_BRANDS: ReadonlyArray<{
  slug: string;
  label: string;
  logo?: string;
}> = [
  { slug: "hyundai", label: "Hyundai" },
  { slug: "kia", label: "Kia" },
  { slug: "genesis", label: "Genesis" },
  { slug: "chevrolet", label: "Chevrolet" },
  { slug: "renault-korea", label: "Renault Korea", logo: "Renault" },
  { slug: "kg-mobility", label: "KG Mobility", logo: "SsangYong" },
  { slug: "bmw", label: "BMW" },
  { slug: "mercedes-benz", label: "Mercedes-Benz" },
  { slug: "audi", label: "Audi" },
  { slug: "volkswagen", label: "Volkswagen" },
  { slug: "volvo", label: "Volvo" },
  { slug: "lexus", label: "Lexus" },
  { slug: "toyota", label: "Toyota" },
  { slug: "honda", label: "Honda" },
  { slug: "nissan", label: "Nissan" },
  { slug: "ford", label: "Ford" },
  { slug: "jeep", label: "Jeep" },
  { slug: "land-rover", label: "Land Rover" },
  { slug: "porsche", label: "Porsche" },
  { slug: "mini", label: "Mini" },
  { slug: "tesla", label: "Tesla" },
];

/**
 * Curated "popular" Korea makes, in display order. Nine of them, so the home
 * page's featured grid reads as 5×2 with the "browse all" card in the tenth
 * cell; the brands explorer shows the same nine above its A–Z list.
 */
export const FEATURED_KOREA_BRANDS: readonly string[] = [
  "hyundai",
  "kia",
  "genesis",
  "kg-mobility",
  "renault-korea",
  "chevrolet",
  "bmw",
  "mercedes-benz",
  "audi",
];

export function koreaBrand(slug: string) {
  return KOREA_BRANDS.find((b) => b.slug === slug);
}

export function koreaBrandLabel(slug: string): string {
  return koreaBrand(slug)?.label ?? slug;
}
```

- [ ] **Step 2: Update the `CarSearchSection.tsx` import block**

In the `@/types/korea` import (currently lines 28–36), add `FEATURED_KOREA_BRANDS` and `koreaBrand`, and **drop `koreaBrandLabel`** — line 114 is its only use in this file and Step 5 replaces it. (`KOREA_BRANDS` stays: line 202 still uses it for the brand select options.)

```tsx
import {
  EMPTY_KOREA_FILTERS,
  FEATURED_KOREA_BRANDS,
  KOREA_BRANDS,
  KOREA_FUELS,
  KOREA_TRANSMISSIONS,
  koreaBrand,
  koreaFiltersToQuery,
  type KoreaFilterValues,
} from "@/types/korea";
```

- [ ] **Step 3: Point "browse all" at the new page**

Replace the `BROWSE_ALL_HREF` block (currently lines 46–50):

```tsx
// The "view all" card opens that tab's manufacturers explorer.
const BROWSE_ALL_HREF: Record<Tab, string> = {
  japan: "/japan/brands",
  korea: "/korea/brands",
};
```

- [ ] **Step 4: Delete the duplicated `FEATURED_KOREA_MAKES` table**

Remove the comment and constant currently at lines 62–79 — that is, from `// Curated "popular" makes shown with logos…` through the `];` closing `FEATURED_KOREA_MAKES` — and replace with just the Japan half of the comment:

```tsx
// Curated "popular" makes shown with logos in the featured grid. Nine each so
// the grid reads as 5×2 with the "all" card filling the tenth cell. Japan
// reuses the shared `TOP_JAPAN_MAKES` ranking (see `@/lib/brand`); Korea uses
// `FEATURED_KOREA_BRANDS` (see `@/types/korea`), whose entries carry the
// backend brand *slug* — `/korea` only accepts those.
```

- [ ] **Step 5: Read the featured Korea makes from `KOREA_BRANDS`**

In the `featuredMakes` `useMemo`, replace the `if (tab === "korea")` branch:

```tsx
    if (tab === "korea") {
      return FEATURED_KOREA_BRANDS.map((slug) => {
        const brand = koreaBrand(slug);
        return {
          key: slug,
          href: `/korea?brand=${slug}`,
          label: brand?.label ?? slug,
          logo: brand?.logo ?? brand?.label ?? slug,
        };
      });
    }
```

- [ ] **Step 6: Verify types and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: both exit 0. If `koreaBrandLabel` is still reported as unused in `CarSearchSection.tsx`, Step 2's import edit was missed. `koreaBrandLabel` itself stays exported from `@/types/korea` — `KoreaFilters.tsx` uses it for the Korea filter chips.

- [ ] **Step 7: Verify the home page**

Open `http://localhost:2500/mn`, switch the search card to the Korea tab.
Expected: the same nine featured makes in the same order with the same logos as before (KG Mobility shows the SsangYong mark, Renault Korea shows the Renault mark). The tenth "browse all" card now links to `/mn/korea/brands` — it will 404 until Task 5.

- [ ] **Step 8: Commit**

```bash
git commit -m "refactor(korea): centralise brand logos and featured order in KOREA_BRANDS" -- src/types/korea.ts src/components/home/CarSearchSection.tsx
git status --short
```

---

### Task 3: Reduce `BrandsExplorer` to a presentational shell

The shell keeps the current layout verbatim — sticky brand rail with search, featured group then A–Z groups, models pane grouped by letter — but learns nothing about routing or data. Selection state moves out to the adapter, because the Korea adapter cannot run its models query without owning `selected`.

**Files:**
- Rewrite: `src/components/brands/BrandsExplorer.tsx`
- Create: `src/components/brands/JapanBrandsExplorer.tsx`
- Modify: `src/app/[locale]/japan/brands/page.tsx:3,48`

**Interfaces:**
- Consumes: `groupByInitial<T>(items, label)` and `LetterGroup<T>` from Task 1.
- Produces: `BrandItem`, `ModelItem`, and the `BrandsExplorer` props contract. Task 5 imports all three.

**Behaviour the shell owns (do not move into adapters):** the search box, sorting `brands`/`models` by label before grouping, the mobile `scrollIntoView` after a select, the models loading skeleton, and the `unavailable` / `noMakes` / `noModels` empty states.

**Sorting note:** the old code relied on `/filters` returning brands pre-sorted. `KOREA_BRANDS` is in curated order, not alphabetical, and `/korea/models` returns Encar's own order — so the shell now sorts defensively before grouping. `groupByInitial` requires pre-sorted input.

- [ ] **Step 1: Rewrite `src/components/brands/BrandsExplorer.tsx`**

```tsx
"use client";

import { useMemo, useRef, useState } from "react";
import { Empty, Input } from "antd";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Skeleton } from "@/components/ui/Skeleton";
import { groupByInitial } from "@/lib/alphabet";
import { brandLogoUrl } from "@/lib/brand";

/** One manufacturer row. `key` is the identity the adapter round-trips through
 *  the URL and its hrefs; `label` is what the user reads; `logo` overrides the
 *  name handed to `brandLogoUrl` when the CDN slug differs from the label. */
export type BrandItem = { key: string; label: string; logo?: string };

/** One model tile. `value` goes into the listing href, `label` is displayed,
 *  `count` is the live listing count (omitted when the source has none). */
export type ModelItem = { value: string; label: string; count?: number };

type Props = {
  brands: BrandItem[];
  /** Brand keys pinned above the A–Z list, in the order given. */
  featuredKeys: string[];
  /** Currently selected brand key — always resolved by the adapter. */
  selected: string;
  onSelect: (key: string) => void;
  models: ModelItem[];
  modelsLoading?: boolean;
  /** "All {brand} listings" target. */
  brandHref: (key: string) => string;
  modelHref: (brand: string, model: string) => string;
  namespace: "japanBrands" | "koreaBrands";
};

const formatCount = (n: number) => new Intl.NumberFormat("en-US").format(n);

const byLabel = <T extends { label: string }>(items: T[]) =>
  [...items].sort((a, b) => a.label.localeCompare(b.label));

export default function BrandsExplorer({
  brands,
  featuredKeys,
  selected,
  onSelect,
  models,
  modelsLoading,
  brandHref,
  modelHref,
  namespace,
}: Props) {
  const t = useTranslations(namespace);
  const modelsRef = useRef<HTMLDivElement>(null);
  const [filter, setFilter] = useState("");
  const q = filter.trim().toLowerCase();

  const byKey = useMemo(
    () => new Map(brands.map((b) => [b.key, b])),
    [brands],
  );
  const selectedLabel = byKey.get(selected)?.label ?? selected;
  const selectedLogo = byKey.get(selected)?.logo ?? selectedLabel;

  // Level 1 — featured makes first (curated order), then the rest A–Z.
  const featured = useMemo(
    () =>
      featuredKeys
        .map((k) => byKey.get(k))
        .filter((b): b is BrandItem => Boolean(b)),
    [featuredKeys, byKey],
  );

  const featuredSet = useMemo(
    () => new Set(featured.map((b) => b.key)),
    [featured],
  );

  const restGroups = useMemo(
    () =>
      groupByInitial(
        byLabel(brands.filter((b) => !featuredSet.has(b.key))),
        (b) => b.label,
      ),
    [brands, featuredSet],
  );

  const filteredGroups = useMemo(
    () =>
      q
        ? groupByInitial(
            byLabel(brands.filter((b) => b.label.toLowerCase().includes(q))),
            (b) => b.label,
          )
        : [],
    [brands, q],
  );

  // Level 2 — selected make's models, grouped by first letter.
  const modelGroups = useMemo(
    () => groupByInitial(byLabel(models), (m) => m.label),
    [models],
  );

  const selectBrand = (key: string) => {
    onSelect(key);
    // On narrow screens the models live below the list — bring them into view.
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      modelsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const renderBrandRow = (brand: BrandItem) => {
    const active = brand.key === selected;
    return (
      <button
        key={brand.key}
        type="button"
        onClick={() => selectBrand(brand.key)}
        aria-current={active}
        className={`group flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors ${
          active
            ? "bg-primary/10 text-primary"
            : "text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800/60"
        }`}
      >
        <img
          src={brandLogoUrl(brand.logo ?? brand.label)}
          alt=""
          loading="lazy"
          width={22}
          height={22}
          className="h-5.5 w-5.5 shrink-0 object-contain"
        />
        <span className="truncate text-[13.5px] font-medium">
          {brand.label}
        </span>
      </button>
    );
  };

  if (brands.length === 0) {
    return (
      <section className="mx-auto w-full max-w-7xl px-4 py-16 lg:px-6">
        <Empty description={t("unavailable")} />
      </section>
    );
  }

  return (
    <section className="mx-auto w-full max-w-7xl px-4 pb-16 pt-8 md:pt-10 lg:px-6">
      {/* Heading */}
      <header className="mb-6">
        <h1 className="text-[24px] font-semibold text-neutral-900 md:text-[28px] dark:text-neutral-50">
          {t("title")}
        </h1>
        <p className="mt-1.5 text-[13.5px] text-neutral-500 dark:text-neutral-400">
          {t("subtitle")}
        </p>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[300px_1fr]">
        {/* LEVEL 1 — manufacturers */}
        <aside className="rounded-2xl border border-neutral-200 bg-white p-3 lg:sticky lg:top-[calc(var(--header-h)+1rem)] lg:max-h-[calc(100dvh-var(--header-h)-2rem)] lg:self-start lg:overflow-y-auto dark:border-neutral-800 dark:bg-neutral-950">
          <Input
            allowClear
            size="large"
            variant="filled"
            placeholder={t("searchPlaceholder")}
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="mb-3"
          />

          {q ? (
            filteredGroups.length === 0 ? (
              <p className="px-2.5 py-4 text-[13px] text-neutral-400">
                {t("noMakes")}
              </p>
            ) : (
              filteredGroups.map((g) => (
                <div key={g.letter} className="mb-1">
                  <LetterHeader letter={g.letter} />
                  {g.items.map(renderBrandRow)}
                </div>
              ))
            )
          ) : (
            <>
              {featured.length > 0 && (
                <div className="mb-2">
                  <SectionLabel>★ {t("featuredLabel")}</SectionLabel>
                  {featured.map(renderBrandRow)}
                </div>
              )}
              <SectionLabel>{t("allLabel")}</SectionLabel>
              {restGroups.map((g) => (
                <div key={g.letter} className="mb-1">
                  <LetterHeader letter={g.letter} />
                  {g.items.map(renderBrandRow)}
                </div>
              ))}
            </>
          )}
        </aside>

        {/* LEVEL 2 — models of the selected make */}
        {/* Offset for `scrollIntoView` comes from `html { scroll-padding-top }`. */}
        <div ref={modelsRef}>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 pb-4 dark:border-neutral-800">
            <div className="flex items-center gap-3">
              <img
                src={brandLogoUrl(selectedLogo)}
                alt=""
                width={36}
                height={36}
                className="h-9 w-9 shrink-0 object-contain"
              />
              <div>
                <h2 className="text-[18px] font-semibold text-neutral-900 dark:text-neutral-50">
                  {t("modelsTitle", { brand: selectedLabel })}
                </h2>
                <p className="text-[12.5px] text-neutral-400">
                  {modelsLoading
                    ? t("modelsLoading")
                    : t("modelCount", { count: models.length })}
                </p>
              </div>
            </div>
            <Link
              href={brandHref(selected)}
              className="text-[13px] font-semibold text-primary hover:underline"
            >
              {t("viewAllInAuctions", { brand: selectedLabel })}
            </Link>
          </div>

          {modelsLoading ? (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 12 }).map((_, i) => (
                <Skeleton key={i} className="h-9.5 w-full rounded-lg" />
              ))}
            </div>
          ) : modelGroups.length === 0 ? (
            <Empty description={t("noModels")} className="py-12" />
          ) : (
            <div className="space-y-6">
              {modelGroups.map((g) => (
                <div key={g.letter}>
                  <div className="sticky top-0 z-10 mb-2 bg-white/90 py-1 backdrop-blur dark:bg-neutral-950/90">
                    <span className="text-2xl font-bold text-primary">
                      {g.letter}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                    {g.items.map((model) => (
                      <Link
                        key={model.value}
                        href={modelHref(selected, model.value)}
                        className="flex items-center justify-between gap-2 rounded-lg border border-neutral-100 bg-white px-3 py-2 text-[13px] font-medium text-neutral-700 transition-colors hover:border-primary hover:text-primary dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-300"
                        title={model.label}
                      >
                        <span className="truncate">{model.label}</span>
                        {model.count != null && (
                          <span className="shrink-0 text-[11.5px] font-normal text-neutral-400">
                            {formatCount(model.count)}
                          </span>
                        )}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-2.5 pb-1 pt-2 text-[11px] font-semibold uppercase text-neutral-400">
      {children}
    </div>
  );
}

function LetterHeader({ letter }: { letter: string }) {
  return (
    <div className="px-2.5 pb-0.5 pt-1 text-[12px] font-bold text-neutral-300 dark:text-neutral-600">
      {letter}
    </div>
  );
}
```

Note two deliberate changes from the original: `tracking-tight` / `tracking-wide` are dropped (banned utilities), and a `modelsLoading` translation key is introduced — Task 4 adds it to `koreaBrands`, and Step 3 below adds it to `japanBrands`.

- [ ] **Step 2: Create `src/components/brands/JapanBrandsExplorer.tsx`**

```tsx
"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { usePathname, useRouter } from "@/i18n/navigation";
import BrandsExplorer, {
  type BrandItem,
  type ModelItem,
} from "@/components/brands/BrandsExplorer";
import { TOP_JAPAN_MAKES, norm } from "@/lib/brand";
import type { BrandsCatalog } from "@/services/filters";

type Props = {
  catalog?: BrandsCatalog;
  /** Server-resolved brand name to show selected on first render ("TOYOTA"). */
  initialMake: string;
};

/**
 * `/japan/brands` adapter — the AJES catalogue arrives complete from the
 * server, so every model is already in hand and nothing loads lazily.
 */
export default function JapanBrandsExplorer({ catalog, initialMake }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const names = useMemo(() => catalog?.brands ?? [], [catalog]);

  const brands = useMemo<BrandItem[]>(
    () => names.map((name) => ({ key: name, label: name })),
    [names],
  );

  // Selection follows `?make=` (shareable / reload-safe), with the
  // server-resolved `initialMake` as the fallback.
  const selected = useMemo(() => {
    const q = params.get("make");
    if (q) {
      const match = names.find((b) => norm(b) === norm(q));
      if (match) return match;
    }
    return initialMake;
  }, [params, names, initialMake]);

  // Curated names are title-case ("Mercedes-Benz"), `/filters` names are upper
  // ("MERCEDES-BENZ") — resolve to the real value the shell keys on.
  const featuredKeys = useMemo(() => {
    const byNorm = new Map(names.map((b) => [norm(b), b]));
    return TOP_JAPAN_MAKES.map((n) => byNorm.get(norm(n))).filter(
      (b): b is string => Boolean(b),
    );
  }, [names]);

  const models = useMemo<ModelItem[]>(
    () =>
      (catalog?.modelsByBrand[selected] ?? []).map((m) => ({
        value: m,
        label: m,
      })),
    [catalog, selected],
  );

  return (
    <BrandsExplorer
      brands={brands}
      featuredKeys={featuredKeys}
      selected={selected}
      onSelect={(key) =>
        router.replace(`${pathname}?make=${encodeURIComponent(key)}`, {
          scroll: false,
        })
      }
      models={models}
      brandHref={(key) => `/japan?marka=${encodeURIComponent(key)}`}
      modelHref={(brand, model) =>
        `/japan?marka=${encodeURIComponent(brand)}&model=${encodeURIComponent(model)}`
      }
      namespace="japanBrands"
    />
  );
}
```

- [ ] **Step 3: Add the `modelsLoading` key to `japanBrands` in all three locales**

The Japan adapter never sets `modelsLoading`, but the shell references the key, so it must exist in both namespaces. Insert one line after `"modelCount"` inside the existing `japanBrands` object:

- `messages/en.json`: `"modelsLoading": "Loading models…",`
- `messages/mn.json`: `"modelsLoading": "Моделуудыг ачаалж байна…",`
- `messages/ru.json`: `"modelsLoading": "Загрузка моделей…",`

**Staging warning:** these three files carry the user's unrelated WIP. Edit the working tree only — do **not** `git add messages/*.json` here. Task 4 stages and commits every i18n change in one curated commit.

- [ ] **Step 4: Point the Japan page at the adapter**

In `src/app/[locale]/japan/brands/page.tsx`, change the import on line 3 and the return on line 48:

```tsx
import JapanBrandsExplorer from "@/components/brands/JapanBrandsExplorer";
```

```tsx
  return <JapanBrandsExplorer catalog={catalog} initialMake={initialMake} />;
```

- [ ] **Step 5: Verify types and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: both exit 0.

- [ ] **Step 6: Verify `/japan/brands` is unchanged**

Open `http://localhost:2500/mn/japan/brands` and check:
- featured makes appear above the A–Z list, in `TOP_JAPAN_MAKES` order
- clicking a make updates `?make=` and swaps the model grid
- reloading on `?make=LEXUS` keeps Lexus selected
- model tiles show **no** count numbers
- a model tile links to `/japan?marka=…&model=…`
- the search box filters the brand rail
- below `lg` width, selecting a make scrolls the model pane into view

- [ ] **Step 7: Commit**

```bash
git commit -m "refactor(brands): split BrandsExplorer into a shell plus a Japan adapter" -- src/components/brands/BrandsExplorer.tsx src/components/brands/JapanBrandsExplorer.tsx "src/app/[locale]/japan/brands/page.tsx"
git status --short
```

The `messages/*.json` edits from Step 3 stay in the working tree, uncommitted — Task 4 commits the whole i18n change in one go.

---

### Task 4: Add the `koreaBrands` translation namespace

**Files:**
- Modify: `messages/en.json`, `messages/mn.json`, `messages/ru.json`

**Interfaces:**
- Consumes: nothing.
- Produces: the `koreaBrands` namespace, keyed identically to `japanBrands` (including `modelsLoading` from Task 3). Task 5's page and adapter depend on it.

- [ ] **Step 1: Add the namespace to `messages/en.json`**

Insert as a sibling of `japanBrands`:

```json
  "koreaBrands": {
    "metadata": {
      "title": "Korean manufacturers",
      "description": "Every manufacturer available from Korea and their models. Pick a manufacturer to see its models with live listing counts."
    },
    "title": "Korean manufacturers",
    "subtitle": "Pick a manufacturer to explore its models and find them in Korea.",
    "featuredLabel": "Featured",
    "allLabel": "All manufacturers",
    "searchPlaceholder": "Search manufacturer",
    "noMakes": "No manufacturers found",
    "modelsTitle": "{brand} models",
    "modelCount": "{count} models",
    "modelsLoading": "Loading models…",
    "viewAllInAuctions": "All {brand} listings",
    "noModels": "No models found",
    "unavailable": "Catalogue is temporarily unavailable. Please try again."
  },
```

- [ ] **Step 2: Add the namespace to `messages/mn.json`**

```json
  "koreaBrands": {
    "metadata": {
      "title": "Солонгосын үйлдвэрлэгчид",
      "description": "Солонгосоос авах боломжтой бүх үйлдвэрлэгч болон тэдгээрийн моделууд. Үйлдвэрлэгчээ сонгоод модел бүрийн зарын тоог үзээрэй."
    },
    "title": "Солонгосын үйлдвэрлэгчид",
    "subtitle": "Үйлдвэрлэгчээ сонгоод моделуудыг нь үзэж, Солонгосоос хайгаарай.",
    "featuredLabel": "Онцлох",
    "allLabel": "Бүх үйлдвэрлэгч",
    "searchPlaceholder": "Үйлдвэрлэгч хайх",
    "noMakes": "Тохирох үйлдвэрлэгч олдсонгүй",
    "modelsTitle": "{brand} моделууд",
    "modelCount": "{count} модел",
    "modelsLoading": "Моделуудыг ачаалж байна…",
    "viewAllInAuctions": "Бүх {brand} зар",
    "noModels": "Модел олдсонгүй",
    "unavailable": "Мэдээлэл түр боломжгүй байна. Дараа дахин оролдоно уу."
  },
```

- [ ] **Step 3: Add the namespace to `messages/ru.json`**

```json
  "koreaBrands": {
    "metadata": {
      "title": "Корейские производители",
      "description": "Все производители, доступные из Кореи, и их модели. Выберите производителя, чтобы увидеть его модели с количеством объявлений."
    },
    "title": "Корейские производители",
    "subtitle": "Выберите производителя, чтобы посмотреть его модели и найти их в Корее.",
    "featuredLabel": "Популярные",
    "allLabel": "Все производители",
    "searchPlaceholder": "Поиск производителя",
    "noMakes": "Производители не найдены",
    "modelsTitle": "Модели {brand}",
    "modelCount": "{count} моделей",
    "modelsLoading": "Загрузка моделей…",
    "viewAllInAuctions": "Все объявления {brand}",
    "noModels": "Модели не найдены",
    "unavailable": "Каталог временно недоступен. Попробуйте позже."
  },
```

- [ ] **Step 4: Validate the JSON**

Run:
```bash
for f in messages/en.json messages/mn.json messages/ru.json; do python3 -m json.tool "$f" > /dev/null && echo "$f ok"; done
python3 -c "
import json
ks = [sorted(json.load(open(f'messages/{l}.json'))['koreaBrands']) for l in ('mn','en','ru')]
assert ks[0] == ks[1] == ks[2], ks
jp = sorted(json.load(open('messages/en.json'))['japanBrands'])
assert ks[0] == jp, (ks[0], jp)
print('koreaBrands keys match across locales and mirror japanBrands')
"
```
Expected: three `ok` lines and the match confirmation.

- [ ] **Step 5: Generate a patch containing only your lines**

Steps 1–4 edited the **working tree**, so the dev server already sees the new keys. Now stage only those lines. `git apply --cached` writes to the index only, so the patch must be computed against `HEAD` — never against the working tree, which also holds the user's unrelated WIP.

The script below re-applies the same insertions to each file's `HEAD` text and emits the diff. Run it from the repo root:

```bash
python3 - <<'PY'
import difflib, subprocess, pathlib

SCRATCH = pathlib.Path("/private/tmp/claude-501/-Users-ankhbayar-Projects-Front-tjcar-front-v2/22154c90-348a-434c-a4c8-df9db6fceae4/scratchpad")
SCRATCH.mkdir(parents=True, exist_ok=True)

LOADING = {
    "en": "Loading models…",
    "mn": "Моделуудыг ачаалж байна…",
    "ru": "Загрузка моделей…",
}

out = []
for loc in ("en", "mn", "ru"):
    head = subprocess.run(
        ["git", "show", f"HEAD:messages/{loc}.json"],
        capture_output=True, text=True, check=True,
    ).stdout
    work = pathlib.Path(f"messages/{loc}.json").read_text()

    lines = head.splitlines(keepends=True)
    # Locate the japanBrands block: its opening line, then the matching
    # closing line at the same two-space indent.
    start = next(i for i, l in enumerate(lines) if l.startswith('  "japanBrands": {'))
    end = next(i for i in range(start + 1, len(lines)) if lines[i].startswith("  },"))

    # a) modelsLoading goes right after modelCount inside japanBrands
    mc = next(i for i in range(start, end) if '"modelCount"' in lines[i])
    lines.insert(mc + 1, f'    "modelsLoading": "{LOADING[loc]}",\n')
    end += 1

    # b) the koreaBrands block goes right after japanBrands closes. Lift it
    #    verbatim out of the already-edited working tree so the staged text
    #    and the working tree can never drift.
    wl = work.splitlines(keepends=True)
    ks = next(i for i, l in enumerate(wl) if l.startswith('  "koreaBrands": {'))
    ke = next(i for i in range(ks + 1, len(wl)) if wl[i].startswith("  },"))
    lines[end + 1 : end + 1] = wl[ks : ke + 1]

    out.extend(difflib.unified_diff(
        head.splitlines(keepends=True), lines,
        fromfile=f"a/messages/{loc}.json", tofile=f"b/messages/{loc}.json",
    ))

patch = SCRATCH / "i18n-korea-brands.patch"
patch.write_text("".join(out))
print(f"wrote {patch}")
PY
```

If any `next(...)` raises `StopIteration`, the anchor it was looking for is missing — most likely Steps 1–4 were not applied to the working tree, or the user's WIP reshaped the `japanBrands` block. Stop and inspect rather than improvising.

- [ ] **Step 6: Apply the patch to the index and verify the staged content**

```bash
git apply --cached /private/tmp/claude-501/-Users-ankhbayar-Projects-Front-tjcar-front-v2/22154c90-348a-434c-a4c8-df9db6fceae4/scratchpad/i18n-korea-brands.patch
git diff --cached -- messages/
```

Expected: the staged diff contains **only** added lines — three `modelsLoading` lines and three `koreaBrands` blocks. Any line touching `footer`, `avgPrice`, `home`, or another unrelated namespace means the patch was built wrong; run `git restore --staged messages/` and redo Step 5.

If `git apply --cached` fails with "patch does not apply", the user's WIP overlaps the `japanBrands` block. Do not force it — report the conflict.

- [ ] **Step 7: Commit**

```bash
git commit -m "i18n: add the koreaBrands namespace and a models-loading label"
git status --short
```

This commit deliberately omits `-- <paths>`: the index has been curated to hold exactly the intended lines, and naming paths would re-stage the whole files including the user's WIP.

Expected afterwards: `messages/{en,mn,ru}.json` still show as ` M` (unstaged), because the user's WIP is still sitting in the working tree untouched.

---

### Task 5: Build `/korea/brands`

**Files:**
- Create: `src/components/brands/KoreaBrandsExplorer.tsx`
- Create: `src/app/[locale]/korea/brands/page.tsx`
- Create: `src/app/[locale]/korea/brands/loading.tsx`

**Interfaces:**
- Consumes: `BrandsExplorer`, `BrandItem`, `ModelItem` (Task 3); `KOREA_BRANDS`, `FEATURED_KOREA_BRANDS` (Task 2); `koreaBrands` messages (Task 4); the existing `useKoreaModels(brand: string | null)` hook returning `{ data?: KoreaModelGroup[]; isLoading: boolean }` where `KoreaModelGroup = { name: string; english: string | null; count: number }`.
- Produces: the `/korea/brands` route. Nothing downstream depends on it.

- [ ] **Step 1: Create `src/components/brands/KoreaBrandsExplorer.tsx`**

```tsx
"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { usePathname, useRouter } from "@/i18n/navigation";
import BrandsExplorer, {
  type BrandItem,
  type ModelItem,
} from "@/components/brands/BrandsExplorer";
import { useKoreaModels } from "@/hooks/useKoreaModels";
import { FEATURED_KOREA_BRANDS, KOREA_BRANDS } from "@/types/korea";

type Props = {
  /** Server-resolved `KOREA_BRANDS` slug selected on first render. */
  initialBrand: string;
};

// `KOREA_BRANDS` is static, so the brand rail needs no fetch — only the
// selected brand's models do, and `/korea/models` is per-brand.
const BRANDS: BrandItem[] = KOREA_BRANDS.map((b) => ({
  key: b.slug,
  label: b.label,
  logo: b.logo,
}));

const FEATURED = [...FEATURED_KOREA_BRANDS];

export default function KoreaBrandsExplorer({ initialBrand }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  // Selection follows `?brand=` (shareable / reload-safe); an unknown slug
  // falls back to the server-resolved default rather than 422-ing later.
  const selected = useMemo(() => {
    const q = params.get("brand");
    return q && KOREA_BRANDS.some((b) => b.slug === q) ? q : initialBrand;
  }, [params, initialBrand]);

  const { data, isLoading } = useKoreaModels(selected);

  // Encar's own name is the filter value; the English translation is display
  // only and is null for model lines that have none.
  const models = useMemo<ModelItem[]>(
    () =>
      (data ?? []).map((m) => ({
        value: m.name,
        label: m.english ?? m.name,
        count: m.count,
      })),
    [data],
  );

  return (
    <BrandsExplorer
      brands={BRANDS}
      featuredKeys={FEATURED}
      selected={selected}
      onSelect={(key) =>
        router.replace(`${pathname}?brand=${encodeURIComponent(key)}`, {
          scroll: false,
        })
      }
      models={models}
      modelsLoading={isLoading}
      brandHref={(key) => `/korea?brand=${encodeURIComponent(key)}`}
      modelHref={(brand, model) =>
        `/korea?brand=${encodeURIComponent(brand)}&model=${encodeURIComponent(model)}`
      }
      namespace="koreaBrands"
    />
  );
}
```

- [ ] **Step 2: Create `src/app/[locale]/korea/brands/page.tsx`**

```tsx
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import KoreaBrandsExplorer from "@/components/brands/KoreaBrandsExplorer";
import { KOREA_BRANDS } from "@/types/korea";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "koreaBrands.metadata" });
  return {
    title: t("title"),
    description: t("description"),
  };
}

type PageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function KoreaBrandsPage({
  params,
  searchParams,
}: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const sp = await searchParams;
  const raw = Array.isArray(sp.brand) ? sp.brand[0] : sp.brand;

  // `KOREA_BRANDS` is a static constant, so this page fetches nothing — only
  // the selected brand's models load, client-side, from `/korea/models`.
  // An unknown slug would 422 at the backend, so fall back to Hyundai.
  const initialBrand =
    KOREA_BRANDS.find((b) => b.slug === raw)?.slug ?? "hyundai";

  return <KoreaBrandsExplorer initialBrand={initialBrand} />;
}
```

- [ ] **Step 3: Create `src/app/[locale]/korea/brands/loading.tsx`**

The models pane loads client-side, so this skeleton only needs to cover the brand rail and the header — model tiles get the shell's own `modelsLoading` skeleton.

```tsx
import { Skeleton } from "@/components/ui/Skeleton";

/**
 * Loading placeholder for `/korea/brands` — mirrors {@link BrandsExplorer}'s
 * two-pane layout (brand rail + model grid).
 */
export default function Loading() {
  return (
    <section
      role="status"
      aria-busy="true"
      className="mx-auto w-full max-w-7xl px-4 pb-16 pt-8 md:pt-10 lg:px-6"
    >
      <span className="sr-only">Loading…</span>
      <div className="mb-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="mt-2 h-4 w-96 max-w-full" />
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[300px_1fr]">
        {/* Brand rail */}
        <aside className="hidden rounded-2xl border border-neutral-200 bg-white p-3 lg:block dark:border-neutral-800 dark:bg-neutral-950">
          <Skeleton className="mb-3 h-9 w-full rounded-lg" />
          <div className="space-y-1.5">
            {Array.from({ length: 12 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full rounded-lg" />
            ))}
          </div>
        </aside>

        {/* Model grid */}
        <div>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 pb-4 dark:border-neutral-800">
            <Skeleton className="h-9 w-56" />
            <Skeleton className="h-5 w-28" />
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <Skeleton key={i} className="h-9.5 w-full rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Verify types and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: both exit 0.

- [ ] **Step 5: Verify the page in the browser**

Use the project's `verify` skill (or `npm run dev` manually) and check each of these:

| Check | Expected |
| --- | --- |
| `/mn/korea/brands` | Renders with Hyundai selected; all 21 brands in the rail |
| View source | The brand rail is in the server HTML; model tiles are not |
| Featured group | Hyundai, Kia, Genesis, KG Mobility, Renault Korea, Chevrolet, BMW, Mercedes-Benz, Audi — in that order, above the A–Z list |
| Logos | KG Mobility shows the SsangYong mark; Renault Korea shows the Renault mark; neither is a broken image |
| Select a brand | URL gains `?brand=<slug>`; skeleton tiles appear, then models with counts |
| Reload on `?brand=kia` | Kia stays selected |
| `?brand=nonsense` | Falls back to Hyundai, no error |
| Model tile | Links to `/korea?brand=<slug>&model=<korean name>`; the listing page opens pre-filtered with matching filter chips |
| "All {brand} listings" | Links to `/korea?brand=<slug>` |
| Search box | Filters the brand rail; nonsense input shows `noMakes` |
| Below `lg` width | Selecting a brand scrolls the model pane into view |
| `/en/korea/brands`, `/ru/korea/brands` | Render in the right language, no missing-message warnings in the console |
| Home page → Korea tab → "browse all" card | Lands on `/korea/brands` (no longer 404) |

- [ ] **Step 6: Commit**

```bash
git commit -m "feat(korea): add the /korea/brands manufacturers explorer" -- src/components/brands/KoreaBrandsExplorer.tsx "src/app/[locale]/korea/brands/page.tsx" "src/app/[locale]/korea/brands/loading.tsx"
git status --short
```

---

## Final verification

- [ ] `npx tsc --noEmit` clean
- [ ] `npm run lint` clean
- [ ] `npm run build` succeeds
- [ ] `/japan/brands` behaves exactly as it did before Task 1 (featured order, no counts, `?make=` round-trip)
- [ ] `/korea/brands` passes every row of the Task 5 Step 5 table
- [ ] `git status --short` shows the user's pre-existing WIP still uncommitted and untouched
