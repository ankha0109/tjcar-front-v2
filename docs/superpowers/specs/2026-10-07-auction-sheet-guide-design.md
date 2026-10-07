# Auction sheet guide page

**Date:** 2026-10-07
**Status:** implemented 2026-10-07 (see "As built" at the end for where it departs from this design)

## Problem

A Japanese lot is bought off its auction sheet, and the sheet is a dense form in
Japanese whose layout changes from one auction house to the next. The only help
the site gives today is `EvaluationGuide` — a modal on the lot page that decodes
the damage marks (A1, U2, W1…). Nothing explains the form itself: where the
grade sits, which box is the shaken date, what the circled abbreviations mean.

Reference: <https://jpstar.ru/informaciya/kak-chitat-auktsionnyj-list/>. Ten
auction tabs, each a raster image of the sheet (original / translated) with
35–80 percent-positioned hotspots that show a tooltip on hover. It is not
vector, has no dark mode, and hover does nothing on a phone.

## Goals

1. A standalone page, `/[locale]/auction-sheet`, that shows one auction house's
   sheet as a vector drawing and explains every box on hover, focus or tap.
2. The same ten houses as the reference: USS, TAA, CAA, MIRIVE, BAYAUC,
   IAA Osaka, HERO, ARAI, LAA, JU. All ten are in our catalogue.
3. mn / en / ru for every explanation, and the printed labels on the sheet
   switch between the Japanese original and the page locale.
4. Usable on a phone, where the viewport is not user-scalable.
5. Reachable from the lot page with the lot's own auction house preselected.

## Non-goals

- Houses outside the ten (Honda, NAA, ORIX, ZERO, LUM, Nissan…).
- Real scanned sheets, PDF export.
- A header nav entry — the bar is full.
- A test runner. The repo has none; correctness is carried by types (below).

Decided in brainstorming: our own vector SVG (not a scan with overlays), all ten
houses in the first version.

## Approach

One generic renderer, data per house.

```
src/lib/auctionSheet/
  types.ts        SheetCell, AuctionHouse, FieldKey, HouseId
  fields.ts       FIELD_META: key → { group, jp, sample?, options?, picked? }
  text/{mn,en,ru}.ts   Record<FieldKey, { title, short?, description, sample?, options? }>
  houses/{uss,taa,…}.ts   one AuctionHouse each
  index.ts        HOUSES, getHouse, matchHouse(auctionName)
```

- **Geometry.** Every sheet is drawn in a `1000 × height` viewBox. A cell is
  `{ field, x, y, w, h, kind?, jp?, sample? }`. Cells that share a `field` light
  up together, so a label box and its value box read as one thing.
- **Cell kinds.** `field` (label top-left, handwritten sample centred — the
  default), `label`, `value`, `note` (multi-line handwriting), `check` (an
  equipment abbreviation, circled in ink when fitted), `diagram` (the unfolded
  car outline with sample damage marks).
- **Samples.** One fictional car is written across all ten sheets in ink blue,
  so the reader sees the difference between what is printed and what the
  inspector writes. Defaults live on the field; a house overrides per cell.
- **Field text is TypeScript, not `messages/*.json`.** `NextIntlClientProvider`
  ships the whole message file to every page; ~85 fields × three strings would
  tax every route for the sake of one. As `Record<FieldKey, …>` per locale the
  dictionary is loaded by this page only, and a key missing from any locale is a
  type error. Precedent: `src/lib/koreaOptionNames.ts`. Page chrome (hero,
  buttons, group names, grade table) stays in `messages` under `auctionSheet`.
- **Layout source.** Cell positions follow the real forms; the reference site's
  hotspot percentages are used as measurements, snapped to shared edges, and
  checked against sheets from our own catalogue. Its images and wording are not
  copied.

## Page

```
Hero
Auction pills (10)                         Labels: [ Japanese | locale ]
┌ sheet (SVG) ───────────────┬ fields rail (sticky, grouped) ┐
│  hover → cell tint + popover│  hover/tap ↔ highlights cell  │
└─────────────────────────────┴───────────────────────────────┘
Grade scale (overall S…R, interior/exterior A–E)
Damage marks (reuses carDetail.evaluationGuide.marks)
CTA → /japan
```

- `?auction=<id>` picks the house. Switching tabs rewrites the query with
  `history.replaceState`, so the page neither navigates nor jumps to the top.
  The server reads the param so the first paint is already the right sheet.
- No `@mobileHeader` file: the page falls through to `[...rest]` and gets the
  default bar, which is what an untitled content page wants.

## Interaction

- **Mouse:** hover tints the cell and anchors a popover to it (title, the
  Japanese label, description). The popover is `pointer-events: none` until
  pinned, so it never blocks the next cell. Click pins; Esc or × unpins.
- **Touch:** tap pins. The pinned popover carries `‹ n / total ›` — on a 390px
  screen some boxes are 12px wide and cannot be hit with a finger.
- **Zoom.** `userScalable: false` rules out pinch, so the sheet has its own
  zoom toggle: fit-to-width, or wide inside a horizontal scroller. The popover
  stays in the visible part of the scroller (`position: sticky; left: 0`).
- **Keyboard:** each stop is a focusable `role="button"`; focus behaves as
  hover, Enter/Space pins.
- **Rail ↔ sheet:** hovering a rail row highlights its cell and the other way
  round. The rail prints every title and description, so the content is in the
  HTML for search engines, not only in a tooltip.
- **Diagram marks** are stops too; their text comes from the existing
  `carDetail.evaluationGuide.marks.*`.

## Entry points

- `EvaluationGuide` modal gains a "full guide" link, `auction` passed down from
  `CarEvaluation` and resolved with `matchHouse` (`"USS Niigata"` → `uss`).
- `DesktopFooter` company column and `MobileDrawer` secondary list.
- `MARK_CODES` moves out of `EvaluationGuide` into `src/lib/auctionMarks.ts` so
  the modal and the page share it.

## Caveats printed on the page

Houses revise their forms, and JU is a federation whose prefectures differ. The
sheet shown is the typical one; the existing "wording varies by house" note is
kept.

## Verification

`tsc --noEmit`, `eslint`, `next build`, then `/verify`: desktop and phone
(CDP device metrics), light and dark, three locales, each of the ten houses.

## As built

- **Field text carries no samples.** `text/{mn,en,ru}.ts` is `{ title, short?,
  description }` only. What is *written* on a sheet — the handwriting and the
  printed choices — is translated line by line through one table,
  `text/glossary.ts`, because houses override samples per box and a per-field
  translation could not follow them.
- **`matchHouse` lives in `match.ts`**, not `index.ts`: the index imports all ten
  layouts and the lot page only needs the lookup to build a link.
- **Tab order** is by how much of our catalogue each house supplies
  (USS, TAA, JU, CAA, …), not the reference site's order.
- **73 fields**, six of them found on one house only: `venue`,
  `wheelMirrorCondition`, `tires` (MIRIVE) and `userPurchase`, `eqTuner`,
  `partsCondition` (IAA).
- **A field printed as three or more differently-labelled boxes keeps its
  Japanese headings in translated mode** (IAA's six-part condition strip) — one
  title cannot label six boxes.
- **Cross-checked against real sheets from our catalogue:** CAA Chubu, MIRIVE
  Saitama, JU Ibaraki — each matched box for box, and MIRIVE's real sheet
  corrected several boxes the reference had mislabelled. **Not cross-checked:** USS
  (local USS lots carry only a thumbnail of the sheet), TAA (same form as CAA),
  BAYAUC, ARAI, and IAA / HERO / LAA beyond the reference. Those follow the
  reference's measurements alone.
- **MIRIVE's `キーロック` box is drawn nowhere.** Its meaning could not be
  confirmed, and a wrong explanation is worse than a missing one.
- The layouts were generated once from measurements and are now plain data,
  maintained by hand; the generator was a throwaway and is not in the repo.
