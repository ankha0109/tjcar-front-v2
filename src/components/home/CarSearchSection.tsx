"use client";

import { useMemo, useState } from "react";
import { Button, Form, Input, Segmented, Select, Space } from "antd";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { JapanIcon, KoreaIcon, ShieldIcon } from "@/components/icons";
import {
  EMPTY_FILTERS,
  RATE_OPTIONS,
  YEAR_OPTIONS,
  filtersToQuery,
  type FilterOptions,
  type FilterValues,
} from "@/types/filters";
import { cn } from "@/utils";

type FilterMode = "maker" | "advanced";
type Tab = "japan" | "korea";

type Props = {
  /** Real brand names for the Japan (AJES) auction, from `/filters`. */
  japanBrands?: string[];
  /** Korea brands — backend not wired yet, falls back to `DEMO_KOREA_BRANDS`. */
  koreaBrands?: string[];
  filterOptions?: FilterOptions;
};

const MAX_VISIBLE_MAKES = 29; // leaves room for the trailing "Бүх марк ↓" cell

const VIEW_ALL_HREF: Record<Tab, string> = {
  japan: "/japan",
  korea: "/korea",
};

// Curated "popular" makes shown with logos above the full alphabetic grid.
const FEATURED_MAKES: Record<Tab, string[]> = {
  japan: ["Toyota", "Lexus", "Mercedes-Benz", "Subaru", "Nissan", "Mitsubishi"],
  korea: ["Hyundai", "Kia", "Genesis", "Samsung", "SsangYong", "Chevrolet"],
};

// Demo brand list for Korea while its backend feed is not yet available.
const DEMO_KOREA_BRANDS = [
  "Hyundai", "Kia", "Genesis", "Samsung", "SsangYong", "Chevrolet",
  "Mercedes-Benz", "BMW", "Audi", "Volkswagen", "Toyota", "Lexus", "Honda",
  "Land Rover", "Volvo", "Mini", "Porsche", "Jaguar", "Tesla", "Renault",
  "Peugeot", "Ford", "Cadillac", "Lincoln", "Bentley", "Maserati", "Ferrari",
  "Lamborghini",
];

function logoUrl(marka: string) {
  const slug = marka.toLowerCase().replace(/\s+/g, "-");
  return `https://www.carlogos.org/car-logos/${slug}-logo.png`;
}

// Backend brand names arrive upper-cased ("TOYOTA"); curated lists use title
// case. Normalise both sides so they match regardless of casing/punctuation.
const norm = (s: string) => s.toUpperCase().replace(/[^A-Z0-9]/g, "");

function formatCount(n: number) {
  return new Intl.NumberFormat("en-US").format(n);
}

export default function CarSearchSection({
  japanBrands,
  koreaBrands,
  filterOptions,
}: Props) {
  const t = useTranslations("homeSearch");
  const tf = useTranslations("featured.filters");
  const router = useRouter();

  const [mode, setMode] = useState<FilterMode>("advanced");
  const [tab, setTab] = useState<Tab>("japan");
  const [filters, setFilters] = useState<FilterValues>(EMPTY_FILTERS);
  const [vinForm] = Form.useForm<{ vin: string }>();

  const brands = useMemo<string[]>(() => {
    if (tab === "japan") return japanBrands ?? [];
    return koreaBrands && koreaBrands.length ? koreaBrands : DEMO_KOREA_BRANDS;
  }, [tab, japanBrands, koreaBrands]);

  // Resolve each curated featured make to its real brand value (for the link)
  // while keeping the nicely-cased curated label (for the logo + caption).
  const featuredMakes = useMemo(() => {
    const byNorm = new Map(brands.map((b) => [norm(b), b]));
    return FEATURED_MAKES[tab].map((name) => ({
      value: byNorm.get(norm(name)) ?? name,
      label: name,
    }));
  }, [brands, tab]);

  const otherMakes = useMemo(() => {
    const featuredNorm = new Set(FEATURED_MAKES[tab].map(norm));
    return brands
      .filter((b) => !featuredNorm.has(norm(b)))
      .sort((a, b) => a.localeCompare(b))
      .slice(0, MAX_VISIBLE_MAKES);
  }, [brands, tab]);

  const viewAllHref = VIEW_ALL_HREF[tab];

  const setFilter = <K extends keyof FilterValues>(
    key: K,
    v: FilterValues[K],
  ) => setFilters((prev) => ({ ...prev, [key]: v }));

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
      .map((c) => ({
        value: c.code,
        label: `${c.code} (${formatCount(c.count)})`,
      }));
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

  const onAdvancedSubmit = () => {
    const q = filtersToQuery(filters);
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(q)) params.set(k, String(v));
    const qs = params.toString();
    router.push(qs ? `/${tab}?${qs}` : `/${tab}`);
  };

  const onVinSubmit = ({ vin }: { vin: string }) => {
    const v = vin.trim();
    if (!v) return;
    router.push(`/report?vin=${encodeURIComponent(v)}`);
  };

  const segments = [
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

  const modeTabs: { key: FilterMode; label: string }[] = [
    { key: "maker", label: t("filterMode.maker") },
    { key: "advanced", label: t("filterMode.advanced") },
  ];

  return (
    <section className="w-full bg-white dark:bg-neutral-950">
      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-5 px-4 pb-6 pt-10 md:pb-8 md:pt-6 lg:grid-cols-10">
        {/* LEFT — 70% */}
        <div className="lg:col-span-7">
          <div className="flex items-center gap-10">
            <h2 className="text-[22px] font-semibold tracking-tight text-neutral-900 md:text-[26px] dark:text-neutral-50">
              {t("title")}
            </h2>
            <p className="max-w-2xl text-[13.5px] leading-relaxed text-neutral-600 md:text-[14px] dark:text-neutral-400">
              {t("description")}
            </p>
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Segmented<Tab>
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
                    onClick={() => setMode(key)}
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
              {/* Featured (left, vertical) + other makes (right) */}
              <div className="mt-5 grid grid-cols-1 gap-6 border-b border-neutral-100 pb-5 md:grid-cols-[220px_1fr] dark:border-neutral-900">
                {/* LEFT — featured makes, vertical with logos */}
                <div className="flex flex-col gap-2">
                  {featuredMakes.map(({ value, label }) => (
                    <Link
                      key={value}
                      href={`${viewAllHref}?marka=${encodeURIComponent(value)}`}
                      className="group flex items-center gap-3 rounded-xl border border-neutral-100 bg-white p-2.5 transition-all hover:border-neutral-300 hover:shadow-sm dark:border-neutral-800 dark:bg-neutral-950 dark:hover:border-neutral-600"
                    >
                      <img
                        src={logoUrl(label)}
                        alt={label}
                        loading="lazy"
                        width={32}
                        height={32}
                        className="h-8 w-8 shrink-0 object-contain transition-transform group-hover:scale-110"
                      />
                      <span className="truncate text-[13px] font-semibold text-neutral-900 dark:text-neutral-100">
                        {label}
                      </span>
                    </Link>
                  ))}
                </div>

                {/* RIGHT — other makes grid */}
                <div className="grid grid-cols-2 gap-x-6 gap-y-2 self-start sm:grid-cols-3 lg:grid-cols-4">
                  {otherMakes.map((marka) => (
                    <Link
                      key={marka}
                      href={`${viewAllHref}?marka=${encodeURIComponent(marka)}`}
                      className="group flex items-baseline gap-1.5 truncate py-0.5 text-[13px]"
                    >
                      <span className="truncate font-medium text-neutral-900 group-hover:text-primary dark:text-neutral-100">
                        {marka}
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
              </div>

              {/* Footer */}
              <div className="mt-6 flex justify-end border-t border-neutral-100 pt-4 dark:border-neutral-900">
                <Button
                  onClick={() => router.push(viewAllHref)}
                  className="rounded-full! text-[13px]! font-semibold!"
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
            <Form
              layout="vertical"
              onFinish={onAdvancedSubmit}
              requiredMark={false}
              className="mt-5"
            >
              <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2 md:grid-cols-3">
                <Form.Item
                  label={tf("placeholders.marka")}
                  className="!mb-3"
                >
                  <Select
                    placeholder={tf("placeholders.marka")}
                    allowClear
                    showSearch
                    size="large"
                    options={markaOptions}
                    value={filters.marka ?? undefined}
                    onChange={(v) => setMarka(v ?? null)}
                    optionFilterProp="label"
                  />
                </Form.Item>
                <Form.Item
                  label={tf("placeholders.model")}
                  className="!mb-3"
                >
                  <Select
                    placeholder={tf("placeholders.model")}
                    allowClear
                    showSearch
                    size="large"
                    options={modelOptions}
                    value={filters.model ?? undefined}
                    onChange={(v) => setModel(v ?? null)}
                    disabled={!filters.marka}
                    optionFilterProp="label"
                  />
                </Form.Item>
                <Form.Item label={tf("placeholders.chassis")} className="!mb-3">
                  <Select
                    placeholder={tf("placeholders.chassis")}
                    allowClear
                    showSearch
                    size="large"
                    options={chassisOptions}
                    value={filters.chassis ?? undefined}
                    onChange={(v) => setFilter("chassis", v ?? null)}
                    disabled={!filters.model}
                    optionFilterProp="label"
                  />
                </Form.Item>
                <Form.Item
                  label={tf("year.label")}
                  className="!mb-3 sm:col-span-2 md:col-span-2"
                >
                  <Space.Compact block>
                    <Select
                      placeholder={tf("year.fromPlaceholder")}
                      allowClear
                      size="large"
                      options={yearFromOptions}
                      value={filters.yearFrom ?? undefined}
                      onChange={(v) => setFilter("yearFrom", v ?? null)}
                      style={{ width: "50%" }}
                    />
                    <Select
                      placeholder={tf("year.toPlaceholder")}
                      allowClear
                      size="large"
                      options={yearToOptions}
                      value={filters.yearTo ?? undefined}
                      onChange={(v) => setFilter("yearTo", v ?? null)}
                      style={{ width: "50%" }}
                    />
                  </Space.Compact>
                </Form.Item>
                <Form.Item label={tf("placeholders.rate")} className="!mb-3">
                  <Select
                    placeholder={tf("placeholders.rate")}
                    allowClear
                    size="large"
                    options={rateOptions}
                    value={filters.rate ?? undefined}
                    onChange={(v) => setFilter("rate", v ?? null)}
                  />
                </Form.Item>
              </div>
              <Button
                htmlType="submit"
                type="primary"
                size="large"
                block
                className="mt-2! rounded-full! text-[14px]! font-semibold!"
              >
                {tf("done")}
              </Button>
            </Form>
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
