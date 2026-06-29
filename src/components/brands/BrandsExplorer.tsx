"use client";

import { useMemo, useRef, useState } from "react";
import { Empty, Input } from "antd";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { groupByInitial } from "@/lib/alphabet";
import { TOP_JAPAN_MAKES, brandLogoUrl, norm } from "@/lib/brand";
import type { BrandsCatalog } from "@/services/filters";

type Props = {
  catalog?: BrandsCatalog;
  /** Resolved real brand name to show selected on first render (e.g. "TOYOTA"). */
  initialMake: string;
};

const auctionHref = (make: string, model?: string) =>
  model
    ? `/japan?marka=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}`
    : `/japan?marka=${encodeURIComponent(make)}`;

export default function BrandsExplorer({ catalog, initialMake }: Props) {
  const t = useTranslations("japanBrands");
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const modelsRef = useRef<HTMLDivElement>(null);

  const brands = useMemo(() => catalog?.brands ?? [], [catalog]);

  // Selection follows the `?make=` query param (shareable / reload-safe), with
  // the server-resolved `initialMake` as the fallback.
  const selected = useMemo(() => {
    const q = params.get("make");
    if (q) {
      const match = brands.find((b) => norm(b) === norm(q));
      if (match) return match;
    }
    return initialMake;
  }, [params, brands, initialMake]);

  const [filter, setFilter] = useState("");
  const q = filter.trim().toLowerCase();

  // Level 1 — featured makes first (curated order), then the rest A–Z.
  const featured = useMemo(() => {
    const byNorm = new Map(brands.map((b) => [norm(b), b]));
    return TOP_JAPAN_MAKES.map((n) => byNorm.get(norm(n))).filter(
      (b): b is string => Boolean(b),
    );
  }, [brands]);

  const featuredSet = useMemo(() => new Set(featured), [featured]);

  const restGroups = useMemo(
    () => groupByInitial(brands.filter((b) => !featuredSet.has(b))),
    [brands, featuredSet],
  );

  const filteredGroups = useMemo(
    () =>
      q
        ? groupByInitial(brands.filter((b) => b.toLowerCase().includes(q)))
        : [],
    [brands, q],
  );

  // Level 2 — selected make's models, grouped by first letter.
  const modelGroups = useMemo(
    () => groupByInitial(catalog?.modelsByBrand[selected] ?? []),
    [catalog, selected],
  );
  const modelCount = catalog?.modelsByBrand[selected]?.length ?? 0;

  const selectMake = (make: string) => {
    router.replace(`${pathname}?make=${encodeURIComponent(make)}`, {
      scroll: false,
    });
    // On narrow screens the models live below the list — bring them into view.
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      modelsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const renderMakeRow = (brand: string) => {
    const active = brand === selected;
    return (
      <button
        key={brand}
        type="button"
        onClick={() => selectMake(brand)}
        aria-current={active}
        className={`group flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors ${
          active
            ? "bg-primary/10 text-primary"
            : "text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800/60"
        }`}
      >
        <img
          src={brandLogoUrl(brand)}
          alt=""
          loading="lazy"
          width={22}
          height={22}
          className="h-5.5 w-5.5 shrink-0 object-contain"
        />
        <span className="truncate text-[13.5px] font-medium">{brand}</span>
      </button>
    );
  };

  if (!catalog || brands.length === 0) {
    return (
      <section className="mx-auto w-full max-w-7xl px-4 py-16">
        <Empty description={t("unavailable")} />
      </section>
    );
  }

  return (
    <section className="mx-auto w-full max-w-7xl px-4 pb-16 pt-8 md:pt-10">
      {/* Heading */}
      <header className="mb-6">
        <h1 className="text-[24px] font-semibold tracking-tight text-neutral-900 md:text-[28px] dark:text-neutral-50">
          {t("title")}
        </h1>
        <p className="mt-1.5 text-[13.5px] text-neutral-500 dark:text-neutral-400">
          {t("subtitle")}
        </p>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[300px_1fr]">
        {/* LEVEL 1 — manufacturers */}
        <aside className="rounded-2xl border border-neutral-200 bg-white p-3 lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:self-start lg:overflow-y-auto dark:border-neutral-800 dark:bg-neutral-950">
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
                  {g.items.map(renderMakeRow)}
                </div>
              ))
            )
          ) : (
            <>
              {featured.length > 0 && (
                <div className="mb-2">
                  <SectionLabel>★ {t("featuredLabel")}</SectionLabel>
                  {featured.map(renderMakeRow)}
                </div>
              )}
              <SectionLabel>{t("allLabel")}</SectionLabel>
              {restGroups.map((g) => (
                <div key={g.letter} className="mb-1">
                  <LetterHeader letter={g.letter} />
                  {g.items.map(renderMakeRow)}
                </div>
              ))}
            </>
          )}
        </aside>

        {/* LEVEL 2 — models of the selected make */}
        <div ref={modelsRef} className="scroll-mt-20">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 pb-4 dark:border-neutral-800">
            <div className="flex items-center gap-3">
              <img
                src={brandLogoUrl(selected)}
                alt=""
                width={36}
                height={36}
                className="h-9 w-9 shrink-0 object-contain"
              />
              <div>
                <h2 className="text-[18px] font-semibold text-neutral-900 dark:text-neutral-50">
                  {t("modelsTitle", { brand: selected })}
                </h2>
                <p className="text-[12.5px] text-neutral-400">
                  {t("modelCount", { count: modelCount })}
                </p>
              </div>
            </div>
            <Link
              href={auctionHref(selected)}
              className="text-[13px] font-semibold text-primary hover:underline"
            >
              {t("viewAllInAuctions", { brand: selected })}
            </Link>
          </div>

          {modelGroups.length === 0 ? (
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
                        key={model}
                        href={auctionHref(selected, model)}
                        className="truncate rounded-lg border border-neutral-100 bg-white px-3 py-2 text-[13px] font-medium text-neutral-700 transition-colors hover:border-primary hover:text-primary dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-300"
                        title={model}
                      >
                        {model}
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
    <div className="px-2.5 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-neutral-400">
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
