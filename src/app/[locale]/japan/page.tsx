import { cookies } from "next/headers";
import { setRequestLocale } from "next-intl/server";
import AuctionBrowser from "@/components/cards/AuctionBrowser";
import {
  VIEW_MODE_COOKIE,
  isViewMode,
  type ViewMode,
} from "@/components/cards/views/viewMode";
import { AUCTIONS_PER_PAGE, getAuctions } from "@/services/auctions";
import { getFilterOptions } from "@/services/filters";
import { filtersToAuctionQuery, queryToFilters } from "@/types/filters";

type PageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function JapanPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const sp = await searchParams;
  const filters = queryToFilters(sp);

  const cookieStore = await cookies();
  const storedMode = cookieStore.get(VIEW_MODE_COOKIE)?.value;
  const initialViewMode: ViewMode = isViewMode(storedMode) ? storedMode : "grid";

  const [pageResult, optionsResult] = await Promise.allSettled([
    getAuctions({
      ...filtersToAuctionQuery(filters),
      page: 1,
      per_page: AUCTIONS_PER_PAGE,
    }),
    getFilterOptions(),
  ]);

  const initialPage =
    pageResult.status === "fulfilled" ? pageResult.value : undefined;
  if (pageResult.status === "rejected") {
    console.error("[Japan] /auctions fetch failed:", pageResult.reason);
  }

  const filterOptions =
    optionsResult.status === "fulfilled" ? optionsResult.value : undefined;
  if (optionsResult.status === "rejected") {
    console.error("[Japan] /filters fetch failed:", optionsResult.reason);
  }

  return (
    <AuctionBrowser
      initialPage={initialPage}
      initialFilters={filters}
      filterOptions={filterOptions}
      initialViewMode={initialViewMode}
    />
  );
}
