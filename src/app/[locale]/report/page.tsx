import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ogSite } from "@/lib/site";
import { getConfig, reportPricing } from "@/services/config";
import ReportJsonLd from "@/components/report/ReportJsonLd";
import ReportHero from "@/components/report/ReportHero";
import ReportCompare from "@/components/report/ReportCompare";
import ReportFeatures from "@/components/report/ReportFeatures";
import ReportPdfPreview from "@/components/report/ReportPdfPreview";
import ReportSteps from "@/components/report/ReportSteps";
import ReportAudience from "@/components/report/ReportAudience";
import ReportFAQ from "@/components/report/ReportFAQ";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({
    locale,
    namespace: "reportLanding.metadata",
  });
  return {
    title: t("title"),
    description: t("description"),
    openGraph: {
      ...ogSite(locale),
      title: t("ogTitle"),
      description: t("ogDescription"),
      type: "website",
      images: [
        {
          url: "/images/tjreport_bg.webp",
          width: 1254,
          height: 1254,
          alt: t("ogAlt"),
        },
      ],
    },
    twitter: { card: "summary_large_image" },
  };
}

export default async function ReportPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  // The backend recomputes the price at purchase time, so this copy is
  // display-only. Every spot on the page that quotes a number takes it from
  // here — a promo has to move all of them at once, or the page contradicts
  // itself. `getConfig` is cached for an hour, and the locale layout has
  // already read it, so this is free.
  const pricing = reportPricing(await getConfig());

  return (
    <>
      <ReportJsonLd locale={locale} pricing={pricing} />
      <ReportHero pricing={pricing} />
      <ReportCompare />
      <ReportFeatures />
      <ReportPdfPreview />
      <ReportSteps pricing={pricing} />
      <ReportAudience />
      <ReportFAQ />
    </>
  );
}
