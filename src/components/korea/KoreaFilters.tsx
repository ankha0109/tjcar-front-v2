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
  EMPTY_KOREA_FILTERS,
  KOREA_BRANDS,
  KOREA_FUELS,
  KOREA_TRANSMISSIONS,
  KRW_PRICE_STEPS,
  isKoreaFiltersEmpty,
  koreaBrandLabel,
  type KoreaFilterValues,
  type KoreaModelGroup,
} from "@/types/korea";
import { MILEAGE_STEPS, YEAR_OPTIONS } from "@/types/filters";
import { useKoreaModels } from "@/hooks/useKoreaModels";
import { cn } from "@/utils";

type Props = {
  value: KoreaFilterValues;
  onChange: (next: KoreaFilterValues) => void;
};

const formatKm = (n: number) => new Intl.NumberFormat("en-US").format(n);
const formatKrw = (n: number) => `₩${new Intl.NumberFormat("en-US").format(n)}`;

/** Model groups render by their English name when the backend has one. */
const modelLabel = (m: KoreaModelGroup) => m.english ?? m.name;

/** `car.card.transmission` keys are camelCase (semi-auto → semiAuto); cvt has no key. */
const TRANSMISSION_LABEL_KEYS: Record<string, string | null> = {
  auto: "auto",
  manual: "manual",
  "semi-auto": "semiAuto",
  cvt: null,
};

/**
 * Korea's filter sidebar. Layout, pills and the mobile drawer all come from the
 * shared `FilterShell`; only the fields below are Korea's own — brand slugs and
 * model groups from Encar, KRW prices, and no auction-house/rate/lot concepts.
 */
export default function KoreaFilters({ value, onChange }: Props) {
  const t = useTranslations("featured.filters");
  const tk = useTranslations("korea");
  const tFuel = useTranslations("carDetail.fuel");
  const tTrans = useTranslations("car.card.transmission");

  const models = useKoreaModels(value.make);

  const set = <K extends keyof KoreaFilterValues>(
    key: K,
    v: KoreaFilterValues[K],
  ) => {
    onChange({ ...value, [key]: v });
  };

  // A model only means anything within its brand — switching brand clears it.
  const setMake = (v: string | null) => {
    onChange({ ...value, make: v, model: null });
  };

  const brandOptions = useMemo(
    () => KOREA_BRANDS.map((b) => ({ value: b.slug, label: b.label })),
    [],
  );

  const modelOptions = useMemo(
    () =>
      (models.data ?? []).map((m) => ({
        value: m.name,
        label: `${modelLabel(m)} (${formatKm(m.count)})`,
      })),
    [models.data],
  );

  const fuelOptions = useMemo(
    () => KOREA_FUELS.map((f) => ({ value: f, label: tFuel(f) })),
    [tFuel],
  );

  const transmissionOptions = useMemo(
    () =>
      KOREA_TRANSMISSIONS.map((tr) => {
        const key = TRANSMISSION_LABEL_KEYS[tr];
        return { value: tr, label: key ? tTrans(key) : tr.toUpperCase() };
      }),
    [tTrans],
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
      KRW_PRICE_STEPS.filter(
        (p) => value.priceTo == null || p <= value.priceTo,
      ).map((p) => ({ value: p, label: formatKrw(p) })),
    [value.priceTo],
  );

  const priceToOptions = useMemo(
    () =>
      KRW_PRICE_STEPS.filter(
        (p) => value.priceFrom == null || p >= value.priceFrom,
      ).map((p) => ({ value: p, label: formatKrw(p) })),
    [value.priceFrom],
  );

  // Encar exposes an upper bound only — there is no `min_mileage` param.
  const mileageToOptions = useMemo(
    () => MILEAGE_STEPS.filter((m) => m > 0).map((m) => ({
      value: m,
      label: formatKm(m),
    })),
    [],
  );

  const selectedModel = (models.data ?? []).find((m) => m.name === value.model);

  const fields: FieldDef[] = [
    {
      key: "make",
      label: t("placeholders.marka"),
      active: !!value.make,
      summary: value.make ? koreaBrandLabel(value.make) : null,
      clear: () => setMake(null),
      control: (
        <Select
          placeholder={t("placeholders.marka")}
          allowClear
          showSearch
          options={brandOptions}
          value={value.make ?? undefined}
          onChange={(v) => setMake(v ?? null)}
          variant="filled"
          style={{ width: "100%" }}
          optionFilterProp="label"
        />
      ),
      mobile: {
        type: "single",
        options: brandOptions.map((o) => ({
          value: o.value,
          label: o.label,
          searchText: o.label,
        })),
        value: value.make,
        onSelect: (v) => setMake(v),
      },
    },
    {
      key: "model",
      label: t("placeholders.model"),
      active: !!value.model,
      summary: selectedModel ? modelLabel(selectedModel) : value.model,
      clear: () => set("model", null),
      control: (
        <Select
          placeholder={
            value.make ? t("placeholders.model") : tk("filters.modelNeedsBrand")
          }
          allowClear
          showSearch
          options={modelOptions}
          value={value.model ?? undefined}
          onChange={(v) => set("model", v ?? null)}
          disabled={!value.make}
          loading={models.isLoading}
          variant="filled"
          style={{ width: "100%" }}
          optionFilterProp="label"
        />
      ),
      mobile: {
        type: "single",
        options: modelOptions.map((o) => ({
          value: o.value,
          label: o.label,
          searchText: o.label,
        })),
        value: value.model,
        onSelect: (v) => set("model", v),
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
      label: tk("price.label"),
      active: value.priceFrom != null || value.priceTo != null,
      summary: rangeSummary(value.priceFrom, value.priceTo, formatKrw),
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
          placeholder: tk("price.fromPlaceholder"),
        },
        to: {
          options: priceToOptions,
          value: value.priceTo,
          onChange: (v) => set("priceTo", v),
          placeholder: tk("price.toPlaceholder"),
        },
      },
    },
    {
      key: "mileage",
      label: t("mileage.label"),
      active: value.mileageTo != null,
      summary: rangeSummary(null, value.mileageTo, formatKm),
      clear: () => set("mileageTo", null),
      control: (
        <Select
          placeholder={t("mileage.maxPlaceholder")}
          allowClear
          options={mileageToOptions}
          value={value.mileageTo ?? undefined}
          onChange={(v) => set("mileageTo", v ?? null)}
          variant="filled"
          style={{ width: "100%" }}
        />
      ),
      mobile: {
        type: "range",
        to: {
          options: mileageToOptions,
          value: value.mileageTo,
          onChange: (v) => set("mileageTo", v),
          placeholder: t("mileage.maxPlaceholder"),
        },
      },
    },
    {
      key: "fuel",
      label: tk("filters.fuel"),
      active: !!value.fuel,
      summary: value.fuel ? tFuel(value.fuel) : null,
      clear: () => set("fuel", null),
      control: (
        <Select
          placeholder={tk("filters.fuel")}
          allowClear
          options={fuelOptions}
          value={value.fuel ?? undefined}
          onChange={(v) => set("fuel", v ?? null)}
          variant="filled"
          style={{ width: "100%" }}
        />
      ),
      mobile: {
        type: "single",
        options: fuelOptions.map((o) => ({
          value: o.value,
          label: o.label,
          searchText: o.label,
        })),
        value: value.fuel,
        onSelect: (v) => set("fuel", v),
      },
    },
    {
      key: "transmission",
      label: tk("filters.transmission"),
      active: !!value.transmission,
      summary: value.transmission
        ? (transmissionOptions.find((o) => o.value === value.transmission)
            ?.label ?? value.transmission)
        : null,
      clear: () => set("transmission", null),
      control: (
        <Select
          placeholder={tk("filters.transmission")}
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
          value: o.value,
          label: o.label,
          searchText: o.label,
        })),
        value: value.transmission,
        onSelect: (v) => set("transmission", v),
      },
    },
  ];

  return (
    <FilterShell
      fields={fields}
      hasFilters={!isKoreaFiltersEmpty(value)}
      // Clearing the filters is not a request to re-sort the results.
      onClearAll={() =>
        onChange({ ...EMPTY_KOREA_FILTERS, ordering: value.ordering })
      }
    />
  );
}

export function KoreaFilterChips({ value, onChange }: Props) {
  const t = useTranslations("featured.filters");
  const tFuel = useTranslations("carDetail.fuel");
  const tTrans = useTranslations("car.card.transmission");
  // Served from the react-query cache the filter select already filled.
  const models = useKoreaModels(value.make);

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
      label: t("chips.marka", { value: koreaBrandLabel(value.make) }),
      onRemove: () => set("make", null),
    });
  if (value.model) {
    const group = models.data?.find((m) => m.name === value.model);
    chips.push({
      key: "model",
      label: t("chips.model", {
        value: group ? modelLabel(group) : value.model,
      }),
      onRemove: () => set("model", null),
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
      label: `${value.priceFrom != null ? formatKrw(value.priceFrom) : "…"} – ${value.priceTo != null ? formatKrw(value.priceTo) : "…"}`,
      onRemove: () => onChange({ ...value, priceFrom: null, priceTo: null }),
    });
  if (value.mileageTo != null)
    chips.push({
      key: "mileage",
      label: t("chips.mileage", { from: "0", to: formatKm(value.mileageTo) }),
      onRemove: () => set("mileageTo", null),
    });
  if (value.fuel)
    chips.push({
      key: "fuel",
      label: tFuel(value.fuel),
      onRemove: () => set("fuel", null),
    });
  if (value.transmission) {
    const key = TRANSMISSION_LABEL_KEYS[value.transmission];
    chips.push({
      key: "transmission",
      label: key ? tTrans(key) : value.transmission.toUpperCase(),
      onRemove: () => set("transmission", null),
    });
  }

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
