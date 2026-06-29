import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import BrandsExplorer from "@/components/brands/BrandsExplorer";
import { norm } from "@/lib/brand";
import { getBrandsCatalog } from "@/services/filters";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "japanBrands.metadata" });
  return {
    title: t("title"),
    description: t("description"),
  };
}

type PageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function JapanBrandsPage({
  params,
  searchParams,
}: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const sp = await searchParams;
  const makeParam = Array.isArray(sp.make) ? sp.make[0] : sp.make;

  const catalog = await getBrandsCatalog().catch((reason) => {
    console.error("[JapanBrands] /filters fetch failed:", reason);
    return undefined;
  });

  // Resolve the requested make to a real brand name; default to Toyota, then
  // fall back to the first brand so the right pane is never empty.
  const brands = catalog?.brands ?? [];
  const resolve = (name: string) =>
    brands.find((b) => norm(b) === norm(name));
  const initialMake =
    (makeParam && resolve(makeParam)) ?? resolve("Toyota") ?? brands[0] ?? "";

  return <BrandsExplorer catalog={catalog} initialMake={initialMake} />;
}
