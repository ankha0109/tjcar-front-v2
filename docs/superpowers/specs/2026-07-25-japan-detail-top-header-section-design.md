# Japan detail: title header as its own top section design

**Date:** 2026-07-25
**Status:** Approved

## Problem

On `/japan/[id]`, the `<header>` holding the car title, `GRADE` and
`CarActionButtons` sits inside the right-hand info column
(`src/components/car-detail/JapanCarDetail.tsx:485`), directly above the
`RateCard` / `LandedPriceCard` tiles. It is therefore constrained to the
narrow column next to the gallery instead of reading as the page's own
heading.

Two facts complicate simply moving it to the top:

1. On phones the title is **already** rendered as an `<h1>` by the sticky
   `MobileHeader` (`src/app/[locale]/@mobileHeader/japan/[id]/page.tsx:18`).
   A full-width in-page header would duplicate it.
2. `MobileShell` vs `DesktopShell` is chosen by the **device cookie**, not a
   CSS breakpoint (`src/app/[locale]/layout.tsx:86`). `resolveDevice`
   (`src/proxy.ts:15`) marks only UA `device.type === "mobile"` (phones) as
   mobile — tablets and narrow desktop windows get `DesktopShell`, which has
   **no** sticky title header. So a purely CSS-hidden header would leave a
   narrow desktop window with no visible title at all.

## Decision

Lift the header out of the info column into a full-width section that is the
first child of `<article>`. Gate the *title block* on the device cookie and
the *action buttons* on the CSS breakpoint, so each appears exactly once at
every width.

| | Title + GRADE | Wishlist / Compare |
| --- | --- | --- |
| Phone (`device === "mobile"`) | sticky `MobileHeader` (unchanged) | mobile sticky bottom bar |
| Desktop cookie, viewport < 1024px | new top section | mobile sticky bottom bar (`lg:hidden`) |
| Desktop cookie, viewport ≥ 1024px | new top section | right side of new top section |

Rejected alternatives:

- **Move the actions into `MobileHeader`'s `right`/`customAction` slot.** Would
  displace the compare-tray entry point added by spec
  2026-07-03-mobile-header-compare-button, and a 56px header row is tight for
  a truncating title plus two more icon buttons.
- **A mobile-only action row under the gallery.** Duplicates structure and
  leaves the sticky bar half-used.
- **`hidden lg:flex` on the whole header.** Loses the title in narrow desktop
  windows (see Problem #2).

## Changes

### 1. `src/components/car-detail/JapanCarDetail.tsx`

- Import `getDevice` from `@/lib/device`; `const device = await getDevice();`
  alongside the existing awaits. Derive
  `const showTitleHeader = device !== "mobile";`
- Hoist the wishlist item, now used twice:
  `const wishlistItem = wishlistItemFromFixture(car, "japan");`
- Move the `<header>` block (currently lines 485–501) out of the info column
  and make it the first child of `<article>`, rendered only when
  `showTitleHeader`:

  ```tsx
  {showTitleHeader && (
    <header className="flex items-start justify-between gap-3 px-4 pt-5 pb-6 lg:px-0 lg:pt-0">
      <div className="flex min-w-0 flex-col gap-1">
        <h1 className="text-2xl font-bold leading-tight text-neutral-900 dark:text-neutral-100 lg:text-[28px]">
          {title}
        </h1>
        {car.GRADE && (
          <div className="flex flex-wrap items-center gap-2 text-[13px] text-neutral-600 dark:text-neutral-400">
            <span>{car.GRADE}</span>
          </div>
        )}
      </div>
      {/* Below lg the actions live in the mobile sticky bar instead. */}
      <div className="hidden shrink-0 lg:block">
        <CarActionButtons item={wishlistItem} enableCompare />
      </div>
    </header>
  )}
  ```

  No divider under the section — separation is spacing only (`pb-6`). `px-4`
  covers the narrow-desktop case, since `<article>` keeps `px-0 lg:px-6`;
  `pt-5 lg:pt-0` likewise, because `<article>`'s `lg:py-8` does not apply below
  `lg` and the title would otherwise sit flush under the site header.
- Info column keeps `gap-5`; it simply loses its first child.
- Pass the bar actions into `CarBidSection`:
  `actions={<CarActionButtons item={wishlistItem} enableCompare variant="bar" />}`
- `quickSpecs`: prepend a `t("specs.grade")` / `car.GRADE` entry **only** when
  `!showTitleHeader`, so the trim is not lost on phones. No `icon` — the
  existing invisible-spacer fallback (line 544) keeps the 3-column grid
  aligned. Update the comment at line 411, which currently states that grade
  is omitted because it shows under the title.

### 2. `src/components/car-detail/CarBidSection.tsx`

- New optional prop `actions?: ReactNode`, documented as the mobile sticky
  bar's secondary actions (same slot style as the existing `quickSpecs`).
- The fixed bar (line 252) becomes a row with the CTA on the left and the
  actions on the right:

  ```tsx
  <div className="fixed inset-x-0 bottom-0 z-30 flex items-center gap-2 border-t border-neutral-100 bg-white/95 px-4 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-3 backdrop-blur-xl dark:border-neutral-900 dark:bg-neutral-950/95">
    <BrandButton size="large" className="flex-1" onClick={() => setOpen(true)}>
      {t("cta")}
    </BrandButton>
    {actions}
  </div>
  ```

  `block` is dropped in favour of `flex-1`; the CTA keeps its `size="large"`
  40px height untouched, so no Tailwind-vs-antd height override is needed and
  the bar height — and the `h-20` spacer at `JapanCarDetail.tsx:585` — stay as
  they are. 40px also matches the touch size spec
  2026-07-03-card-actions-mobile settled on for `CarTableView`.
- Nothing else in the component changes; the desktop `<section>` and the
  `lg:hidden` mobile panel are untouched.

### 3. `src/components/car-detail/CarActionButtons.tsx`

New prop:

```tsx
/**
 * "header" — detail-page title row: h-9 round heart + labelled compare pill.
 * "bar" — mobile sticky bid bar: both icon-only, 40px, no compare label.
 */
variant?: "header" | "bar";
```

Default `"header"` keeps every current call site byte-identical in output.
For `"bar"`:

- Wishlist button: `h-10 w-10 rounded-xl` instead of `h-9 w-9 rounded-full`.
- Compare button: `h-10 w-10 justify-center rounded-xl` with no horizontal
  padding, the `<span>{t("compare")}</span>` label omitted, and
  `aria-label={t("compare")}` + `title={t("compare")}` added so the icon-only
  control keeps its name.
- Colours, `aria-pressed`, and the full-tray `message.warning` behaviour are
  unchanged.

### 4. i18n

None. `carDetail.specs.grade` (Грейд / Grade / Класс) and `car.card.compare`
already exist in all three locales.

## Out of scope

`EncarDetail.tsx:141` has the same in-column header pattern. It is left alone
— Korea/Encar detail keeps its current layout.

## Verification

- `npx eslint` clean on the three touched files; `npm run build` succeeds.
- Manual, via `npm run dev` on `/mn/japan/[id]`:
  - ≥ 1024px: title + GRADE full width above the gallery, actions on its
    right, no bottom bar, no divider line.
  - Desktop cookie at ~900px: title + GRADE still visible with `px-4`
    padding, actions only in the bottom bar (CTA left, heart + compare right).
  - `?view=mobile` on a phone-width window: no in-page title, `MobileHeader`
    title intact, GRADE present in the quick-specs grid, actions in the
    bottom bar.
  - Heart and compare toggles still persist (wishlist + compare tray) from
    the bar, and the compare-full warning still fires.
