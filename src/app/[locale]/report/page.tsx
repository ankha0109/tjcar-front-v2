import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
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

  return (
    <>
      <ReportJsonLd locale={locale} />
      <ReportHero />
      <ReportCompare />
      <ReportFeatures />
      <ReportPdfPreview />
      <ReportSteps />
      <ReportAudience />
      <ReportFAQ />
    </>
  );
}
