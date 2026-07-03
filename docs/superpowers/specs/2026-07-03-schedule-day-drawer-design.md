# Schedule day bottom-drawer on mobile design

**Date:** 2026-07-03
**Status:** Approved

## Problem

On the Japan auction listing (`AuctionBrowser`) and the home featured section
(`FeaturedAuctionSchedule`), the date strip (`ScheduleTabList`: All + 3 day
tiles, ~370–420px with counts) shares one row with `ViewModeSwitcher`
(~110px). On phone viewports (360–430px) the row does not fit: the tab rail
scrolls under / collides with the switcher.

## Decision

Below the `sm` breakpoint (640px), replace the tab rail with a **trigger
button that opens an antd bottom drawer** listing the day options; tapping an
option selects it and closes the drawer. At `sm` and above the current tab
rail is unchanged. Chosen over an antd/native `<select>` (user preference:
bottom sheet matches the existing Japan-filters mobile drawer pattern) and
over moving `ViewModeSwitcher` to its own row (eats vertical space).

## Scope

| File | Change |
| --- | --- |
| `src/components/cards/views/scheduleTabs.tsx` | add `ScheduleDayDrawer` component (+ exported `ScheduleDayOption` type) |
| `src/components/cards/AuctionBrowser.tsx` | render drawer on mobile, hide tab rail below `sm` |
| `src/components/cards/FeaturedAuctionSchedule.tsx` | same integration, with counts + empty labels |
| `messages/{mn,en,ru}.json` | new key `featured.schedule.pickDay` |

Existing `ScheduleTabList` / `AllTab` / `DayTab` components are untouched.

## New component: `ScheduleDayDrawer`

Lives in `scheduleTabs.tsx` next to the tab components it mirrors.

```ts
export type ScheduleDayOption = {
  key: string;        // "YYYY-MM-DD"
  topLabel: string;   // relative label ("Маргааш") or dow ("Sat")
  day: string;        // "04"
  month: string;      // "Jul"
  weekend?: boolean;
  count?: number;     // omitted on AuctionBrowser (no counts there)
};

type ScheduleDayDrawerProps = {
  selected: string;                 // "all" | "YYYY-MM-DD"
  onSelect: (key: string) => void;  // receives "all" or a day key
  allLabel: string;                 // t("all")
  allCount?: number;
  days: ScheduleDayOption[];
  title: string;                    // t("pickDay") — drawer header
  emptyLabel?: string;              // t("empty") — shown when count === 0
};
```

Open/close state is internal (`useState`). The component renders:

1. **Trigger button** — styled like the existing rails (`rounded-2xl border
   border-neutral-200/80 bg-neutral-50/70 p-1` outer look, 40px tall, dark
   variants matching `ScheduleTabList`). Content: current selection label +
   chevron-down icon. Label logic: `selected === "all"` → `allLabel`; a key
   found in `days` → `{topLabel} · {day} {month}`; unknown key (stale URL
   date beyond the 3-day window) → the raw key string. Long labels truncate.
   `aria-haspopup="dialog"`, `aria-expanded` bound to open state.
2. **Bottom drawer** — antd `Drawer` configured exactly like the
   Japan-filters mobile drawer (`JapanAuctionFilters.tsx:824-835`):
   `placement="bottom"`, `size="auto"`, `styles.section` top corners radius
   16, header padding `16px 20px` with bottom hairline. Title = `title`
   prop. No footer.
3. **Option rows** — full-width buttons in a vertical list: "All" row first
   (`allLabel` + count badge when `allCount != null`), then one row per
   `days` entry: `{topLabel} · {day} {month}` left (weekend `topLabel`
   tinted `text-rose-500` like `DayTab`), count badge right. `count === 0`
   rows are dimmed (`opacity-50`) and show `emptyLabel` instead of a badge.
   The active row gets a tinted background (`bg-neutral-100
   dark:bg-neutral-800`) and a leading check icon; `aria-selected` set.
   Tapping a row calls `onSelect(key)` and closes the drawer. Rows are
   44px+ tall (touch target).

The component has no breakpoint knowledge — parents wrap it in `sm:hidden`.

## Integration (both parents, same shape)

In the toolbar row of `AuctionBrowser.tsx:170-203` and
`FeaturedAuctionSchedule.tsx:169-197`:

- Wrap the drawer in `<div className="min-w-0 flex-1 pb-3 sm:hidden">`
  rendered before the existing scrollable tab wrapper.
- Add `hidden sm:block` to the existing overflow-x wrapper div so the rail
  only renders from `sm` up.
- `ViewModeSwitcher` stays as-is (`shrink-0`, right side) — on mobile it now
  shares the row with the compact trigger only.

Prop wiring:

- **AuctionBrowser:** `selected`, `onSelect={setSelected}`,
  `allLabel={tSchedule("all")}`, `days={days.map(d => ({key, topLabel, day,
  month, weekend: d.isWeekend}))}`, `title={tSchedule("pickDay")}`. No
  counts, no `emptyLabel`.
- **FeaturedAuctionSchedule:** same plus `allCount={cars.length}`, per-day
  `count: countsByDate.get(day.key) ?? 0`, `emptyLabel={t("empty")}`.

Both parents may share a tiny local mapping; duplication of a 5-line `.map`
is acceptable — no new abstraction.

## i18n

Add `featured.schedule.pickDay` to all three locale files, next to the
existing `"all"` key:

- `mn`: "Өдөр сонгох"
- `en`: "Pick a day"
- `ru`: "Выбрать день"

**Staging caution:** `messages/*.json` often carry unrelated uncommitted WIP
— stage only the added lines (`git apply --cached` on a scoped diff), never
`git add` the whole file.

## Not changing

- Desktop/tablet (`sm`+) tab rail behaviour and markup.
- `ScheduleTabList`/`AllTab`/`DayTab` internals.
- Filter/URL sync logic (`setSelected` semantics identical).

## Verification

- `npx tsc --noEmit` clean; `npm run lint` no new findings.
- Dev server (port 2500): SSR HTML contains the trigger (with `sm:hidden`
  wrapper) and the rail wrapper carries `hidden sm:block` on both `/mn/japan`
  and the home featured section.
- Browser/emulation eyeball: phone viewport — trigger + switcher fit one
  row, drawer opens from bottom, selecting "Маргааш" filters the list and
  closes the drawer, active row highlighted on reopen; desktop — tabs
  unchanged.
