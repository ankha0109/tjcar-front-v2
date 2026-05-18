"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "@/i18n/navigation";
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
import FeaturedAuctionFilters, {
  FeaturedAuctionFilterChips,
} from "@/components/cards/FeaturedAuctionFilters";
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
        <FeaturedAuctionFilters
          value={filters}
          onChange={setFilters}
          options={filterOptions}
        />

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1 -mx-4 overflow-x-auto px-4 pb-3 [scrollbar-width:none] lg:mx-0 lg:px-0 [&::-webkit-scrollbar]:hidden">
              <div role="tablist" className="flex items-stretch gap-2">
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

          <FeaturedAuctionFilterChips value={filters} onChange={setFilters} />

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
                    <CarCard key={car.ID} car={fromFeaturedCar(car)} />
                  ))}
                </div>
              )}
              {viewMode === "list" && (
                <div className="flex flex-col gap-3">
                  {filteredCars.map((car) => (
                    <CarListItem key={car.ID} car={fromFeaturedCar(car)} />
                  ))}
                </div>
              )}
              {viewMode === "table" && (
                <CarTableView cars={filteredCars.map(fromFeaturedCar)} />
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

const TAB_BASE =
  "group relative flex shrink-0 flex-col items-center justify-center rounded-2xl px-3.5 py-2.5 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40";

function AllTab({
  isActive,
  onClick,
  label,
  count,
  unit,
}: {
  isActive: boolean;
  onClick: () => void;
  label: string;
  count: number;
  unit: string;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      onClick={onClick}
      className={cn(
        TAB_BASE,
        "min-w-[88px] border",
        isActive
          ? "border-transparent bg-neutral-900 text-white shadow-[0_10px_24px_-12px_rgba(0,0,0,0.55)]"
          : "border-neutral-200 bg-white text-neutral-700 hover:-translate-y-0.5 hover:border-neutral-300 hover:shadow-sm",
      )}
    >
      <span
        className={cn(
          "text-[10px] font-semibold uppercase",
          isActive ? "text-white/70" : "text-neutral-500",
        )}
      >
        {label}
      </span>
      <span className="mt-0.5 text-[19px] font-semibold tabular-nums">
        {count}
      </span>
      <span
        className={cn(
          "mt-0.5 text-[10.5px] font-medium",
          isActive ? "text-white/75" : "text-neutral-400",
        )}
      >
        {unit}
      </span>
    </button>
  );
}

function DayTab({
  isActive,
  onClick,
  topLabel,
  day,
  month,
  count,
  emptyLabel,
  weekend,
  highlight,
}: {
  isActive: boolean;
  onClick: () => void;
  topLabel: string;
  day: string;
  month: string;
  count: number;
  emptyLabel: string;
  weekend?: boolean;
  highlight?: boolean;
}) {
  const isEmpty = count === 0;
  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      onClick={onClick}
      className={cn(
        TAB_BASE,
        "min-w-[80px] border",
        isActive
          ? "border-transparent bg-neutral-900 text-white shadow-[0_10px_24px_-12px_rgba(0,0,0,0.55)]"
          : "border-neutral-200/70 bg-neutral-50/60 text-neutral-700 hover:-translate-y-0.5 hover:border-neutral-300 hover:bg-white hover:shadow-sm",
        !isActive && isEmpty && "opacity-55",
      )}
    >
      {highlight && !isActive && (
        <span className="absolute -top-1 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-primary shadow-[0_0_0_3px_rgba(255,255,255,0.9)]" />
      )}
      <span
        className={cn(
          "text-[10px] font-semibold uppercase",
          isActive
            ? "text-white/70"
            : weekend
              ? "text-red-500/80"
              : "text-neutral-500",
        )}
      >
        {topLabel}
      </span>
      <span className="mt-0.5 flex items-baseline gap-1">
        <span className="text-[20px] font-semibold tabular-nums leading-none">
          {day}
        </span>
        <span
          className={cn(
            "text-[9.5px] font-semibold uppercase",
            isActive ? "text-white/60" : "text-neutral-400",
          )}
        >
          {month}
        </span>
      </span>
      <span
        className={cn(
          "mt-1 inline-flex items-center gap-1 text-[10.5px] font-medium tabular-nums",
          isActive
            ? "text-white/80"
            : isEmpty
              ? "text-neutral-400"
              : "text-primary",
        )}
      >
        {!isEmpty && (
          <span
            className={cn(
              "h-1 w-1 rounded-full",
              isActive ? "bg-white/70" : "bg-primary",
            )}
          />
        )}
        {isEmpty ? emptyLabel : count}
      </span>
    </button>
  );
}

function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="mt-6 flex flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-200 bg-neutral-50/40 py-16">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-neutral-200">
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-neutral-400"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
      </div>
      <p className="mt-3 text-[14px] font-medium text-neutral-700">
        {title}
      </p>
      <p className="mt-1 text-[12.5px] text-neutral-500">
        {description}
      </p>
    </div>
  );
}
