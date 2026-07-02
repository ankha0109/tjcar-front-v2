"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { Link, useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import dayjs from "dayjs";
import CarCard from "@/components/cards/CarCard";
import CarListItem from "@/components/cards/views/CarListItem";
import CarTableView from "@/components/cards/views/CarTableView";
import ViewModeSwitcher from "@/components/cards/views/ViewModeSwitcher";
import {
  VIEW_MODE_COOKIE,
  VIEW_MODE_COOKIE_MAX_AGE,
  type ViewMode,
} from "@/components/cards/views/viewMode";
import JapanAuctionFilters, {
  JapanAuctionFilterChips,
} from "@/components/cards/JapanAuctionFilters";
import {
  AllTab,
  DayTab,
  EmptyState,
} from "@/components/cards/views/scheduleTabs";
import {
  FilterOptions,
  FilterValues,
  filtersToQuery,
} from "@/types/filters";
import { FeaturedCar } from "@/types/featured";
import { fromFeaturedCar } from "@/types/car";
import { cn } from "@/utils";

type Props = {
  initialCars: FeaturedCar[];
  initialFilters: FilterValues;
  filterOptions?: FilterOptions;
  initialViewMode?: ViewMode;
};

const DAYS_AHEAD = 7;
const FILTER_DEBOUNCE_MS = 400;

function serializeFilters(filters: FilterValues): string {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(filtersToQuery(filters))) {
    params.set(k, String(v));
  }
  return params.toString();
}

export default function FeaturedAuctionSchedule({
  initialCars,
  initialFilters,
  filterOptions,
  initialViewMode = "grid",
}: Props) {
  const t = useTranslations("featured.schedule");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [filters, setFilters] = useState<FilterValues>(initialFilters);
  const [viewMode, setViewMode] = useState<ViewMode>(initialViewMode);
  const lastPushedRef = useRef<string>(serializeFilters(initialFilters));
  const selected = filters.date ?? "all";
  const setSelected = (next: string) =>
    setFilters((f) => ({ ...f, date: next === "all" ? null : next }));

  const handleViewModeChange = (next: ViewMode) => {
    setViewMode(next);
    document.cookie = `${VIEW_MODE_COOKIE}=${next}; path=/; max-age=${VIEW_MODE_COOKIE_MAX_AGE}; SameSite=Lax`;
  };

  const RELATIVE_LABELS: Record<number, string> = {
    1: t("tomorrow"),
    2: t("dayAfter"),
  };

  useEffect(() => {
    const next = serializeFilters(filters);
    if (next === lastPushedRef.current) return;
    const handler = setTimeout(() => {
      lastPushedRef.current = next;
      startTransition(() => {
        router.replace(next ? `/?${next}` : "/", { scroll: false });
      });
    }, FILTER_DEBOUNCE_MS);
    return () => clearTimeout(handler);
  }, [filters, router]);

  const cars = initialCars;
  const isFetching = isPending;

  const days = useMemo(() => {
    const today = dayjs().startOf("day");
    return Array.from({ length: DAYS_AHEAD }, (_, i) => {
      const offset = i + 1;
      const d = today.add(offset, "day");
      const dow = d.day();
      return {
        key: d.format("YYYY-MM-DD"),
        topLabel: RELATIVE_LABELS[offset] ?? d.format("ddd"),
        day: d.format("DD"),
        month: d.format("MMM"),
        full: d.format("YYYY-MM-DD"),
        isWeekend: dow === 0 || dow === 6,
        isHighlighted: offset <= 2,
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const countsByDate = useMemo(() => {
    const m = new Map<string, number>();
    for (const car of cars) {
      const key = dayjs(car.AUCTION_DATE).format("YYYY-MM-DD");
      if (!key) continue;
      m.set(key, (m.get(key) ?? 0) + 1);
    }
    return m;
  }, [cars]);

  const filteredCars = useMemo(() => {
    if (selected === "all") return cars;
    return cars.filter(
      (c) => dayjs(c.AUCTION_DATE).format("YYYY-MM-DD") === selected,
    );
  }, [cars, selected]);

  const activeDayLabel = useMemo(() => {
    if (selected === "all") return null;
    const day = days.find((d) => d.key === selected);
    return day ? `${day.topLabel} · ${day.full}` : null;
  }, [selected, days]);

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-8">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-[22px] font-semibold text-neutral-900">
            {t("title")}
          </h2>
          <p className="mt-1 text-[13px] text-neutral-500">
            {activeDayLabel
              ? activeDayLabel
              : t("subtitleDefault")}
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 text-[11.5px] font-medium uppercase text-neutral-400">
          {isFetching ? (
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
            </span>
          ) : (
            <span className="h-1 w-1 rounded-full bg-neutral-400" />
          )}
          {isFetching ? t("updating") : t("totalCars", { count: filteredCars.length })}
        </span>
      </div>

      <div className="flex flex-col lg:flex-row lg:gap-6">
        <JapanAuctionFilters
          value={filters}
          onChange={setFilters}
          options={filterOptions}
        />

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1 -mx-4 overflow-x-auto px-4 pb-3 [scrollbar-width:none] lg:mx-0 lg:px-0 [&::-webkit-scrollbar]:hidden">
              <div role="tablist" className="flex items-center gap-2">
                <AllTab
                  isActive={selected === "all"}
                  onClick={() => setSelected("all")}
                  label={t("all")}
                  count={cars.length}
                  unit={t("carsUnit")}
                />
                {days.map((day) => {
                  const count = countsByDate.get(day.key) ?? 0;
                  return (
                    <DayTab
                      key={day.key}
                      isActive={selected === day.key}
                      onClick={() => setSelected(day.key)}
                      topLabel={day.topLabel}
                      day={day.day}
                      month={day.month}
                      count={count}
                      emptyLabel={t("empty")}
                      weekend={day.isWeekend}
                      highlight={day.isHighlighted}
                    />
                  );
                })}
              </div>
            </div>
            <div className="shrink-0 pt-1">
              <ViewModeSwitcher
                value={viewMode}
                onChange={handleViewModeChange}
                labels={{
                  grid: t("view.grid"),
                  list: t("view.list"),
                  table: t("view.table"),
                }}
              />
            </div>
          </div>

          <JapanAuctionFilterChips value={filters} onChange={setFilters} />

          {filteredCars.length > 0 ? (
            <div
              className={cn(
                "mt-6 transition-opacity",
                isFetching && "opacity-60",
              )}
            >
              {viewMode === "grid" && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4">
                  {filteredCars.map((car) => (
                    <Link
                      key={car.ID}
                      href={`/korea/${car.ID}`}
                      className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 rounded-xl"
                    >
                      {/* Rows are AJES lots labeled "korea" — the compare fetch would 404. */}
                      <CarCard car={fromFeaturedCar(car, "korea")} disableCompare />
                    </Link>
                  ))}
                </div>
              )}
              {viewMode === "list" && (
                <div className="flex flex-col gap-3">
                  {filteredCars.map((car) => (
                    <Link
                      key={car.ID}
                      href={`/korea/${car.ID}`}
                      className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 rounded-xl"
                    >
                      <CarListItem car={fromFeaturedCar(car, "korea")} disableCompare />
                    </Link>
                  ))}
                </div>
              )}
              {viewMode === "table" && (
                <CarTableView
                  cars={filteredCars.map((car) => fromFeaturedCar(car, "korea"))}
                  onRowClick={(car) => router.push(`/korea/${car.id}`)}
                  disableCompare
                />
              )}
            </div>
          ) : (
            <EmptyState
              title={t("noResultsTitle")}
              description={t("noResultsDescription")}
            />
          )}
        </div>
      </div>
    </section>
  );
}
