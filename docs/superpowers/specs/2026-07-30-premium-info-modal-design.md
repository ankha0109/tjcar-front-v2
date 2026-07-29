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

### `PremiumInfoModalRoot` (new)

`src/components/modal/PremiumInfoModalRoot.tsx` — antd `Modal`,
`footer={null}`, `centered`, `destroyOnHidden`, `width="min(460px, 92vw)"`.

It is mounted **once**, in `AntdProvider` beside `GuideModalRoot`, and owns its
own `open` state. `PremiumBadge` opens it by dispatching through
`src/components/modal/premiumInfoBus.ts` (`openPremiumInfo()`), mirroring the
existing `guideBus` pattern.

The modal cannot be a child of the badge. React portals bubble events through
the **React tree**, not the DOM, so a `Modal` rendered under `PremiumBadge`
sends every click inside it — the close button, the mask, the CTA — up to the
card's `<Link>`, which navigates to the car. This was observed, not theorised:
the first implementation opened correctly but navigated away the moment the
user closed the modal. Mounting the modal outside every card removes the
parent `<Link>` from its React ancestry entirely.

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

The rendered element becomes a `<button type="button">` whose click calls
`openPremiumInfo()`. The badge holds no state.

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

- **Reuse the existing `openGuide` bus** (`src/components/modal/guideBus.ts`).
  The right shape — a dedicated root plus a dispatch — but the wrong renderer:
  `GuideModalRoot` draws through `modal.confirm` with `title: null` and
  `footer: null`, which fights the structured title/list/CTA layout, and it
  would push the benefit JSX into the badge. `premiumInfoBus` copies the
  pattern, not the component.
- **Keep the modal inside `PremiumBadge` and stop propagation on a wrapper.**
  Only covers the children this code renders; antd owns the mask and the close
  button, so their clicks would still reach the card `<Link>`.
- **Build `/dashboard/wallet` in the same change.** The top-up flow needs its
  own backend contract review and spec.

## Verification

Driven in headless Chrome over CDP against the dev server, with real mouse and
key events:

- Badge click opens the modal and the listing does **not** navigate — grid,
  list and table views (the table row uses `onRowClick` rather than a `<Link>`,
  so both nesting mechanisms are covered).
- Open → close repeated three times on one page stays on `/mn/japan`; mask
  click and the X button close without navigating.
- The lede renders `2,000,000₮` and the CTA resolves to
  `/{locale}/dashboard/wallet` in all of `mn`, `en`, `ru`.
- Signed out, the CTA lands on `/mn/auth/login` via the `/dashboard/*` guard.
- The badge is focusable and opens the modal on Enter.

Known, pre-existing: Escape does not close this modal. It does not close
`SampleReportModal` either — in this app only the imperative `modal.confirm`
path (`GuideModalRoot`) registers antd v6's Escape handler. Out of scope here;
fixing it belongs in a change that covers every declarative `<Modal>`.
