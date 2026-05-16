import FeaturedAuctionSchedule from "@/components/cards/FeaturedAuctionSchedule";
import ServerApi from "@/services/ServerApi";
import { FeaturedCar } from "@/types/featured";
import {
  FilterOptions,
  filtersToQuery,
  queryToFilters,
} from "@/types/filters";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function Home({ searchParams }: PageProps) {
  const params = await searchParams;
  const filters = queryToFilters(params);

  // Home page is public/mixed — fall back to empty data on any failure
  // (including 401 from an expired backend token) instead of signing the
  // user out. Auth-required pages should handle 401 explicitly with
  // redirectIfUnauthorized from @/lib/serverAuth.
  const [carsResult, optionsResult] = await Promise.allSettled([
    ServerApi.get<FeaturedCar[]>("/featured", filtersToQuery(filters), {
      cache: "no-store",
    }),
    ServerApi.get<FilterOptions>(
      "/filter-options",
      {},
      { next: { revalidate: 300 } },
    ),
  ]);

  const cars = carsResult.status === "fulfilled" ? carsResult.value : [];
  if (carsResult.status === "rejected") {
    console.error("[Home] /featured fetch failed:", carsResult.reason);
  }

  const filterOptions =
    optionsResult.status === "fulfilled" ? optionsResult.value : undefined;
  if (optionsResult.status === "rejected") {
    console.error(
      "[Home] /filter-options fetch failed:",
      optionsResult.reason,
    );
  }

  return (
    <FeaturedAuctionSchedule
      initialCars={cars}
      initialFilters={filters}
      filterOptions={filterOptions}
    />
  );
}
