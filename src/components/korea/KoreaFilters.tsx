"use client";

import { Button, Drawer, Input, InputNumber, Select, Space, Tag } from "antd";
import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  EMPTY_KOREA_FILTERS,
  isKoreaFiltersEmpty,
  type KoreaFilterValues,
} from "@/types/korea";
import { MILEAGE_STEPS, YEAR_OPTIONS } from "@/types/filters";
import { cn } from "@/utils";

type Props = {
  value: KoreaFilterValues;
  onChange: (next: KoreaFilterValues) => void;
};

const formatKm = (n: number) => new Intl.NumberFormat("en-US").format(n);
const formatUsd = (n: number) => `$${new Intl.NumberFormat("en-US").format(n)}`;

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

export default function KoreaFilters({ value, onChange }: Props) {
  const t = useTranslations("featured.filters");
  const tk = useTranslations("korea");
  const [mobileOpen, setMobileOpen] = useState(false);

  const set = <K extends keyof KoreaFilterValues>(
    key: K,
    v: KoreaFilterValues[K],
  ) => {
    onChange({ ...value, [key]: v });
  };

  const yearFromOptions = YEAR_OPTIONS.filter(
    (y) => value.yearTo == null || y <= value.yearTo,
  ).map((y) => ({ value: y, label: String(y) }));
  const yearToOptions = YEAR_OPTIONS.filter(
    (y) => value.yearFrom == null || y >= value.yearFrom,
  ).map((y) => ({ value: y, label: String(y) }));
  const mileageToOptions = MILEAGE_STEPS.filter((m) => m > 0).map((m) => ({
    value: m,
    label: formatKm(m),
  }));

  const totalCount =
    (value.make ? 1 : 0) +
    (value.model ? 1 : 0) +
    (value.yearFrom != null ? 1 : 0) +
    (value.yearTo != null ? 1 : 0) +
    (value.priceFrom != null ? 1 : 0) +
    (value.priceTo != null ? 1 : 0) +
    (value.mileageTo != null ? 1 : 0);
  const hasFilters = !isKoreaFiltersEmpty(value);

  const body = (
    <div className="space-y-3 py-2">
      <Field label={t("placeholders.marka")}>
        <Input
          placeholder={t("placeholders.marka")}
          allowClear
          value={value.make ?? ""}
          onChange={(e) => set("make", e.target.value || null)}
          variant="filled"
        />
      </Field>
      <Field label={t("placeholders.model")}>
        <Input
          placeholder={t("placeholders.model")}
          allowClear
          value={value.model ?? ""}
          onChange={(e) => set("model", e.target.value || null)}
          variant="filled"
        />
      </Field>
      <Field label={t("year.label")}>
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
      </Field>
      <Field label={tk("price.label")}>
        <Space.Compact block>
          <InputNumber
            placeholder={tk("price.fromPlaceholder")}
            min={0}
            value={value.priceFrom ?? undefined}
            onChange={(v) => set("priceFrom", (v as number | null) ?? null)}
            variant="filled"
            style={{ width: "50%" }}
            formatter={(v) => (v ? formatUsd(Number(v)) : "")}
            parser={(v) => Number((v ?? "").replace(/[^0-9]/g, ""))}
          />
          <InputNumber
            placeholder={tk("price.toPlaceholder")}
            min={0}
            value={value.priceTo ?? undefined}
            onChange={(v) => set("priceTo", (v as number | null) ?? null)}
            variant="filled"
            style={{ width: "50%" }}
            formatter={(v) => (v ? formatUsd(Number(v)) : "")}
            parser={(v) => Number((v ?? "").replace(/[^0-9]/g, ""))}
          />
        </Space.Compact>
      </Field>
      <Field label={t("mileage.label")}>
        <Select
          placeholder={t("mileage.maxPlaceholder")}
          allowClear
          options={mileageToOptions}
          value={value.mileageTo ?? undefined}
          onChange={(v) => set("mileageTo", v ?? null)}
          variant="filled"
          style={{ width: "100%" }}
        />
      </Field>
    </div>
  );

  const header = (
    <div className="flex items-center justify-between">
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
        onClick={() => onChange({ ...EMPTY_KOREA_FILTERS })}
        disabled={!hasFilters}
        className="!text-[11px] !font-medium !text-neutral-500"
      >
        {t("clear")}
      </Button>
    </div>
  );

  return (
    <>
      {/* Mobile trigger — below lg */}
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
            onClick={() => onChange({ ...EMPTY_KOREA_FILTERS })}
            className="!text-neutral-500"
          >
            {t("clear")}
          </Button>
        )}
      </div>

      {/* Desktop sidebar — lg+ */}
      <aside className="hidden lg:sticky lg:top-4 lg:block lg:w-[280px] lg:shrink-0 lg:self-start">
        <div className="overflow-hidden rounded-2xl border border-neutral-200/80 bg-white dark:border-neutral-800 dark:bg-neutral-900">
          <div className="border-b border-neutral-100 px-4 py-3 dark:border-neutral-800">
            {header}
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
        size="default"
        title={header}
        styles={{
          header: { padding: "16px 20px", borderBottom: "1px solid #f5f5f5" },
          body: { padding: "4px 20px" },
        }}
      >
        {body}
      </Drawer>
    </>
  );
}

export function KoreaFilterChips({ value, onChange }: Props) {
  const t = useTranslations("featured.filters");

  const set = <K extends keyof KoreaFilterValues>(
    key: K,
    v: KoreaFilterValues[K],
  ) => {
    onChange({ ...value, [key]: v });
  };

  type Chip = { key: string; label: string; onRemove: () => void };
  const chips: Chip[] = [];
  if (value.make)
    chips.push({
      key: "make",
      label: t("chips.marka", { value: value.make }),
      onRemove: () => set("make", null),
    });
  if (value.model)
    chips.push({
      key: "model",
      label: t("chips.model", { value: value.model }),
      onRemove: () => set("model", null),
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
  if (value.priceFrom != null || value.priceTo != null)
    chips.push({
      key: "price",
      label: `${value.priceFrom != null ? formatUsd(value.priceFrom) : "$…"} – ${value.priceTo != null ? formatUsd(value.priceTo) : "$…"}`,
      onRemove: () => onChange({ ...value, priceFrom: null, priceTo: null }),
    });
  if (value.mileageTo != null)
    chips.push({
      key: "mileage",
      label: t("chips.mileage", { from: "0", to: formatKm(value.mileageTo) }),
      onRemove: () => set("mileageTo", null),
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
