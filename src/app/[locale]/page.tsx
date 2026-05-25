import { setRequestLocale } from "next-intl/server";
import CarSearchSection from "@/components/home/CarSearchSection";
import ServerApi from "@/services/ServerApi";
import type { FilterOptions, MarkaStatsResponse } from "@/types/filters";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export default async function Home({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [filterRes, japanRes, koreaRes, readyRes] = await Promise.allSettled([
    ServerApi.get<FilterOptions>(
      "/filter-options",
      {},
      { next: { revalidate: 300 } },
    ),
    ServerApi.get<MarkaStatsResponse>(
      "/marka-stats",
      { source: "japan" },
      { next: { revalidate: 300 } },
    ),
    ServerApi.get<MarkaStatsResponse>(
      "/marka-stats",
      { source: "korea" },
      { next: { revalidate: 300 } },
    ),
    ServerApi.get<MarkaStatsResponse>(
      "/marka-stats",
      { source: "ready" },
      { next: { revalidate: 300 } },
    ),
  ]);

  if (filterRes.status === "rejected") {
    console.error("[Home] /filter-options fetch failed:", filterRes.reason);
  }
  if (japanRes.status === "rejected") {
    console.error(
      "[Home] /marka-stats?source=japan fetch failed:",
      japanRes.reason,
    );
  }
  if (koreaRes.status === "rejected") {
    console.error(
      "[Home] /marka-stats?source=korea fetch failed:",
      koreaRes.reason,
    );
  }
  if (readyRes.status === "rejected") {
    console.error(
      "[Home] /marka-stats?source=ready fetch failed:",
      readyRes.reason,
    );
  }

  const filterOptions =
    filterRes.status === "fulfilled" ? filterRes.value : undefined;
  const japan = japanRes.status === "fulfilled" ? japanRes.value : undefined;
  const korea = koreaRes.status === "fulfilled" ? koreaRes.value : undefined;
  const ready = readyRes.status === "fulfilled" ? readyRes.value : undefined;

  return (
    <CarSearchSection
      japan={japan}
      korea={korea}
      ready={ready}
      filterOptions={filterOptions}
    />
  );
}
