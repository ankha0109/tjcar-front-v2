"use client";

import { useMemo, useRef, useState } from "react";
import { Empty, Input } from "antd";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Skeleton } from "@/components/ui/Skeleton";
import { groupByInitial } from "@/lib/alphabet";
import { brandLogoUrl } from "@/lib/brand";

/** One manufacturer row. `key` is the identity the adapter round-trips through
 *  the URL and its hrefs; `label` is what the user reads; `logo` overrides the
 *  name handed to `brandLogoUrl` when the CDN slug differs from the label. */
export type BrandItem = { key: string; label: string; logo?: string };

/** One model tile. `value` goes into the listing href, `label` is displayed,
 *  `count` is the live listing count (omitted when the source has none). */
export type ModelItem = { value: string; label: string; count?: number };

type Props = {
  brands: BrandItem[];
  /** Brand keys pinned above the A–Z list, in the order given. */
  featuredKeys: string[];
  /** Currently selected brand key — always resolved by the adapter. */
  selected: string;
  onSelect: (key: string) => void;
  models: ModelItem[];
  modelsLoading?: boolean;
  /** "All {brand} listings" target. */
  brandHref: (key: string) => string;
  modelHref: (brand: string, model: string) => string;
  namespace: "japanBrands" | "koreaBrands";
};

const formatCount = (n: number) => new Intl.NumberFormat("en-US").format(n);

const byLabel = <T extends { label: string }>(items: T[]) =>
  [...items].sort((a, b) => a.label.localeCompare(b.label));

export default function BrandsExplorer({
  brands,
  featuredKeys,
  selected,
  onSelect,
  models,
  modelsLoading,
  brandHref,
  modelHref,
  namespace,
}: Props) {
  const t = useTranslations(namespace);
  const modelsRef = useRef<HTMLDivElement>(null);
  const [filter, setFilter] = useState("");
  const q = filter.trim().toLowerCase();

  const byKey = useMemo(
    () => new Map(brands.map((b) => [b.key, b])),
    [brands],
  );
  const selectedLabel = byKey.get(selected)?.label ?? selected;
  const selectedLogo = byKey.get(selected)?.logo ?? selectedLabel;

  // Level 1 — featured makes first (curated order), then the rest A–Z.
  const featured = useMemo(
    () =>
      featuredKeys
        .map((k) => byKey.get(k))
        .filter((b): b is BrandItem => Boolean(b)),
    [featuredKeys, byKey],
  );

  const featuredSet = useMemo(
    () => new Set(featured.map((b) => b.key)),
    [featured],
  );

  const restGroups = useMemo(
    () =>
      groupByInitial(
        byLabel(brands.filter((b) => !featuredSet.has(b.key))),
        (b) => b.label,
      ),
    [brands, featuredSet],
  );

  const filteredGroups = useMemo(
    () =>
      q
        ? groupByInitial(
            byLabel(brands.filter((b) => b.label.toLowerCase().includes(q))),
            (b) => b.label,
          )
        : [],
    [brands, q],
  );

  // Level 2 — selected make's models, grouped by first letter.
  const modelGroups = useMemo(
    () => groupByInitial(byLabel(models), (m) => m.label),
    [models],
  );

  const selectBrand = (key: string) => {
    onSelect(key);
    // On narrow screens the models live below the list — bring them into view.
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      modelsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const renderBrandRow = (brand: BrandItem) => {
    const active = brand.key === selected;
    return (
      <button
        key={brand.key}
        type="button"
        onClick={() => selectBrand(brand.key)}
        aria-current={active}
        className={`group flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors ${
          active
            ? "bg-primary/10 text-primary"
            : "text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800/60"
        }`}
      >
        <img
          src={brandLogoUrl(brand.logo ?? brand.label)}
          alt=""
          loading="lazy"
          width={22}
          height={22}
          className="h-5.5 w-5.5 shrink-0 object-contain"
        />
        <span className="truncate text-[13.5px] font-medium">
          {brand.label}
        </span>
      </button>
    );
  };

  if (brands.length === 0) {
    return (
      <section className="mx-auto w-full max-w-7xl px-4 py-16 lg:px-6">
        <Empty description={t("unavailable")} />
      </section>
    );
  }

  return (
    <section className="mx-auto w-full max-w-7xl px-4 pb-16 pt-8 md:pt-10 lg:px-6">
      {/* Heading */}
      <header className="mb-6">
        <h1 className="text-[24px] font-semibold text-neutral-900 md:text-[28px] dark:text-neutral-50">
          {t("title")}
        </h1>
        <p className="mt-1.5 text-[13.5px] text-neutral-500 dark:text-neutral-400">
          {t("subtitle")}
        </p>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[300px_1fr]">
        {/* LEVEL 1 — manufacturers */}
        <aside className="rounded-2xl border border-neutral-200 bg-white p-3 lg:sticky lg:top-[calc(var(--header-h)+1rem)] lg:max-h-[calc(100dvh-var(--header-h)-2rem)] lg:self-start lg:overflow-y-auto dark:border-neutral-800 dark:bg-neutral-950">
          <Input
            allowClear
            size="large"
            variant="filled"
            placeholder={t("searchPlaceholder")}
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="mb-3"
          />

          {q ? (
            filteredGroups.length === 0 ? (
              <p className="px-2.5 py-4 text-[13px] text-neutral-400">
                {t("noMakes")}
              </p>
            ) : (
              filteredGroups.map((g) => (
                <div key={g.letter} className="mb-1">
                  <LetterHeader letter={g.letter} />
                  {g.items.map(renderBrandRow)}
                </div>
              ))
            )
          ) : (
            <>
              {featured.length > 0 && (
                <div className="mb-2">
                  <SectionLabel>★ {t("featuredLabel")}</SectionLabel>
                  {featured.map(renderBrandRow)}
                </div>
              )}
              <SectionLabel>{t("allLabel")}</SectionLabel>
              {restGroups.map((g) => (
                <div key={g.letter} className="mb-1">
                  <LetterHeader letter={g.letter} />
                  {g.items.map(renderBrandRow)}
                </div>
              ))}
            </>
          )}
        </aside>

        {/* LEVEL 2 — models of the selected make */}
        {/* Offset for `scrollIntoView` comes from `html { scroll-padding-top }`. */}
        <div ref={modelsRef}>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 pb-4 dark:border-neutral-800">
            <div className="flex items-center gap-3">
              <img
                src={brandLogoUrl(selectedLogo)}
                alt=""
                width={36}
                height={36}
                className="h-9 w-9 shrink-0 object-contain"
              />
              <div>
                <h2 className="text-[18px] font-semibold text-neutral-900 dark:text-neutral-50">
                  {t("modelsTitle", { brand: selectedLabel })}
                </h2>
                <p className="text-[12.5px] text-neutral-400">
                  {modelsLoading
                    ? t("modelsLoading")
                    : t("modelCount", { count: models.length })}
                </p>
              </div>
            </div>
            <Link
              href={brandHref(selected)}
              className="text-[13px] font-semibold text-primary hover:underline"
            >
              {t("viewAllInAuctions", { brand: selectedLabel })}
            </Link>
          </div>

          {modelsLoading ? (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 12 }).map((_, i) => (
                <Skeleton key={i} className="h-9.5 w-full rounded-lg" />
              ))}
            </div>
          ) : modelGroups.length === 0 ? (
            <Empty description={t("noModels")} className="py-12" />
          ) : (
            <div className="space-y-6">
              {modelGroups.map((g) => (
                <div key={g.letter}>
                  <div className="sticky top-0 z-10 mb-2 bg-white/90 py-1 backdrop-blur dark:bg-neutral-950/90">
                    <span className="text-2xl font-bold text-primary">
                      {g.letter}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                    {g.items.map((model) => (
                      <Link
                        key={model.value}
                        href={modelHref(selected, model.value)}
                        className="flex items-center justify-between gap-2 rounded-lg border border-neutral-100 bg-white px-3 py-2 text-[13px] font-medium text-neutral-700 transition-colors hover:border-primary hover:text-primary dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-300"
                        title={model.label}
                      >
                        <span className="truncate">{model.label}</span>
                        {model.count != null && (
                          <span className="shrink-0 text-[11.5px] font-normal text-neutral-400">
                            {formatCount(model.count)}
                          </span>
                        )}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-2.5 pb-1 pt-2 text-[11px] font-semibold uppercase text-neutral-400">
      {children}
    </div>
  );
}

function LetterHeader({ letter }: { letter: string }) {
  return (
    <div className="px-2.5 pb-0.5 pt-1 text-[12px] font-bold text-neutral-300 dark:text-neutral-600">
      {letter}
    </div>
  );
}
