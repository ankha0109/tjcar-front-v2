"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
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
import { FilterOptions, FilterValues, filtersToQuery } from "@/types/filters";
import { fromFeaturedCar, type CarItem } from "@/types/car";
import {
  useAuctionsInfinite,
  type AuctionPage,
} from "@/hooks/useAuctionsInfinite";
import { useScrollRestoration } from "@/hooks/useScrollRestoration";

type Props = {
  initialPage?: AuctionPage;
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

export default function AuctionBrowser({
  initialPage,
  initialFilters,
  filterOptions,
  initialViewMode = "grid",
}: Props) {
  const t = useTranslations("auctions");
  const tSchedule = useTranslations("featured.schedule");
  const router = useRouter();
  const pathname = usePathname();
  const [, startTransition] = useTransition();

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

  // ── Sync filters → URL (debounced), so the page is shareable and the server
  //    can hydrate page 1 with the same filters on a fresh load. ──
  useEffect(() => {
    const next = serializeFilters(filters);
    if (next === lastPushedRef.current) return;
    const handler = setTimeout(() => {
      lastPushedRef.current = next;
      startTransition(() => {
        router.replace(next ? `${pathname}?${next}` : pathname, {
          scroll: false,
        });
      });
    }, FILTER_DEBOUNCE_MS);
    return () => clearTimeout(handler);
  }, [filters, router, pathname]);

  // ── Infinite auction list ──
  const infinite = useAuctionsInfinite(filters, initialPage);
  const cars = useMemo(
    () => infinite.data?.pages.flatMap((p) => p.data) ?? [],
    [infinite.data],
  );
  const total = infinite.data?.pages[0]?.meta.total ?? 0;

  useScrollRestoration(!!infinite.data);

  // ── Date strip (All + next 7 days) ──
  const RELATIVE_LABELS: Record<number, string> = {
    1: tSchedule("tomorrow"),
    2: tSchedule("dayAfter"),
  };

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
        isWeekend: dow === 0 || dow === 6,
        isHighlighted: offset <= 2,
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Infinite-scroll sentinel ──
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const { hasNextPage, isFetchingNextPage, fetchNextPage } = infinite;
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: "600px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const isInitialLoading = infinite.isLoading;
  // Dedupe by id: offset pagination over the live auction feed can legitimately
  // return a lot on two pages (the set shifts between fetches), which would
  // otherwise collide as duplicate React keys.
  const items = useMemo(() => {
    const seen = new Set<string>();
    const out: CarItem[] = [];
    for (const car of cars) {
      const item = fromFeaturedCar(car);
      if (seen.has(item.id)) continue;
      seen.add(item.id);
      out.push(item);
    }
    return out;
  }, [cars]);

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-4 md:py-8">
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
                  label={tSchedule("all")}
                />
                {days.map((day) => (
                  <DayTab
                    key={day.key}
                    isActive={selected === day.key}
                    onClick={() => setSelected(day.key)}
                    topLabel={day.topLabel}
                    day={day.day}
                    month={day.month}
                    weekend={day.isWeekend}
                    highlight={day.isHighlighted}
                  />
                ))}
              </div>
            </div>
            <div className="shrink-0 pt-1">
              <ViewModeSwitcher
                value={viewMode}
                onChange={handleViewModeChange}
                labels={{
                  grid: tSchedule("view.grid"),
                  list: tSchedule("view.list"),
                  table: tSchedule("view.table"),
                }}
              />
            </div>
          </div>

          <JapanAuctionFilterChips value={filters} onChange={setFilters} />

          {isInitialLoading ? (
            <div className="mt-16 flex items-center justify-center text-[13px] text-neutral-500">
              {t("loading")}
            </div>
          ) : items.length > 0 ? (
            <>
              <div className="mt-6">
                {viewMode === "grid" && (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4">
                    {items.map((car) => (
                      <Link
                        key={car.id}
                        href={`/japan/${car.id}`}
                        className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 rounded-xl"
                      >
                        <CarCard car={car} hidePrice />
                      </Link>
                    ))}
                  </div>
                )}
                {viewMode === "list" && (
                  <div className="flex flex-col gap-3">
                    {items.map((car) => (
                      <Link
                        key={car.id}
                        href={`/japan/${car.id}`}
                        className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 rounded-xl"
                      >
                        <CarListItem car={car} hidePrice />
                      </Link>
                    ))}
                  </div>
                )}
                {viewMode === "table" && (
                  <CarTableView
                    cars={items}
                    hidePrice
                    onRowClick={(car) => router.push(`/japan/${car.id}`)}
                  />
                )}
              </div>

              {/* Infinite-scroll sentinel + status */}
              <div
                ref={sentinelRef}
                className="mt-8 flex items-center justify-center py-6 text-[12.5px] text-neutral-400"
              >
                {isFetchingNextPage
                  ? t("loadingMore")
                  : hasNextPage
                    ? " "
                    : t("endOfList")}
              </div>
            </>
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
