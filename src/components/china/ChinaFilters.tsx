"use client";

import { Select, Tag } from "antd";
import { useMemo } from "react";
import { useTranslations } from "next-intl";
import FilterShell, {
  RangePair,
  rangeSummary,
  type FieldDef,
} from "@/components/cards/filterShell";
import {
  CHINA_COLORS,
  CHINA_DRIVES,
  CHINA_TRANSMISSIONS,
  CNY_PRICE_STEPS,
  EMPTY_CHINA_FILTERS,
  chinaColorLabel,
  isChinaFiltersEmpty,
  type ChinaCatalogEntry,
  type ChinaColor,
  type ChinaDrive,
  type ChinaFilterValues,
  type ChinaTransmission,
} from "@/types/china";
import { MILEAGE_STEPS, YEAR_OPTIONS } from "@/types/filters";
import {
  useChinaModels,
  type ChinaInitialModels,
} from "@/hooks/useChinaModels";
import { cn } from "@/utils";

type Props = {
  value: ChinaFilterValues;
  onChange: (next: ChinaFilterValues) => void;
  /** Every brand with listings, from `GET /china/brands` (server-fetched). */
  brands: ChinaCatalogEntry[];
  /** The URL brand's models, read server-side for the first paint. */
  initialModels?: ChinaInitialModels;
};

const formatNumber = (n: number) => new Intl.NumberFormat("en-US").format(n);
const formatCny = (n: number) => `¥${formatNumber(n)}`;

/** Catalog entries render with their listing count, the way Korea's models do. */
const entryLabel = (e: ChinaCatalogEntry) =>
  `${e.name} (${formatNumber(e.count)})`;

/**
 * China's filter sidebar. Layout, pills and the mobile drawer all come from the
 * shared `FilterShell`, as on `/korea`; the fields are the mirror's own —
 * brand and model ids from `/china/brands` and `/china/models`, yuan prices, a
 * mileage range (the local table has both bounds, unlike Encar), and the
 * drivetrain and colour buckets AJES files every listing under.
 */
export default function ChinaFilters({
  value,
  onChange,
  brands,
  initialModels,
}: Props) {
  const t = useTranslations("featured.filters");
  const tc = useTranslations("china");
  const tColor = useTranslations("carDetail");
  const tCard = useTranslations("car.card");

  const models = useChinaModels(value.brandId, initialModels);

  const set = <K extends keyof ChinaFilterValues>(
    key: K,
    v: ChinaFilterValues[K],
  ) => {
    onChange({ ...value, [key]: v });
  };

  // A model only means anything within its brand — switching brand clears it.
  const setBrand = (v: number | null) => {
    onChange({ ...value, brandId: v, modelId: null });
  };

  const brandOptions = useMemo(
    () => brands.map((b) => ({ value: b.id, label: entryLabel(b) })),
    [brands],
  );

  const modelOptions = useMemo(
    () =>
      (models.data ?? []).map((m) => ({ value: m.id, label: entryLabel(m) })),
    [models.data],
  );

  const transmissionOptions = useMemo(
    () =>
      CHINA_TRANSMISSIONS.map((tr) => ({
        value: tr,
        label: tCard(`transmission.${tr}`),
      })),
    [tCard],
  );

  const driveOptions = useMemo(
    () =>
      CHINA_DRIVES.map((d) => ({ value: d, label: tCard(`drivetrain.${d}`) })),
    [tCard],
  );

  const colorOptions = useMemo(
    () =>
      CHINA_COLORS.map((c) => ({ value: c, label: chinaColorLabel(c, tColor) })),
    [tColor],
  );

  const yearFromOptions = useMemo(
    () =>
      YEAR_OPTIONS.filter((y) => value.yearTo == null || y <= value.yearTo).map(
        (y) => ({ value: y, label: String(y) }),
      ),
    [value.yearTo],
  );

  const yearToOptions = useMemo(
    () =>
      YEAR_OPTIONS.filter(
        (y) => value.yearFrom == null || y >= value.yearFrom,
      ).map((y) => ({ value: y, label: String(y) })),
    [value.yearFrom],
  );

  const priceFromOptions = useMemo(
    () =>
      CNY_PRICE_STEPS.filter(
        (p) => value.priceTo == null || p <= value.priceTo,
      ).map((p) => ({ value: p, label: formatCny(p) })),
    [value.priceTo],
  );

  const priceToOptions = useMemo(
    () =>
      CNY_PRICE_STEPS.filter(
        (p) => value.priceFrom == null || p >= value.priceFrom,
      ).map((p) => ({ value: p, label: formatCny(p) })),
    [value.priceFrom],
  );

  const mileageFromOptions = useMemo(
    () =>
      MILEAGE_STEPS.filter(
        (m) => value.mileageTo == null || m <= value.mileageTo,
      ).map((m) => ({ value: m, label: formatNumber(m) })),
    [value.mileageTo],
  );

  const mileageToOptions = useMemo(
    () =>
      MILEAGE_STEPS.filter(
        (m) => m > 0 && (value.mileageFrom == null || m >= value.mileageFrom),
      ).map((m) => ({ value: m, label: formatNumber(m) })),
    [value.mileageFrom],
  );

  const selectedBrand = brands.find((b) => b.id === value.brandId);
  const selectedModel = (models.data ?? []).find((m) => m.id === value.modelId);

  // The mobile drawer's single-select speaks strings; the ids are numbers.
  const toMobileOptions = (options: { value: number; label: string }[]) =>
    options.map((o) => ({
      value: String(o.value),
      label: o.label,
      searchText: o.label,
    }));
  const toId = (v: string | null) => (v == null ? null : Number(v));

  const fields: FieldDef[] = [
    {
      key: "brand",
      label: t("placeholders.marka"),
      active: value.brandId != null,
      summary: selectedBrand?.name ?? null,
      clear: () => setBrand(null),
      control: (
        <Select
          placeholder={t("placeholders.marka")}
          allowClear
          showSearch
          options={brandOptions}
          value={value.brandId ?? undefined}
          onChange={(v) => setBrand(v ?? null)}
          variant="filled"
          style={{ width: "100%" }}
          optionFilterProp="label"
        />
      ),
      mobile: {
        type: "single",
        options: toMobileOptions(brandOptions),
        value: value.brandId != null ? String(value.brandId) : null,
        onSelect: (v) => setBrand(toId(v)),
      },
    },
    {
      key: "model",
      label: t("placeholders.model"),
      active: value.modelId != null,
      summary: selectedModel?.name ?? null,
      clear: () => set("modelId", null),
      control: (
        <Select
          placeholder={
            value.brandId != null
              ? t("placeholders.model")
              : tc("filters.modelNeedsBrand")
          }
          allowClear
          showSearch
          options={modelOptions}
          value={value.modelId ?? undefined}
          onChange={(v) => set("modelId", v ?? null)}
          disabled={value.brandId == null}
          loading={models.isLoading}
          variant="filled"
          style={{ width: "100%" }}
          optionFilterProp="label"
        />
      ),
      mobile: {
        type: "single",
        options: toMobileOptions(modelOptions),
        value: value.modelId != null ? String(value.modelId) : null,
        onSelect: (v) => set("modelId", toId(v)),
      },
    },
    {
      key: "year",
      label: t("year.label"),
      active: value.yearFrom != null || value.yearTo != null,
      summary: rangeSummary(value.yearFrom, value.yearTo, (n) => String(n)),
      clear: () => onChange({ ...value, yearFrom: null, yearTo: null }),
      control: (
        <RangePair>
          <Select
            placeholder={t("examples.select")}
            allowClear
            options={yearFromOptions}
            value={value.yearFrom ?? undefined}
            onChange={(v) => set("yearFrom", v ?? null)}
            variant="filled"
            style={{ width: "100%" }}
          />
          <Select
            placeholder={t("examples.select")}
            allowClear
            options={yearToOptions}
            value={value.yearTo ?? undefined}
            onChange={(v) => set("yearTo", v ?? null)}
            variant="filled"
            style={{ width: "100%" }}
          />
        </RangePair>
      ),
      mobile: {
        type: "range",
        from: {
          options: yearFromOptions,
          value: value.yearFrom,
          onChange: (v) => set("yearFrom", v),
          placeholder: t("year.fromPlaceholder"),
        },
        to: {
          options: yearToOptions,
          value: value.yearTo,
          onChange: (v) => set("yearTo", v),
          placeholder: t("year.toPlaceholder"),
        },
      },
    },
    {
      key: "price",
      label: tc("price.label"),
      active: value.priceFrom != null || value.priceTo != null,
      summary: rangeSummary(value.priceFrom, value.priceTo, formatCny),
      clear: () => onChange({ ...value, priceFrom: null, priceTo: null }),
      control: (
        <RangePair>
          <Select
            placeholder={t("examples.select")}
            allowClear
            options={priceFromOptions}
            value={value.priceFrom ?? undefined}
            onChange={(v) => set("priceFrom", v ?? null)}
            variant="filled"
            style={{ width: "100%" }}
          />
          <Select
            placeholder={t("examples.select")}
            allowClear
            options={priceToOptions}
            value={value.priceTo ?? undefined}
            onChange={(v) => set("priceTo", v ?? null)}
            variant="filled"
            style={{ width: "100%" }}
          />
        </RangePair>
      ),
      mobile: {
        type: "range",
        from: {
          options: priceFromOptions,
          value: value.priceFrom,
          onChange: (v) => set("priceFrom", v),
          placeholder: tc("price.fromPlaceholder"),
        },
        to: {
          options: priceToOptions,
          value: value.priceTo,
          onChange: (v) => set("priceTo", v),
          placeholder: tc("price.toPlaceholder"),
        },
      },
    },
    {
      key: "mileage",
      label: t("mileage.label"),
      active: value.mileageFrom != null || value.mileageTo != null,
      summary: rangeSummary(value.mileageFrom, value.mileageTo, formatNumber),
      clear: () => onChange({ ...value, mileageFrom: null, mileageTo: null }),
      control: (
        <RangePair>
          <Select
            placeholder={t("mileage.minPlaceholder")}
            allowClear
            options={mileageFromOptions}
            value={value.mileageFrom ?? undefined}
            onChange={(v) => set("mileageFrom", v ?? null)}
            variant="filled"
            style={{ width: "100%" }}
          />
          <Select
            placeholder={t("mileage.maxPlaceholder")}
            allowClear
            options={mileageToOptions}
            value={value.mileageTo ?? undefined}
            onChange={(v) => set("mileageTo", v ?? null)}
            variant="filled"
            style={{ width: "100%" }}
          />
        </RangePair>
      ),
      mobile: {
        type: "range",
        from: {
          options: mileageFromOptions,
          value: value.mileageFrom,
          onChange: (v) => set("mileageFrom", v),
          placeholder: t("mileage.minPlaceholder"),
        },
        to: {
          options: mileageToOptions,
          value: value.mileageTo,
          onChange: (v) => set("mileageTo", v),
          placeholder: t("mileage.maxPlaceholder"),
        },
      },
    },
    {
      key: "transmission",
      label: tc("filters.transmission"),
      active: !!value.transmission,
      summary: value.transmission
        ? tCard(`transmission.${value.transmission}`)
        : null,
      clear: () => set("transmission", null),
      control: (
        <Select<ChinaTransmission>
          placeholder={tc("filters.transmission")}
          allowClear
          options={transmissionOptions}
          value={value.transmission ?? undefined}
          onChange={(v) => set("transmission", v ?? null)}
          variant="filled"
          style={{ width: "100%" }}
        />
      ),
      mobile: {
        type: "single",
        options: transmissionOptions.map((o) => ({
          ...o,
          searchText: o.label,
        })),
        value: value.transmission,
        onSelect: (v) => set("transmission", v as ChinaTransmission | null),
      },
    },
    {
      key: "drive",
      label: tc("filters.drive"),
      active: !!value.drive,
      summary: value.drive ? tCard(`drivetrain.${value.drive}`) : null,
      clear: () => set("drive", null),
      control: (
        <Select<ChinaDrive>
          placeholder={tc("filters.drive")}
          allowClear
          options={driveOptions}
          value={value.drive ?? undefined}
          onChange={(v) => set("drive", v ?? null)}
          variant="filled"
          style={{ width: "100%" }}
        />
      ),
      mobile: {
        type: "single",
        options: driveOptions.map((o) => ({ ...o, searchText: o.label })),
        value: value.drive,
        onSelect: (v) => set("drive", v as ChinaDrive | null),
      },
    },
    {
      key: "color",
      label: tc("filters.color"),
      active: !!value.color,
      summary: value.color ? chinaColorLabel(value.color, tColor) : null,
      clear: () => set("color", null),
      control: (
        <Select<ChinaColor>
          placeholder={tc("filters.color")}
          allowClear
          options={colorOptions}
          value={value.color ?? undefined}
          onChange={(v) => set("color", v ?? null)}
          variant="filled"
          style={{ width: "100%" }}
        />
      ),
      mobile: {
        type: "single",
        options: colorOptions.map((o) => ({ ...o, searchText: o.label })),
        value: value.color,
        onSelect: (v) => set("color", v as ChinaColor | null),
      },
    },
  ];

  return (
    <FilterShell
      fields={fields}
      hasFilters={!isChinaFiltersEmpty(value)}
      // Clearing the filters is not a request to re-sort the results.
      onClearAll={() =>
        onChange({ ...EMPTY_CHINA_FILTERS, ordering: value.ordering })
      }
    />
  );
}

export function ChinaFilterChips({
  value,
  onChange,
  brands,
  initialModels,
}: Props) {
  const t = useTranslations("featured.filters");
  const tColor = useTranslations("carDetail");
  const tCard = useTranslations("car.card");
  // Served from the react-query cache the filter select already filled.
  const models = useChinaModels(value.brandId, initialModels);

  const set = <K extends keyof ChinaFilterValues>(
    key: K,
    v: ChinaFilterValues[K],
  ) => {
    onChange({ ...value, [key]: v });
  };

  type Chip = { key: string; label: string; onRemove: () => void };
  const chips: Chip[] = [];
  if (value.brandId != null) {
    const brand = brands.find((b) => b.id === value.brandId);
    chips.push({
      key: "brand",
      label: t("chips.marka", { value: brand?.name ?? String(value.brandId) }),
      onRemove: () => onChange({ ...value, brandId: null, modelId: null }),
    });
  }
  if (value.modelId != null) {
    const model = models.data?.find((m) => m.id === value.modelId);
    chips.push({
      key: "model",
      label: t("chips.model", { value: model?.name ?? String(value.modelId) }),
      onRemove: () => set("modelId", null),
    });
  }
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
      label: `${value.priceFrom != null ? formatCny(value.priceFrom) : "…"} – ${value.priceTo != null ? formatCny(value.priceTo) : "…"}`,
      onRemove: () => onChange({ ...value, priceFrom: null, priceTo: null }),
    });
  if (value.mileageFrom != null || value.mileageTo != null)
    chips.push({
      key: "mileage",
      label: t("chips.mileage", {
        from: value.mileageFrom != null ? formatNumber(value.mileageFrom) : "0",
        to: value.mileageTo != null ? formatNumber(value.mileageTo) : "…",
      }),
      onRemove: () => onChange({ ...value, mileageFrom: null, mileageTo: null }),
    });
  if (value.transmission)
    chips.push({
      key: "transmission",
      label: tCard(`transmission.${value.transmission}`),
      onRemove: () => set("transmission", null),
    });
  if (value.drive)
    chips.push({
      key: "drive",
      label: tCard(`drivetrain.${value.drive}`),
      onRemove: () => set("drive", null),
    });
  if (value.color)
    chips.push({
      key: "color",
      label: t("chips.color", { value: chinaColorLabel(value.color, tColor) }),
      onRemove: () => set("color", null),
    });

  if (chips.length === 0) return null;

  return (
    // Desktop only — below `lg` the same state is already visible in the pills.
    <div className="mt-3 hidden flex-wrap items-center gap-1.5 lg:flex">
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
