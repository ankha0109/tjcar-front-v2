import type { Metadata } from "next";
import { cookies } from "next/headers";
import { getTranslations, setRequestLocale } from "next-intl/server";
import ChinaBrowser from "@/components/china/ChinaBrowser";
import {
  VIEW_MODE_COOKIE,
  isViewMode,
  type ViewMode,
} from "@/components/cards/views/viewMode";
import {
  CHINA_PER_PAGE,
  getChinaBrands,
  getChinaListings,
  getChinaModels,
} from "@/services/china";
import { chinaFiltersToQuery, queryToChinaFilters } from "@/types/china";

type PageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "china.metadata" });
  return { title: t("title"), description: t("description") };
}

export default async function ChinaPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const sp = await searchParams;
  const filters = queryToChinaFilters(sp);

  const cookieStore = await cookies();
  const storedMode = cookieStore.get(VIEW_MODE_COOKIE)?.value;
  const initialViewMode: ViewMode = isViewMode(storedMode) ? storedMode : "grid";

  // Each can fail on its own: the list still renders without the brand
  // options, and the selects still work over a list the client refetches. The
  // URL brand's models are only read when there is one, for its model label.
  const [pageResult, brandsResult, modelsResult] = await Promise.allSettled([
    getChinaListings({
      ...chinaFiltersToQuery(filters),
      page: 1,
      per_page: CHINA_PER_PAGE,
    }),
    getChinaBrands(),
    filters.brandId != null
      ? getChinaModels(filters.brandId)
      : Promise.resolve(null),
  ]);

  const initialPage =
    pageResult.status === "fulfilled" ? pageResult.value : undefined;
  if (pageResult.status === "rejected") {
    console.error("[China] /china fetch failed:", pageResult.reason);
  }
  const brands = brandsResult.status === "fulfilled" ? brandsResult.value : [];
  if (brandsResult.status === "rejected") {
    console.error("[China] /china/brands fetch failed:", brandsResult.reason);
  }
  const initialModels =
    filters.brandId != null &&
    modelsResult.status === "fulfilled" &&
    modelsResult.value
      ? { brandId: filters.brandId, models: modelsResult.value }
      : undefined;
  if (modelsResult.status === "rejected") {
    console.error("[China] /china/models fetch failed:", modelsResult.reason);
  }

  return (
    <ChinaBrowser
      initialPage={initialPage}
      initialFilters={filters}
      brands={brands}
      initialModels={initialModels}
      initialViewMode={initialViewMode}
    />
  );
}
