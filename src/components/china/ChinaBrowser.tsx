"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { Select } from "antd";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import CarCard, { PRIORITY_CARDS } from "@/components/cards/CarCard";
import CarListItem from "@/components/cards/views/CarListItem";
import CarTableView from "@/components/cards/views/CarTableView";
import ViewModeSwitcher from "@/components/cards/views/ViewModeSwitcher";
import {
  VIEW_MODE_COOKIE,
  VIEW_MODE_COOKIE_MAX_AGE,
  type ViewMode,
} from "@/components/cards/views/viewMode";
import { EmptyState } from "@/components/cards/views/scheduleTabs";
import InfiniteScrollSentinel from "@/components/cards/views/InfiniteScrollSentinel";
import ChinaFilters, {
  ChinaFilterChips,
} from "@/components/china/ChinaFilters";
import { chinaListingToCarItem } from "@/lib/chinaAdapter";
import { type CarItem } from "@/types/car";
import {
  type ChinaCatalogEntry,
  type ChinaFilterValues,
  type ChinaOrdering,
  chinaColorShortLabel,
  chinaFiltersToQuery,
} from "@/types/china";
import { useChinaInfinite, type ChinaPage } from "@/hooks/useChinaInfinite";
import type { ChinaInitialModels } from "@/hooks/useChinaModels";
import { useFilterScrollReset } from "@/utils/useFilterScrollReset";

type Props = {
  initialPage?: ChinaPage;
  initialFilters: ChinaFilterValues;
  /** Every brand with listings — the brand select's options. */
  brands: ChinaCatalogEntry[];
  /** The URL brand's models, so a `model_id` link resolves on first paint. */
  initialModels?: ChinaInitialModels;
  initialViewMode?: ViewMode;
};

const FILTER_DEBOUNCE_MS = 400;

/** The backend's default order has no `ordering` key of its own, hence the sentinel. */
type SortChoice = ChinaOrdering | "newest";

function serializeFilters(filters: ChinaFilterValues): string {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(chinaFiltersToQuery(filters))) {
    params.set(k, String(v));
  }
  return params.toString();
}

/**
 * `/china` — the Korea browser's layout over the China mirror: the shared
 * filter shell, sort select, view-mode switcher and infinite list, with
 * China's own filters and adapter.
 */
export default function ChinaBrowser({
  initialPage,
  initialFilters,
  brands,
  initialModels,
  initialViewMode = "grid",
}: Props) {
  const t = useTranslations("auctions");
  const tSchedule = useTranslations("featured.schedule");
  const tSort = useTranslations("china.sort");
  const tColor = useTranslations("carDetail");
  const router = useRouter();
  const pathname = usePathname();
  const [, startTransition] = useTransition();

  const [filters, setFilters] = useState<ChinaFilterValues>(initialFilters);
  const [viewMode, setViewMode] = useState<ViewMode>(initialViewMode);
  const lastPushedRef = useRef<string>(serializeFilters(initialFilters));
  const { ref: rootRef, scrollToTop } = useFilterScrollReset<HTMLElement>();

  // Every filter entry point goes through this, never `setFilters` directly —
  // see `useFilterScrollReset` for what the list collapse does to the scroll
  // position otherwise.
  const changeFilters = (next: ChinaFilterValues) => {
    setFilters(next);
    scrollToTop();
  };

  // Sorting is the backend's job, so it goes through the same filter state —
  // changing it refetches from page 1 rather than reordering the pages already
  // in hand, which would only sort the slice the user scrolled to.
  const handleSortChange = (next: SortChoice) => {
    changeFilters({
      ...filters,
      ordering: next === "newest" ? null : next,
    });
  };

  const handleViewModeChange = (next: ViewMode) => {
    setViewMode(next);
    document.cookie = `${VIEW_MODE_COOKIE}=${next}; path=/; max-age=${VIEW_MODE_COOKIE_MAX_AGE}; SameSite=Lax`;
  };

  // Sync filters → URL (debounced) so the page is shareable and the server can
  // hydrate page 1 with the same filters on a fresh load.
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

  const infinite = useChinaInfinite(filters, initialPage);
  const listings = useMemo(
    () => infinite.data?.pages.flatMap((p) => p.data) ?? [],
    [infinite.data],
  );

  const isInitialLoading = infinite.isLoading;
  // Dedupe by id — a sync landing between two page fetches can shift a row
  // across the page boundary.
  const items = useMemo(() => {
    const seen = new Set<string>();
    const out: CarItem[] = [];
    for (const listing of listings) {
      const item = chinaListingToCarItem(listing, {
        colorLabel: (color) => chinaColorShortLabel(color, tColor),
      });
      if (seen.has(item.id)) continue;
      seen.add(item.id);
      out.push(item);
    }
    return out;
  }, [listings, tColor]);

  return (
    <section
      ref={rootRef}
      className="mx-auto w-full max-w-7xl px-4 py-8 lg:px-6"
    >
      <div className="flex flex-col lg:flex-row lg:gap-6">
        <ChinaFilters
          value={filters}
          onChange={changeFilters}
          brands={brands}
          initialModels={initialModels}
        />

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-end gap-3 pt-1">
            <Select<SortChoice>
              options={[
                { value: "newest", label: tSort("newest") },
                { value: "price", label: tSort("priceAsc") },
                { value: "-price", label: tSort("priceDesc") },
                { value: "-year", label: tSort("yearDesc") },
                { value: "year", label: tSort("yearAsc") },
                { value: "mileage", label: tSort("mileageAsc") },
                { value: "-mileage", label: tSort("mileageDesc") },
              ]}
              value={filters.ordering ?? "newest"}
              onChange={handleSortChange}
              variant="filled"
              size="large"
              style={{ width: 200 }}
            />
            <div className="shrink-0">
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

          <ChinaFilterChips
            value={filters}
            onChange={changeFilters}
            brands={brands}
            initialModels={initialModels}
          />

          {isInitialLoading ? (
            <div className="mt-16 flex items-center justify-center text-[13px] text-neutral-500">
              {t("loading")}
            </div>
          ) : items.length > 0 ? (
            <>
              <div className="mt-6">
                {viewMode === "grid" && (
                  <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4">
                    {items.map((car, i) => (
                      <Link
                        key={car.id}
                        href={`/china/${car.id}`}
                        className="block rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                      >
                        <CarCard car={car} imagePriority={i < PRIORITY_CARDS} />
                      </Link>
                    ))}
                  </div>
                )}
                {viewMode === "list" && (
                  <div className="flex flex-col gap-3">
                    {items.map((car) => (
                      <Link
                        key={car.id}
                        href={`/china/${car.id}`}
                        className="block rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                      >
                        <CarListItem car={car} />
                      </Link>
                    ))}
                  </div>
                )}
                {viewMode === "table" && (
                  <CarTableView
                    cars={items}
                    onRowClick={(car) => router.push(`/china/${car.id}`)}
                  />
                )}
              </div>

              <InfiniteScrollSentinel
                hasNextPage={infinite.hasNextPage}
                isFetchingNextPage={infinite.isFetchingNextPage}
                isFetchNextPageError={infinite.isFetchNextPageError}
                fetchNextPage={infinite.fetchNextPage}
              />
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
