"use client";

import { useMemo, useState } from "react";
import { Button, Select, Space } from "antd";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { JapanIcon, KoreaIcon } from "@/components/icons";
import {
  EMPTY_FILTERS,
  RATE_OPTIONS,
  YEAR_OPTIONS,
  filtersToQuery,
  type FilterOptions,
  type FilterValues,
} from "@/types/filters";

type Tab = "japan" | "korea";

type Props = {
  filterOptions?: FilterOptions;
};

const TABS: {
  key: Tab;
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}[] = [
  { key: "japan", Icon: JapanIcon },
  { key: "korea", Icon: KoreaIcon },
];

export default function HeroFilter({ filterOptions }: Props) {
  const t = useTranslations("homeFilter");
  const tf = useTranslations("featured.filters");
  const router = useRouter();

  const [tab, setTab] = useState<Tab>("japan");
  const [filters, setFilters] = useState<FilterValues>(EMPTY_FILTERS);

  const set = <K extends keyof FilterValues>(key: K, v: FilterValues[K]) =>
    setFilters((prev) => ({ ...prev, [key]: v }));

  const setMarka = (marka: string | null) =>
    setFilters((prev) => ({ ...prev, marka, model: null, chassis: null }));

  const setModel = (model: string | null) =>
    setFilters((prev) => ({ ...prev, model, chassis: null }));

  const markaOptions = useMemo(
    () => (filterOptions?.markas ?? []).map((v) => ({ value: v, label: v })),
    [filterOptions?.markas],
  );

  const modelOptions = useMemo(() => {
    const all = filterOptions?.models ?? [];
    const filtered = filters.marka
      ? all.filter((m) => !m.marka || m.marka === filters.marka)
      : all;
    return filtered.map((m) => ({ value: m.name, label: m.name }));
  }, [filterOptions?.models, filters.marka]);

  const chassisOptions = useMemo(() => {
    if (!filters.model) return [];
    return (filterOptions?.chassis ?? [])
      .filter((c) => c.model === filters.model)
      .map((c) => ({ value: c.code, label: c.code }));
  }, [filterOptions?.chassis, filters.model]);

  const yearFromOptions = useMemo(
    () =>
      YEAR_OPTIONS.filter(
        (y) => filters.yearTo == null || y <= filters.yearTo,
      ).map((y) => ({ value: y, label: String(y) })),
    [filters.yearTo],
  );

  const yearToOptions = useMemo(
    () =>
      YEAR_OPTIONS.filter(
        (y) => filters.yearFrom == null || y >= filters.yearFrom,
      ).map((y) => ({ value: y, label: String(y) })),
    [filters.yearFrom],
  );

  const rateOptions = useMemo(
    () => RATE_OPTIONS.map((r) => ({ value: r, label: r })),
    [],
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = filtersToQuery(filters);
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(q)) params.set(k, String(v));
    const qs = params.toString();
    router.push(qs ? `/${tab}?${qs}` : `/${tab}`);
  };

  return (
    <section className="mx-auto w-full max-w-7xl px-4 pb-10 md:pb-14">
      <form
        onSubmit={handleSubmit}
        className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-[0_28px_56px_-32px_rgba(15,15,25,0.22)] dark:border-neutral-800 dark:bg-neutral-950"
      >
        <div
          role="tablist"
          aria-label={t("ariaTabs")}
          className="flex items-center gap-1 border-b border-neutral-100 px-3 py-2.5 dark:border-neutral-800"
        >
          {TABS.map(({ key, Icon }) => {
            const active = tab === key;
            return (
              <Button
                key={key}
                type="text"
                role="tab"
                aria-selected={active}
                onClick={() => setTab(key)}
                className={
                  active
                    ? "rounded-full! bg-neutral-900! pl-1! pr-4! text-[13px]! font-semibold! text-white! dark:bg-neutral-100! dark:text-neutral-900! hover:bg-neutral-900! dark:hover:bg-neutral-100!"
                    : "rounded-full! pl-1! pr-4! text-[13px]! font-medium! text-neutral-500! hover:text-neutral-900! dark:text-neutral-400! dark:hover:text-neutral-100!"
                }
              >
                <span
                  className={`block h-7 w-7 overflow-hidden rounded-full ring-1 ${
                    active
                      ? "ring-white/40 dark:ring-neutral-900/40"
                      : "ring-black/10 dark:ring-white/10"
                  }`}
                >
                  <Icon className="h-full w-full" />
                </span>
                {t(`tabs.${key}`)}
              </Button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 divide-y divide-neutral-100 lg:grid-cols-5 lg:divide-x lg:divide-y-0 dark:divide-neutral-800">
          <Cell label={tf("placeholders.marka")}>
            <Select
              placeholder={tf("placeholders.marka")}
              allowClear
              showSearch
              variant="borderless"
              options={markaOptions}
              value={filters.marka ?? undefined}
              onChange={(v) => setMarka(v ?? null)}
              style={{ width: "100%" }}
              optionFilterProp="label"
            />
          </Cell>
          <Cell label={tf("placeholders.model")}>
            <Select
              placeholder={tf("placeholders.model")}
              allowClear
              showSearch
              variant="borderless"
              options={modelOptions}
              value={filters.model ?? undefined}
              onChange={(v) => setModel(v ?? null)}
              disabled={!filters.marka}
              style={{ width: "100%" }}
              optionFilterProp="label"
            />
          </Cell>
          <Cell label={tf("placeholders.chassis")}>
            <Select
              placeholder={tf("placeholders.chassis")}
              allowClear
              showSearch
              variant="borderless"
              options={chassisOptions}
              value={filters.chassis ?? undefined}
              onChange={(v) => set("chassis", v ?? null)}
              disabled={!filters.model}
              style={{ width: "100%" }}
              optionFilterProp="label"
            />
          </Cell>
          <Cell label={tf("year.label")}>
            <Space.Compact block>
              <Select
                placeholder={tf("year.fromPlaceholder")}
                allowClear
                variant="borderless"
                options={yearFromOptions}
                value={filters.yearFrom ?? undefined}
                onChange={(v) => set("yearFrom", v ?? null)}
                style={{ width: "50%" }}
              />
              <Select
                placeholder={tf("year.toPlaceholder")}
                allowClear
                variant="borderless"
                options={yearToOptions}
                value={filters.yearTo ?? undefined}
                onChange={(v) => set("yearTo", v ?? null)}
                style={{ width: "50%" }}
              />
            </Space.Compact>
          </Cell>
          <Cell label={tf("placeholders.rate")}>
            <Select
              placeholder={tf("placeholders.rate")}
              allowClear
              variant="borderless"
              options={rateOptions}
              value={filters.rate ?? undefined}
              onChange={(v) => set("rate", v ?? null)}
              style={{ width: "100%" }}
            />
          </Cell>
        </div>

        <div className="border-t border-neutral-100 bg-neutral-50/60 p-3 dark:border-neutral-800 dark:bg-neutral-900/40">
          <Button
            htmlType="submit"
            color="default"
            variant="solid"
            size="large"
            block
            className="rounded-full! text-[14px]! font-semibold!"
          >
            <SearchIcon className="h-4 w-4" />
            {t("submit")}
          </Button>
        </div>
      </form>
    </section>
  );
}

function Cell({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-0.5 px-4 py-3">
      <span className="text-[10.5px] font-semibold uppercase text-neutral-500 dark:text-neutral-400">
        {label}
      </span>
      {children}
    </div>
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
      <circle cx="11" cy="11" r="7" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}
