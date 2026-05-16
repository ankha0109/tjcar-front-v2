"use client";

import { Button, Drawer, Input, Select, Space, Tag } from "antd";
import { useMemo, useState } from "react";
import {
  EMPTY_FILTERS,
  FilterOptions,
  FilterValues,
  isFiltersEmpty,
  MILEAGE_STEPS,
  RATE_OPTIONS,
  YEAR_OPTIONS,
} from "@/types/filters";
import { cn } from "@/utils";

type Props = {
  value: FilterValues;
  onChange: (next: FilterValues) => void;
  options?: FilterOptions;
  optionsLoading?: boolean;
};

const formatKm = (n: number) =>
  `${new Intl.NumberFormat("en-US").format(n)} км`;

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

export default function FeaturedAuctionFilters({
  value,
  onChange,
  options,
  optionsLoading,
}: Props) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const set = <K extends keyof FilterValues>(key: K, v: FilterValues[K]) => {
    onChange({ ...value, [key]: v });
  };

  const setMarka = (marka: string | null) => {
    // Reset dependent fields when manufacturer changes
    onChange({ ...value, marka, model: null });
  };

  const markaOptions = useMemo(
    () => (options?.markas ?? []).map((v) => ({ value: v, label: v })),
    [options?.markas],
  );

  const modelOptions = useMemo(() => {
    const all = options?.models ?? [];
    const filtered = value.marka
      ? all.filter((m) => !m.marka || m.marka === value.marka)
      : all;
    return filtered.map((m) => ({ value: m.name, label: m.name }));
  }, [options?.models, value.marka]);

  const bodyOptions = useMemo(
    () => (options?.bodies ?? []).map((v) => ({ value: v, label: v })),
    [options?.bodies],
  );

  const locationOptions = useMemo(
    () => (options?.locations ?? []).map((v) => ({ value: v, label: v })),
    [options?.locations],
  );

  const advancedCount = useMemo(() => {
    let n = 0;
    if (value.yearFrom != null) n++;
    if (value.yearTo != null) n++;
    if (value.mileageFrom != null) n++;
    if (value.mileageTo != null) n++;
    if (value.location) n++;
    return n;
  }, [value]);

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

  type Chip = { key: string; label: string; onRemove: () => void };
  const chips: Chip[] = [];
  if (value.marka)
    chips.push({
      key: "marka",
      label: `Үйлдвэрлэгч: ${value.marka}`,
      onRemove: () => setMarka(null),
    });
  if (value.model)
    chips.push({
      key: "model",
      label: `Модел: ${value.model}`,
      onRemove: () => set("model", null),
    });
  if (value.body)
    chips.push({
      key: "body",
      label: `Арал: ${value.body}`,
      onRemove: () => set("body", null),
    });
  if (value.rate)
    chips.push({
      key: "rate",
      label: `Үнэлгээ: ${value.rate}`,
      onRemove: () => set("rate", null),
    });
  if (value.lot)
    chips.push({
      key: "lot",
      label: `LOT: ${value.lot}`,
      onRemove: () => set("lot", ""),
    });
  if (value.yearFrom != null || value.yearTo != null)
    chips.push({
      key: "year",
      label: `Он: ${value.yearFrom ?? "…"}–${value.yearTo ?? "…"}`,
      onRemove: () =>
        onChange({ ...value, yearFrom: null, yearTo: null }),
    });
  if (value.mileageFrom != null || value.mileageTo != null)
    chips.push({
      key: "mileage",
      label: `Гүйлт: ${value.mileageFrom != null ? formatKm(value.mileageFrom) : "…"} – ${value.mileageTo != null ? formatKm(value.mileageTo) : "…"}`,
      onRemove: () =>
        onChange({ ...value, mileageFrom: null, mileageTo: null }),
    });
  if (value.location)
    chips.push({
      key: "location",
      label: `Байршил: ${value.location}`,
      onRemove: () => set("location", null),
    });

  const hasFilters = !isFiltersEmpty(value);

  const resetAdvanced = () =>
    onChange({
      ...value,
      yearFrom: null,
      yearTo: null,
      mileageFrom: null,
      mileageTo: null,
      location: null,
    });

  return (
    <div className="mb-4">
      {/* Toolbar */}
      <div className="-mx-4 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex min-w-min flex-nowrap items-center gap-2">
          <Select
            placeholder="Үйлдвэрлэгч"
            allowClear
            showSearch
            options={markaOptions}
            value={value.marka ?? undefined}
            onChange={(v) => setMarka(v ?? null)}
            variant="filled"
            loading={optionsLoading}
            style={{ minWidth: 156 }}
            optionFilterProp="label"
          />
          <Select
            placeholder="Модел"
            allowClear
            showSearch
            options={modelOptions}
            value={value.model ?? undefined}
            onChange={(v) => set("model", v ?? null)}
            disabled={!value.marka}
            variant="filled"
            loading={optionsLoading}
            style={{ minWidth: 156 }}
            optionFilterProp="label"
          />
          <Select
            placeholder="Арал"
            allowClear
            options={bodyOptions}
            value={value.body ?? undefined}
            onChange={(v) => set("body", v ?? null)}
            variant="filled"
            loading={optionsLoading}
            style={{ minWidth: 124 }}
          />
          <Select
            placeholder="Үнэлгээ"
            allowClear
            options={RATE_OPTIONS.map((r) => ({ value: r, label: r }))}
            value={value.rate ?? undefined}
            onChange={(v) => set("rate", v ?? null)}
            variant="filled"
            style={{ minWidth: 110 }}
          />
          <Input
            placeholder="LOT №"
            allowClear
            prefix={<SearchIcon className="h-3.5 w-3.5 text-neutral-400" />}
            value={value.lot}
            onChange={(e) => set("lot", e.target.value)}
            variant="filled"
            style={{ width: 140 }}
          />
          <Button
            onClick={() => setDrawerOpen(true)}
            icon={<FilterIcon className="h-3.5 w-3.5" />}
            className="relative !h-8 !shrink-0"
          >
            Илүү шүүлт
            {advancedCount > 0 && (
              <span className="ml-1.5 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-white">
                {advancedCount}
              </span>
            )}
          </Button>
          {hasFilters && (
            <Button
              type="text"
              onClick={() => onChange(EMPTY_FILTERS)}
              className="!ml-1 !shrink-0 !text-neutral-500"
            >
              Цэвэрлэх
            </Button>
          )}
        </div>
      </div>

      {/* Active chips */}
      {chips.length > 0 && (
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-neutral-400">
            Идэвхтэй
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
              )}
            >
              {c.label}
            </Tag>
          ))}
        </div>
      )}

      {/* Advanced drawer */}
      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        placement="right"
        size={400}
        title={
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-neutral-900 text-white">
              <FilterIcon className="h-3.5 w-3.5" />
            </span>
            <span className="text-[14px] font-semibold tracking-tight text-neutral-900">
              Илүү шүүлт
            </span>
          </div>
        }
        styles={{
          header: { padding: "16px 20px", borderBottom: "1px solid #f5f5f5" },
          body: { padding: 20 },
          footer: { padding: 16 },
        }}
        footer={
          <div className="flex items-center justify-between gap-2">
            <Button
              type="text"
              onClick={resetAdvanced}
              disabled={advancedCount === 0}
              className="!text-neutral-500"
            >
              Цэвэрлэх
            </Button>
            <Button type="primary" onClick={() => setDrawerOpen(false)}>
              Болсон
            </Button>
          </div>
        }
      >
        <div className="space-y-6">
          <DrawerSection
            label="Үйлдвэрлэсэн он"
            hint="Машины үйлдвэрлэгдсэн оны хязгаар"
          >
            <Space.Compact block>
              <Select
                placeholder="Эхлэх"
                allowClear
                options={yearFromOptions}
                value={value.yearFrom ?? undefined}
                onChange={(v) => set("yearFrom", v ?? null)}
                variant="filled"
                style={{ width: "50%" }}
              />
              <Select
                placeholder="Дуусах"
                allowClear
                options={yearToOptions}
                value={value.yearTo ?? undefined}
                onChange={(v) => set("yearTo", v ?? null)}
                variant="filled"
                style={{ width: "50%" }}
              />
            </Space.Compact>
          </DrawerSection>

          <DrawerSection
            label="Явсан гүйлт"
            hint="Километрийн хязгаар"
          >
            <Space.Compact block>
              <Select
                placeholder="Хамгийн бага"
                allowClear
                options={mileageFromOptions}
                value={value.mileageFrom ?? undefined}
                onChange={(v) => set("mileageFrom", v ?? null)}
                variant="filled"
                style={{ width: "50%" }}
              />
              <Select
                placeholder="Хамгийн их"
                allowClear
                options={mileageToOptions}
                value={value.mileageTo ?? undefined}
                onChange={(v) => set("mileageTo", v ?? null)}
                variant="filled"
                style={{ width: "50%" }}
              />
            </Space.Compact>
          </DrawerSection>

          <DrawerSection
            label="Auction байршил"
            hint="Дуудлагын зах зээлийн байршил"
          >
            <Select
              placeholder="Байршил сонгох"
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
          </DrawerSection>
        </div>
      </Drawer>
    </div>
  );
}

function DrawerSection({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between">
        <span className="text-[12px] font-semibold uppercase tracking-[0.14em] text-neutral-700">
          {label}
        </span>
        {hint && (
          <span className="text-[11px] text-neutral-400">{hint}</span>
        )}
      </div>
      {children}
    </div>
  );
}
