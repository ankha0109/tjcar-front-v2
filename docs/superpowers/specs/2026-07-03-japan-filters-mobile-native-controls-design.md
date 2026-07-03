# Japan auction filters — mobile drawer native controls

**Date:** 2026-07-03
**Component:** `src/components/cards/JapanAuctionFilters.tsx`
**Status:** Approved design

## Problem

The mobile per-field bottom drawer currently renders the *same* antd control
(`control` in `FieldDef`) that the desktop sidebar uses. For every Select-based
field this means tapping a pill opens a bottom drawer that itself contains an
antd `Select` — and tapping that Select opens a *second*, nested dropdown. On a
touch screen this double-popup is awkward and error-prone.

Two concrete complaints:

1. **Select-in-Select.** The user must tap the pill, then tap the Select inside
   the drawer, then pick from a floating dropdown that overlays the drawer.
2. **DatePicker keyboard + page scroll.** Tapping the date field's input pops
   the mobile virtual keyboard, the calendar floats, and picking a day scrolls
   the whole page — the field becomes very hard to use.

The user also asked whether antd has an official config to lock body scroll
while a Select/DatePicker popup is open.

## Goals

- Mobile drawer content selects values **directly** — no nested antd popup.
- DatePicker on mobile must not raise the virtual keyboard and must not scroll
  the page.
- Rename the drawer's confirm button from "Болсон" (done) to "Хайх" (search),
  where such a button still exists.
- **Desktop (`lg+`) stays byte-for-byte unchanged.** Only the mobile drawer and
  the `FieldDef` shape change; the desktop sidebar keeps rendering `control`.

## Non-goals

- No change to filter semantics, live-apply behaviour, the pill row, the desktop
  sidebar, or the `JapanAuctionFilterChips` component.
- No global "lock body scroll on popup" hack. See Answer below.

## Answer: body scroll on popup

antd has **no** dedicated prop that locks body scroll while a `Select`/
`DatePicker` popup is open. The right fix is structural, not a global lock:

- Replacing every single-select with a native in-drawer list **removes the
  Select popup entirely**, so its scroll behaviour is moot.
- For `DatePicker`, `inputReadOnly` is the official antd prop for touch devices —
  it prevents the virtual keyboard. `getPopupContainer` pointed at the drawer
  body keeps the calendar contained inside the drawer instead of portaling to
  `document.body`, so picking a day cannot scroll the page.

## Design

### Field type model

Extend `FieldDef` with a discriminated `mobile` descriptor that carries exactly
the data the drawer needs to build a native control. The existing `control`
(desktop antd JSX) is untouched.

```ts
type MobileControl =
  | {
      type: "single";
      options: { value: string; label: React.ReactNode; searchText: string }[];
      value: string | null;
      onSelect: (v: string | null) => void; // null clears
      loading?: boolean;
    }
  | {
      type: "range";
      from: { options: RangeOpt[]; value: number | null; onChange: (v: number | null) => void; placeholder: string };
      to:   { options: RangeOpt[]; value: number | null; onChange: (v: number | null) => void; placeholder: string };
    }
  | { type: "date"; value: string | null; onChange: (v: string | null) => void; placeholder: string }
  | { type: "text"; value: string; onChange: (v: string) => void; placeholder: string };
```

`RangeOpt = { value: number; label: string }`. `searchText` is the plain-text
form used to filter the list (e.g. the color name or chassis code), decoupled
from the rich `label` node (swatch, count suffix, etc.).

`FieldDef` gains `mobile: MobileControl`. `control` remains for desktop.

### Drawer rendering

The drawer body switches on `activeField.mobile.type`:

- **single** → `<OptionList>`: a scrollable list of rows. Each row shows the
  label and a ✓ when selected. When `options.length > 8`, a search input at the
  top filters by `searchText` (case-insensitive substring). Tapping a row calls
  `onSelect(value)` **and closes the drawer** (`setOpenField(null)`).
- **range** → `<RangeColumns>`: two side-by-side `<OptionList>`-style columns
  (Доод / Дээд headers from the from/to placeholders). Each column is
  independently scrollable; tapping applies live and keeps the drawer open. No
  search (numeric step lists are short).
- **date** → antd `DatePicker` with `inputReadOnly`, `open` uncontrolled,
  `getPopupContainer={() => drawerBodyEl}`, full width. `onChange` applies live
  and closes the drawer (single value, like single-select).
- **text** → the existing `Input` (kept; typing needs the keyboard).

### Footer logic

| Field type | Footer |
|---|---|
| single, date | Left `Цэвэрлэх` only (disabled when field inactive). No `Хайх`. Selecting auto-closes; `Цэвэрлэх` clears **and** closes. |
| range, text | `Цэвэрлэх` (left) + `Хайх` (right, `type="primary"`). `Хайх` closes. |

`Хайх` uses a new translation key; `Цэвэрлэх` reuses the existing `clear` key.

### Auto-close & drawer body ref

- Single-select and date close via `setOpenField(null)` from their own
  handlers, so the footer needs no confirm button for them.
- `getPopupContainer` for the date field needs the drawer body DOM node. Capture
  it with a ref set on the drawer body wrapper (a `<div ref>` inside the Drawer),
  falling back to `document.body` when the ref is not yet attached.

### New sub-components (same file)

- `OptionList` — props: `options`, `selected`, `onSelect`, optional `searchLabel`
  and a `searchThreshold` (default 8). Renders search input + rows. Pure
  presentational; no filter state leaks outside.
- `RangeColumns` — props: `from`, `to` descriptors. Renders two labelled
  `OptionList`s side by side (each with its own selection, no search).

Both live in `JapanAuctionFilters.tsx` (module scope, like `FilterPill`), keep
the file's single responsibility, and take plain props so they can be reasoned
about in isolation.

## Translations

Add to `messages/{mn,en,ru}.json` under `featured.filters`:

- `search`: `"Хайх"` / `"Search"` / `"Поиск"`

`messages/*.json` currently has unrelated uncommitted changes. When committing,
stage **only** the added `search` lines (e.g. targeted `git add`), leaving the
user's in-progress edits in the working tree untouched.

## Verification

No unit-test framework exists in this repo. Verification gate:

- `npx tsc --noEmit` clean
- `npx eslint src/components/cards/JapanAuctionFilters.tsx` clean
- Manual dev check at mobile width (<1024px, `npm run dev` on port 2500):
  - single-select: list renders, search filters long lists, tap applies + closes
  - date: no keyboard, calendar contained, pick applies + closes, page does not scroll
  - range: two columns, live apply, `Хайх` closes
  - lot: input + keyboard normal, `Хайх` closes
  - `Цэвэрлэх` clears each type; pills reflect state; desktop sidebar unchanged

## Risk / rollback

Single file, additive to `FieldDef`. Desktop path (`control`) is untouched, so
regression risk is confined to the mobile drawer. Rollback = revert the commit.
