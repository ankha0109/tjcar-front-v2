# Auction date strip: extend to 5 days design

**Date:** 2026-07-03
**Status:** Approved

## Problem

The auction browser's date strip offers All + 3 upcoming days. Now that the
mobile bottom drawer (spec 2026-07-03-schedule-day-drawer) makes longer day
lists usable, the user wants All + 5 days — on both the mobile drawer and
the desktop tab rail.

## Decision

Change `DAYS_AHEAD` from `3` to `5` in
`src/components/cards/AuctionBrowser.tsx:41`. Nothing else changes:

- The single `days` array feeds both the desktop `ScheduleTabList` rail and
  the mobile `ScheduleDayDrawer`, so both surfaces get 5 days from the one
  constant.
- Days 4–5 fall outside `RELATIVE_LABELS` (offsets 1–2) and render with
  `dayjs` day-of-week labels ("Sat"), exactly like day 3 today. Weekend rose
  tint and `isHighlighted` (offsets ≤ 2) logic are untouched.
- The desktop rail grows ~110px; its wrapper already scrolls
  (`overflow-x-auto`) on narrow-but-`sm`+ viewports.
- `FeaturedAuctionSchedule` already uses its own `DAYS_AHEAD = 7` and is not
  part of this change.

## Verification

`npx tsc --noEmit` clean; dev-server SSR of `/mn/japan` renders 6 tab roles
(All + 5 days) in the rail and 6 drawer option rows.
