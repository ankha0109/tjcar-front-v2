# CardActions mobile visibility design

**Date:** 2026-07-03
**Status:** Approved

## Problem

The wishlist and compare buttons (`CardActions`) on car cards are invisible and
unusable on touch devices.

- `src/components/cards/shared/CardActions.tsx` hides the buttons with
  `opacity-0` and reveals them with `group-hover:opacity-100`.
- The project uses Tailwind CSS v4 (4.2.1 installed), where `hover:` and
  `group-hover:` variants only apply under `@media (hover: hover)`. On
  touch-only devices the reveal never fires, so the buttons stay at opacity 0
  permanently.
- `opacity-0` elements remain interactive, so users can tap the invisible
  buttons by accident — a double defect.
- The antd circle buttons are 32px, below the ~44px touch-target guideline.

## Decision

Keep the hover-reveal behaviour on fine-pointer (mouse) devices; make the
buttons always visible with larger touch targets on coarse-pointer (touch)
devices. Chosen over "always visible everywhere" (clutters desktop hover
scrub) and "move buttons below the image on mobile" (large layout change).

## Scope

Only `src/components/cards/shared/CardActions.tsx` changes. Consumers:

| Call site | Mode | Effect |
| --- | --- | --- |
| `src/components/cards/CarCard.tsx:96` | hover (default) | fixed: visible on touch |
| `src/components/cards/views/CarListItem.tsx:90` | hover (default) | fixed: visible on touch |
| `src/components/cards/views/CarTableView.tsx:147` | `visibility="always"` | unchanged visibility; buttons grow to 40px on touch. Fits the 92px actions column (40 + 6 + 40 = 86px). |

## Changes

Tailwind 4.2.1 ships `pointer-fine:` / `pointer-coarse:` variants natively
(added in v4.1); no arbitrary variants needed.

### 1. Visibility (root div, hover mode only)

```
before: opacity-0 transition-opacity duration-200 group-hover:opacity-100 focus-within:opacity-100
after:  pointer-fine:opacity-0 transition-opacity duration-200 pointer-fine:group-hover:opacity-100 focus-within:opacity-100
```

Coarse pointer: always visible. Fine pointer: identical to current behaviour.
Keyboard `focus-within` reveal is preserved.

### 2. Touch target (both buttons, all modes)

Add to both antd buttons: `pointer-coarse:` size overrides taking the circle
button from 32px to 40px (`h-10`/`w-10`/`min-w-10` with `!` importance, since
antd sets its own sizing). Bump the inline SVG icons from 15px to 17px on
coarse pointers via a `pointer-coarse:size-[17px]` class on the `<svg>` (CSS
overrides the width/height presentation attributes).

### 3. Contrast (all devices)

Inactive-state background changes from `bg-white/85` to `bg-white/90` and
gains `shadow-sm`, so the buttons separate from light-coloured car photos.
Active states (rose wishlist, black compare) already have `shadow-md` and are
unchanged.

## Not changing

- Tooltips stay (harmless brief show on tap; `aria-label` already present).
- Active-state colours, table-view placement, `visibility`/`absolute` props API.

## Verification

- Dev server + browser DevTools mobile emulation (coarse pointer simulation):
  buttons visible without hover, 40px, toggle works.
- Desktop viewport: buttons hidden until card hover, 32px as today.
- Table view on mobile emulation: actions column accommodates 40px buttons.
- `npx tsc --noEmit` and `npm run lint` pass.
