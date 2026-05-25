import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import AboutHero from "@/components/about/AboutHero";
import CompanyStory from "@/components/about/CompanyStory";
import ServicesList from "@/components/about/ServicesList";
import ProcessTimeline from "@/components/about/ProcessTimeline";
import AdvantagesAndTrust from "@/components/about/AdvantagesAndTrust";
import CompanyAtAGlance from "@/components/about/CompanyAtAGlance";
import AboutCTA from "@/components/about/AboutCTA";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "about.metadata" });
  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function AboutPage() {
  return (
    <>
      <AboutHero />
      <CompanyStory />
      <ServicesList />
      <ProcessTimeline />
      <AdvantagesAndTrust />
      <CompanyAtAGlance />
      <AboutCTA />
    </>
  );
}
