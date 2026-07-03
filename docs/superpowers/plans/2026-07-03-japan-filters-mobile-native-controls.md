# Japan Filters Mobile Native Controls Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the nested antd `Select`/`DatePicker` inside the mobile per-field bottom drawer with native in-drawer controls (option lists, two-column range lists, keyboard-free date picker), so touch users select values directly.

**Architecture:** `FieldDef` gains a discriminated `mobile: MobileControl` descriptor carrying the data each field needs. The desktop sidebar keeps rendering the existing `control` (antd JSX) untouched. The bottom drawer switches on `mobile.type` and renders new module-scope presentational components (`OptionList`, `RangeColumns`) or a keyboard-free `DatePicker`/`Input`.

**Tech Stack:** React (Next.js 16, "use client"), TypeScript, Ant Design v6, Tailwind, next-intl.

## Global Constraints

- Single file of production code: `src/components/cards/JapanAuctionFilters.tsx`. Plus translation keys in `messages/{mn,en,ru}.json`.
- **Desktop (`lg+`) must stay behaviourally unchanged.** Only the mobile drawer and the `FieldDef` shape change. The desktop `body`/`control` path is not modified.
- Live-apply semantics preserved: every control writes through the existing `set`/`setMarka`/`setModel`/`onChange` handlers; no draft state.
- Routing (if any added) uses `@/i18n/navigation`. (None expected here.)
- New translation key added to ALL three locales.
- `messages/*.json` currently has unrelated uncommitted changes. Translation edits are made but **NOT committed** — they stay in the working tree with the user's WIP. Only `JapanAuctionFilters.tsx` is committed.
- Verification gate (no test framework in repo): `npx tsc --noEmit` clean AND `npx eslint src/components/cards/JapanAuctionFilters.tsx` clean. Report both.
- Commit trailer: `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`.
- Work on branch `feat/japan-filters-mobile-native` (already checked out; design spec committed as `7489fcc`).

---

### Task 1: Add `search` translation key (uncommitted)

**Files:**
- Modify: `messages/mn.json` (featured.filters block)
- Modify: `messages/en.json` (featured.filters block)
- Modify: `messages/ru.json` (featured.filters block)

**Interfaces:**
- Consumes: nothing.
- Produces: translation key `featured.filters.search` — used by Task 3 for the drawer confirm button and the option-list search input placeholder.

- [ ] **Step 1: Add the key to `messages/mn.json`**

In the `featured.filters` object, immediately after the `"done"` line, add a `"search"` line. The `done` line reads `"done": "Болсон",`. Result:

```json
    "done": "Болсон",
    "search": "Хайх",
```

- [ ] **Step 2: Add the key to `messages/en.json`**

`done` line reads `"done": "Done",`. Result:

```json
    "done": "Done",
    "search": "Search",
```

- [ ] **Step 3: Add the key to `messages/ru.json`**

`done` line reads `"done": "Готово",`. Result:

```json
    "done": "Готово",
    "search": "Поиск",
```

- [ ] **Step 4: Verify all three JSON files parse**

Run:
```bash
for l in mn en ru; do node -e "JSON.parse(require('fs').readFileSync('messages/$l.json','utf8')); console.log('$l ok')"; done
```
Expected: `mn ok` / `en ok` / `ru ok`.

- [ ] **Step 5: Do NOT commit**

These files contain the user's unrelated in-progress edits. Leave them in the working tree. Confirm with `git status --short messages/` (still shows ` M`). No commit in this task.

---

### Task 2: Add `MobileControl` type + `mobile` descriptor to every `FieldDef`

**Files:**
- Modify: `src/components/cards/JapanAuctionFilters.tsx`

**Interfaces:**
- Consumes: existing option arrays (`markaOptions`, `modelOptions`, `chassisOptions`, `colorOptions`, `locationOptions`, `engVFromOptions`, `engVToOptions`, `yearFromOptions`, `yearToOptions`, `mileageFromOptions`, `mileageToOptions`), `RATE_OPTIONS`, `value`, and handlers `set`/`setMarka`/`setModel`. All already exist.
- Produces:
  - `type RangeOpt = { value: number; label: string }`
  - `type MobileControl` (discriminated union, definition below)
  - `FieldDef.mobile: MobileControl` populated for all 11 fields. Task 3 reads `activeField.mobile`.

- [ ] **Step 1: Add `RangeOpt` and `MobileControl` types**

Immediately after the existing `type FieldDef = {...}` block (currently at module scope near line 124), add:

```tsx
type RangeOpt = { value: number; label: string };

type MobileControl =
  | {
      type: "single";
      options: { value: string; label: React.ReactNode; searchText: string }[];
      value: string | null;
      onSelect: (v: string | null) => void;
    }
  | {
      type: "range";
      from: {
        options: RangeOpt[];
        value: number | null;
        onChange: (v: number | null) => void;
        placeholder: string;
      };
      to: {
        options: RangeOpt[];
        value: number | null;
        onChange: (v: number | null) => void;
        placeholder: string;
      };
    }
  | { type: "date"; value: string | null; onChange: (v: string | null) => void; placeholder: string }
  | { type: "text"; value: string; onChange: (v: string) => void; placeholder: string };
```

- [ ] **Step 2: Add `mobile` to the `FieldDef` type**

In `type FieldDef`, add the field (after `control`):

```tsx
  control: React.ReactNode;
  mobile: MobileControl;
  clear: () => void;
```

- [ ] **Step 3: Populate `mobile` on each of the 11 field objects**

Add a `mobile:` property to each entry in the `fields: FieldDef[]` array (alongside the existing `control`). Use exactly these values:

marka:
```tsx
      mobile: {
        type: "single",
        options: markaOptions.map((o) => ({ value: o.value, label: o.label, searchText: o.value })),
        value: value.marka,
        onSelect: (v) => setMarka(v),
      },
```

model:
```tsx
      mobile: {
        type: "single",
        options: modelOptions.map((o) => ({ value: o.value, label: o.label, searchText: o.value })),
        value: value.model,
        onSelect: (v) => setModel(v),
      },
```

chassis:
```tsx
      mobile: {
        type: "single",
        options: chassisOptions.map((o) => ({ value: o.value, label: o.label, searchText: String(o.label) })),
        value: value.chassis,
        onSelect: (v) => set("chassis", v),
      },
```

rate:
```tsx
      mobile: {
        type: "single",
        options: RATE_OPTIONS.map((r) => ({ value: r, label: r, searchText: r })),
        value: value.rate,
        onSelect: (v) => set("rate", v),
      },
```

lot:
```tsx
      mobile: { type: "text", value: value.lot, onChange: (v) => set("lot", v), placeholder: "LOT №" },
```

date:
```tsx
      mobile: {
        type: "date",
        value: value.date,
        onChange: (v) => set("date", v),
        placeholder: t("auctionDate.placeholder"),
      },
```

color:
```tsx
      mobile: {
        type: "single",
        options: colorOptions.map((o) => ({ value: o.value, label: o.label, searchText: o.value })),
        value: value.color,
        onSelect: (v) => set("color", v),
      },
```

engine:
```tsx
      mobile: {
        type: "range",
        from: { options: engVFromOptions, value: value.engVFrom, onChange: (v) => set("engVFrom", v), placeholder: t("engV.fromPlaceholder") },
        to: { options: engVToOptions, value: value.engVTo, onChange: (v) => set("engVTo", v), placeholder: t("engV.toPlaceholder") },
      },
```

year:
```tsx
      mobile: {
        type: "range",
        from: { options: yearFromOptions, value: value.yearFrom, onChange: (v) => set("yearFrom", v), placeholder: t("year.fromPlaceholder") },
        to: { options: yearToOptions, value: value.yearTo, onChange: (v) => set("yearTo", v), placeholder: t("year.toPlaceholder") },
      },
```

mileage:
```tsx
      mobile: {
        type: "range",
        from: { options: mileageFromOptions, value: value.mileageFrom, onChange: (v) => set("mileageFrom", v), placeholder: t("mileage.minPlaceholder") },
        to: { options: mileageToOptions, value: value.mileageTo, onChange: (v) => set("mileageTo", v), placeholder: t("mileage.maxPlaceholder") },
      },
```

location:
```tsx
      mobile: {
        type: "single",
        options: locationOptions.map((o) => ({ value: o.value, label: o.label, searchText: o.value })),
        value: value.location,
        onSelect: (v) => set("location", v),
      },
```

Note: `colorOptions[].label` is JSX (swatch + name) and `[].value` is the plain color name — `searchText: o.value` filters on the name. `chassisOptions[].label` is a string — `searchText: String(o.label)` filters on `code · model (count)`.

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit`
Expected: exit 0, no errors. (`mobile` is populated but not yet read — object properties are not flagged as unused.)

- [ ] **Step 5: Lint**

Run: `npx eslint src/components/cards/JapanAuctionFilters.tsx`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/components/cards/JapanAuctionFilters.tsx
git commit -m "feat: add mobile control descriptor to Japan filter fields

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: Native drawer rendering — `OptionList`, `RangeColumns`, keyboard-free date, footer

**Files:**
- Modify: `src/components/cards/JapanAuctionFilters.tsx`

**Interfaces:**
- Consumes: `MobileControl`, `RangeOpt`, `FieldDef.mobile` (Task 2); `featured.filters.search` (Task 1); existing `openField`/`setOpenField` state, `activeField`, `t`, `SearchIcon`, `cn`, `dayjs`.
- Produces: final mobile drawer. No new exports.

- [ ] **Step 1: Add `useRef` to the React import**

Change line 4 from:
```tsx
import { useMemo, useState } from "react";
```
to:
```tsx
import { useMemo, useRef, useState } from "react";
```

- [ ] **Step 2: Add a `CheckIcon` helper**

After the existing `CloseIcon` function (near line 107), add:

```tsx
function CheckIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}
```

- [ ] **Step 3: Add the `OptionList` module component**

After the `FilterPill` function (near line 847), add:

```tsx
function OptionList({
  options,
  selected,
  onSelect,
  searchPlaceholder,
  searchThreshold = 8,
}: {
  options: { value: string; label: React.ReactNode; searchText: string }[];
  selected: string | null;
  onSelect: (value: string) => void;
  searchPlaceholder: string;
  searchThreshold?: number;
}) {
  const [query, setQuery] = useState("");
  const showSearch = options.length > searchThreshold;
  const filtered =
    showSearch && query
      ? options.filter((o) =>
          o.searchText.toLowerCase().includes(query.toLowerCase()),
        )
      : options;
  return (
    <div className="flex flex-col">
      {showSearch && (
        <Input
          placeholder={searchPlaceholder}
          allowClear
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          prefix={<SearchIcon className="h-3.5 w-3.5 text-neutral-400" />}
          variant="filled"
          className="mb-2"
        />
      )}
      <div className="-mx-1 max-h-[50vh] overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="px-3 py-6 text-center text-[13px] text-neutral-400">
            —
          </div>
        ) : (
          filtered.map((o) => {
            const active = o.value === selected;
            return (
              <button
                key={o.value}
                type="button"
                onClick={() => onSelect(o.value)}
                className={cn(
                  "flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-left text-[14px] transition-colors",
                  active
                    ? "bg-primary/10 font-medium text-primary"
                    : "text-neutral-700 hover:bg-neutral-50 dark:text-neutral-200 dark:hover:bg-neutral-800",
                )}
              >
                <span className="min-w-0 flex-1 truncate">{o.label}</span>
                {active && <CheckIcon className="h-4 w-4 shrink-0" />}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Add the `RangeColumns` module component**

After `OptionList`, add:

```tsx
function RangeColumns({
  from,
  to,
}: {
  from: {
    options: RangeOpt[];
    value: number | null;
    onChange: (v: number | null) => void;
    placeholder: string;
  };
  to: {
    options: RangeOpt[];
    value: number | null;
    onChange: (v: number | null) => void;
    placeholder: string;
  };
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {[from, to].map((col) => (
        <div key={col.placeholder} className="min-w-0">
          <div className="mb-1.5 text-[11px] font-semibold uppercase text-neutral-500">
            {col.placeholder}
          </div>
          <div className="max-h-[45vh] overflow-y-auto rounded-lg border border-neutral-100 dark:border-neutral-800">
            {col.options.length === 0 ? (
              <div className="px-3 py-6 text-center text-[13px] text-neutral-400">
                —
              </div>
            ) : (
              col.options.map((o) => {
                const active = o.value === col.value;
                return (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => col.onChange(active ? null : o.value)}
                    className={cn(
                      "flex w-full items-center justify-between gap-1 px-3 py-2 text-left text-[13px] transition-colors",
                      active
                        ? "bg-primary/10 font-medium text-primary"
                        : "text-neutral-700 hover:bg-neutral-50 dark:text-neutral-200 dark:hover:bg-neutral-800",
                    )}
                  >
                    <span className="truncate">{o.label}</span>
                    {active && <CheckIcon className="h-3.5 w-3.5 shrink-0" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 5: Add the drawer body ref inside the component**

In `JapanAuctionFilters`, right after `const [openField, setOpenField] = useState<string | null>(null);` (line 141), add:

```tsx
  const drawerBodyRef = useRef<HTMLDivElement>(null);
```

- [ ] **Step 6: Add the `renderMobileControl` helper inside the component**

Immediately after `const activeField = fields.find((f) => f.key === openField) ?? null;` (near line 545), add:

```tsx
  const renderMobileControl = (m: MobileControl) => {
    switch (m.type) {
      case "single":
        return (
          <OptionList
            options={m.options}
            selected={m.value}
            searchPlaceholder={t("search")}
            onSelect={(v) => {
              m.onSelect(v);
              setOpenField(null);
            }}
          />
        );
      case "range":
        return <RangeColumns from={m.from} to={m.to} />;
      case "date":
        return (
          <DatePicker
            placeholder={m.placeholder}
            allowClear
            inputReadOnly
            value={m.value ? dayjs(m.value) : null}
            onChange={(d) => {
              m.onChange(d ? d.format("YYYY-MM-DD") : null);
              if (d) setOpenField(null);
            }}
            variant="filled"
            format="YYYY-MM-DD"
            style={{ width: "100%" }}
            getPopupContainer={() => drawerBodyRef.current ?? document.body}
          />
        );
      case "text":
        return (
          <Input
            placeholder={m.placeholder}
            allowClear
            prefix={<SearchIcon className="h-3.5 w-3.5 text-neutral-400" />}
            value={m.value}
            onChange={(e) => m.onChange(e.target.value)}
            variant="filled"
          />
        );
    }
  };
```

- [ ] **Step 7: Rewrite the bottom `Drawer` (footer + body)**

Replace the entire `<Drawer ...>...</Drawer>` block (currently lines ~651-680) with:

```tsx
      {/* Mobile per-field bottom drawer */}
      <Drawer
        open={openField != null}
        onClose={() => setOpenField(null)}
        placement="bottom"
        size="auto"
        title={activeField?.label}
        styles={{
          header: { padding: "16px 20px", borderBottom: "1px solid #f5f5f5" },
          body: { padding: "20px" },
          footer: { padding: 16 },
          section: { borderTopLeftRadius: 16, borderTopRightRadius: 16 },
        }}
        footer={
          activeField ? (
            <div className="flex items-center justify-between gap-2">
              <Button
                type="text"
                onClick={() => {
                  activeField.clear();
                  if (
                    activeField.mobile.type !== "range" &&
                    activeField.mobile.type !== "text"
                  )
                    setOpenField(null);
                }}
                disabled={!activeField.active}
                className="!text-neutral-500"
              >
                {t("clear")}
              </Button>
              {(activeField.mobile.type === "range" ||
                activeField.mobile.type === "text") && (
                <Button type="primary" onClick={() => setOpenField(null)}>
                  {t("search")}
                </Button>
              )}
            </div>
          ) : null
        }
      >
        <div ref={drawerBodyRef} className="relative">
          {activeField && renderMobileControl(activeField.mobile)}
        </div>
      </Drawer>
```

Rationale: single/date fields auto-close on selection (in `renderMobileControl`), so their footer shows only `Цэвэрлэх`, and clearing them also closes. range/text fields stay open for multi-step editing and close via the primary `Хайх` button; clearing them keeps the drawer open.

- [ ] **Step 8: Typecheck**

Run: `npx tsc --noEmit`
Expected: exit 0. The `switch (m.type)` is exhaustive over the union, so no "not all paths return" error.

- [ ] **Step 9: Lint**

Run: `npx eslint src/components/cards/JapanAuctionFilters.tsx`
Expected: no errors, no warnings. (`control` is still consumed by the desktop `body`; `OptionList`/`RangeColumns`/`CheckIcon` are all now referenced.)

- [ ] **Step 10: Build sanity (optional but recommended)**

Run: `npx tsc --noEmit` already covers types. If time permits: `npm run lint`.

- [ ] **Step 11: Commit**

```bash
git add src/components/cards/JapanAuctionFilters.tsx
git commit -m "feat: native in-drawer controls for Japan filters on mobile

Option lists (with search) replace nested Select; range fields use
two-column lists; date uses inputReadOnly + drawer-contained calendar;
confirm button renamed Болсон → Хайх (search) for range/text fields.
Desktop sidebar unchanged.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Manual verification (after Task 3)

Run `npm run dev` (port 2500), open a Japan auction listing page at mobile width (<1024px, DevTools device toolbar):

- **Single-select** (e.g. Үйлдвэрлэгч): pill → drawer opens with a native list; long lists (marka/chassis) show a search box that filters; tapping a row applies the filter (list updates behind) and the drawer closes; the pill turns primary with `Label: value` + ✕.
- **Date**: tap pill → drawer; tapping the date field does NOT raise the keyboard; the calendar appears inside the drawer; picking a day applies + closes; the page does not scroll away.
- **Range** (e.g. Хөдөлгүүр): two columns Доод/Дээд; tapping applies live; tapping the active row again clears that bound; `Хайх` closes.
- **Lot**: `Input` with keyboard as normal; `Хайх` closes.
- **Цэвэрлэх** clears each field type; the trailing clear-all still resets (keeping `date`); the desktop sidebar (≥1024px) looks and behaves exactly as before.

---

## Self-Review

**1. Spec coverage:**
- "Mobile drawer selects directly, no nested popup" → Task 3 `OptionList`/`RangeColumns` (single/range); date uses inline calendar; text keeps Input (typing is intended). ✓
- "DatePicker no keyboard, no page scroll" → Task 3 `inputReadOnly` + `getPopupContainer` → drawer body ref. ✓
- "Rename Болсон → Хайх where a confirm button exists" → Task 1 key + Task 3 footer uses `t("search")` for range/text. ✓
- "Desktop unchanged" → `control` and `body` untouched; only `FieldDef` gains a property and the drawer changes. ✓
- "search box for single lists > 8" → `OptionList` `searchThreshold = 8`. ✓
- "two-column range" → `RangeColumns`. ✓
- "footer logic table" → Task 3 Step 7 matches the spec table. ✓
- "answer body-scroll question (no global lock)" → no lock added; structural fix only. ✓
- "translations in all 3 locales, staged carefully" → Task 1 + Global Constraints (uncommitted). ✓

**2. Placeholder scan:** No TBD/TODO; every code step shows full code. ✓

**3. Type consistency:** `MobileControl` union members and `RangeOpt` defined in Task 2 are consumed verbatim in Task 3 (`renderMobileControl` switch arms, `OptionList` prop type, `RangeColumns` prop type). `onSelect` in the `single` union is `(v: string | null) => void`; `OptionList.onSelect` prop is `(value: string) => void` and the drawer adapts via `onSelect={(v) => { m.onSelect(v); setOpenField(null); }}` — `v: string` is assignable to `string | null`. ✓ `CheckIcon`/`OptionList`/`RangeColumns` names are consistent across definition and use. ✓
