import { getTranslations } from "next-intl/server";
import { REPORT_FAQ_KEYS } from "./reportFaqKeys";

const SITE_URL = "https://v2.tjcar.mn";

function JsonLdScript({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}

/** FAQPage + Service structured data for the /report landing page. */
export default async function ReportJsonLd({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "reportLanding" });

  const faqPage = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: REPORT_FAQ_KEYS.map((k) => ({
      "@type": "Question",
      name: t(`faq.items.${k}.q`),
      acceptedAnswer: {
        "@type": "Answer",
        text: t(`faq.items.${k}.a`),
      },
    })),
  };

  const service = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: t("jsonLd.serviceName"),
    serviceType: "Vehicle history report",
    description: t("metadata.description"),
    url: `${SITE_URL}/${locale}/report`,
    provider: {
      "@type": "Organization",
      name: "TJ CAR",
      url: SITE_URL,
    },
    areaServed: {
      "@type": "Country",
      name: "Mongolia",
    },
    offers: {
      "@type": "Offer",
      price: "20000",
      priceCurrency: "MNT",
      availability: "https://schema.org/InStock",
    },
  };

  return (
    <>
      <JsonLdScript data={faqPage} />
      <JsonLdScript data={service} />
    </>
  );
}
