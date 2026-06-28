import { cookies } from "next/headers";
import FeaturedAuctionSchedule from "@/components/cards/FeaturedAuctionSchedule";
import {
  VIEW_MODE_COOKIE,
  isViewMode,
  type ViewMode,
} from "@/components/cards/views/viewMode";
import ServerApi from "@/services/ServerApi";
import { getFilterOptions } from "@/services/filters";
import { FeaturedCar } from "@/types/featured";
import { filtersToQuery, queryToFilters } from "@/types/filters";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function KoreaPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const filters = queryToFilters(params);

  const cookieStore = await cookies();
  const storedMode = cookieStore.get(VIEW_MODE_COOKIE)?.value;
  const initialViewMode: ViewMode = isViewMode(storedMode) ? storedMode : "grid";

  const [carsResult, optionsResult] = await Promise.allSettled([
    ServerApi.get<FeaturedCar[]>("/featured", filtersToQuery(filters), {
      cache: "no-store",
    }),
    getFilterOptions(),
  ]);

  const cars = carsResult.status === "fulfilled" ? carsResult.value : [];
  if (carsResult.status === "rejected") {
    console.error("[Korea] /featured fetch failed:", carsResult.reason);
  }

  const filterOptions =
    optionsResult.status === "fulfilled" ? optionsResult.value : undefined;
  if (optionsResult.status === "rejected") {
    console.error("[Korea] /filters fetch failed:", optionsResult.reason);
  }

  return (
    <FeaturedAuctionSchedule
      initialCars={cars}
      initialFilters={filters}
      filterOptions={filterOptions}
      initialViewMode={initialViewMode}
    />
  );
}
