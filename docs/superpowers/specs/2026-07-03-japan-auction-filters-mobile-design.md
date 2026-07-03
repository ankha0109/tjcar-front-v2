# Japan Auction Filters — Mobile inline pill + per-filter Bottom Drawer

**Date:** 2026-07-03
**Component:** `src/components/cards/JapanAuctionFilters.tsx`
**Consumers (unchanged):** `src/components/cards/AuctionBrowser.tsx`, `src/components/cards/FeaturedAuctionSchedule.tsx`

## Problem

On mobile (`<lg`) the Japan auction listing exposes all filters behind a single
**"Шүүлтүүр"** button that opens one full-height left `Drawer` containing every
filter grouped into four collapsible sections. This hides the filters behind a
modal and forces the user through one long form.

We want a touch-first experience: filters visible **inline** the way they are on
desktop, laid out as a **horizontally scrollable pill row** the user swipes
through. Tapping a pill opens a **Bottom Drawer** scoped to that single filter.

Desktop stays exactly as it is today.

## Decisions (locked during brainstorming)

1. **Pill granularity:** one pill per filter field (fine-grained), ~11 pills.
   Range filters (engine, year, mileage) keep their `from`/`to` pair together in
   one pill / one sheet.
2. **Apply behaviour:** live — changing a control applies immediately and the
   list behind refreshes (same as desktop `onChange`). No draft state.
3. **Selected pill:** shows its value inline (primary tint) with an inline `✕`
   for one-tap clear. The separate `JapanAuctionFilterChips` active-row is
   redundant on mobile and is hidden there (kept on desktop).

## Architecture — single source of truth

Today the desktop sidebar `body` inlines the JSX for all 11 controls. To let
desktop sections **and** mobile pills/sheets render the same controls without
duplication, extract a `fields` descriptor list built once per render:

```ts
type FieldSection = "vehicle" | "auction" | "specs" | "advanced";

type FieldDef = {
  key: string;               // stable id: "marka" | "engine" | "year" | ...
  label: string;             // pill label + Field label + sheet title
  section: FieldSection;     // groups fields into the desktop sections
  active: boolean;           // has a value → highlight pill, show ✕
  summary: string | null;    // short value text for the selected pill
  control: React.ReactNode;  // the existing Select / Input / range JSX
  clear: () => void;         // reset just this field
};
```

The array is assembled inside the component so each `control` closes over the
existing memoized option arrays (`markaOptions`, `engVFromOptions`, …) and the
existing `set` / `setMarka` / `setModel` helpers. No option logic moves or
changes; the cascade (marka → model → chassis) and range clamping are untouched.

### Field list (order matches current desktop sections)

| key       | section  | label source            | control (existing)                    | summary                          |
|-----------|----------|-------------------------|---------------------------------------|----------------------------------|
| marka     | vehicle  | `placeholders.marka`    | marka Select                          | `value.marka`                    |
| model     | vehicle  | `placeholders.model`    | model Select                          | `value.model`                    |
| chassis   | vehicle  | `placeholders.chassis`  | chassis Select                        | `value.chassis`                  |
| rate      | auction  | `placeholders.rate`     | rate Select                           | `value.rate`                     |
| lot       | auction  | `"LOT №"`               | LOT Input                             | `value.lot`                      |
| date      | auction  | `auctionDate.label`     | DatePicker                            | `value.date`                     |
| color     | specs    | `color.label`           | color Select                          | capitalized `value.color`        |
| engine    | specs    | `engV.label`            | engV from/to `Space.Compact`          | `from–to` (reuse chip fmt, `…`)  |
| year      | advanced | `year.label`            | year from/to `Space.Compact`          | `from–to` (`…` for open ends)    |
| mileage   | advanced | `mileage.label`         | mileage from/to `Space.Compact`       | `from–to` km (`…` for open ends) |
| location  | advanced | `location.label`        | location Select                       | `value.location`                 |

`active` per field: single-value fields → truthy check; range fields → either
bound non-null. `summary` reuses the same range-formatting logic already present
in `JapanAuctionFilterChips` (`formatCc`, `formatKm`, `…` placeholder for an
open bound). Extract small shared helpers so the chips row and the pill summaries
stay in sync.

## Desktop (`lg+`) — behaviour unchanged

The sticky 280px sidebar and its four collapsible `Section`s render exactly as
today. Only the internals change: each `Section` maps the `fields` whose
`section` matches and renders `<Field label={f.label}>{f.control}</Field>`.
Section active counts derive from the fields' `active` flags. Visual output is
identical to the current sidebar.

## Mobile (`<lg`) — new

1. **Remove** the current mobile trigger bar (the "Шүүлтүүр" button) **and the
   left `Drawer`** entirely.
2. **Pill row** — horizontal scroll, edge-to-edge, hidden scrollbar (reuse the
   day-tab pattern: `-mx-4 overflow-x-auto px-4 [scrollbar-width:none]
   [&::-webkit-scrollbar]:hidden`), `lg:hidden`.
   - Inactive pill: label + chevron, neutral styling. Tapping opens the sheet.
   - Active pill: primary tint, `label: summary`, trailing `✕`. The `✕` calls
     `clear` (stopping propagation so it doesn't open the sheet); tapping the
     label area still opens the sheet to edit.
   - Trailing **"Бүгдийг цэвэрлэх"** text button, shown only when `hasFilters`;
     clears via `{ ...EMPTY_FILTERS, date: value.date }` (preserves date, the
     existing clear-all behaviour).
3. **Bottom Drawer** — a single `Drawer placement="bottom"` driven by
   `openField: string | null` state (the active field `key`).
   - Rounded top corners (via `styles.content` `borderTopLeftRadius` /
     `borderTopRightRadius`).
   - Title = the field's `label`. Body = that field's `control`. Footer =
     `[Цэвэрлэх]` (calls the field's `clear`) and `[Болсон]` (closes the sheet).
   - Live: editing the control applies immediately; the list behind refreshes.
   - Height sized to content (modest fixed height is fine; Select/DatePicker
     popups render in a portal and overlay above the sheet).

## `JapanAuctionFilterChips`

Change its root wrapper from `flex` to **`hidden lg:flex`**. This hides the
active-chip row on mobile (the pills now show and clear values) while keeping it
on desktop. Both parent call sites inherit this — **no parent edits needed.**

## Out of scope

- Backend params, query mapping, and data fetching (`filtersToQuery`,
  `filtersToAuctionQuery`) — untouched.
- Desktop visual appearance — unchanged.
- Parent components (`AuctionBrowser`, `FeaturedAuctionSchedule`) — no edits.
- Translations: reuse existing keys. One optional new key
  `featured.filters.clearAll` ("Бүгдийг цэвэрлэх") across `mn/en/ru` if the
  current `clear` label doesn't read well for the trailing button; otherwise
  reuse `featured.filters.clear`.

## Testing / verification

- Desktop sidebar renders identically (all 4 sections, controls, active counts,
  clear button) — manual visual check at `lg+`.
- Mobile: pill row scrolls; each pill opens the correct field sheet; live edits
  update the list; `✕` clears a single field; "Бүгдийг цэвэрлэх" resets all but
  date; active-chip row is absent on mobile, present on desktop.
- Cascade intact: choosing a marka in its sheet resets model/chassis; range
  clamps (engV/year/mileage from ≤ to) still hold.
- `npm run lint` / typecheck clean.
