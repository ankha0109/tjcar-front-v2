import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import GarageBrowser from "@/components/garage/GarageBrowser";
import { carResourceToStockItem } from "@/lib/stockAdapter";
import { STOCK_PER_PAGE, getCars } from "@/services/cars";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "garage.metadata" });
  return { title: t("title"), description: t("description") };
}

export default async function GaragePage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("garage");

  // One request for the whole catalogue: the endpoint supports no filters, and
  // `GarageBrowser` needs every row in hand to filter and sort client-side.
  const result = await getCars({ per_page: STOCK_PER_PAGE }).catch((err) => {
    console.error("[garage] /cars fetch failed:", err);
    return null;
  });

  const cars = (result?.data ?? []).map(carResourceToStockItem);

  return (
    <>
      <div className="mx-auto w-full max-w-7xl px-4 pb-6 pt-8 md:pt-10 lg:px-6">
        <header className="flex flex-col gap-2">
          <span className="text-[11px] font-semibold uppercase text-primary/80">
            {t("eyebrow")}
          </span>
          <h1 className="text-[26px] font-semibold text-neutral-900 md:text-[32px] dark:text-neutral-50">
            {t("heading")}
          </h1>
          <p className="max-w-2xl text-[13.5px] leading-relaxed text-neutral-600 md:text-[14px] dark:text-neutral-400">
            {t("subheading")}
          </p>
        </header>
      </div>

      {result === null ? (
        <p className="mx-auto w-full max-w-7xl px-4 pb-16 text-center text-[14px] text-neutral-600 lg:px-6 dark:text-neutral-400">
          {t("error")}
        </p>
      ) : (
        <GarageBrowser cars={cars} />
      )}
    </>
  );
}
