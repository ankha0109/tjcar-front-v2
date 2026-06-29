import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import ReportHero from "@/components/report/ReportHero";
import ReportSteps from "@/components/report/ReportSteps";
import ReportContents from "@/components/report/ReportContents";
import ReportSample from "@/components/report/ReportSample";
import ReportPricing from "@/components/report/ReportPricing";
import ReportFAQ from "@/components/report/ReportFAQ";
import ReportFinalCta from "@/components/report/ReportFinalCta";

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
      <ReportHero />
      <ReportSteps />
      <ReportContents />
      <ReportSample />
      <ReportPricing />
      <ReportFAQ />
      <ReportFinalCta />
    </>
  );
}
