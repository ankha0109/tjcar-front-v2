# Japan Auction Filters — Mobile Pill + Bottom Drawer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** On mobile (`<lg`), replace the single "Filters" button + left drawer with an inline horizontally-scrollable pill row where each pill opens a per-filter Bottom Drawer, while leaving desktop unchanged.

**Architecture:** Extract the 11 filter controls into a single `fields` descriptor array (one source of truth). The desktop sidebar sections and the new mobile pills/sheets both render from this array. A per-field Bottom Drawer (`placement="bottom"`) is driven by an `openField` state and applies changes live.

**Tech Stack:** Next.js 16, React, TypeScript, Ant Design v6 (`Drawer`, `Select`, `Input`, `DatePicker`, `Space.Compact`, `Button`), Tailwind, `next-intl`.

## Global Constraints

- Single file for logic: `src/components/cards/JapanAuctionFilters.tsx`. Parent components (`AuctionBrowser.tsx`, `FeaturedAuctionSchedule.tsx`) MUST NOT be edited.
- Desktop (`lg+`) visual output stays byte-for-identical: keep the existing section badge counts (`vehicleCount`, `auctionCount`, `specsCount`, `advancedCount`) wired to the desktop `Section`s. `fields[].active` is a per-field boolean used ONLY by mobile pills — it does not replace the desktop counts.
- Live-apply everywhere (existing `onChange` semantics). No draft state.
- Clear-all preserves date: `onChange({ ...EMPTY_FILTERS, date: value.date })` (existing behaviour; `date` is day-tab navigation).
- Do NOT touch `messages/*.json` — the working tree already has unrelated uncommitted changes in those files. The mobile clear-all button reuses the existing `featured.filters.clear` key (the spec-sanctioned fallback), which is also what the current desktop/mobile clear-all already uses. No new locale key is added.
- No unit-test framework exists in this repo. Automated gate per task is `npm run lint` + `npx tsc --noEmit`; behaviour is confirmed manually via `npm run dev` (port 2500) at mobile (`<1024px`) and desktop (`≥1024px`) widths.
- Reuse the existing SVG icon helper style and the `Section` / `Field` components already in the file.

---

## File Structure

- **Modify:** `src/components/cards/JapanAuctionFilters.tsx`
  - Add module-level `rangeSummary` helper, `CloseIcon` SVG helper, `FilterPill` component, and `FieldSection` / `FieldDef` types.
  - Add a `fields: FieldDef[]` array inside the component; refactor `body` to render from it.
  - Replace mobile trigger bar + left `Drawer` with a pill row + a bottom `Drawer`.
  - Change `JapanAuctionFilterChips` root to hide on mobile.
  - The mobile clear-all button reuses the existing `featured.filters.clear` key — no `messages/*.json` edits (those files carry unrelated uncommitted work).

---

## Task 1: Extract `fields` descriptor and refactor desktop `body`

Foundational refactor. After this task the desktop sidebar looks and behaves identically; only the internal source of the controls changes.

**Files:**
- Modify: `src/components/cards/JapanAuctionFilters.tsx`

**Interfaces:**
- Produces:
  - `type FieldSection = "vehicle" | "auction" | "specs" | "advanced"`
  - `type FieldDef = { key: string; label: string; section: FieldSection; active: boolean; summary: string | null; control: React.ReactNode; clear: () => void }`
  - `const fields: FieldDef[]` (11 entries, order: marka, model, chassis, rate, lot, date, color, engine, year, mileage, location) — consumed by Task 3.
  - `rangeSummary(from, to, fmt)` module helper.

- [ ] **Step 1: Add the `rangeSummary` module helper**

Insert directly after the existing `formatCc` function (near the top, after line ~31):

```tsx
// Short "from–to" label for range pills; mirrors the chip formatting (… for an open bound).
const rangeSummary = (
  from: number | null,
  to: number | null,
  fmt: (n: number) => string,
): string | null => {
  if (from == null && to == null) return null;
  return `${from != null ? fmt(from) : "…"}–${to != null ? fmt(to) : "…"}`;
};
```

- [ ] **Step 2: Add the `FieldSection` / `FieldDef` types**

Insert at module scope (e.g. just above `export default function JapanAuctionFilters`):

```tsx
type FieldSection = "vehicle" | "auction" | "specs" | "advanced";

type FieldDef = {
  key: string;
  label: string;
  section: FieldSection;
  active: boolean;
  summary: string | null;
  control: React.ReactNode;
  clear: () => void;
};
```

- [ ] **Step 3: Build the `fields` array**

Inside the component, insert after the `const hasFilters = !isFiltersEmpty(value);` line (~line 238) and BEFORE `const body = (`. Each `control` is copied verbatim from the current `body`:

```tsx
const fields: FieldDef[] = [
  {
    key: "marka",
    label: t("placeholders.marka"),
    section: "vehicle",
    active: !!value.marka,
    summary: value.marka,
    clear: () => setMarka(null),
    control: (
      <Select
        placeholder={t("placeholders.marka")}
        allowClear
        showSearch
        options={markaOptions}
        value={value.marka ?? undefined}
        onChange={(v) => setMarka(v ?? null)}
        variant="filled"
        loading={optionsLoading}
        style={{ width: "100%" }}
        optionFilterProp="label"
      />
    ),
  },
  {
    key: "model",
    label: t("placeholders.model"),
    section: "vehicle",
    active: !!value.model,
    summary: value.model,
    clear: () => setModel(null),
    control: (
      <Select
        placeholder={t("placeholders.model")}
        allowClear
        showSearch
        options={modelOptions}
        value={value.model ?? undefined}
        onChange={(v) => setModel(v ?? null)}
        variant="filled"
        loading={optionsLoading}
        style={{ width: "100%" }}
        optionFilterProp="label"
      />
    ),
  },
  {
    key: "chassis",
    label: t("placeholders.chassis"),
    section: "vehicle",
    active: !!value.chassis,
    summary: value.chassis,
    clear: () => set("chassis", null),
    control: (
      <Select
        placeholder={t("placeholders.chassis")}
        allowClear
        showSearch
        options={chassisOptions}
        value={value.chassis ?? undefined}
        onChange={(v) => set("chassis", v ?? null)}
        variant="filled"
        loading={optionsLoading}
        style={{ width: "100%" }}
        optionFilterProp="label"
      />
    ),
  },
  {
    key: "rate",
    label: t("placeholders.rate"),
    section: "auction",
    active: !!value.rate,
    summary: value.rate,
    clear: () => set("rate", null),
    control: (
      <Select
        placeholder={t("placeholders.rate")}
        allowClear
        options={RATE_OPTIONS.map((r) => ({ value: r, label: r }))}
        value={value.rate ?? undefined}
        onChange={(v) => set("rate", v ?? null)}
        variant="filled"
        style={{ width: "100%" }}
      />
    ),
  },
  {
    key: "lot",
    label: "LOT №",
    section: "auction",
    active: !!value.lot,
    summary: value.lot || null,
    clear: () => set("lot", ""),
    control: (
      <Input
        placeholder="LOT №"
        allowClear
        prefix={<SearchIcon className="h-3.5 w-3.5 text-neutral-400" />}
        value={value.lot}
        onChange={(e) => set("lot", e.target.value)}
        variant="filled"
      />
    ),
  },
  {
    key: "date",
    label: t("auctionDate.label"),
    section: "auction",
    active: !!value.date,
    summary: value.date,
    clear: () => set("date", null),
    control: (
      <DatePicker
        placeholder={t("auctionDate.placeholder")}
        allowClear
        value={value.date ? dayjs(value.date) : null}
        onChange={(d) => set("date", d ? d.format("YYYY-MM-DD") : null)}
        variant="filled"
        format="YYYY-MM-DD"
        style={{ width: "100%" }}
      />
    ),
  },
  {
    key: "color",
    label: t("color.label"),
    section: "specs",
    active: !!value.color,
    summary: value.color,
    clear: () => set("color", null),
    control: (
      <Select
        placeholder={t("color.placeholder")}
        allowClear
        showSearch
        options={colorOptions}
        value={value.color ?? undefined}
        onChange={(v) => set("color", v ?? null)}
        variant="filled"
        loading={optionsLoading}
        style={{ width: "100%" }}
        filterOption={(input, opt) =>
          String(opt?.value ?? "")
            .toLowerCase()
            .includes(input.toLowerCase())
        }
      />
    ),
  },
  {
    key: "engine",
    label: t("engV.label"),
    section: "specs",
    active: value.engVFrom != null || value.engVTo != null,
    summary: rangeSummary(value.engVFrom, value.engVTo, formatCc),
    clear: () => onChange({ ...value, engVFrom: null, engVTo: null }),
    control: (
      <Space.Compact block>
        <Select
          placeholder={t("engV.fromPlaceholder")}
          allowClear
          options={engVFromOptions}
          value={value.engVFrom ?? undefined}
          onChange={(v) => set("engVFrom", v ?? null)}
          variant="filled"
          style={{ width: "50%" }}
        />
        <Select
          placeholder={t("engV.toPlaceholder")}
          allowClear
          options={engVToOptions}
          value={value.engVTo ?? undefined}
          onChange={(v) => set("engVTo", v ?? null)}
          variant="filled"
          style={{ width: "50%" }}
        />
      </Space.Compact>
    ),
  },
  {
    key: "year",
    label: t("year.label"),
    section: "advanced",
    active: value.yearFrom != null || value.yearTo != null,
    summary: rangeSummary(value.yearFrom, value.yearTo, (n) => String(n)),
    clear: () => onChange({ ...value, yearFrom: null, yearTo: null }),
    control: (
      <Space.Compact block>
        <Select
          placeholder={t("year.fromPlaceholder")}
          allowClear
          options={yearFromOptions}
          value={value.yearFrom ?? undefined}
          onChange={(v) => set("yearFrom", v ?? null)}
          variant="filled"
          style={{ width: "50%" }}
        />
        <Select
          placeholder={t("year.toPlaceholder")}
          allowClear
          options={yearToOptions}
          value={value.yearTo ?? undefined}
          onChange={(v) => set("yearTo", v ?? null)}
          variant="filled"
          style={{ width: "50%" }}
        />
      </Space.Compact>
    ),
  },
  {
    key: "mileage",
    label: t("mileage.label"),
    section: "advanced",
    active: value.mileageFrom != null || value.mileageTo != null,
    summary: rangeSummary(value.mileageFrom, value.mileageTo, formatKm),
    clear: () => onChange({ ...value, mileageFrom: null, mileageTo: null }),
    control: (
      <Space.Compact block>
        <Select
          placeholder={t("mileage.minPlaceholder")}
          allowClear
          options={mileageFromOptions}
          value={value.mileageFrom ?? undefined}
          onChange={(v) => set("mileageFrom", v ?? null)}
          variant="filled"
          style={{ width: "50%" }}
        />
        <Select
          placeholder={t("mileage.maxPlaceholder")}
          allowClear
          options={mileageToOptions}
          value={value.mileageTo ?? undefined}
          onChange={(v) => set("mileageTo", v ?? null)}
          variant="filled"
          style={{ width: "50%" }}
        />
      </Space.Compact>
    ),
  },
  {
    key: "location",
    label: t("location.label"),
    section: "advanced",
    active: !!value.location,
    summary: value.location,
    clear: () => set("location", null),
    control: (
      <Select
        placeholder={t("location.placeholder")}
        allowClear
        showSearch
        options={locationOptions}
        value={value.location ?? undefined}
        onChange={(v) => set("location", v ?? null)}
        variant="filled"
        loading={optionsLoading}
        style={{ width: "100%" }}
        optionFilterProp="label"
      />
    ),
  },
];

const sectionFields = (s: FieldSection) =>
  fields.filter((f) => f.section === s);
```

- [ ] **Step 4: Replace the `body` JSX to render from `fields`**

Replace the entire existing `const body = ( ... );` block (current lines ~240-442) with:

```tsx
const body = (
  <div className="divide-y divide-neutral-100">
    <Section title={t("sections.vehicle")} defaultOpen activeCount={vehicleCount}>
      {sectionFields("vehicle").map((f) => (
        <Field key={f.key} label={f.label}>
          {f.control}
        </Field>
      ))}
    </Section>
    <Section title={t("sections.auction")} defaultOpen activeCount={auctionCount}>
      {sectionFields("auction").map((f) => (
        <Field key={f.key} label={f.label}>
          {f.control}
        </Field>
      ))}
    </Section>
    <Section
      title={t("sections.specs")}
      defaultOpen={specsCount > 0}
      activeCount={specsCount}
    >
      {sectionFields("specs").map((f) => (
        <Field key={f.key} label={f.label}>
          {f.control}
        </Field>
      ))}
    </Section>
    <Section
      title={t("sections.advanced")}
      defaultOpen={advancedCount > 0}
      activeCount={advancedCount}
    >
      {sectionFields("advanced").map((f) => (
        <Field key={f.key} label={f.label}>
          {f.control}
        </Field>
      ))}
    </Section>
  </div>
);
```

Note: the section badge counts (`vehicleCount`, `auctionCount`, `specsCount`, `advancedCount`) and their computations are UNCHANGED — leave those lines exactly as they are so desktop badges stay identical.

- [ ] **Step 5: Lint + typecheck**

Run: `npm run lint && npx tsc --noEmit`
Expected: no errors. (If eslint flags an unused var, confirm it is not one you introduced; all option memos are still consumed by `fields`.)

- [ ] **Step 6: Manual verification — desktop unchanged**

Run: `npm run dev` and open a Japan auction listing page at ≥1024px width.
Expected: sidebar shows the four sections (Машин / Дуудлага / Үзүүлэлт / Нэмэлт) with the same controls and order as before; badge counts behave as before (set both engine bounds → Үзүүлэлт badge shows 2, not 1); marka → model → chassis cascade still narrows; clear button still resets.

- [ ] **Step 7: Commit**

```bash
git add src/components/cards/JapanAuctionFilters.tsx
git commit -m "refactor: source Japan filter controls from a fields descriptor"
```

---

## Task 2: Hide the active-chip row on mobile

`JapanAuctionFilterChips` (rendered by the parents) duplicates the pill values on mobile. Hide it below `lg`, keep it on desktop. No parent edits.

**Files:**
- Modify: `src/components/cards/JapanAuctionFilters.tsx` (the `JapanAuctionFilterChips` export, ~line 640)

- [ ] **Step 1: Change the chips wrapper class**

Find (in `JapanAuctionFilterChips`):

```tsx
    <div className="mt-3 flex flex-wrap items-center gap-1.5">
```

Replace with:

```tsx
    <div className="mt-3 hidden flex-wrap items-center gap-1.5 lg:flex">
```

- [ ] **Step 2: Lint + typecheck**

Run: `npm run lint && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Manual verification**

With `npm run dev`: set a filter, then check the active-chip row (below the day-tabs) is hidden at <1024px and visible at ≥1024px.

- [ ] **Step 4: Commit**

```bash
git add src/components/cards/JapanAuctionFilters.tsx
git commit -m "feat: hide active-filter chip row on mobile"
```

---

## Task 3: Mobile pill row + per-field Bottom Drawer

Replace the mobile trigger button and the left `Drawer` with a scrollable pill row and a single bottom `Drawer` scoped to the tapped field.

**Files:**
- Modify: `src/components/cards/JapanAuctionFilters.tsx` (this task touches NO other file)

**Interfaces:**
- Consumes: `fields: FieldDef[]`, `sectionFields`, `hasFilters`, `EMPTY_FILTERS` (from Task 1 / existing).
- Produces: `FilterPill` component; `openField: string | null` state.

Note: the mobile clear-all button uses the existing `t("clear")` label. Do NOT add a new locale key and do NOT edit `messages/*.json`.

- [ ] **Step 1: Add the `CloseIcon` SVG helper**

Add near the other icon helpers (after `ChevronIcon`, ~line 80):

```tsx
function CloseIcon(props: React.SVGProps<SVGSVGElement>) {
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
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}
```

- [ ] **Step 2: Add the `FilterPill` component**

Add at module scope, next to `Section` / `Field` (bottom of file):

```tsx
function FilterPill({
  label,
  summary,
  active,
  onOpen,
  onClear,
}: {
  label: string;
  summary: string | null;
  active: boolean;
  onOpen: () => void;
  onClear: () => void;
}) {
  return (
    <div
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-full border px-3 py-1.5 text-[13px] transition-colors",
        active
          ? "border-primary/30 bg-primary/10 text-primary"
          : "border-neutral-200 bg-white text-neutral-700 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200",
      )}
    >
      <button
        type="button"
        onClick={onOpen}
        className="inline-flex items-center gap-1"
      >
        <span className="whitespace-nowrap font-medium">
          {active && summary ? `${label}: ${summary}` : label}
        </span>
        {!active && <ChevronIcon className="h-3 w-3 opacity-60" />}
      </button>
      {active && (
        <button
          type="button"
          aria-label="clear"
          onClick={(e) => {
            e.stopPropagation();
            onClear();
          }}
          className="ml-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full text-primary/70 hover:bg-primary/20 hover:text-primary"
        >
          <CloseIcon className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Swap the mobile state variable**

Replace:

```tsx
  const [mobileOpen, setMobileOpen] = useState(false);
```

with:

```tsx
  const [openField, setOpenField] = useState<string | null>(null);
```

- [ ] **Step 4: Derive the currently-open field**

Add just after the `fields` array / `sectionFields` definition:

```tsx
const activeField = fields.find((f) => f.key === openField) ?? null;
```

- [ ] **Step 5: Replace the mobile trigger bar with the pill row**

In the returned JSX, replace the whole mobile trigger block (the `{/* Mobile trigger bar — visible below lg */}` div, current lines ~446-469) with:

```tsx
      {/* Mobile pill row — visible below lg */}
      <div className="mb-3 lg:hidden">
        <div className="-mx-4 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex items-center gap-2">
            {fields.map((f) => (
              <FilterPill
                key={f.key}
                label={f.label}
                summary={f.summary}
                active={f.active}
                onOpen={() => setOpenField(f.key)}
                onClear={f.clear}
              />
            ))}
            {hasFilters && (
              <Button
                type="text"
                onClick={() => onChange({ ...EMPTY_FILTERS, date: value.date })}
                className="!shrink-0 !text-neutral-500"
              >
                {t("clear")}
              </Button>
            )}
          </div>
        </div>
      </div>
```

- [ ] **Step 6: Replace the left `Drawer` with the bottom `Drawer`**

Replace the whole `{/* Mobile drawer */}` `<Drawer ...>{body}</Drawer>` block (current lines ~503-546) with:

```tsx
      {/* Mobile per-field bottom drawer */}
      <Drawer
        open={openField != null}
        onClose={() => setOpenField(null)}
        placement="bottom"
        height="auto"
        title={activeField?.label}
        styles={{
          header: { padding: "16px 20px", borderBottom: "1px solid #f5f5f5" },
          body: { padding: "20px" },
          footer: { padding: 16 },
          content: { borderTopLeftRadius: 16, borderTopRightRadius: 16 },
        }}
        footer={
          <div className="flex items-center justify-between gap-2">
            <Button
              type="text"
              onClick={() => activeField?.clear()}
              disabled={!activeField?.active}
              className="!text-neutral-500"
            >
              {t("clear")}
            </Button>
            <Button type="primary" onClick={() => setOpenField(null)}>
              {t("done")}
            </Button>
          </div>
        }
      >
        {activeField?.control}
      </Drawer>
```

- [ ] **Step 7: Lint + typecheck**

Run: `npm run lint && npx tsc --noEmit`
Expected: no errors, and no "unused variable" for `mobileOpen`/`setMobileOpen` (both removed). `totalCount` is still used by the desktop header badge — leave it.

- [ ] **Step 8: Manual verification — mobile**

With `npm run dev` at <1024px on a Japan auction listing page:
- Pill row scrolls horizontally edge-to-edge; scrollbar hidden.
- Tapping a pill opens a bottom sheet with rounded top corners, titled with the field name, containing that field's control.
- Changing a control updates the list behind immediately (live). For a range field the sheet shows both from/to selects.
- A set filter's pill turns primary-tinted and reads `Label: value`; its `✕` clears just that filter without opening the sheet.
- Sheet footer: `Цэвэрлэх` disabled until the field has a value; `Болсон` closes.
- The trailing clear-all button (labelled `Цэвэрлэх`, reusing `t("clear")`) appears at the row end only when a filter is set and resets all filters except date.
- Confirm at ≥1024px the desktop sidebar and behaviour are unchanged.

- [ ] **Step 9: Commit**

Stage ONLY the component file — the `messages/*.json` files carry unrelated uncommitted work and must not be swept in.

```bash
git add src/components/cards/JapanAuctionFilters.tsx
git commit -m "feat: mobile inline filter pills with per-filter bottom drawer"
```

---

## Self-Review

**Spec coverage:**
- Per-field pills (fine-grained), ranges paired → `fields` array + Task 3 pill row. ✓
- Live-apply → controls reuse existing `onChange`/`set`; no draft state. ✓
- Selected pill shows value + inline ✕ → `FilterPill` active branch. ✓
- Active-chip row hidden on mobile → Task 2. ✓
- Single source of truth (desktop + mobile from `fields`) → Task 1. ✓
- Remove old trigger + left drawer → Task 3 Steps 5–6. ✓
- Desktop unchanged (badge counts preserved) → Task 1 note + kept count vars. ✓
- Clear-all label → reuses `t("clear")`; no `messages/*.json` edits (those files hold unrelated uncommitted work). ✓
- Parents untouched → chips hidden via own class; no parent edits. ✓

**Placeholder scan:** none — every step has concrete code/commands.

**Type consistency:** `FieldDef` fields (`key`, `label`, `section`, `active`, `summary`, `control`, `clear`) are used identically in `fields`, `sectionFields`, `activeField`, `FilterPill` props, and the bottom `Drawer`. `openField: string | null` matches `f.key: string`. `rangeSummary` returns `string | null` matching `summary`. `clear: () => void` matches all usages.

**Open risk noted:** antd `Drawer height="auto"` (bottom placement) is expected to shrink to content. If in manual verification the sheet renders full-height or clipped, fall back to a fixed `height={280}` on the bottom `Drawer` — this does not change any other task.
