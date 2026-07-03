# Schedule Day Bottom-Drawer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** On phone viewports, replace the overflowing schedule tab rail with a compact trigger button that opens a bottom drawer of day options, in both AuctionBrowser and FeaturedAuctionSchedule.

**Architecture:** One new self-contained client component (`ScheduleDayDrawer` in `scheduleTabs.tsx`) owning its open/close state, fed a plain `days` array both parents already compute. Parents render it under `sm:hidden` and gate the existing tab rail behind `hidden sm:block`. No breakpoint knowledge inside the component.

**Tech Stack:** Next.js 16, antd 6.4.3 (`Drawer`), Tailwind CSS 4.2.1, next-intl.

**Spec:** `docs/superpowers/specs/2026-07-03-schedule-day-drawer-design.md`

## Global Constraints

- No test framework in this repo. Verification = `npx tsc --noEmit`, `npm run lint`, and dev-server checks. The dev server usually already runs on port 2500 (user's own `next dev`, HMR picks changes up) — do NOT start a second one if `curl -s -o /dev/null -w "%{http_code}" http://localhost:2500/mn` returns 200.
- Pre-existing lint findings live in `start.js`, `BrandsExplorer.tsx`, `CarSearchSection.tsx`, `MobileHome.tsx`, `LanguageSwitcher.tsx`, `AuctionBrowser.tsx` (`'total' unused`), `@mobileHeader/page.tsx` — ignore them; only NEW findings in touched files block.
- `messages/*.json` may carry the user's unrelated uncommitted WIP. Before staging, run `git status --porcelain messages/`; if it printed nothing before your edit, plain `git add` is safe. Otherwise stage ONLY your `pickDay` lines (fallback recipe in Task 1 Step 6).
- Breakpoint is `sm` (640px): drawer below, tab rail at `sm`+. Desktop tab markup must not change.
- i18n: any new key goes to ALL THREE locale files (`messages/mn.json`, `messages/en.json`, `messages/ru.json`).
- Commits go directly on `main` (repo convention).

---

### Task 1: `ScheduleDayDrawer` component + `pickDay` i18n key

**Files:**
- Modify: `src/components/cards/views/scheduleTabs.tsx` (append new exports; existing components untouched)
- Modify: `messages/mn.json`, `messages/en.json`, `messages/ru.json` (one key each)

**Interfaces:**
- Consumes: antd `Drawer`, `cn` from `@/utils` (already imported in the file: `cn` yes, `Drawer` no — extend the antd import).
- Produces (Tasks 2–3 rely on these exact names):
  - `export type ScheduleDayOption = { key: string; topLabel: string; day: string; month: string; weekend?: boolean; count?: number }`
  - `export function ScheduleDayDrawer(props: { selected: string; onSelect: (key: string) => void; allLabel: string; allCount?: number; days: ScheduleDayOption[]; title: string; emptyLabel?: string }): JSX.Element`
  - i18n key `featured.schedule.pickDay` in all three locales.

- [ ] **Step 1: Extend imports in `scheduleTabs.tsx`**

The file starts with:

```tsx
"use client";

import { Button } from "antd";
import { cn } from "@/utils";
```

Change to:

```tsx
"use client";

import { useState } from "react";
import { Button, Drawer } from "antd";
import { cn } from "@/utils";
```

- [ ] **Step 2: Append the component to the END of `scheduleTabs.tsx`**

Native `<button>` elements (not antd `Button`) are deliberate: drawer rows and
the trigger need none of antd's button chrome, and this avoids the `!`
override battles the tab tiles required.

```tsx
export type ScheduleDayOption = {
  key: string; // "YYYY-MM-DD"
  topLabel: string; // relative label ("Маргааш") or dow ("Sat")
  day: string; // "04"
  month: string; // "Jul"
  weekend?: boolean;
  count?: number;
};

// Mobile replacement for ScheduleTabList: a rail-styled trigger that opens a
// bottom drawer of day options. Parents gate it behind `sm:hidden`; the
// component itself has no breakpoint knowledge.
export function ScheduleDayDrawer({
  selected,
  onSelect,
  allLabel,
  allCount,
  days,
  title,
  emptyLabel,
}: {
  selected: string; // "all" | "YYYY-MM-DD"
  onSelect: (key: string) => void;
  allLabel: string;
  allCount?: number;
  days: ScheduleDayOption[];
  title: string;
  emptyLabel?: string;
}) {
  const [open, setOpen] = useState(false);

  const activeDay = days.find((d) => d.key === selected);
  const triggerLabel =
    selected === "all"
      ? allLabel
      : activeDay
        ? `${activeDay.topLabel} · ${activeDay.day} ${activeDay.month}`
        : selected;

  const pick = (key: string) => {
    onSelect(key);
    setOpen(false);
  };

  return (
    <>
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className="flex h-10 w-full min-w-0 items-center justify-between gap-2 rounded-2xl border border-neutral-200/80 bg-neutral-50/70 px-3.5 text-[12.5px] font-bold text-neutral-800 transition-colors hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 dark:border-neutral-800 dark:bg-neutral-900/40 dark:text-neutral-100 dark:hover:bg-neutral-800"
      >
        <span className="truncate">{triggerLabel}</span>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="shrink-0 text-neutral-400"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        placement="bottom"
        size="auto"
        title={title}
        styles={{
          header: { padding: "16px 20px", borderBottom: "1px solid #f5f5f5" },
          body: { padding: "8px 8px 16px" },
          section: { borderTopLeftRadius: 16, borderTopRightRadius: 16 },
        }}
      >
        <div role="listbox" aria-label={title} className="flex flex-col">
          <DrawerRow
            isActive={selected === "all"}
            onClick={() => pick("all")}
            label={allLabel}
            count={allCount}
            emptyLabel={emptyLabel}
          />
          {days.map((d) => (
            <DrawerRow
              key={d.key}
              isActive={selected === d.key}
              onClick={() => pick(d.key)}
              label={`${d.day} ${d.month}`}
              topLabel={d.topLabel}
              weekend={d.weekend}
              count={d.count}
              emptyLabel={emptyLabel}
            />
          ))}
        </div>
      </Drawer>
    </>
  );
}

function DrawerRow({
  isActive,
  onClick,
  label,
  topLabel,
  weekend,
  count,
  emptyLabel,
}: {
  isActive: boolean;
  onClick: () => void;
  label: string;
  topLabel?: string;
  weekend?: boolean;
  count?: number;
  emptyLabel?: string;
}) {
  const isEmpty = count === 0;
  return (
    <button
      type="button"
      role="option"
      aria-selected={isActive}
      onClick={onClick}
      className={cn(
        "flex min-h-11 w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left transition-colors",
        isActive
          ? "bg-neutral-100 dark:bg-neutral-800"
          : "hover:bg-neutral-50 dark:hover:bg-neutral-800/60",
        !isActive && isEmpty && "opacity-50",
      )}
    >
      <span
        className={cn(
          "inline-flex h-4 w-4 shrink-0 items-center justify-center text-neutral-900 dark:text-neutral-100",
          !isActive && "invisible",
        )}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M20 6 9 17l-5-5" />
        </svg>
      </span>
      <span className="flex min-w-0 flex-1 items-baseline gap-1.5">
        {topLabel && (
          <span
            className={cn(
              "shrink-0 text-[10px] font-semibold uppercase tracking-wide",
              weekend
                ? "text-rose-500"
                : "text-neutral-400 dark:text-neutral-500",
            )}
          >
            {topLabel}
          </span>
        )}
        <span className="truncate text-[13.5px] font-semibold tabular-nums text-neutral-900 dark:text-neutral-100">
          {label}
        </span>
      </span>
      {count != null && !isEmpty && (
        <span className="rounded-full bg-primary/10 px-1.5 text-[10.5px] font-semibold leading-4.5 tabular-nums text-primary">
          {count}
        </span>
      )}
      {isEmpty && emptyLabel && (
        <span className="text-[10.5px] font-medium text-neutral-400">
          {emptyLabel}
        </span>
      )}
    </button>
  );
}
```

- [ ] **Step 3: Add `pickDay` to all three locale files**

In each file, find the `featured` → `schedule` block (`grep -n '"pickDay"\|"carsUnit"' messages/*.json` — `carsUnit` marks the block) and insert one line directly after the `"all"` entry:

`messages/mn.json` (the block currently reads `"all": "Бүгд",` then `"carsUnit": "машин",`):

```json
      "all": "Бүгд",
      "pickDay": "Өдөр сонгох",
      "carsUnit": "машин",
```

`messages/en.json` — after its `"all"` line inside `featured.schedule`:

```json
      "pickDay": "Pick a day",
```

`messages/ru.json` — after its `"all"` line inside `featured.schedule`:

```json
      "pickDay": "Выбрать день",
```

- [ ] **Step 4: Verify the key exists in all three locales**

Run: `grep -c '"pickDay"' messages/mn.json messages/en.json messages/ru.json`
Expected: `1` for each file.

- [ ] **Step 5: Typecheck + lint**

Run: `npx tsc --noEmit`
Expected: exit 0. (The new exports are unused until Task 2 — that is fine, TS does not flag unused exports.)

Run: `npm run lint`
Expected: only the pre-existing findings listed in Global Constraints; nothing new for `scheduleTabs.tsx`.

- [ ] **Step 6: Commit (scoped staging for messages)**

Run: `git status --porcelain messages/` FIRST.

If it shows ONLY your three modified files and `git diff messages/mn.json` contains ONLY the `pickDay` hunk:

```bash
git add src/components/cards/views/scheduleTabs.tsx messages/mn.json messages/en.json messages/ru.json
git commit -m "feat: ScheduleDayDrawer mobile day picker + pickDay i18n key

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

If the diff contains OTHER (user WIP) hunks, stage only yours per locale file:

```bash
git diff -U3 -- messages/mn.json > /tmp/mn.patch
# edit /tmp/mn.patch down to only the pickDay hunk, then:
git apply --cached /tmp/mn.patch
# repeat for en/ru, then git add scheduleTabs.tsx and commit as above
```

---

### Task 2: Wire the drawer into AuctionBrowser

**Files:**
- Modify: `src/components/cards/AuctionBrowser.tsx:19-24` (import) and `:170-191` (toolbar row)

**Interfaces:**
- Consumes (from Task 1): `ScheduleDayDrawer` with props `{ selected: string; onSelect: (key: string) => void; allLabel: string; days: ScheduleDayOption[]; title: string }`; i18n key `featured.schedule.pickDay`. The local `days` items carry `{ key, topLabel, day, month, isWeekend, isHighlighted }` — map `isWeekend` → `weekend`; `isHighlighted` is not used by the drawer.
- Produces: nothing consumed later; Task 3 mirrors this shape independently.

- [ ] **Step 1: Extend the scheduleTabs import**

`src/components/cards/AuctionBrowser.tsx` currently imports:

```tsx
import {
  AllTab,
  DayTab,
  EmptyState,
  ScheduleTabList,
} from "@/components/cards/views/scheduleTabs";
```

Change to:

```tsx
import {
  AllTab,
  DayTab,
  EmptyState,
  ScheduleDayDrawer,
  ScheduleTabList,
} from "@/components/cards/views/scheduleTabs";
```

- [ ] **Step 2: Add the mobile drawer and gate the rail**

The toolbar row currently reads:

```tsx
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1 -mx-4 overflow-x-auto px-4 pb-3 [scrollbar-width:none] lg:mx-0 lg:px-0 [&::-webkit-scrollbar]:hidden">
```

Replace those two lines with:

```tsx
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1 pb-3 sm:hidden">
              <ScheduleDayDrawer
                selected={selected}
                onSelect={setSelected}
                allLabel={tSchedule("all")}
                days={days.map((d) => ({
                  key: d.key,
                  topLabel: d.topLabel,
                  day: d.day,
                  month: d.month,
                  weekend: d.isWeekend,
                }))}
                title={tSchedule("pickDay")}
              />
            </div>
            <div className="hidden min-w-0 flex-1 -mx-4 overflow-x-auto px-4 pb-3 [scrollbar-width:none] sm:block lg:mx-0 lg:px-0 [&::-webkit-scrollbar]:hidden">
```

(Everything inside the rail div — `ScheduleTabList` through its closing tag — stays exactly as-is.)

- [ ] **Step 3: Typecheck + lint**

Run: `npx tsc --noEmit` → exit 0.
Run: `npm run lint` → nothing new for `AuctionBrowser.tsx` (the pre-existing `'total' unused` warning there remains).

- [ ] **Step 4: SSR verification on the dev server**

With the dev server up on port 2500:

```bash
HTML=$(curl -s http://localhost:2500/mn/japan)
echo "$HTML" | grep -c 'aria-haspopup="dialog"'        # expect ≥ 1 (trigger rendered)
echo "$HTML" | grep -o 'min-w-0 flex-1 pb-3 sm:hidden' # expect match (mobile wrapper)
echo "$HTML" | grep -o 'hidden min-w-0 flex-1 -mx-4[^"]*sm:block[^"]*' | head -1  # rail gated
echo "$HTML" | grep -c 'role="tablist"'                # expect 1 (rail still SSRs)
```

Expected: all four greps match. Then eyeball in a browser: phone emulation — trigger + ViewModeSwitcher on one row, drawer opens from the bottom, picking a day filters the list and closes the drawer; desktop — tabs unchanged.

- [ ] **Step 5: Commit**

```bash
git add src/components/cards/AuctionBrowser.tsx
git commit -m "feat: mobile day-picker drawer on auction browser

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 3: Wire the drawer into FeaturedAuctionSchedule (with counts)

**Files:**
- Modify: `src/components/cards/FeaturedAuctionSchedule.tsx:19-24` (import) and `:169-197` (toolbar row)

**Interfaces:**
- Consumes (from Task 1): `ScheduleDayDrawer` incl. `allCount`, per-day `count`, `emptyLabel`. Locals in this file: `days` items carry `{ key, topLabel, day, month, full, isWeekend, isHighlighted }`; `countsByDate: Map<string, number>`; `cars` array; translator `t` is the `featured.schedule` namespace.
- Produces: nothing downstream.

- [ ] **Step 1: Extend the scheduleTabs import**

The file imports (lines 19–24):

```tsx
import {
  AllTab,
  DayTab,
  EmptyState,
  ScheduleTabList,
} from "@/components/cards/views/scheduleTabs";
```

Change to:

```tsx
import {
  AllTab,
  DayTab,
  EmptyState,
  ScheduleDayDrawer,
  ScheduleTabList,
} from "@/components/cards/views/scheduleTabs";
```

- [ ] **Step 2: Add the mobile drawer and gate the rail**

The toolbar row (around line 169) currently reads:

```tsx
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1 -mx-4 overflow-x-auto px-4 pb-3 [scrollbar-width:none] lg:mx-0 lg:px-0 [&::-webkit-scrollbar]:hidden">
```

Replace those two lines with:

```tsx
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1 pb-3 sm:hidden">
              <ScheduleDayDrawer
                selected={selected}
                onSelect={setSelected}
                allLabel={t("all")}
                allCount={cars.length}
                days={days.map((d) => ({
                  key: d.key,
                  topLabel: d.topLabel,
                  day: d.day,
                  month: d.month,
                  weekend: d.isWeekend,
                  count: countsByDate.get(d.key) ?? 0,
                }))}
                title={t("pickDay")}
                emptyLabel={t("empty")}
              />
            </div>
            <div className="hidden min-w-0 flex-1 -mx-4 overflow-x-auto px-4 pb-3 [scrollbar-width:none] sm:block lg:mx-0 lg:px-0 [&::-webkit-scrollbar]:hidden">
```

(Rail contents unchanged. If this file's `setSelected` is a `useState` setter its type `Dispatch<SetStateAction<string>>` is assignable to `(key: string) => void` — no wrapper needed.)

- [ ] **Step 3: Typecheck + lint**

Run: `npx tsc --noEmit` → exit 0.
Run: `npm run lint` → nothing new for `FeaturedAuctionSchedule.tsx`.

- [ ] **Step 4: SSR verification on the dev server**

`FeaturedAuctionSchedule` renders on the home page:

```bash
HTML=$(curl -s http://localhost:2500/mn)
echo "$HTML" | grep -c 'aria-haspopup="dialog"'   # expect ≥ 1
echo "$HTML" | grep -c 'role="tablist"'           # expect ≥ 1 (rail still SSRs)
```

Expected: both match. Eyeball: home page phone emulation — trigger shows "Бүгд" with the drawer listing counts per day (0-count rows dimmed with "Хоосон"); desktop unchanged.

- [ ] **Step 5: Commit**

```bash
git add src/components/cards/FeaturedAuctionSchedule.tsx
git commit -m "feat: mobile day-picker drawer on featured schedule

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```
