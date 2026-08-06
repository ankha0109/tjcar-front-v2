import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import ContactHero from "@/components/contact/ContactHero";
import ContactChannels from "@/components/contact/ContactChannels";
import ContactMap from "@/components/contact/ContactMap";
import ContactJsonLd from "@/components/contact/ContactJsonLd";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "contact.metadata" });
  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function ContactPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <ContactJsonLd locale={locale} />
      <ContactHero />
      <div className="mx-auto w-full max-w-7xl px-4 py-10 md:py-14 lg:px-6">
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 lg:col-span-7">
            <ContactChannels />
          </div>
          <div className="col-span-12 lg:col-span-5">
            <ContactMap />
          </div>
        </div>
      </div>
    </>
  );
}
