# Japan Detail Top Header Section Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** On `/japan/[id]`, lift the car title + GRADE + wishlist/compare header out of the narrow right-hand info column into a full-width section above the gallery, and move the wishlist/compare buttons into the mobile sticky bid bar wherever that section's buttons are hidden.

**Architecture:** Three isolated changes. `CarActionButtons` gains a presentational `variant` prop (`"header"` default keeps every existing call site identical, `"bar"` renders both controls icon-only for the sticky bar). `CarBidSection` gains an optional `actions` ReactNode slot rendered inside its existing mobile fixed bar — same slot style as its current `quickSpecs` prop, so the component learns nothing about wishlists. `JapanCarDetail` does the actual re-layout: it reads the device cookie to decide whether the in-page title section renders at all, and passes the bar actions down.

**Tech Stack:** Next.js 16 (App Router, server components), antd 6.x (`BrandButton` wraps antd `Button`), Tailwind CSS 4.x, next-intl.

**Spec:** `docs/superpowers/specs/2026-07-25-japan-detail-top-header-section-design.md`

## Global Constraints

- **No test framework in this repo** (`package.json` scripts are only `dev`, `build`, `start`, `lint`). Verification per task = `npx tsc --noEmit`, `npx eslint <touched files>`, and a dev-server visual check.
- The dev server usually already runs on port 2500 (the user's own `next dev`, HMR picks changes up). Do **NOT** start a second one if
  `curl -s -o /dev/null -w "%{http_code}" http://localhost:2500/mn` returns `200`.
- Lint baseline for the three touched files is **clean** (verified 2026-07-25). Any eslint finding in them is yours — fix it.
- **No i18n changes.** `carDetail.specs.grade` (`Грейд` / `Grade` / `Класс`) and `car.card.compare` (`Харьцуулах` / `Compare` / `Сравнить`) already exist in all three locale files. Do not touch `messages/*.json` — they carry the user's unrelated uncommitted WIP.
- The repo has a large uncommitted WIP across many files. **Stage only the exact files each task's commit lists** — never `git add -A`, never `git add .`.
- Commits go directly on `main` (repo convention).
- Visibility rule that drives everything, from the spec — do not "simplify" it into a single gate:
  - Title + GRADE: gated on the **device cookie** (`getDevice()`), because `MobileShell`/`DesktopShell` is picked by that cookie (`src/app/[locale]/layout.tsx:86`), not a breakpoint. A narrow desktop window gets `DesktopShell`, which has no sticky title header, so it still needs the in-page title.
  - Wishlist/compare: gated on the **`lg` breakpoint** (`hidden lg:block` in the header, and the sticky bar is already inside a `lg:hidden` wrapper), so exactly one copy exists at every viewport width.
- Container rule (CLAUDE.md): `<article>` already owns `mx-auto w-full max-w-7xl px-0 lg:px-6`. The new header therefore uses `px-4 lg:px-0` — it must not add its own max-width or `mx-auto`.

---

### Task 1: `CarActionButtons` gains a `variant` prop

Presentational only, and no consumer passes `variant` yet — after this task the rendered output at every existing call site (`JapanCarDetail.tsx`, `EncarDetail.tsx`) is byte-identical.

**Files:**
- Modify: `src/components/car-detail/CarActionButtons.tsx`
- Test: none available (no test framework — see Global Constraints)

**Interfaces:**
- Consumes: nothing from other tasks.
- Produces (Tasks 2–3 rely on these exact names):
  - `CarActionButtons` accepts `variant?: "header" | "bar"`, default `"header"`.
  - `variant="bar"` → wrapper `flex shrink-0 items-center gap-2` (unchanged), heart `h-10 w-10 rounded-xl`, compare `h-10 w-10 justify-center rounded-xl` icon-only with `aria-label`/`title`.

- [ ] **Step 1: Add the `variant` prop to the `Props` type**

In `src/components/car-detail/CarActionButtons.tsx`, the `Props` type currently ends:

```tsx
  /**
   * Show the compare pill. Only detail pages whose id the compare endpoint can
   * re-fetch upstream enable this (Japan AJES lots, Korea CARAPIS listings);
   * local stock (`/cars/[id]`) stays wishlist-only.
   */
  enableCompare?: boolean;
};
```

Change to:

```tsx
  /**
   * Show the compare pill. Only detail pages whose id the compare endpoint can
   * re-fetch upstream enable this (Japan AJES lots, Korea CARAPIS listings);
   * local stock (`/cars/[id]`) stays wishlist-only.
   */
  enableCompare?: boolean;
  /**
   * "header" — detail-page title row: 36px round heart + labelled compare pill.
   * "bar" — mobile sticky bid bar: both controls icon-only at 40px, no label.
   */
  variant?: "header" | "bar";
};
```

- [ ] **Step 2: Extend the JSDoc above the component**

The block comment above `export default function CarActionButtons` currently reads:

```tsx
/**
 * Wishlist + compare actions for the detail-page header, to the right of the
 * title. The heart is wired to the shared wishlist (guest localStorage or the
 * account, via {@link useWishlist}); compare uses the device-local tray
 * ({@link useCompare}). Reuses the `car.card.wishlist` / `car.card.compare` labels.
 */
```

Append one sentence before the closing `*/`:

```tsx
 * `variant="bar"` renders the same two controls icon-only for the mobile
 * sticky bid bar, where there is no room for the compare label.
 */
```

- [ ] **Step 3: Destructure `variant` and derive a local flag**

Change the signature:

```tsx
export default function CarActionButtons({
  item,
  enableCompare = false,
}: Props) {
```

to:

```tsx
export default function CarActionButtons({
  item,
  enableCompare = false,
  variant = "header",
}: Props) {
```

Then, immediately after the existing `const compared = enableCompare && isCompared(item.source, item.id);` line, add:

```tsx
  const bar = variant === "bar";
```

- [ ] **Step 4: Make the heart's size/shape variant-driven**

The wishlist `<button>`'s `className` is currently:

```tsx
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-full border transition active:scale-95",
          wishlisted
            ? "border-rose-200 bg-rose-50 text-rose-500 dark:border-rose-900/50 dark:bg-rose-950/40"
            : "border-neutral-200 text-neutral-500 hover:border-neutral-300 hover:text-rose-500 dark:border-neutral-800 dark:text-neutral-400 dark:hover:border-neutral-700",
        )}
```

Change to (only the first string is split; the two colour strings are untouched):

```tsx
        className={cn(
          "flex items-center justify-center border transition active:scale-95",
          bar ? "h-10 w-10 rounded-xl" : "h-9 w-9 rounded-full",
          wishlisted
            ? "border-rose-200 bg-rose-50 text-rose-500 dark:border-rose-900/50 dark:bg-rose-950/40"
            : "border-neutral-200 text-neutral-500 hover:border-neutral-300 hover:text-rose-500 dark:border-neutral-800 dark:text-neutral-400 dark:hover:border-neutral-700",
        )}
```

- [ ] **Step 5: Make the compare control icon-only in `bar` mode**

The compare `<button>` currently opens:

```tsx
        <button
          type="button"
          onClick={() => {
            if (toggleCompare(item) === "full") {
              message.warning(tc("fullWarning"));
            }
          }}
          aria-pressed={compared}
          className={cn(
            "flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-[13px] font-medium transition active:scale-95",
            compared
              ? "border-neutral-900 bg-neutral-900 text-white dark:border-neutral-100 dark:bg-neutral-100 dark:text-neutral-900"
              : "border-neutral-200 text-neutral-700 hover:border-neutral-300 dark:border-neutral-800 dark:text-neutral-300 dark:hover:border-neutral-700",
          )}
        >
```

Change that opening tag to:

```tsx
        <button
          type="button"
          onClick={() => {
            if (toggleCompare(item) === "full") {
              message.warning(tc("fullWarning"));
            }
          }}
          aria-pressed={compared}
          aria-label={bar ? t("compare") : undefined}
          title={bar ? t("compare") : undefined}
          className={cn(
            "flex items-center gap-1.5 border text-[13px] font-medium transition active:scale-95",
            bar
              ? "h-10 w-10 justify-center rounded-xl"
              : "h-9 rounded-full px-3.5",
            compared
              ? "border-neutral-900 bg-neutral-900 text-white dark:border-neutral-100 dark:bg-neutral-100 dark:text-neutral-900"
              : "border-neutral-200 text-neutral-700 hover:border-neutral-300 dark:border-neutral-800 dark:text-neutral-300 dark:hover:border-neutral-700",
          )}
        >
```

The `aria-label`/`title` are required: without the visible label the icon-only button would have no accessible name. In `header` mode they stay `undefined` so the visible text remains the name.

Then drop the label in `bar` mode. The button's closing lines are currently:

```tsx
          <span>{t("compare")}</span>
        </button>
```

Change to:

```tsx
          {!bar && <span>{t("compare")}</span>}
        </button>
```

Leave the `<svg>` between them exactly as it is.

- [ ] **Step 6: Typecheck and lint**

Run:

```bash
npx tsc --noEmit && npx eslint src/components/car-detail/CarActionButtons.tsx
```

Expected: both silent (exit 0). The repo's typecheck and the lint baseline for this file were both clean on 2026-07-25, so treat any output as caused by your edit.

- [ ] **Step 7: Confirm nothing changed visually yet**

Open `http://localhost:2500/mn/japan/098lhaBTqH3Ih` (ids rotate upstream — if it 404s, grab a fresh one with
`curl -s http://localhost:2500/mn/japan | grep -oE 'href="/mn/japan/[^"]+"' | head -3`).

Expected: the heart + "Харьцуулах" pill in the title row look exactly as before, and both still toggle. `variant` has no consumer yet.

- [ ] **Step 8: Commit**

```bash
git add src/components/car-detail/CarActionButtons.tsx
git commit -m "feat(car-detail): add icon-only bar variant to CarActionButtons"
```

---

### Task 2: `CarBidSection` renders an `actions` slot in its mobile sticky bar

Additive and inert: no caller passes `actions` yet, so the bar keeps rendering just the CTA. Only the bar's layout primitives change (`block` → flex row).

**Files:**
- Modify: `src/components/car-detail/CarBidSection.tsx`
- Test: none available (no test framework — see Global Constraints)

**Interfaces:**
- Consumes: nothing from Task 1 (the slot is a plain `React.ReactNode`).
- Produces (Task 3 relies on this exact name): `CarBidSection` accepts `actions?: React.ReactNode`, rendered to the **right** of the bid CTA inside the fixed mobile bar.

- [ ] **Step 1: Add the `actions` prop to the `Props` type**

In `src/components/car-detail/CarBidSection.tsx`, the `Props` type currently ends:

```tsx
  /** Quick-spec grid rendered at the top of the card, above a divider. */
  quickSpecs?: React.ReactNode;
};
```

Change to:

```tsx
  /** Quick-spec grid rendered at the top of the card, above a divider. */
  quickSpecs?: React.ReactNode;
  /**
   * Secondary actions for the mobile sticky bar, right of the bid CTA (wishlist
   * + compare on the Japan lot page). The `lg` layout puts those in the page's
   * title header instead, so this slot is effectively mobile-only.
   */
  actions?: React.ReactNode;
};
```

Use `React.ReactNode` (not an imported `ReactNode`) to match `quickSpecs` — this file has no `import type { ReactNode }`.

- [ ] **Step 2: Destructure it**

The destructuring block at the top of `CarBidSection` currently ends:

```tsx
    jpyRate,
    quickSpecs,
  } = props;
```

Change to:

```tsx
    jpyRate,
    quickSpecs,
    actions,
  } = props;
```

- [ ] **Step 3: Turn the fixed bar into a flex row with the actions on the right**

Inside the `<div className="lg:hidden">` block, the fixed bar is currently:

```tsx
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-neutral-100 bg-white/95 px-4 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-3 backdrop-blur-xl dark:border-neutral-900 dark:bg-neutral-950/95">
          <BrandButton block size="large" onClick={() => setOpen(true)}>
            {t("cta")}
          </BrandButton>
        </div>
```

Change to:

```tsx
        <div className="fixed inset-x-0 bottom-0 z-30 flex items-center gap-2 border-t border-neutral-100 bg-white/95 px-4 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-3 backdrop-blur-xl dark:border-neutral-900 dark:bg-neutral-950/95">
          <BrandButton size="large" className="flex-1" onClick={() => setOpen(true)}>
            {t("cta")}
          </BrandButton>
          {actions}
        </div>
```

`block` (antd's `width: 100%`) is replaced by `flex-1` so the CTA still fills the leftover width beside the icons. Do **not** add a Tailwind height class to `BrandButton` — antd's `size="large"` 40px height must win, and it matches the 40px icon buttons from Task 1.

- [ ] **Step 4: Typecheck and lint**

Run:

```bash
npx tsc --noEmit && npx eslint src/components/car-detail/CarBidSection.tsx
```

Expected: both silent (exit 0).

- [ ] **Step 5: Verify the bar still looks unchanged on mobile**

Open `http://localhost:2500/mn/japan/098lhaBTqH3Ih?view=mobile` in a phone-width window (~390px). The `?view=mobile` query is honoured by `resolveDevice` (`src/proxy.ts:13`) and sets the device cookie, so you get the real mobile shell.

Expected: the bottom bar still shows one full-width brand-orange CTA (`actions` is undefined, and `flex-1` reproduces the old `block` width). Tapping it still opens the bid drawer.

**Note:** once the cookie is set to `mobile`, later desktop checks need `?view=desktop` to flip it back.

- [ ] **Step 6: Commit**

```bash
git add src/components/car-detail/CarBidSection.tsx
git commit -m "feat(car-detail): add actions slot to the mobile sticky bid bar"
```

---

### Task 3: `JapanCarDetail` — full-width title section, device-gated, actions wired

The visible change. Everything here is in one file.

**Files:**
- Modify: `src/components/car-detail/JapanCarDetail.tsx` (imports ~line 13; component body ~lines 356–372; quick-specs comment + array ~lines 411–419; JSX ~lines 468–561)
- Test: none available (no test framework — see Global Constraints)

**Interfaces:**
- Consumes: `CarActionButtons` `variant="bar"` (Task 1); `CarBidSection` `actions` prop (Task 2); `getDevice()` from `@/lib/device`, which returns `"mobile" | "desktop"` read from the `tjcar-device` cookie.
- Produces: nothing downstream.

- [ ] **Step 1: Import `getDevice`**

The import block currently has these three consecutive lines:

```tsx
import { parseImages, type CarFixture, carTitle } from "@/lib/carFixtures";
import { wishlistItemFromFixture } from "@/lib/wishlist";
import { toComparableSales, sameSpecLabel } from "@/lib/priceHistory";
```

Add a fourth to keep the `@/lib` group together:

```tsx
import { parseImages, type CarFixture, carTitle } from "@/lib/carFixtures";
import { wishlistItemFromFixture } from "@/lib/wishlist";
import { toComparableSales, sameSpecLabel } from "@/lib/priceHistory";
import { getDevice } from "@/lib/device";
```

- [ ] **Step 2: Read the device and hoist the wishlist item**

In the component body, this block currently reads:

```tsx
  // Live JPY→MNT rate for the bid panel's approximate-value preview.
  const jpyRate = (await getConfig()).JPY;

  const title = carTitle(car);
```

Change to:

```tsx
  // Live JPY→MNT rate for the bid panel's approximate-value preview.
  const jpyRate = (await getConfig()).JPY;

  // The phone shell already renders the lot title as an <h1> in its sticky
  // header (`@mobileHeader/japan/[id]`), so the in-page title section is for the
  // desktop shell only. The gate is the same device cookie that picks the shell
  // (not a breakpoint) — a narrow desktop window has no sticky header and still
  // needs the title.
  const device = await getDevice();
  const showTitleHeader = device !== "mobile";

  const title = carTitle(car);
  // Used twice: the title section's buttons and the mobile sticky bar's.
  const wishlistItem = wishlistItemFromFixture(car, "japan");
```

- [ ] **Step 3: Replace the stale quick-specs comment**

Immediately above `const quickSpecs: Array<{`, the comment currently reads:

```tsx
  // Grade is already shown under the title, so it is omitted here. Chassis and
  // equipment sit in the same grid as the rest — their icons are still to come,
  // so those cells fall back to an invisible spacer to keep the columns aligned.
```

Replace with:

```tsx
  // Grade leads the grid only when the title section is hidden (phone shell) —
  // on desktop it sits under the title and would be duplicated here. Cells
  // whose icon is still to come fall back to an invisible spacer so the columns
  // stay aligned.
```

- [ ] **Step 4: Prepend the grade quick-spec when the title section is hidden**

The array literal currently opens:

```tsx
  }> = [
    { label: t("specs.year"), value: car.YEAR, icon: <YearIcon /> },
```

Change to:

```tsx
  }> = [
    ...(showTitleHeader || !car.GRADE
      ? []
      : [{ label: t("specs.grade"), value: car.GRADE }]),
    { label: t("specs.year"), value: car.YEAR, icon: <YearIcon /> },
```

The entry deliberately has no `icon` — `icon` is optional on the array's element type, and the renderer already falls back to an invisible `h-6 w-6` spacer for iconless cells, which keeps the 3-column grid aligned. `carDetail.specs.grade` exists in all three locales; add no keys.

- [ ] **Step 5: Move the header out of the info column and up to the top of `<article>`**

The JSX currently opens:

```tsx
  return (
    <article className="mx-auto w-full max-w-7xl px-0 lg:px-6 lg:py-8">
      <div className="flex flex-col lg:flex-row lg:items-start lg:gap-x-10">
```

Change to (insert the header as `<article>`'s first child; the row `<div>` is unchanged):

```tsx
  return (
    <article className="mx-auto w-full max-w-7xl px-0 lg:px-6 lg:py-8">
      {/* Title section — its own full-width band above the gallery row. Skipped
          on the phone shell, whose sticky header already carries the title.
          Below `lg` the actions move to the mobile sticky bid bar, so exactly
          one copy of them exists at any width. Separation is spacing only, no
          divider. `pt-5 lg:pt-0` because <article>'s `lg:py-8` does not apply
          below `lg` (a narrow desktop window would sit flush under the site
          header). */}
      {showTitleHeader && (
        <header className="flex items-start justify-between gap-3 px-4 pt-5 pb-6 lg:px-0 lg:pt-0">
          <div className="flex min-w-0 flex-col gap-1">
            <h1 className="text-2xl font-bold leading-tight text-neutral-900 dark:text-neutral-100 lg:text-[28px]">
              {title}
            </h1>
            {/* Year + color live in the quick specs below, so only grade shows here. */}
            {car.GRADE && (
              <div className="flex flex-wrap items-center gap-2 text-[13px] text-neutral-600 dark:text-neutral-400">
                <span>{car.GRADE}</span>
              </div>
            )}
          </div>
          <div className="hidden shrink-0 lg:block">
            <CarActionButtons item={wishlistItem} enableCompare />
          </div>
        </header>
      )}
      <div className="flex flex-col lg:flex-row lg:items-start lg:gap-x-10">
```

- [ ] **Step 6: Delete the old header from the info column**

The info column currently opens:

```tsx
        {/* Info column — right on desktop, independent height from the left */}
        <div className="flex flex-col gap-5 py-5 lg:min-w-0 lg:grow lg:basis-0 lg:py-0">
          <header className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 flex-col gap-1">
              <h1 className="text-2xl font-bold leading-tight text-neutral-900 dark:text-neutral-100 lg:text-[28px]">
                {title}
              </h1>
              {/* Year + color live in the quick specs below, so only grade shows here. */}
              {car.GRADE && (
                <div className="flex flex-wrap items-center gap-2 text-[13px] text-neutral-600 dark:text-neutral-400">
                  <span>{car.GRADE}</span>
                </div>
              )}
            </div>
            <CarActionButtons
              item={wishlistItemFromFixture(car, "japan")}
              enableCompare
            />
          </header>

          {/* Headline tiles — inspection grade + MNT landed price */}
```

Change to (the whole `<header>` and the blank line after it go away; the div keeps `gap-5`):

```tsx
        {/* Info column — right on desktop, independent height from the left */}
        <div className="flex flex-col gap-5 py-5 lg:min-w-0 lg:grow lg:basis-0 lg:py-0">
          {/* Headline tiles — inspection grade + MNT landed price */}
```

- [ ] **Step 7: Pass the bar actions to `CarBidSection`**

In the `<CarBidSection ... />` call, this line currently precedes the `quickSpecs` slot:

```tsx
            jpyRate={jpyRate}
            quickSpecs={
```

Change to:

```tsx
            jpyRate={jpyRate}
            actions={
              <CarActionButtons
                item={wishlistItem}
                enableCompare
                variant="bar"
              />
            }
            quickSpecs={
```

- [ ] **Step 8: Typecheck and lint**

Run:

```bash
npx tsc --noEmit && npx eslint src/components/car-detail/JapanCarDetail.tsx
```

Expected: both silent (exit 0). A `'wishlistItemFromFixture' is defined but never used` finding means Step 2's `wishlistItem` const is missing or Step 6/7 still call the helper inline — the import must stay used exactly once.

- [ ] **Step 9: Verify the desktop shell at `lg` and above**

Open `http://localhost:2500/mn/japan/098lhaBTqH3Ih?view=desktop` in a window ≥ 1024px wide (ids rotate — refresh one with `curl -s http://localhost:2500/mn/japan | grep -oE 'href="/mn/japan/[^"]+"' | head -3`).

Expected:
- Title (28px) + grade line span the full page width **above** the gallery, their left edge flush with the site header's, no divider line under them.
- Heart + "Харьцуулах" pill sit on the same row, right-aligned, and still toggle (heart fills rose; pill inverts to dark).
- Gallery and the RATE / landed-price tiles both start at the same vertical position.
- No bottom sticky bar; the grade appears **only** under the title, not in the quick-specs grid.

- [ ] **Step 10: Verify the desktop shell in a narrow window**

Same URL, resize the window to ~900px (still `?view=desktop`, so `DesktopShell`).

Expected: title + grade still visible with 16px side padding and clear space under the site header; the heart/pill are **gone** from the header; the bottom sticky bar now shows `[ CTA ] [♡] [⇄]` — CTA on the left filling the width, two 40px icon buttons on the right, all the same height. Both icons toggle, and adding a 4th car to a full compare tray still raises the antd warning toast.

- [ ] **Step 11: Verify the phone shell**

Open `http://localhost:2500/mn/japan/098lhaBTqH3Ih?view=mobile` in a ~390px window.

Expected:
- **No** in-page title block — only the sticky `MobileHeader` title (back chevron, truncated title, compare-tray icon).
- Gallery is still full-bleed and is the first thing under that header.
- The quick-specs grid's first cell reads `ГРЕЙД` with the trim value (e.g. `TX L Package`), long values truncating inside their cell, columns still aligned.
- Bottom bar: `[ CTA ] [♡] [⇄]`, both toggles working, CTA still opens the bid drawer.

Then flip the cookie back with `?view=desktop` so the rest of the session renders the desktop shell.

- [ ] **Step 12: Production build**

Run:

```bash
npm run build
```

Expected: build succeeds. `getDevice()` reads `cookies()`, which the route already does via `auth()`/`getLocale()`, so the page stays dynamic exactly as before — no new "used cookies" build warnings should appear for `/[locale]/japan/[id]`.

- [ ] **Step 13: Commit**

```bash
git add src/components/car-detail/JapanCarDetail.tsx
git commit -m "feat(japan): lift lot title into its own full-width top section"
```

---

## Out of scope

- `src/components/car-detail/EncarDetail.tsx:141` has the same in-column header pattern. Leave it alone — Korea/Encar detail keeps its current layout (spec's "Out of scope").
- `MobileHeader`'s `DefaultRight` compare-tray link stays as spec 2026-07-03-mobile-header-compare-button left it. Do not move wishlist/compare into the mobile header.
- No `messages/*.json` edits.
