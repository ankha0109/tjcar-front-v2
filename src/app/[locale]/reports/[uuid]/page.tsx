import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import ReportStatus from "@/components/report/ReportStatus";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "reportStatus" });

  return {
    title: t("metaTitle"),
    // A paid report belongs to one customer; keep it out of search results.
    robots: { index: false, follow: false },
  };
}

/**
 * Payment + delivery screen for a single report.
 *
 * Rendered client-side on purpose: it polls two endpoints (QPay payment state
 * and the report itself) until the PDF lands, which a server component cannot
 * do. The uuid alone is the addressing key — the API checks the bearer token.
 */
export default async function ReportDetailPage({
  params,
}: {
  params: Promise<{ locale: string; uuid: string }>;
}) {
  const { locale, uuid } = await params;
  setRequestLocale(locale);

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-12 md:py-16 lg:px-6">
      <ReportStatus uuid={uuid} />
    </main>
  );
}
