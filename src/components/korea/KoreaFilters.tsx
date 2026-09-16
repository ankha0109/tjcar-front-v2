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
  KOREA_FUELS,
  KOREA_TRANSMISSIONS,
  KOREA_TRUCK_CAPACITIES,
  KOREA_TRUCK_FORMS,
  KRW_PRICE_STEPS,
  isKoreaFiltersEmpty,
  koreaBrandLabelFor,
  koreaBrandsFor,
  koreaFormLabelKey,
  type KoreaCategory,
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

  const models = useKoreaModels(value.make, value.category);

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

  // A truck make, model, form and capacity mean nothing in the car catalogue
  // (the backend 422s a slug from the wrong one), so switching clears them.
  const setCategory = (next: KoreaCategory) => {
    onChange({
      ...value,
      category: next,
      make: null,
      model: null,
      form: null,
      capacity: null,
    });
  };

  const brandOptions = useMemo(
    () =>
      koreaBrandsFor(value.category).map((b) => ({
        value: b.slug,
        label: b.label,
      })),
    [value.category],
  );

  const categoryOptions = [
    { value: "car", label: tk("filters.categoryCar") },
    { value: "truck", label: tk("filters.categoryTruck") },
  ];

  const formOptions = useMemo(
    () =>
      KOREA_TRUCK_FORMS.map((slug) => ({
        value: slug,
        label: tk(koreaFormLabelKey(slug)),
      })),
    [tk],
  );

  const capacityOptions = useMemo(
    () =>
      KOREA_TRUCK_CAPACITIES.map((tons) => ({
        value: tons,
        label: tk("filters.capacityValue", { tons }),
      })),
    [tk],
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
      key: "category",
      label: tk("filters.category"),
      active: value.category === "truck",
      summary: value.category === "truck" ? tk("filters.categoryTruck") : null,
      clear: () => setCategory("car"),
      control: (
        <Select
          options={categoryOptions}
          value={value.category}
          onChange={(v) => setCategory(v as KoreaCategory)}
          variant="filled"
          style={{ width: "100%" }}
        />
      ),
      mobile: {
        type: "single",
        options: categoryOptions.map((o) => ({
          value: o.value,
          label: o.label,
          searchText: o.label,
        })),
        value: value.category,
        onSelect: (v) => setCategory(v === "truck" ? "truck" : "car"),
      },
    },
    {
      key: "make",
      label: t("placeholders.marka"),
      active: !!value.make,
      summary: value.make ? koreaBrandLabelFor(value.category, value.make) : null,
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
    ...(value.category === "truck"
      ? [
          {
            key: "form",
            label: tk("filters.form"),
            active: !!value.form,
            summary: value.form ? tk(koreaFormLabelKey(value.form)) : null,
            clear: () => set("form", null),
            control: (
              <Select
                placeholder={tk("filters.form")}
                allowClear
                options={formOptions}
                value={value.form ?? undefined}
                onChange={(v) => set("form", v ?? null)}
                variant="filled"
                style={{ width: "100%" }}
              />
            ),
            mobile: {
              type: "single" as const,
              options: formOptions.map((o) => ({
                value: o.value,
                label: o.label,
                searchText: o.label,
              })),
              value: value.form,
              onSelect: (v: string | null) => set("form", v),
            },
          },
          {
            key: "capacity",
            label: tk("filters.capacity"),
            active: !!value.capacity,
            summary: value.capacity
              ? tk("filters.capacityValue", { tons: value.capacity })
              : null,
            clear: () => set("capacity", null),
            control: (
              <Select
                placeholder={tk("filters.capacity")}
                allowClear
                options={capacityOptions}
                value={value.capacity ?? undefined}
                onChange={(v) => set("capacity", v ?? null)}
                variant="filled"
                style={{ width: "100%" }}
              />
            ),
            mobile: {
              type: "single" as const,
              options: capacityOptions.map((o) => ({
                value: o.value,
                label: o.label,
                searchText: o.label,
              })),
              value: value.capacity,
              onSelect: (v: string | null) => set("capacity", v),
            },
          },
        ]
      : []),
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
  const tk = useTranslations("korea");
  const tFuel = useTranslations("carDetail.fuel");
  const tTrans = useTranslations("car.card.transmission");
  // Served from the react-query cache the filter select already filled.
  const models = useKoreaModels(value.make, value.category);

  const set = <K extends keyof KoreaFilterValues>(
    key: K,
    v: KoreaFilterValues[K],
  ) => {
    onChange({ ...value, [key]: v });
  };

  type Chip = { key: string; label: string; onRemove: () => void };
  const chips: Chip[] = [];
  if (value.category === "truck")
    chips.push({
      key: "category",
      label: tk("filters.categoryTruck"),
      onRemove: () =>
        onChange({
          ...value,
          category: "car",
          make: null,
          model: null,
          form: null,
          capacity: null,
        }),
    });
  if (value.make)
    chips.push({
      key: "make",
      label: t("chips.marka", {
        value: koreaBrandLabelFor(value.category, value.make),
      }),
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
  if (value.category === "truck" && value.form)
    chips.push({
      key: "form",
      label: tk(koreaFormLabelKey(value.form)),
      onRemove: () => set("form", null),
    });
  if (value.category === "truck" && value.capacity)
    chips.push({
      key: "capacity",
      label: tk("filters.capacityValue", { tons: value.capacity }),
      onRemove: () => set("capacity", null),
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
