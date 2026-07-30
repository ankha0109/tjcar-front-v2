import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import KoreaBrandsExplorer from "@/components/brands/KoreaBrandsExplorer";
import { KOREA_BRANDS } from "@/types/korea";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "koreaBrands.metadata" });
  return {
    title: t("title"),
    description: t("description"),
  };
}

type PageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function KoreaBrandsPage({
  params,
  searchParams,
}: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const sp = await searchParams;
  const raw = Array.isArray(sp.brand) ? sp.brand[0] : sp.brand;

  // `KOREA_BRANDS` is a static constant, so this page fetches nothing — only
  // the selected brand's models load, client-side, from `/korea/models`.
  // An unknown slug would 422 at the backend, so fall back to Hyundai.
  const initialBrand =
    KOREA_BRANDS.find((b) => b.slug === raw)?.slug ?? "hyundai";

  return <KoreaBrandsExplorer initialBrand={initialBrand} />;
}
