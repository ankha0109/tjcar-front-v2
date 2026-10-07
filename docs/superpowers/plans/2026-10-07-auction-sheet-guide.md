# Auction Sheet Guide Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** A standalone `/[locale]/auction-sheet` page that draws each of ten Japanese auction houses' sheets as vector SVG and explains every box on hover, focus or tap, in mn / en / ru.

**Architecture:** One generic client renderer (`SheetSvg`) draws a house from data: a list of cells in a `1000 × height` viewBox, each naming a field. Field metadata and per-locale text are typed TypeScript records keyed by `FieldKey`, loaded by this page only. Page chrome lives in `messages/*.json` under `auctionSheet`.

**Tech Stack:** Next.js 16 (app router), React 19, next-intl 4, Tailwind v4, antd 6 (only the existing modal).

**Spec:** `docs/superpowers/specs/2026-10-07-auction-sheet-guide-design.md`

**Execution:** native, in the brainstorming session — the user approved the design, pre-approved this plan and asked for the work to be finished unattended. No commits; the result is left in the working tree for review.

## Global Constraints

- Locales `mn`, `en`, `ru`; every `messages` key added to all three.
- Routing through `@/i18n/navigation` (`Link`); `useSearchParams` stays on `next/navigation`.
- Page container: `mx-auto w-full max-w-7xl px-4 lg:px-6`.
- Never `tracking-*`, `font-mono`, `tabular-nums`.
- `hover:` is gated behind `(hover: hover)` in Tailwind v4 — nothing may be reachable by hover only.
- Anything clearing the fixed header reads `var(--header-h)`.
- Anchors need their colour class on the `<a>` itself (antd reset).
- mn copy: market wording ("Хайбрид", never "гибрид"); never "бүрэн сүйрсэн"/total loss.
- No test runner exists and none is added. Field coverage is a type error, not a test.
- The reference site's images and wording are not copied; its hotspot percentages are measurements only.

## Review Focus

1. `?auction=` is garbage or names a house outside the ten → page renders USS, no crash, no 404.
2. A lot whose `AUCTION` is not one of the ten (`Honda Tokyo`) → the modal link still works, opening the default house.
3. Phone, 390px, fit-to-width: a 12px-wide box → reachable through the stepper and the rail.
4. Zoomed sheet scrolled horizontally → the pinned popover stays inside the visible part.
5. A long localized label in a small box → shrinks, wraps to two lines or truncates; never spills over the neighbour.

Each is exercised in Task 8's browser pass, since there is no runner to pin them in.

---

## File structure

| File | Responsibility |
| --- | --- |
| `src/lib/auctionMarks.ts` | `MARK_CODES`, `MarkCode` (moved out of `EvaluationGuide`) |
| `src/lib/auctionSheet/fields.ts` | `FIELD_META`, `FieldKey`, `FieldGroup`, `FIELD_GROUPS` |
| `src/lib/auctionSheet/types.ts` | `SheetCell`, `SheetMark`, `AuctionHouse`, `HouseId`, `FieldText` |
| `src/lib/auctionSheet/text/{mn,en,ru}.ts` | `Record<FieldKey, FieldText>` per locale |
| `src/lib/auctionSheet/text/index.ts` | `getFieldText(locale)` |
| `src/lib/auctionSheet/houses/*.ts` | one `AuctionHouse` each (ten files) |
| `src/lib/auctionSheet/index.ts` | `HOUSES`, `HOUSE_IDS`, `getHouse`, `matchHouse`, `houseStops` |
| `src/lib/auctionSheet/fit.ts` | `fitText` — deterministic text fitting for SVG |
| `src/components/auction-sheet/SheetExplorer.tsx` | client; house, label mode, zoom, hovered/pinned state, URL sync |
| `src/components/auction-sheet/SheetSvg.tsx` | draws one house; emits enter/leave/select |
| `src/components/auction-sheet/CarDiagram.tsx` | unfolded car outline + damage marks |
| `src/components/auction-sheet/SheetPopover.tsx` | anchored explanation card + stepper |
| `src/components/auction-sheet/FieldRail.tsx` | grouped field list, two-way highlight |
| `src/components/auction-sheet/AuctionSheetHero.tsx` | server; hero band |
| `src/components/auction-sheet/GradeScale.tsx` | server; overall + interior/exterior grades |
| `src/components/auction-sheet/MarkLegend.tsx` | server; damage mark grid |
| `src/app/[locale]/auction-sheet/page.tsx` | metadata, reads `?auction=`, composes the page |

Modified: `EvaluationGuide.tsx`, `CarEvaluation.tsx`, `DesktopFooter.tsx`, `MobileDrawer.tsx`, `messages/{mn,en,ru}.json`.

## Interfaces (shared by every task)

```ts
// fields.ts
export type FieldGroup =
  | "identity" | "grade" | "spec" | "docs" | "equipment" | "notes" | "diagram";
export type FieldMeta = {
  group: FieldGroup;
  /** Label as printed on a typical sheet. */
  jp: string;
  /** What the inspector writes in — the sample car. */
  sample?: string | string[];
  /** Printed choices; `picked` is the one circled in ink. */
  options?: string[];
  picked?: number;
};
export const FIELD_META = { /* … */ } satisfies Record<string, FieldMeta>;
export type FieldKey = keyof typeof FIELD_META;
export const FIELD_GROUPS: FieldGroup[];

// types.ts
export type CellKind = "field" | "label" | "value" | "note" | "check" | "diagram";
export type SheetCell = {
  field: FieldKey;
  x: number; y: number; w: number; h: number;   // viewBox units, width = 1000
  kind?: CellKind;                               // default "field"
  jp?: string;                                   // overrides FIELD_META[field].jp
  sample?: string | string[];
  options?: string[];
  picked?: number;                               // -1 = nothing circled
};
export type SheetMark = { code: MarkCode; x: number; y: number }; // 0..1 inside the diagram cell
export type HouseId =
  | "uss" | "taa" | "caa" | "mirive" | "bayauc" | "iaa" | "hero" | "arai" | "laa" | "ju";
export type AuctionHouse = {
  id: HouseId; name: string; height: number; cells: SheetCell[]; marks: SheetMark[];
};
export type FieldText = {
  title: string; short?: string; description: string;
  sample?: string | string[]; options?: string[];   // localized, used in translated-label mode
};

// index.ts
export const HOUSES: AuctionHouse[];
export const HOUSE_IDS: HouseId[];
export function getHouse(id: string | undefined): AuctionHouse;        // falls back to USS
export function matchHouse(auctionName: string | undefined): HouseId | undefined;
export type Stop =
  | { id: string; type: "field"; field: FieldKey; cells: SheetCell[] }
  | { id: string; type: "mark"; code: MarkCode; mark: SheetMark };
export function houseStops(house: AuctionHouse): Stop[];               // reading order

// fit.ts
export function fitText(text: string, w: number, h: number,
  opts: { max: number; min: number; lines?: number }): { size: number; lines: string[] };
```

---

### Task 1: Field vocabulary and types

**Files:** create `src/lib/auctionMarks.ts`, `src/lib/auctionSheet/{fields,types}.ts`; modify `src/components/car-detail/EvaluationGuide.tsx` to import `MARK_CODES`.

- [x] Move `MARK_CODES` verbatim into `auctionMarks.ts`, export `MarkCode`.
- [x] Write `FIELD_META` covering every box on the ten sheets, with the sample car (Prius ZVW30, lot 3765, grade 4 / B).
- [x] Write `types.ts` as above.
- [x] `npx tsc --noEmit` passes.

### Task 2: House layouts

**Files:** create `src/lib/auctionSheet/houses/{uss,taa,caa,mirive,bayauc,iaa,hero,arai,laa,ju}.ts`, `src/lib/auctionSheet/index.ts`.

- [x] Per house, map each measured box to a `FieldKey` + kind (scratchpad `map_<id>.json`), reading the printed label off the flattened original.
- [x] Run the scratchpad generator: percent → viewBox units, cluster edges within 0.6% so neighbours share a border, sort into reading order, emit the `.ts`.
- [x] `index.ts`: `HOUSES` in the reference's order, `getHouse`, `matchHouse` (first token of the upper-cased name; `BAY` and `BAYAUC` both → `bayauc`), `houseStops`.
- [x] `npx tsc --noEmit` passes — an unknown field key in any house fails here.

### Task 3: Field text, three locales

**Files:** create `src/lib/auctionSheet/text/{mn,en,ru,index}.ts`.

- [x] One `Record<FieldKey, FieldText>` per locale: `title`, `short` where the title will not fit a box, `description` of one or two sentences, localized `sample`/`options` where the Japanese sample is prose.
- [x] `getFieldText(locale)` falls back to `mn`.
- [x] `npx tsc --noEmit` passes — a key missing from one locale fails here.

### Task 4: Renderer

**Files:** create `fit.ts`, `SheetSvg.tsx`, `CarDiagram.tsx`.

- [x] `fitText`: width estimate of 1em for CJK and 0.56em otherwise; shrink from `max` to `min`, then wrap at spaces up to `lines`, then truncate with `…`.
- [x] `SheetSvg` props: `house`, `text`, `labelMode: "jp" | "local"`, `activeId`, `pinnedId`, `onEnter(id)`, `onLeave()`, `onSelect(id)`, `markLabel(code)`. Paper rect, one `<g>` per stop, cells drawn by kind; ink samples `fill-blue-700 dark:fill-blue-300`; active stop tinted with `--color-primary`.
- [x] Pointer handling: `onPointerEnter` only for `pointerType === "mouse"`; `onClick` selects; `tabIndex=0`, `role="button"`, `aria-label`, Enter/Space select.
- [x] `CarDiagram`: own drawing (body, glass, doors, wheels) in a `0 0 200 300` box, scaled into the diagram cell; marks as focusable ink labels.

### Task 5: Explorer, popover, rail

**Files:** create `SheetExplorer.tsx`, `SheetPopover.tsx`, `FieldRail.tsx`.

- [x] `SheetExplorer` props: `initialHouse: HouseId`, `text: Record<FieldKey, FieldText>`. State: `houseId`, `labelMode`, `zoomed`, `hovered`, `pinned`; `active = hovered ?? pinned`. Tab change → `history.replaceState(null, "", "?auction=…")`, clears hover and pin.
- [x] Popover anchored to the union box of the active stop's cells: below it, or above when the box sits in the lower 45% of the sheet; full-width under `sm`, 320px otherwise, clamped to the sheet. `pointer-events-none` unless pinned. Pinned: ×, `‹ n / total ›`. Esc unpins.
- [x] Zoom: scroller `overflow-x-auto`, inner width `100%` or `240%`; popover row spans the inner width with a `sticky left-0` child sized to the scroller.
- [x] `FieldRail`: grouped by `FIELD_GROUPS`, each row title + `jp` + description; `lg:sticky lg:top-[calc(var(--header-h)+1rem)]` with its own scroll; scrolls the active row into its own view by setting `scrollTop`, never the window.

### Task 6: Page and static sections

**Files:** create `src/app/[locale]/auction-sheet/page.tsx`, `AuctionSheetHero.tsx`, `GradeScale.tsx`, `MarkLegend.tsx`; modify `messages/{mn,en,ru}.json` (`auctionSheet` namespace).

- [x] Page: `generateMetadata` from `auctionSheet.metadata`; `searchParams.auction` → `getHouse(...).id`; `setRequestLocale`; hero, explorer, grade scale, mark legend, CTA to `/japan`.
- [x] `GradeScale`: overall S / 6 / 5 / 4.5 / 4 / 3.5 / 3 / 2 / 1 / R·RA / ✱✱✱, and interior·exterior A–E.
- [x] `MarkLegend`: `MARK_CODES` × `carDetail.evaluationGuide.marks`.

### Task 7: Entry points

**Files:** modify `EvaluationGuide.tsx`, `CarEvaluation.tsx`, `DesktopFooter.tsx`, `MobileDrawer.tsx`, `messages/*`.

- [x] `EvaluationGuide` takes `auction?: string`; the modal body ends with a `Link` to `/auction-sheet` (`?auction=` when `matchHouse` resolves).
- [x] `CarEvaluation` passes `car.AUCTION`.
- [x] Footer company column and drawer secondary list gain the link (`footer.company.auctionSheet`, `header.nav.auctionSheet`).

### Task 8: Verification

- [x] `npx tsc --noEmit`, `npx eslint src`, `npx next build`.
- [x] `grep -rn "tabular-nums\|font-mono\|tracking-" src/components/auction-sheet src/app/\[locale\]/auction-sheet` is empty.
- [x] `/verify`: all ten houses rendered next to the reference geometry; desktop hover + pin + keyboard; phone tap, stepper, zoom; dark mode; en and ru; the five Review Focus cases.

## Outcome

All eight tasks done in one session. `tsc --noEmit` clean, `eslint src` 0 errors
(9 warnings, all in files this change did not write), `next build` passes with
`/[locale]/auction-sheet` in the route table.

Departures from the tasks above, all recorded in the spec's "As built":

- Task 2: `HOUSES` is ordered by catalogue volume, and `matchHouse` moved to
  `match.ts`.
- Task 3: `FieldText` has no `sample` / `options`; `text/glossary.ts` translates
  what is written on the sheets instead.
- Task 4: `SheetSvg` also takes `glossary`.

Browser pass (headless Chrome over CDP, dev server): all ten houses in both
label modes; hover, pin, ← → and Esc on desktop; tap, stepper, zoom, sticky bar
with the header hidden and shown, and rail → sheet reveal at 390px; dark mode;
`ru` and `en`; `?auction=zzz` / `honda` / empty fall back to USS; the lot modal
links to `?auction=caa` from a CAA lot and to the bare page from an ISUZU lot.
