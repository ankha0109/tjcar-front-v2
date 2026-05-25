"use client";

import { useMemo, useState } from "react";
import { Button, Form, Input, Segmented, Select, Space } from "antd";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { CarIcon, JapanIcon, KoreaIcon, ShieldIcon } from "@/components/icons";
import {
  EMPTY_FILTERS,
  RATE_OPTIONS,
  YEAR_OPTIONS,
  filtersToQuery,
  type FilterOptions,
  type FilterValues,
  type MarkaSource,
  type MarkaStatsResponse,
} from "@/types/filters";
import { cn } from "@/utils";

type FilterMode = "maker" | "advanced";

type Props = {
  japan?: MarkaStatsResponse;
  korea?: MarkaStatsResponse;
  ready?: MarkaStatsResponse;
  filterOptions?: FilterOptions;
};

const MAX_VISIBLE_MAKES = 29; // leaves room for the trailing "Бүх марк ↓" cell

const VIEW_ALL_HREF: Record<MarkaSource, string> = {
  japan: "/japan",
  korea: "/korea",
  ready: "/cars",
};

// Curated "popular" makes shown with logos above the full alphabetic grid.
const FEATURED_MAKES: Record<MarkaSource, string[]> = {
  japan: ["Toyota", "Honda", "Nissan", "Subaru", "Mitsubishi", "Lexus"],
  korea: ["Hyundai", "Kia", "Genesis", "Samsung", "SsangYong", "Chevrolet"],
  ready: ["Toyota", "Hyundai", "Honda", "Lexus", "Mercedes-Benz", "BMW"],
};

function logoUrl(marka: string) {
  const slug = marka.toLowerCase().replace(/\s+/g, "-");
  return `https://www.carlogos.org/car-logos/${slug}-logo.png`;
}

// Demo fallback while backend `/marka-stats` is not yet available.
// Counts are illustrative; real values come from the API once it ships.
const DEMO_STATS: Record<MarkaSource, MarkaStatsResponse> = {
  japan: {
    total: 312_540,
    items: [
      { marka: "Toyota", count: 78_420 },
      { marka: "Honda", count: 41_230 },
      { marka: "Nissan", count: 32_180 },
      { marka: "Mazda", count: 21_540 },
      { marka: "Subaru", count: 18_760 },
      { marka: "Mitsubishi", count: 16_320 },
      { marka: "Suzuki", count: 15_870 },
      { marka: "Lexus", count: 14_650 },
      { marka: "Daihatsu", count: 12_410 },
      { marka: "Isuzu", count: 9_820 },
      { marka: "BMW", count: 8_540 },
      { marka: "Mercedes-Benz", count: 8_120 },
      { marka: "Volkswagen", count: 6_980 },
      { marka: "Audi", count: 5_870 },
      { marka: "Hino", count: 5_240 },
      { marka: "Acura", count: 4_810 },
      { marka: "Infiniti", count: 4_320 },
      { marka: "Volvo", count: 3_760 },
      { marka: "Porsche", count: 3_210 },
      { marka: "Mini", count: 2_980 },
      { marka: "Land Rover", count: 2_640 },
      { marka: "Jaguar", count: 2_180 },
      { marka: "Peugeot", count: 1_920 },
      { marka: "Fiat", count: 1_540 },
      { marka: "Alfa Romeo", count: 1_180 },
      { marka: "Renault", count: 980 },
      { marka: "Ford", count: 870 },
      { marka: "Chevrolet", count: 620 },
      { marka: "Tesla", count: 410 },
    ],
  },
  korea: {
    total: 187_910,
    items: [
      { marka: "Hyundai", count: 52_840 },
      { marka: "Kia", count: 47_320 },
      { marka: "Genesis", count: 18_460 },
      { marka: "Samsung", count: 12_980 },
      { marka: "SsangYong", count: 9_540 },
      { marka: "Chevrolet", count: 8_760 },
      { marka: "Mercedes-Benz", count: 7_820 },
      { marka: "BMW", count: 7_240 },
      { marka: "Audi", count: 5_180 },
      { marka: "Volkswagen", count: 4_620 },
      { marka: "Toyota", count: 4_120 },
      { marka: "Lexus", count: 3_980 },
      { marka: "Honda", count: 3_240 },
      { marka: "Land Rover", count: 2_870 },
      { marka: "Volvo", count: 2_410 },
      { marka: "Mini", count: 2_180 },
      { marka: "Porsche", count: 1_960 },
      { marka: "Jaguar", count: 1_540 },
      { marka: "Tesla", count: 1_380 },
      { marka: "Renault", count: 1_120 },
      { marka: "Peugeot", count: 980 },
      { marka: "Ford", count: 820 },
      { marka: "Cadillac", count: 640 },
      { marka: "Lincoln", count: 480 },
      { marka: "Bentley", count: 320 },
      { marka: "Maserati", count: 240 },
      { marka: "Ferrari", count: 120 },
      { marka: "Lamborghini", count: 80 },
    ],
  },
  ready: {
    total: 1_240,
    items: [
      { marka: "Toyota", count: 320 },
      { marka: "Hyundai", count: 180 },
      { marka: "Honda", count: 142 },
      { marka: "Kia", count: 118 },
      { marka: "Nissan", count: 96 },
      { marka: "Lexus", count: 78 },
      { marka: "Mazda", count: 62 },
      { marka: "Subaru", count: 54 },
      { marka: "Mercedes-Benz", count: 48 },
      { marka: "BMW", count: 42 },
      { marka: "Mitsubishi", count: 36 },
      { marka: "Genesis", count: 28 },
      { marka: "Audi", count: 22 },
      { marka: "Volkswagen", count: 18 },
      { marka: "Suzuki", count: 14 },
      { marka: "Land Rover", count: 12 },
      { marka: "Porsche", count: 10 },
      { marka: "Volvo", count: 8 },
      { marka: "Mini", count: 6 },
      { marka: "Daihatsu", count: 5 },
    ],
  },
};

function formatCount(n: number) {
  return new Intl.NumberFormat("en-US").format(n);
}

export default function CarSearchSection({
  japan,
  korea,
  ready,
  filterOptions,
}: Props) {
  const t = useTranslations("homeSearch");
  const tf = useTranslations("featured.filters");
  const router = useRouter();

  const [mode, setMode] = useState<FilterMode>("maker");
  const [tab, setTab] = useState<MarkaSource>("japan");
  const [filters, setFilters] = useState<FilterValues>(EMPTY_FILTERS);
  const [vinForm] = Form.useForm<{ vin: string }>();

  const data = useMemo<MarkaStatsResponse>(() => {
    const source = tab === "japan" ? japan : tab === "korea" ? korea : ready;
    if (source && source.items.length > 0) return source;
    return DEMO_STATS[tab];
  }, [tab, japan, korea, ready]);

  const sortedMakes = useMemo(
    () =>
      [...data.items]
        .sort((a, b) => b.count - a.count)
        .slice(0, MAX_VISIBLE_MAKES),
    [data.items],
  );

  const viewAllHref = VIEW_ALL_HREF[tab];

  const setFilter = <K extends keyof FilterValues>(
    key: K,
    v: FilterValues[K],
  ) => setFilters((prev) => ({ ...prev, [key]: v }));

  const setMarka = (marka: string | null) =>
    setFilters((prev) => ({ ...prev, marka, model: null }));

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

  const bodyOptions = useMemo(
    () => (filterOptions?.bodies ?? []).map((v) => ({ value: v, label: v })),
    [filterOptions?.bodies],
  );

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

  const onAdvancedSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = filtersToQuery(filters);
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(q)) params.set(k, String(v));
    const advTarget = tab === "ready" ? "japan" : tab;
    const qs = params.toString();
    router.push(qs ? `/${advTarget}?${qs}` : `/${advTarget}`);
  };

  const onVinSubmit = ({ vin }: { vin: string }) => {
    const v = vin.trim();
    if (!v) return;
    router.push(`/report?vin=${encodeURIComponent(v)}`);
  };

  const baseSegments = [
    {
      label: (
        <span className="inline-flex items-center gap-1.5 px-1 text-[13px]">
          <JapanIcon className="h-4 w-4 shrink-0" />
          {t("segments.japan")}
        </span>
      ),
      value: "japan" as const,
    },
    {
      label: (
        <span className="inline-flex items-center gap-1.5 px-1 text-[13px]">
          <KoreaIcon className="h-4 w-4 shrink-0" />
          {t("segments.korea")}
        </span>
      ),
      value: "korea" as const,
    },
  ];

  const segments =
    mode === "maker"
      ? [
          ...baseSegments,
          {
            label: (
              <span className="inline-flex items-center gap-1.5 px-1 text-[13px]">
                <CarIcon className="h-4 w-4 shrink-0" />
                {t("segments.ready")}
              </span>
            ),
            value: "ready" as const,
          },
        ]
      : baseSegments;

  const modeTabs: { key: FilterMode; label: string }[] = [
    { key: "maker", label: t("filterMode.maker") },
    { key: "advanced", label: t("filterMode.advanced") },
  ];

  return (
    <section className="mx-auto w-full max-w-7xl px-4 pb-6 pt-10 md:pb-8 md:pt-14">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-10">
        {/* LEFT — 70% */}
        <div className="lg:col-span-7">
          <header>
            <h2 className="text-[22px] font-semibold tracking-tight text-neutral-900 md:text-[26px] dark:text-neutral-50">
              {t("title")}
            </h2>
            <p className="mt-2 max-w-2xl text-[13.5px] leading-relaxed text-neutral-600 md:text-[14px] dark:text-neutral-400">
              {t("description")}
            </p>
          </header>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Segmented<MarkaSource>
              value={tab}
              onChange={setTab}
              options={segments}
              size="large"
            />
            <nav
              aria-label={t("filterMode.maker")}
              className="flex shrink-0 items-center gap-1"
            >
              {modeTabs.map(({ key, label }) => {
                const active = mode === key;
                return (
                  <Button
                    key={key}
                    type="text"
                    onClick={() => {
                      setMode(key);
                      if (key === "advanced" && tab === "ready") setTab("japan");
                    }}
                    className={cn(
                      "rounded-full! text-[13px]!",
                      active
                        ? "font-semibold! text-neutral-900! dark:text-neutral-100!"
                        : "font-medium! text-neutral-500! hover:text-neutral-900! dark:text-neutral-400! dark:hover:text-neutral-100!",
                    )}
                  >
                    {label}
                  </Button>
                );
              })}
            </nav>
          </div>

          {mode === "maker" ? (
            <>
              {/* Featured makes — with logos */}
              <div className="mt-5 grid grid-cols-2 gap-3 border-b border-neutral-100 pb-5 sm:grid-cols-3 md:grid-cols-6 dark:border-neutral-900">
                {FEATURED_MAKES[tab].map((marka) => {
                  const entry = data.items.find((i) => i.marka === marka);
                  return (
                    <Link
                      key={marka}
                      href={`${viewAllHref}?marka=${encodeURIComponent(marka)}`}
                      className="group flex flex-col items-center justify-center gap-2 rounded-xl border border-neutral-100 bg-white p-3 transition-all hover:-translate-y-0.5 hover:border-neutral-300 hover:shadow-sm dark:border-neutral-800 dark:bg-neutral-950 dark:hover:border-neutral-600"
                    >
                      <img
                        src={logoUrl(marka)}
                        alt={marka}
                        loading="lazy"
                        width={40}
                        height={40}
                        className="h-10 w-10 object-contain transition-transform group-hover:scale-110"
                      />
                      <div className="flex flex-col items-center gap-0.5">
                        <span className="text-[12px] font-semibold text-neutral-900 dark:text-neutral-100">
                          {marka}
                        </span>
                        {entry ? (
                          <span className="text-[10.5px] tabular-nums text-neutral-400 dark:text-neutral-500">
                            {formatCount(entry.count)}
                          </span>
                        ) : null}
                      </div>
                    </Link>
                  );
                })}
              </div>

              {/* Make grid */}
              <div className="mt-5 grid grid-cols-2 gap-x-6 gap-y-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {sortedMakes.map(({ marka, count }) => (
                  <Link
                    key={marka}
                    href={`${viewAllHref}?marka=${encodeURIComponent(marka)}`}
                    className="group flex items-baseline gap-1.5 truncate py-0.5 text-[13px]"
                  >
                    <span className="truncate font-medium text-neutral-900 group-hover:text-primary dark:text-neutral-100">
                      {marka}
                    </span>
                    <span className="tabular-nums text-neutral-400 dark:text-neutral-500">
                      {formatCount(count)}
                    </span>
                  </Link>
                ))}
                <Link
                  href={viewAllHref}
                  className="flex items-center gap-1 py-0.5 text-[13px] font-medium text-neutral-700 hover:text-primary dark:text-neutral-300"
                >
                  <span>{t("allMakes")}</span>
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </Link>
              </div>

              {/* Footer */}
              <div className="mt-6 flex flex-col gap-3 border-t border-neutral-100 pt-4 sm:flex-row sm:items-center sm:justify-between dark:border-neutral-900">
                <span className="text-[13px] text-neutral-600 dark:text-neutral-400">
                  {t("totalInAuction", { count: formatCount(data.total) })}
                </span>
                <Button
                  onClick={() => router.push(viewAllHref)}
                  className="self-start! rounded-full! text-[13px]! font-semibold! sm:self-auto!"
                >
                  {t("viewAll")}
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </Button>
              </div>
            </>
          ) : (
            <form onSubmit={onAdvancedSubmit} className="mt-5">
              <div className="grid grid-cols-1 divide-y divide-neutral-100 rounded-2xl border border-neutral-200 bg-white sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-5 lg:divide-x dark:divide-neutral-800 dark:border-neutral-800 dark:bg-neutral-950">
                <AdvCell label={tf("placeholders.marka")}>
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
                </AdvCell>
                <AdvCell label={tf("placeholders.model")}>
                  <Select
                    placeholder={tf("placeholders.model")}
                    allowClear
                    showSearch
                    variant="borderless"
                    options={modelOptions}
                    value={filters.model ?? undefined}
                    onChange={(v) => setFilter("model", v ?? null)}
                    disabled={!filters.marka}
                    style={{ width: "100%" }}
                    optionFilterProp="label"
                  />
                </AdvCell>
                <AdvCell label={tf("placeholders.body")}>
                  <Select
                    placeholder={tf("placeholders.body")}
                    allowClear
                    variant="borderless"
                    options={bodyOptions}
                    value={filters.body ?? undefined}
                    onChange={(v) => setFilter("body", v ?? null)}
                    style={{ width: "100%" }}
                  />
                </AdvCell>
                <AdvCell label={tf("year.label")}>
                  <Space.Compact block>
                    <Select
                      placeholder={tf("year.fromPlaceholder")}
                      allowClear
                      variant="borderless"
                      options={yearFromOptions}
                      value={filters.yearFrom ?? undefined}
                      onChange={(v) => setFilter("yearFrom", v ?? null)}
                      style={{ width: "50%" }}
                    />
                    <Select
                      placeholder={tf("year.toPlaceholder")}
                      allowClear
                      variant="borderless"
                      options={yearToOptions}
                      value={filters.yearTo ?? undefined}
                      onChange={(v) => setFilter("yearTo", v ?? null)}
                      style={{ width: "50%" }}
                    />
                  </Space.Compact>
                </AdvCell>
                <AdvCell label={tf("placeholders.rate")}>
                  <Select
                    placeholder={tf("placeholders.rate")}
                    allowClear
                    variant="borderless"
                    options={rateOptions}
                    value={filters.rate ?? undefined}
                    onChange={(v) => setFilter("rate", v ?? null)}
                    style={{ width: "100%" }}
                  />
                </AdvCell>
              </div>
              <Button
                htmlType="submit"
                type="primary"
                size="large"
                block
                className="mt-4! rounded-full! text-[14px]! font-semibold!"
              >
                {tf("done")}
              </Button>
            </form>
          )}
        </div>

        {/* RIGHT — 30% — VIN check */}
        <aside className="rounded-2xl bg-neutral-50 p-5 md:p-6 lg:col-span-3 dark:bg-neutral-900">
          <div className="flex items-start gap-3">
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400">
              <ShieldIcon className="h-5 w-5" />
            </span>
            <div>
              <h3 className="text-[15px] font-semibold text-neutral-900 dark:text-neutral-50">
                {t("vin.title")}
              </h3>
              <p className="mt-1 text-[12.5px] leading-relaxed text-neutral-600 dark:text-neutral-400">
                {t("vin.blurb")}
              </p>
            </div>
          </div>

          <Form
            form={vinForm}
            layout="vertical"
            onFinish={onVinSubmit}
            className="mt-4"
            requiredMark={false}
          >
            <Form.Item
              name="vin"
              rules={[{ required: true, message: t("vin.required") }]}
              className="!mb-3"
            >
              <Input
                placeholder={t("vin.placeholder")}
                size="large"
                autoComplete="off"
                spellCheck={false}
                className="!rounded-xl"
              />
            </Form.Item>
            <Button
              htmlType="submit"
              type="primary"
              size="large"
              block
              className="rounded-xl! font-semibold!"
              color="default"
              variant="solid"
            >
              {t("vin.submit")}
            </Button>
          </Form>
        </aside>
      </div>
    </section>
  );
}

function AdvCell({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-0.5 px-4 py-3">
      <span className="text-[10.5px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
        {label}
      </span>
      {children}
    </div>
  );
}
