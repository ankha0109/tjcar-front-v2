# Premium badge opens a membership modal design

**Date:** 2026-07-30
**Status:** Approved

## Problem

`PremiumBadge` marks paid USS lots on every card surface, but it explains
nothing. A customer who sees the gold chip has no way to learn what Premium
is, what it unlocks, or how to get it — the only place that copy exists today
is `PremiumGallery`'s locked teaser, which you reach only after opening a
premium car's detail page.

## Decision

Make the badge itself the entry point: clicking it opens a modal that explains
Premium membership and links to the top-up page.

### `PremiumInfoModal` (new)

`src/components/cards/shared/PremiumInfoModal.tsx` — antd `Modal`,
`footer={null}`, `centered`, `destroyOnHidden`, `width="min(460px, 92vw)"`.
Props: `open`, `onClose`.

Content, top to bottom:

- A gold unlocked-padlock glyph in a `bg-yellow-500/12` circle.
- Title `car.premiumInfo.title` and a lede that names the threshold through an
  ICU placeholder: `t("lede", { amount: formatMnt(MINIMUM_BALANCE) })`. The
  amount is never hardcoded in the copy — `MINIMUM_BALANCE` (`src/lib/bidConfig.ts`)
  stays the single source of truth, shared with `CarBidSection` and
  `PremiumGallery`.
- Four benefits, each a gold `✓` plus one line of text.
- A `BrandButton` inside a locale-aware `Link` to `/dashboard/wallet`, closing
  the modal on click.

Visual language follows the badge's gold (`yellow-500`) so the chip and the
modal read as one cue, the same way `PREMIUM_CARD_BORDER_CLASSES` ties the
chip to the card frame.

`/dashboard/wallet` does not exist yet and is out of scope for this change —
the link is written against the route the top-up page will claim. Signed-out
visitors who click it are redirected to `/{locale}/auth/login` by the
`/dashboard/*` guard in `src/proxy.ts`, so the modal needs no session logic.

### `PremiumBadge` changes

The rendered element becomes a `<button type="button">` holding its own
`useState(false)`, and renders `<PremiumInfoModal>` alongside the chip.

The click handler calls `preventDefault()` and `stopPropagation()` before
opening. This is mandatory, not defensive: every call site nests the badge
inside something clickable — `<Link>` wrappers in `CarCard` and `CarListItem`,
an `onRow`-clickable row in `CarTableView`. It is the same pattern
`CardActions` already uses for its wishlist and compare buttons, including the
`<button>`-inside-`<a>` nesting.

Styling gains `cursor-pointer` and a focus-visible ring; the existing size,
colour, and `text-[…]/tight` utilities are untouched.

All three call sites are unchanged — the badge owns the whole interaction.

### i18n

New `car.premiumInfo` namespace in `messages/{mn,en,ru}.json`:
`title`, `lede`, `benefitsTitle`, `benefit1`–`benefit4`, `cta`, `badgeAria`.

Benefits (mn):

1. Японы хамгийн том USS Auction-ы мэдээлэл, зургийг бүрэн харах
2. Дуудлага худалдаанд үнийн санал тавьж оролцох
3. Шинжээчийн үнэлгээний хуудсыг дэлгэрэнгүй үзэх
4. Мэргэжлийн зөвлөгөө, дэмжлэг авах

## Alternatives rejected

- **Route the click through the existing `openGuide` bus**
  (`src/components/modal/guideBus.ts`). It renders through `modal.confirm`
  with `title: null` and `footer: null`, which fights the structured
  title/list/CTA layout this needs, and it would push the benefit JSX into the
  badge.
- **Render the modal only while open** (`{open && <PremiumInfoModal …/>}`).
  Unnecessary: antd's `Modal` portals nothing until `open` first flips true,
  so an always-mounted instance per badge costs nothing and keeps the exit
  animation.
- **Build `/dashboard/wallet` in the same change.** The top-up flow needs its
  own backend contract review and spec.

## Verification

- Click the badge on a card in the Japan and Korea listings, the list view,
  and the table view: the modal opens and the card does **not** navigate.
- The lede shows `2,000,000₮` in all three locales.
- The CTA lands on `/{locale}/dashboard/wallet` (or the login page when
  signed out).
- Keyboard: the badge is tabbable and opens on Enter/Space.
