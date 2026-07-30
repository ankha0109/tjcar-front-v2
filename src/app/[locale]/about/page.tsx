import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import AboutHero from "@/components/about/AboutHero";
import AboutServices from "@/components/about/AboutServices";
import AboutStory from "@/components/about/AboutStory";
import AboutTeam from "@/components/about/AboutTeam";
import AboutGallery from "@/components/about/AboutGallery";
import AboutCustomers from "@/components/about/AboutCustomers";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "about.metadata" });
  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function AboutPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <AboutHero />
      <AboutServices />
      <AboutStory />
      <AboutTeam />
      <AboutGallery />
      <AboutCustomers />
    </>
  );
}
