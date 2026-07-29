import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import ReportLookup from "@/components/report/ReportLookup";
import { effectiveReportPrice, getConfig } from "@/services/config";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "reportCheck" });

  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    // A lookup result is per-customer and worthless to crawlers.
    robots: { index: false, follow: false },
  };
}

/**
 * Report lookup + purchase. The hero only validates and redirects here, so this
 * page owns the plate → VIN → report chain and stays refreshable/shareable.
 *
 * The price is resolved server-side from GET /config; the backend recomputes it
 * at purchase time regardless, so this value is display-only.
 */
export default async function ReportCheckPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ plate?: string; vin?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const { plate, vin } = await searchParams;
  const config = await getConfig();

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-12 md:py-16 lg:px-6">
      <ReportLookup
        price={effectiveReportPrice(config)}
        plate={plate}
        vin={vin}
      />
    </main>
  );
}
