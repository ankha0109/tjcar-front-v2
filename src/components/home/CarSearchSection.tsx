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
import { useKoreaModels } from "@/hooks/useKoreaModels";
import { TOP_JAPAN_MAKES, brandLogoUrl, norm } from "@/lib/brand";
import {
  EMPTY_FILTERS,
  MILEAGE_STEPS,
  RATE_OPTIONS,
  YEAR_OPTIONS,
  filtersToQuery,
  type FilterOptions,
  type FilterValues,
} from "@/types/filters";
import {
  EMPTY_KOREA_FILTERS,
  FEATURED_KOREA_BRANDS,
  KOREA_BRANDS,
  KOREA_FUELS,
  KOREA_TRANSMISSIONS,
  koreaBrand,
  koreaFiltersToQuery,
  type KoreaFilterValues,
} from "@/types/korea";
import {
  normalizeFor,
  reportSearchQuery,
  validate,
  type SearchError,
  type SearchMode,
} from "@/lib/reportSearch";

type Tab = "japan" | "korea";

type Props = {
  /** Real brand names for the Japan (AJES) auction, from `/filters`. */
  japanBrands?: string[];
  filterOptions?: FilterOptions;
};

// The "view all" card opens that tab's manufacturers explorer.
const BROWSE_ALL_HREF: Record<Tab, string> = {
  japan: "/japan/brands",
  korea: "/korea/brands",
};

// Brand-blue gradient for the search form's BorderBeam (Ocean preset).
const SEARCH_BEAM_COLOR: BorderBeamGradient = [
  { color: "#1677ff", percent: 0 },
  { color: "#36cfc9", percent: 52 },
  { color: "#95de64", percent: 100 },
];

// The three things the report actually answers — shown as chips under the blurb.
const REPORT_POINTS = ["accident", "mileage", "report"] as const;

// Curated "popular" makes shown with logos in the featured grid. Nine each so
// the grid reads as 5×2 with the "all" card filling the tenth cell. Japan
// reuses the shared `TOP_JAPAN_MAKES` ranking (see `@/lib/brand`); Korea uses
// `FEATURED_KOREA_BRANDS` (see `@/types/korea`), whose entries carry the
// backend brand *slug* — `/korea` only accepts those.

// `car.card.transmission` keys are camelCase (semi-auto → semiAuto); cvt has none.
const TRANSMISSION_LABEL_KEYS: Record<string, string | null> = {
  auto: "auto",
  manual: "manual",
  "semi-auto": "semiAuto",
  cvt: null,
};

function formatCount(n: number) {
  return new Intl.NumberFormat("en-US").format(n);
}

export default function CarSearchSection({ japanBrands, filterOptions }: Props) {
  const t = useTranslations("homeSearch");
  const tf = useTranslations("featured.filters");
  const tk = useTranslations("korea");
  const tFuel = useTranslations("carDetail.fuel");
  const tTrans = useTranslations("car.card.transmission");
  const tr = useTranslations("reportLanding.hero.form");
  const router = useRouter();

  const [tab, setTab] = useState<Tab>("japan");
  const [filters, setFilters] = useState<FilterValues>(EMPTY_FILTERS);
  const [koreaFilters, setKoreaFilters] =
    useState<KoreaFilterValues>(EMPTY_KOREA_FILTERS);
  const [reportMode, setReportMode] = useState<SearchMode>("plate");
  const [reportValue, setReportValue] = useState("");
  const [reportError, setReportError] = useState<SearchError>(null);

  // Each tab links into its own browser with that browser's query contract:
  // `/japan` reads `marka`, `/korea` reads a `brand` slug (see `@/types/korea`).
  const featuredMakes = useMemo(() => {
    if (tab === "korea") {
      return FEATURED_KOREA_BRANDS.map((slug) => {
        const brand = koreaBrand(slug);
        return {
          key: slug,
          href: `/korea?brand=${slug}`,
          label: brand?.label ?? slug,
          logo: brand?.logo ?? brand?.label ?? slug,
        };
      });
    }
    // Resolve each curated make to the real `/filters` brand value (for the
    // link) while keeping the nicely-cased curated label (logo + caption).
    const byNorm = new Map((japanBrands ?? []).map((b) => [norm(b), b]));
    return TOP_JAPAN_MAKES.map((name) => {
      const value = byNorm.get(norm(name)) ?? name;
      return {
        key: value,
        href: `/japan?marka=${encodeURIComponent(value)}`,
        label: name,
        logo: name,
      };
    });
  }, [japanBrands, tab]);

  const setFilter = <K extends keyof FilterValues>(
    key: K,
    v: FilterValues[K],
  ) => setFilters((prev) => ({ ...prev, [key]: v }));

  const setMarka = (marka: string | null) =>
    setFilters((prev) => ({ ...prev, marka, model: null, chassis: null }));

  const setModel = (model: string | null) =>
    setFilters((prev) => ({ ...prev, model, chassis: null }));

  const setKorea = <K extends keyof KoreaFilterValues>(
    key: K,
    v: KoreaFilterValues[K],
  ) => setKoreaFilters((prev) => ({ ...prev, [key]: v }));

  // A Korea model only means anything inside its brand — switching clears it.
  const setKoreaMake = (make: string | null) =>
    setKoreaFilters((prev) => ({ ...prev, make, model: null }));

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

  const rateOptions = useMemo(
    () => RATE_OPTIONS.map((r) => ({ value: r, label: r })),
    [],
  );

  // ── Korea tab — its own catalogue (`/korea/models`) and its own vocabulary;
  // chassis / rate / lot are AJES-only and have no Korea counterpart.
  const koreaModels = useKoreaModels(koreaFilters.make);

  const koreaBrandOptions = useMemo(
    () => KOREA_BRANDS.map((b) => ({ value: b.slug, label: b.label })),
    [],
  );

  const koreaModelOptions = useMemo(
    () =>
      (koreaModels.data ?? []).map((m) => ({
        value: m.name,
        label: `${m.english ?? m.name} (${formatCount(m.count)})`,
      })),
    [koreaModels.data],
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

  const mileageToOptions = useMemo(
    () =>
      MILEAGE_STEPS.filter((m) => m > 0).map((m) => ({
        value: m,
        label: formatCount(m),
      })),
    [],
  );

  // The year row is shared by both tabs — it reads/writes the active tab's state.
  const yearFrom = tab === "korea" ? koreaFilters.yearFrom : filters.yearFrom;
  const yearTo = tab === "korea" ? koreaFilters.yearTo : filters.yearTo;
  const setYearFrom = (v: number | null) =>
    tab === "korea" ? setKorea("yearFrom", v) : setFilter("yearFrom", v);
  const setYearTo = (v: number | null) =>
    tab === "korea" ? setKorea("yearTo", v) : setFilter("yearTo", v);

  const yearFromOptions = useMemo(
    () =>
      YEAR_OPTIONS.filter((y) => yearTo == null || y <= yearTo).map((y) => ({
        value: y,
        label: String(y),
      })),
    [yearTo],
  );

  const yearToOptions = useMemo(
    () =>
      YEAR_OPTIONS.filter((y) => yearFrom == null || y >= yearFrom).map((y) => ({
        value: y,
        label: String(y),
      })),
    [yearFrom],
  );

  const onAdvancedSubmit = () => {
    // Each browser parses a different param set — Japan `marka/model/chassis…`,
    // Korea `brand/model/min_year…` — so the query is built per tab.
    const q =
      tab === "korea"
        ? koreaFiltersToQuery(koreaFilters)
        : filtersToQuery(filters);
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(q)) params.set(k, String(v));
    const qs = params.toString();
    router.push(qs ? `/${tab}?${qs}` : `/${tab}`);
  };

  const switchReportMode = (next: SearchMode) => {
    setReportMode(next);
    setReportValue("");
    setReportError(null);
  };

  /**
   * The panel only validates and hands off — `/report` owns the lookup and
   * opens its result modal from the query it finds here.
   */
  const onReportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const err = validate(reportMode, reportValue);
    setReportError(err);
    if (err) return;
    router.push({
      pathname: "/report",
      query: reportSearchQuery(reportMode, reportValue),
    });
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
      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-12 px-4 pb-6 pt-10 md:pb-8 md:pt-6 lg:px-6 lg:grid-cols-10">
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
            {featuredMakes.map(({ key, href, label, logo }) => (
              <Link
                key={key}
                href={href}
                className="group flex items-center gap-2.5 rounded-xl border border-neutral-100 bg-white p-2.5 transition-all hover:border-neutral-300 hover:shadow-sm dark:border-neutral-800 dark:bg-neutral-950 dark:hover:border-neutral-600"
              >
                <img
                  src={brandLogoUrl(logo)}
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
                    {/* Row 1 — Japan: marka · model · chassis
                                Korea: brand · model · fuel */}
                    <div className="grid grid-cols-1 gap-x-3 sm:grid-cols-3">
                      {tab === "japan" ? (
                        <>
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
                        </>
                      ) : (
                        <>
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
                              options={koreaBrandOptions}
                              value={koreaFilters.make ?? undefined}
                              onChange={(v) => setKoreaMake(v ?? null)}
                              optionFilterProp="label"
                            />
                          </Form.Item>
                          <Form.Item
                            label={tf("placeholders.model")}
                            className="mb-3! sm:mb-0!"
                          >
                            <Select
                              placeholder={
                                koreaFilters.make
                                  ? tf("placeholders.model")
                                  : tk("filters.modelNeedsBrand")
                              }
                              allowClear
                              showSearch
                              size="large"
                              variant="filled"
                              options={koreaModelOptions}
                              value={koreaFilters.model ?? undefined}
                              onChange={(v) => setKorea("model", v ?? null)}
                              disabled={!koreaFilters.make}
                              loading={koreaModels.isLoading}
                              optionFilterProp="label"
                            />
                          </Form.Item>
                          <Form.Item
                            label={tk("filters.fuel")}
                            className="mb-3! sm:mb-0!"
                          >
                            <Select
                              placeholder={tk("filters.fuel")}
                              allowClear
                              size="large"
                              variant="filled"
                              options={fuelOptions}
                              value={koreaFilters.fuel ?? undefined}
                              onChange={(v) => setKorea("fuel", v ?? null)}
                            />
                          </Form.Item>
                        </>
                      )}
                    </div>

                    {/* Row 2 — Japan: rate · year · lot · submit
                                Korea: transmission · year · mileage · submit */}
                    <div className="grid grid-cols-1 gap-x-3 sm:mt-4 sm:grid-cols-[1fr_1.6fr_1fr_auto] sm:items-end">
                      {tab === "japan" ? (
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
                      ) : (
                        <Form.Item
                          label={tk("filters.transmission")}
                          className="mb-3! sm:mb-0!"
                        >
                          <Select
                            placeholder={tk("filters.transmission")}
                            allowClear
                            size="large"
                            variant="filled"
                            options={transmissionOptions}
                            value={koreaFilters.transmission ?? undefined}
                            onChange={(v) => setKorea("transmission", v ?? null)}
                          />
                        </Form.Item>
                      )}
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
                            value={yearFrom ?? undefined}
                            onChange={(v) => setYearFrom(v ?? null)}
                            style={{ width: "50%" }}
                          />
                          <Select
                            placeholder={tf("year.toPlaceholder")}
                            allowClear
                            size="large"
                            variant="filled"
                            options={yearToOptions}
                            value={yearTo ?? undefined}
                            onChange={(v) => setYearTo(v ?? null)}
                            style={{ width: "50%" }}
                          />
                        </Space.Compact>
                      </Form.Item>
                      {tab === "japan" ? (
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
                      ) : (
                        <Form.Item
                          label={tf("mileage.label")}
                          className="mb-3! sm:mb-0!"
                        >
                          <Select
                            placeholder={tf("mileage.maxPlaceholder")}
                            allowClear
                            size="large"
                            variant="filled"
                            options={mileageToOptions}
                            value={koreaFilters.mileageTo ?? undefined}
                            onChange={(v) => setKorea("mileageTo", v ?? null)}
                          />
                        </Form.Item>
                      )}
                      <Button
                        htmlType="submit"
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

        {/* RIGHT — 30% — VIN / accident check. Deep-navy panel lit only by two
            blurred glows (no background photo). */}
        <aside className="relative flex min-h-110 flex-col overflow-hidden rounded-2xl bg-[#05122e] p-6 shadow-sm ring-1 ring-white/10 md:p-7 lg:col-span-3 lg:min-h-0">
          {/* Ambient glows — the only "scenery" left in the panel */}
          <div
            aria-hidden
            className="pointer-events-none absolute -top-24 -right-20 h-60 w-60 rounded-full bg-blue-500/25 blur-3xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-28 -left-24 h-60 w-60 rounded-full bg-cyan-400/15 blur-3xl"
          />

          <div className="relative flex flex-1 flex-col">
            {/* <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-blue-100 ring-1 ring-white/15 ring-inset">
              <ShieldIcon className="h-3.5 w-3.5 shrink-0" />
              {t("vin.badge")}
            </span> */}

            <h3 className="shiny-text mt-4 text-2xl leading-snug font-semibold">
              {t("vin.title")}
            </h3>
            <p className="mt-2 text-[12.5px] leading-relaxed text-blue-100/75">
              {t("vin.blurb")}
            </p>

            <ul className="mt-4 flex flex-wrap gap-1.5">
              {REPORT_POINTS.map((key) => (
                <li
                  key={key}
                  className="rounded-full bg-white/6 px-2.5 py-1 text-[11.5px] font-medium text-blue-50/90 ring-1 ring-white/10 ring-inset"
                >
                  {t(`vin.points.${key}`)}
                </li>
              ))}
            </ul>

            <form onSubmit={onReportSubmit} noValidate className="mt-auto pt-8">
              <Segmented<SearchMode>
                value={reportMode}
                onChange={switchReportMode}
                options={[
                  { label: t("vin.modePlate"), value: "plate" },
                  { label: t("vin.modeVin"), value: "vin" },
                ]}
                block
                className="mb-3 bg-white/10! [&_.ant-segmented-item]:text-blue-100! [&_.ant-segmented-item-selected]:bg-white! [&_.ant-segmented-item-selected]:text-neutral-900!"
              />
              <label htmlFor="home-report-input" className="sr-only">
                {reportMode === "plate" ? tr("plateLabel") : tr("label")}
              </label>
              <Input
                id="home-report-input"
                value={reportValue}
                onChange={(e) => {
                  setReportValue(normalizeFor(reportMode, e.target.value));
                  if (reportError) setReportError(null);
                }}
                placeholder={
                  reportMode === "plate"
                    ? tr("platePlaceholder")
                    : tr("placeholder")
                }
                size="large"
                autoComplete="off"
                spellCheck={false}
                aria-invalid={reportError ? true : undefined}
                aria-describedby={reportError ? "home-report-error" : undefined}
                className="rounded-xl! border-white/30! bg-white/95! shadow-sm! backdrop-blur"
              />
              {reportError ? (
                <p
                  id="home-report-error"
                  role="alert"
                  className="mt-2 text-[12px] font-medium text-red-300"
                >
                  {tr(`errors.${reportError}`)}
                </p>
              ) : null}
              <Button
                htmlType="submit"
                type="primary"
                size="large"
                block
                className="mt-3 rounded-xl! border-none! bg-blue-600! font-semibold! text-white! shadow-lg! hover:bg-blue-500!"
              >
                {t("vin.submit")}
              </Button>
            </form>
          </div>
        </aside>
      </div>
    </section>
  );
}
