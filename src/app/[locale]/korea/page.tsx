import { cookies } from "next/headers";
import { setRequestLocale } from "next-intl/server";
import KoreaBrowser from "@/components/korea/KoreaBrowser";
import {
  VIEW_MODE_COOKIE,
  isViewMode,
  type ViewMode,
} from "@/components/cards/views/viewMode";
import { KOREA_PER_PAGE, getKoreaListings } from "@/services/korea";
import { koreaFiltersToQuery, queryToKoreaFilters } from "@/types/korea";

type PageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function KoreaPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const sp = await searchParams;
  const filters = queryToKoreaFilters(sp);

  const cookieStore = await cookies();
  const storedMode = cookieStore.get(VIEW_MODE_COOKIE)?.value;
  const initialViewMode: ViewMode = isViewMode(storedMode) ? storedMode : "grid";

  const pageResult = await Promise.allSettled([
    getKoreaListings({
      ...koreaFiltersToQuery(filters),
      page: 1,
      per_page: KOREA_PER_PAGE,
    }),
  ]);

  const initialPage =
    pageResult[0].status === "fulfilled" ? pageResult[0].value : undefined;
  if (pageResult[0].status === "rejected") {
    console.error("[Korea] /korea fetch failed:", pageResult[0].reason);
  }

  return (
    <KoreaBrowser
      initialPage={initialPage}
      initialFilters={filters}
      initialViewMode={initialViewMode}
    />
  );
}
