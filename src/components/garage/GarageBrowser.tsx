"use client";

import { Select } from "antd";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import CarCard, { PRIORITY_CARDS } from "@/components/cards/CarCard";
import { EmptyState } from "@/components/cards/views/scheduleTabs";
import { Link } from "@/i18n/navigation";
import type { StockCarItem } from "@/lib/stockAdapter";
import type { CarType } from "@/types/car";
import { cn } from "@/utils";
import { SoldBadge, StockBadge } from "./StockBadge";

type Tab = "available" | "sold";
type Sort = "newest" | "priceAsc" | "priceDesc";

/** Nearest-first, which is the order a buyer cares about. */
const TYPE_ORDER: CarType[] = [
  "available",
  "ready_to_ship",
  "arriving_soon",
  "preorder_only",
];

/**
 * The in-stock grid. `GET /cars` takes no filters or sort, so the page hands the
 * whole catalogue (~80 rows) down and everything below happens in the browser —
 * no round trip, no pagination.
 */
export default function GarageBrowser({ cars }: { cars: StockCarItem[] }) {
  const t = useTranslations("garage");

  const [tab, setTab] = useState<Tab>("available");
  const [type, setType] = useState<CarType | null>(null);
  const [brand, setBrand] = useState<string | null>(null);
  const [sort, setSort] = useState<Sort>("newest");

  const counts = useMemo(
    () => ({
      available: cars.filter((c) => c.status !== "sold").length,
      sold: cars.filter((c) => c.status === "sold").length,
    }),
    [cars],
  );

  const inTab = useMemo(
    () =>
      cars.filter((c) =>
        tab === "sold" ? c.status === "sold" : c.status !== "sold",
      ),
    [cars, tab],
  );

  // Both option lists are derived from the cars actually in the tab, so no
  // choice can ever lead to an empty grid.
  const brandOptions = useMemo(() => {
    const brands = [...new Set(inTab.map((c) => c.car.marka).filter(Boolean))];
    brands.sort((a, b) => a.localeCompare(b));
    return brands.map((b) => ({ value: b, label: b }));
  }, [inTab]);

  const typeOptions = useMemo(() => {
    const present = new Set(inTab.map((c) => c.type));
    return TYPE_ORDER.filter((value) => present.has(value));
  }, [inTab]);

  const items = useMemo(() => {
    let out = inTab;
    if (brand) out = out.filter((c) => c.car.marka === brand);
    if (type) out = out.filter((c) => c.type === type);
    // The API already returns newest-first, so "newest" is the untouched order.
    if (sort !== "newest") {
      const dir = sort === "priceAsc" ? 1 : -1;
      out = [...out].sort((a, b) => (a.car.price.mnt - b.car.price.mnt) * dir);
    }
    return out;
  }, [inTab, brand, type, sort]);

  // A brand or type carried over from the other tab could match nothing there.
  const switchTab = (next: Tab) => {
    setTab(next);
    setBrand(null);
    setType(null);
    setSort("newest");
  };

  const isSold = tab === "sold";

  return (
    <section className="mx-auto w-full max-w-7xl px-4 pb-16 lg:px-6">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 border-b border-neutral-200/80 pb-4 md:flex-row md:items-center md:justify-between dark:border-neutral-800">
        <div className="flex gap-2">
          <TabPill
            active={!isSold}
            label={t("tabs.available")}
            count={counts.available}
            onClick={() => switchTab("available")}
          />
          <TabPill
            active={isSold}
            label={t("tabs.sold")}
            count={counts.sold}
            onClick={() => switchTab("sold")}
          />
        </div>

        <div className="flex items-center gap-2">
          <Select
            placeholder={t("filters.brand")}
            allowClear
            showSearch
            optionFilterProp="label"
            options={brandOptions}
            value={brand ?? undefined}
            onChange={(v) => setBrand(v ?? null)}
            variant="filled"
            style={{ width: 150 }}
          />
          {/* Sorting by a price the sold tab hides would be meaningless. */}
          {!isSold && (
            <Select<Sort>
              options={[
                { value: "newest", label: t("sort.newest") },
                { value: "priceAsc", label: t("sort.priceAsc") },
                { value: "priceDesc", label: t("sort.priceDesc") },
              ]}
              value={sort}
              onChange={setSort}
              variant="filled"
              style={{ width: 170 }}
            />
          )}
        </div>
      </div>

      {/* Purchase-type chips. `-mx-4 px-4` lets the row bleed to the screen
          edges while scrolling, so the last chip doesn't look clipped. */}
      {typeOptions.length > 1 && (
        <div className="-mx-4 mt-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:px-0">
          <Chip
            active={type === null}
            label={t("filters.allTypes")}
            onClick={() => setType(null)}
          />
          {typeOptions.map((value) => (
            <Chip
              key={value}
              active={type === value}
              label={t(`type.${value}`)}
              onClick={() => setType(value)}
            />
          ))}
        </div>
      )}

      {items.length === 0 ? (
        <EmptyState title={t("empty.title")} description={t("empty.description")} />
      ) : (
        <div className="mt-5 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
          {items.map((item, i) => (
            <Link
              key={item.car.id}
              href={`/garage/${item.car.id}`}
              className="block rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              <CarCard
                car={item.car}
                hidePrice={isSold}
                priceLabel={t("priceLabel")}
                imagePriority={i < PRIORITY_CARDS}
                badge={
                  isSold ? (
                    <SoldBadge label={t("sold")} />
                  ) : item.type ? (
                    <StockBadge type={item.type} label={t(`type.${item.type}`)} />
                  ) : null
                }
              />
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

function TabPill({
  active,
  label,
  count,
  onClick,
}: {
  active: boolean;
  label: string;
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-[13px] font-semibold transition-colors",
        active
          ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
          : "bg-neutral-100 text-neutral-600 pointer-fine:hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300",
      )}
    >
      {label}
      <span
        className={cn(
          "rounded-md px-1.5 py-0.5 text-[11px] font-bold",
          active
            ? "bg-white/20 dark:bg-neutral-900/15"
            : "bg-white dark:bg-neutral-900",
        )}
      >
        {count}
      </span>
    </button>
  );
}

function Chip({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "shrink-0 rounded-full border px-3 py-1.5 text-[12.5px] font-medium transition-colors",
        active
          ? "border-primary bg-primary/10 text-primary"
          : "border-neutral-200 text-neutral-600 pointer-fine:hover:border-neutral-300 dark:border-neutral-800 dark:text-neutral-300",
      )}
    >
      {label}
    </button>
  );
}
