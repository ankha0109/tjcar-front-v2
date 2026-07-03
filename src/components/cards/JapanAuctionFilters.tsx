"use client";

import { Button, DatePicker, Drawer, Input, Select, Space, Tag } from "antd";
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import dayjs from "dayjs";
import {
  EMPTY_FILTERS,
  ENG_V_STEPS,
  FilterOptions,
  FilterValues,
  isFiltersEmpty,
  MILEAGE_STEPS,
  RATE_OPTIONS,
  YEAR_OPTIONS,
} from "@/types/filters";
import { getColorSwatch } from "@/utils/carColor";
import { cn } from "@/utils";

type Props = {
  value: FilterValues;
  onChange: (next: FilterValues) => void;
  options?: FilterOptions;
  optionsLoading?: boolean;
};

const formatKm = (n: number) =>
  new Intl.NumberFormat("en-US").format(n);

const formatCc = (n: number) =>
  `${new Intl.NumberFormat("en-US").format(n)} cc`;

// Short "from–to" label for range pills; mirrors the chip formatting (… for an open bound).
const rangeSummary = (
  from: number | null,
  to: number | null,
  fmt: (n: number) => string,
): string | null => {
  if (from == null && to == null) return null;
  return `${from != null ? fmt(from) : "…"}–${to != null ? fmt(to) : "…"}`;
};

function FilterIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  );
}

function SearchIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

function ChevronIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function ColorSwatch({ name }: { name: string }) {
  const swatch = getColorSwatch(name);
  return (
    <span
      className={cn(
        "inline-block h-3 w-3 shrink-0 rounded-full",
        swatch.ring && "ring-1 ring-inset ring-neutral-300",
      )}
      style={{ background: swatch.bg }}
    />
  );
}

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

export default function JapanAuctionFilters({
  value,
  onChange,
  options,
  optionsLoading,
}: Props) {
  const t = useTranslations("featured.filters");
  const [mobileOpen, setMobileOpen] = useState(false);

  const set = <K extends keyof FilterValues>(key: K, v: FilterValues[K]) => {
    onChange({ ...value, [key]: v });
  };

  const setMarka = (marka: string | null) => {
    onChange({ ...value, marka, model: null, chassis: null });
  };

  const setModel = (model: string | null) => {
    onChange({ ...value, model, chassis: null });
  };

  const markaOptions = useMemo(
    () => (options?.markas ?? []).map((v) => ({ value: v, label: v })),
    [options?.markas],
  );

  // Model → marka lookup so chassis (which only carries its model name) can be
  // narrowed by the selected marka even when no model is chosen.
  const modelToMarka = useMemo(
    () => new Map((options?.models ?? []).map((m) => [m.name, m.marka])),
    [options?.models],
  );

  const modelOptions = useMemo(() => {
    const all = options?.models ?? [];
    const filtered = value.marka
      ? all.filter((m) => !m.marka || m.marka === value.marka)
      : all;
    return filtered.map((m) => ({ value: m.name, label: m.name }));
  }, [options?.models, value.marka]);

  // Chassis is independent of marka/model: when nothing is selected every code
  // is searchable (type "AWS210" to find Crown). A marka narrows it to that
  // marka's chassis; a model narrows it further to that model's chassis.
  const chassisOptions = useMemo(() => {
    const all = options?.chassis ?? [];
    const filtered = value.model
      ? all.filter((c) => c.model === value.model)
      : value.marka
        ? all.filter((c) => modelToMarka.get(c.model) === value.marka)
        : all;
    // Without a model the list spans every model, so the bare code is
    // ambiguous — append the model name to disambiguate.
    const withModel = !value.model;
    return filtered.map((c) => ({
      value: c.code,
      label: withModel
        ? `${c.code} · ${c.model} (${c.count})`
        : `${c.code} (${c.count})`,
    }));
  }, [options?.chassis, value.model, value.marka, modelToMarka]);

  const colorOptions = useMemo(
    () =>
      (options?.colors ?? []).map((c) => ({
        value: c,
        label: (
          <span className="flex items-center gap-2">
            <ColorSwatch name={c} />
            <span className="capitalize">{c}</span>
          </span>
        ),
      })),
    [options?.colors],
  );

  const engVFromOptions = useMemo(
    () =>
      ENG_V_STEPS.filter(
        (v) => value.engVTo == null || v <= value.engVTo,
      ).map((v) => ({ value: v, label: formatCc(v) })),
    [value.engVTo],
  );

  const engVToOptions = useMemo(
    () =>
      ENG_V_STEPS.filter(
        (v) => value.engVFrom == null || v >= value.engVFrom,
      ).map((v) => ({ value: v, label: formatCc(v) })),
    [value.engVFrom],
  );

  const locationOptions = useMemo(
    () => (options?.auctions ?? []).map((v) => ({ value: v, label: v })),
    [options?.auctions],
  );

  const yearFromOptions = useMemo(
    () =>
      YEAR_OPTIONS.filter(
        (y) => value.yearTo == null || y <= value.yearTo,
      ).map((y) => ({ value: y, label: String(y) })),
    [value.yearTo],
  );

  const yearToOptions = useMemo(
    () =>
      YEAR_OPTIONS.filter(
        (y) => value.yearFrom == null || y >= value.yearFrom,
      ).map((y) => ({ value: y, label: String(y) })),
    [value.yearFrom],
  );

  const mileageFromOptions = useMemo(
    () =>
      MILEAGE_STEPS.filter(
        (m) => value.mileageTo == null || m <= value.mileageTo,
      ).map((m) => ({ value: m, label: formatKm(m) })),
    [value.mileageTo],
  );

  const mileageToOptions = useMemo(
    () =>
      MILEAGE_STEPS.filter(
        (m) => value.mileageFrom == null || m >= value.mileageFrom,
      ).map((m) => ({ value: m, label: formatKm(m) })),
    [value.mileageFrom],
  );

  const vehicleCount =
    (value.marka ? 1 : 0) + (value.model ? 1 : 0) + (value.chassis ? 1 : 0);
  const auctionCount = (value.rate ? 1 : 0) + (value.lot ? 1 : 0);
  const specsCount =
    (value.color ? 1 : 0) +
    (value.engVFrom != null ? 1 : 0) +
    (value.engVTo != null ? 1 : 0);
  const advancedCount =
    (value.yearFrom != null ? 1 : 0) +
    (value.yearTo != null ? 1 : 0) +
    (value.mileageFrom != null ? 1 : 0) +
    (value.mileageTo != null ? 1 : 0) +
    (value.location ? 1 : 0);
  const totalCount = vehicleCount + auctionCount + specsCount + advancedCount;
  const hasFilters = !isFiltersEmpty(value);

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

  return (
    <>
      {/* Mobile trigger bar — visible below lg */}
      <div className="mb-3 flex items-center gap-2 lg:hidden">
        <Button
          onClick={() => setMobileOpen(true)}
          icon={<FilterIcon className="h-3.5 w-3.5" />}
          className="!h-9 !shrink-0"
        >
          {t("title")}
          {totalCount > 0 && (
            <span className="ml-1.5 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-white">
              {totalCount}
            </span>
          )}
        </Button>
        {hasFilters && (
          <Button
            type="text"
            onClick={() => onChange({ ...EMPTY_FILTERS, date: value.date })}
            className="!text-neutral-500"
          >
            {t("clear")}
          </Button>
        )}
      </div>

      {/* Desktop sidebar — visible at lg+ */}
      <aside className="hidden lg:sticky lg:top-4 lg:block lg:w-[280px] lg:shrink-0 lg:self-start">
        <div className="overflow-hidden rounded-2xl border border-neutral-200/80 bg-white dark:border-neutral-800 dark:bg-neutral-900">
          <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-3 dark:border-neutral-800">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-neutral-900 text-white">
                <FilterIcon className="h-3.5 w-3.5" />
              </span>
              <span className="text-[13px] font-semibold text-neutral-900">
                {t("title")}
              </span>
              {totalCount > 0 && (
                <span className="inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-white">
                  {totalCount}
                </span>
              )}
            </div>
            <Button
              type="text"
              onClick={() => onChange({ ...EMPTY_FILTERS, date: value.date })}
              disabled={!hasFilters}
              className="h-auto! p-0! border-0! bg-transparent! text-[11px]! font-medium! text-neutral-500! hover:text-neutral-900! hover:bg-transparent! disabled:cursor-not-allowed! disabled:text-neutral-300! disabled:hover:text-neutral-300!"
            >
              {t("clear")}
            </Button>
          </div>
          <div className="max-h-[calc(100vh-8rem)] overflow-y-auto px-4">
            {body}
          </div>
        </div>
      </aside>

      {/* Mobile drawer */}
      <Drawer
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        placement="left"
        size={320}
        title={
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-neutral-900 text-white">
              <FilterIcon className="h-3.5 w-3.5" />
            </span>
            <span className="text-[14px] font-semibold text-neutral-900">
              {t("title")}
            </span>
            {totalCount > 0 && (
              <span className="inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-white">
                {totalCount}
              </span>
            )}
          </div>
        }
        styles={{
          header: { padding: "16px 20px", borderBottom: "1px solid #f5f5f5" },
          body: { padding: "4px 20px" },
          footer: { padding: 16 },
        }}
        footer={
          <div className="flex items-center justify-between gap-2">
            <Button
              type="text"
              onClick={() => onChange({ ...EMPTY_FILTERS, date: value.date })}
              disabled={!hasFilters}
              className="!text-neutral-500"
            >
              {t("clear")}
            </Button>
            <Button type="primary" onClick={() => setMobileOpen(false)}>
              {t("done")}
            </Button>
          </div>
        }
      >
        {body}
      </Drawer>
    </>
  );
}

export function JapanAuctionFilterChips({
  value,
  onChange,
}: {
  value: FilterValues;
  onChange: (next: FilterValues) => void;
}) {
  const t = useTranslations("featured.filters");

  const set = <K extends keyof FilterValues>(key: K, v: FilterValues[K]) => {
    onChange({ ...value, [key]: v });
  };

  type Chip = { key: string; label: string; onRemove: () => void };
  const chips: Chip[] = [];
  if (value.marka)
    chips.push({
      key: "marka",
      label: t("chips.marka", { value: value.marka }),
      onRemove: () => onChange({ ...value, marka: null, model: null }),
    });
  if (value.model)
    chips.push({
      key: "model",
      label: t("chips.model", { value: value.model }),
      onRemove: () => set("model", null),
    });
  if (value.chassis)
    chips.push({
      key: "chassis",
      label: t("chips.chassis", { value: value.chassis }),
      onRemove: () => set("chassis", null),
    });
  if (value.rate)
    chips.push({
      key: "rate",
      label: t("chips.rate", { value: value.rate }),
      onRemove: () => set("rate", null),
    });
  if (value.lot)
    chips.push({
      key: "lot",
      label: `LOT: ${value.lot}`,
      onRemove: () => set("lot", ""),
    });
  if (value.color)
    chips.push({
      key: "color",
      label: t("chips.color", { value: value.color }),
      onRemove: () => set("color", null),
    });
  if (value.engVFrom != null || value.engVTo != null)
    chips.push({
      key: "engV",
      label: t("chips.engV", {
        from: value.engVFrom != null ? formatCc(value.engVFrom) : "…",
        to: value.engVTo != null ? formatCc(value.engVTo) : "…",
      }),
      onRemove: () => onChange({ ...value, engVFrom: null, engVTo: null }),
    });
  if (value.yearFrom != null || value.yearTo != null)
    chips.push({
      key: "year",
      label: t("chips.year", {
        from: value.yearFrom ?? "…",
        to: value.yearTo ?? "…",
      }),
      onRemove: () => onChange({ ...value, yearFrom: null, yearTo: null }),
    });
  if (value.mileageFrom != null || value.mileageTo != null)
    chips.push({
      key: "mileage",
      label: t("chips.mileage", {
        from: value.mileageFrom != null ? formatKm(value.mileageFrom) : "…",
        to: value.mileageTo != null ? formatKm(value.mileageTo) : "…",
      }),
      onRemove: () =>
        onChange({ ...value, mileageFrom: null, mileageTo: null }),
    });
  if (value.location)
    chips.push({
      key: "location",
      label: t("chips.location", { value: value.location }),
      onRemove: () => set("location", null),
    });

  if (chips.length === 0) return null;

  return (
    <div className="mt-3 flex flex-wrap items-center gap-1.5">
      <span className="text-[11px] font-medium uppercase text-neutral-400">
        {t("active")}
      </span>
      {chips.map((c) => (
        <Tag
          key={c.key}
          closable
          onClose={(e) => {
            e.preventDefault();
            c.onRemove();
          }}
          className={cn(
            "!m-0 !rounded-full !border-neutral-200 !bg-white !px-2.5 !py-0.5 !text-[12px] !text-neutral-700",
            "dark:border-neutral-700! dark:bg-neutral-800! dark:text-neutral-200!",
          )}
        >
          {c.label}
        </Tag>
      ))}
    </div>
  );
}

function Section({
  title,
  defaultOpen,
  activeCount,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  activeCount?: number;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(!!defaultOpen);
  return (
    <div className="py-1">
      <Button
        type="text"
        onClick={() => setOpen((o) => !o)}
        block
        className="flex! w-full! h-auto! items-center! justify-between! py-3! px-0! text-left! border-0! bg-transparent! hover:bg-transparent!"
      >
        <span className="flex items-center gap-2">
          <span className="text-[11px] font-semibold uppercase text-neutral-700">
            {title}
          </span>
          {!!activeCount && activeCount > 0 && (
            <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-neutral-900 px-1 text-[10px] font-semibold text-white">
              {activeCount}
            </span>
          )}
        </span>
        <ChevronIcon
          className={cn(
            "h-3.5 w-3.5 text-neutral-400 transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </Button>
      {open && <div className="space-y-3 pb-3">{children}</div>}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-1 text-[10.5px] font-medium uppercase text-neutral-500">
        {label}
      </div>
      {children}
    </div>
  );
}
