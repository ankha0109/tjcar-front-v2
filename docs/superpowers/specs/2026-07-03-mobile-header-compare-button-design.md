# Mobile header: compare button replaces sign-in design

**Date:** 2026-07-03
**Status:** Approved

## Problem

`MobileHeader`'s `DefaultRight` shows a sign-in pill (logged out) or an
initials avatar linking to `/dashboard` (logged in). Both duplicate the
bottom nav's profile tab, which already routes to `/auth/login` or
`/dashboard` by session state. Meanwhile the compare tray (spec
2026-07-02-car-compare) has a desktop header entry (`CompareDropdown`) but
no mobile header entry point.

## Decision

Replace `DefaultRight` in
`src/components/layout/mobile/MobileHeader.tsx` entirely — for both auth
states — with a compare entry:

- A `Link` to `/compare` styled as the header's standard `h-9 w-9` round
  icon button, always visible.
- Icon: the same two-arrow SVG paths as desktop `CompareDropdown`, for
  visual consistency across headers.
- Count badge from `useCompare().count`: the hand-rolled rose-500 span used
  by `MobileBottomNav`'s wishlist badge (99+ cap), hidden at 0. No antd
  `Badge` — `MobileHeader` stays antd-free.
- Tapping always goes straight to `/compare`; no mobile tray dropdown. The
  page already canonicalizes a non-empty tray into `?items=` and shows the
  empty state otherwise (`CompareFromStore`).
- `useSession`, `CustomerUser`, and `getInitials` are removed from the file
  (used nowhere else).
- i18n: reuse existing `header.compare` (present in all three locales) for
  `aria-label`; no new keys.
- Pages passing a `right` prop are unaffected (`right ?? <DefaultRight />`
  unchanged).

## Alternatives rejected

- Keep the avatar when logged in alongside compare — redundant with the
  bottom nav profile tab.
- Port `CompareDropdown` as a mobile bottom sheet — extra work for tray
  management the `/compare` page already provides.

## Verification

`npx tsc --noEmit` clean; mobile viewport shows the compare icon in the
header on all auth states, badge count tracks the tray, tap lands on
`/compare`.
