"use client";

import { useMemo, useState } from "react";
import {
  BorderBeam,
  Button,
  Form,
  Input,
  Segmented,
  Select,
  Space,
} from "antd";
import type { BorderBeamGradient } from "antd";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { JapanIcon, KoreaIcon, ShieldIcon } from "@/components/icons";
import { TOP_JAPAN_MAKES, brandLogoUrl, norm } from "@/lib/brand";
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
  /** Real brand names for the Japan (AJES) auction, from `/filters`. */
  japanBrands?: string[];
  /** Korea brands — backend not wired yet, falls back to `DEMO_KOREA_BRANDS`. */
  koreaBrands?: string[];
  filterOptions?: FilterOptions;
};

// Base for the per-make cards + advanced search (the auction browser).
const VIEW_ALL_HREF: Record<Tab, string> = {
  japan: "/japan",
  korea: "/korea",
};

// The "view all" card opens the manufacturers explorer (Japan only for now).
const BROWSE_ALL_HREF: Record<Tab, string> = {
  japan: "/japan/brands",
  korea: "/korea",
};

// Brand-blue gradient for the search form's BorderBeam (Ocean preset).
const SEARCH_BEAM_COLOR: BorderBeamGradient = [
  { color: "#1677ff", percent: 0 },
  { color: "#36cfc9", percent: 52 },
  { color: "#95de64", percent: 100 },
];

// Curated "popular" makes shown with logos in the featured grid. Nine each so
// the grid reads as 5×2 with the "all" card filling the tenth cell. Japan
// reuses the shared `TOP_JAPAN_MAKES` ranking (see `@/lib/brand`).
const FEATURED_MAKES: Record<Tab, string[]> = {
  japan: [...TOP_JAPAN_MAKES],
  korea: [
    "Hyundai",
    "Kia",
    "Genesis",
    "Samsung",
    "SsangYong",
    "Chevrolet",
    "Renault",
    "BMW",
    "Audi",
  ],
};

// Demo brand list for Korea while its backend feed is not yet available.
const DEMO_KOREA_BRANDS = [
  "Hyundai",
  "Kia",
  "Genesis",
  "Samsung",
  "SsangYong",
  "Chevrolet",
  "Mercedes-Benz",
  "BMW",
  "Audi",
  "Volkswagen",
  "Toyota",
  "Lexus",
  "Honda",
  "Land Rover",
  "Volvo",
  "Mini",
  "Porsche",
  "Jaguar",
  "Tesla",
  "Renault",
  "Peugeot",
  "Ford",
  "Cadillac",
  "Lincoln",
  "Bentley",
  "Maserati",
  "Ferrari",
  "Lamborghini",
];

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

  // Model → marka lookup so chassis (which only carries its model name) can be
  // narrowed by the selected marka even before a model is chosen.
  const modelToMarka = useMemo(
    () => new Map((filterOptions?.models ?? []).map((m) => [m.name, m.marka])),
    [filterOptions?.models],
  );

  const modelOptions = useMemo(() => {
    const all = filterOptions?.models ?? [];
    const filtered = filters.marka
      ? all.filter((m) => !m.marka || m.marka === filters.marka)
      : all;
    return filtered.map((m) => ({ value: m.name, label: m.name }));
  }, [filterOptions?.models, filters.marka]);

  // Chassis stays searchable even with nothing selected (type "AWS210" to find
  // Crown); a marka narrows it to that marka's chassis, a model narrows further.
  const chassisOptions = useMemo(() => {
    const all = filterOptions?.chassis ?? [];
    const filtered = filters.model
      ? all.filter((c) => c.model === filters.model)
      : filters.marka
        ? all.filter((c) => modelToMarka.get(c.model) === filters.marka)
        : all;
    // Without a model the list spans every model, so the bare code is
    // ambiguous — append the model name to disambiguate.
    const withModel = !filters.model;
    return filtered.map((c) => ({
      value: c.code,
      label: withModel
        ? `${c.code} · ${c.model} (${formatCount(c.count)})`
        : `${c.code} (${formatCount(c.count)})`,
    }));
  }, [filterOptions?.chassis, filters.model, filters.marka, modelToMarka]);

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

  return (
    <section className="w-full bg-white dark:bg-neutral-950">
      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-12 px-4 pb-6 pt-10 md:pb-8 md:pt-6 lg:grid-cols-10">
        {/* LEFT — 70% — featured brands + search bar */}
        <div className="lg:col-span-7">
          {/* Header — title + Japan/Korea segment */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-[22px] font-semibold tracking-tight text-neutral-900 md:text-[26px] dark:text-neutral-50">
              {t("title")}
            </h2>
            <Segmented<Tab>
              value={tab}
              onChange={setTab}
              options={segments}
              size="large"
            />
          </div>

          {/* Featured brands — 5×2 grid (9 brands + view-all) */}
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {featuredMakes.map(({ value, label }) => (
              <Link
                key={value}
                href={`${viewAllHref}?marka=${encodeURIComponent(value)}`}
                className="group flex items-center gap-2.5 rounded-xl border border-neutral-100 bg-white p-2.5 transition-all hover:border-neutral-300 hover:shadow-sm dark:border-neutral-800 dark:bg-neutral-950 dark:hover:border-neutral-600"
              >
                <img
                  src={brandLogoUrl(label)}
                  alt={label}
                  loading="lazy"
                  width={28}
                  height={28}
                  className="h-7 w-7 shrink-0 object-contain transition-transform group-hover:scale-110"
                />
                <span className="truncate text-[12.5px] font-semibold text-neutral-900 dark:text-neutral-100">
                  {label}
                </span>
              </Link>
            ))}
            {/* 10th cell — view all → manufacturers explorer */}
            <Link
              href={BROWSE_ALL_HREF[tab]}
              className="group flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-neutral-200 bg-neutral-50/60 p-2.5 text-[13px] font-semibold text-neutral-700 transition-all hover:border-primary hover:text-primary dark:border-neutral-700 dark:bg-neutral-900/40 dark:text-neutral-300"
            >
              <span>{t("viewAllShort")}</span>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="transition-transform group-hover:translate-x-0.5"
              >
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </Link>
          </div>

          {/* Search form — wrapped in a rounded card with an animated
              BorderBeam running along its edge. */}
          <div className="mt-6">
            <BorderBeam color={SEARCH_BEAM_COLOR} outset={0}>
              <div className="relative overflow-hidden rounded-2xl border border-neutral-200 bg-[#f2f2f2] p-5 sm:p-6 dark:border-neutral-800 dark:bg-neutral-900/40">
                <Form
                  layout="vertical"
                  onFinish={onAdvancedSubmit}
                  requiredMark={false}
                >
                  <div className="[&_.ant-input-affix-wrapper-filled]:bg-white! [&_.ant-input-filled]:bg-white! [&_.ant-input::placeholder]:text-neutral-500! [&_.ant-select-filled]:bg-white! [&_.ant-select-placeholder]:text-neutral-500!">
                    {/* Row 1 — marka · model · chassis */}
                    <div className="grid grid-cols-1 gap-x-3 sm:grid-cols-3">
                      <Form.Item
                        label={tf("placeholders.marka")}
                        className="mb-3! sm:mb-0!"
                      >
                        <Select
                          placeholder={tf("placeholders.marka")}
                          allowClear
                          showSearch
                          size="large"
                          variant="filled"
                          options={markaOptions}
                          value={filters.marka ?? undefined}
                          onChange={(v) => setMarka(v ?? null)}
                          optionFilterProp="label"
                        />
                      </Form.Item>
                      <Form.Item
                        label={tf("placeholders.model")}
                        className="mb-3! sm:mb-0!"
                      >
                        <Select
                          placeholder={tf("placeholders.model")}
                          allowClear
                          showSearch
                          size="large"
                          variant="filled"
                          options={modelOptions}
                          value={filters.model ?? undefined}
                          onChange={(v) => setModel(v ?? null)}
                          optionFilterProp="label"
                        />
                      </Form.Item>
                      <Form.Item
                        label={tf("placeholders.chassis")}
                        className="mb-3! sm:mb-0!"
                      >
                        <Select
                          placeholder={tf("placeholders.chassis")}
                          allowClear
                          showSearch
                          size="large"
                          variant="filled"
                          options={chassisOptions}
                          value={filters.chassis ?? undefined}
                          onChange={(v) => setFilter("chassis", v ?? null)}
                          optionFilterProp="label"
                        />
                      </Form.Item>
                    </div>

                    {/* Row 2 — rate · year · lot · submit */}
                    <div className="grid grid-cols-1 gap-x-3 sm:mt-4 sm:grid-cols-[1fr_1.6fr_1fr_auto] sm:items-end">
                      <Form.Item
                        label={tf("placeholders.rate")}
                        className="mb-3! sm:mb-0!"
                      >
                        <Select
                          placeholder={tf("placeholders.rate")}
                          allowClear
                          size="large"
                          variant="filled"
                          options={rateOptions}
                          value={filters.rate ?? undefined}
                          onChange={(v) => setFilter("rate", v ?? null)}
                        />
                      </Form.Item>
                      <Form.Item
                        label={tf("year.label")}
                        className="mb-3! sm:mb-0!"
                      >
                        <Space.Compact block>
                          <Select
                            placeholder={tf("year.fromPlaceholder")}
                            allowClear
                            size="large"
                            variant="filled"
                            options={yearFromOptions}
                            value={filters.yearFrom ?? undefined}
                            onChange={(v) => setFilter("yearFrom", v ?? null)}
                            style={{ width: "50%" }}
                          />
                          <Select
                            placeholder={tf("year.toPlaceholder")}
                            allowClear
                            size="large"
                            variant="filled"
                            options={yearToOptions}
                            value={filters.yearTo ?? undefined}
                            onChange={(v) => setFilter("yearTo", v ?? null)}
                            style={{ width: "50%" }}
                          />
                        </Space.Compact>
                      </Form.Item>
                      <Form.Item
                        label={tf("placeholders.lot")}
                        className="mb-3! sm:mb-0!"
                      >
                        <Input
                          placeholder={tf("placeholders.lot")}
                          size="large"
                          variant="filled"
                          allowClear
                          value={filters.lot}
                          onChange={(e) => setFilter("lot", e.target.value)}
                        />
                      </Form.Item>
                      <Button
                        color="default"
                        variant="solid"
                        size="large"
                        className="w-full rounded-full! px-7! text-[14px]! font-semibold! sm:w-auto"
                      >
                        {t("search")}
                      </Button>
                    </div>
                  </div>
                </Form>
              </div>
            </BorderBeam>
          </div>
        </div>

        {/* RIGHT — 30% — VIN / accident check */}
        <aside className="relative flex min-h-110 flex-col overflow-hidden rounded-2xl shadow-sm ring-1 ring-blue-950/10 lg:col-span-3 lg:min-h-0 dark:ring-white/10">
          {/* Background scene — damaged-car inspection report */}
          <img
            src="/images/tjreport_bg2.webp"
            alt=""
            aria-hidden
            className="pointer-events-none absolute inset-0 h-full w-full object-cover object-center select-none"
          />
          {/* Legibility overlays — deep navy, strongest at top (heading) and bottom (form) */}
          <div className="pointer-events-none absolute inset-0 bg-linear-to-b from-[#05122e]/95 via-[#05122e]/35 to-[#020a1f]/95" />
          <div className="pointer-events-none absolute inset-0 bg-linear-to-tr from-[#05122e]/70 via-transparent to-transparent" />

          <div className="relative flex flex-1 flex-col p-6 md:p-7">
            <div className="flex items-start gap-4">
              <div>
                <h3 className="text-xl font-semibold text-white">
                  {t("vin.title")}
                </h3>
                <p className="mt-1.5 text-[12.5px] leading-relaxed text-blue-100/80">
                  {t("vin.blurb")}
                </p>
              </div>
            </div>

            <Form
              form={vinForm}
              layout="vertical"
              onFinish={onVinSubmit}
              className="mt-auto pt-8"
              requiredMark={false}
            >
              <Form.Item
                name="vin"
                rules={[{ required: true, message: t("vin.required") }]}
                className="mb-3!"
              >
                <Input
                  placeholder={t("vin.placeholder")}
                  size="large"
                  autoComplete="off"
                  spellCheck={false}
                  className="rounded-xl! border-white/30! bg-white/95! shadow-sm! backdrop-blur"
                />
              </Form.Item>
              <Button
                htmlType="submit"
                type="primary"
                size="large"
                block
                className="rounded-xl! border-none! bg-blue-600! font-semibold! text-white! shadow-lg! hover:bg-blue-500!"
              >
                {t("vin.submit")}
              </Button>
            </Form>
          </div>
        </aside>
      </div>
    </section>
  );
}
