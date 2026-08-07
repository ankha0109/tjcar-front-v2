import { getTranslations } from "next-intl/server";
import {
  CONTACT_EMAIL,
  CONTACT_PHONES,
  FACEBOOK_URL,
  INSTAGRAM_URL,
  OFFICE_LAT,
  OFFICE_LNG,
} from "@/lib/contact";
import { SITE_URL } from "@/lib/site";

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

/**
 * AutoDealer (a LocalBusiness subtype) structured data for /contact — the one
 * page that states the address, the numbers and the opening hours together.
 */
export default async function ContactJsonLd({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "contact.office" });

  const data = {
    "@context": "https://schema.org",
    "@type": "AutoDealer",
    "@id": `${SITE_URL}/#organization`,
    name: "TJ Car LLC",
    url: `${SITE_URL}/${locale}/contact`,
    telephone: CONTACT_PHONES.map((phone) => phone.raw),
    email: CONTACT_EMAIL,
    address: {
      "@type": "PostalAddress",
      streetAddress: t("address"),
      addressLocality: "Ulaanbaatar",
      addressCountry: "MN",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: OFFICE_LAT,
      longitude: OFFICE_LNG,
    },
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
        ],
        opens: "07:30",
        closes: "17:30",
      },
    ],
    sameAs: [FACEBOOK_URL, INSTAGRAM_URL],
  };

  return <JsonLdScript data={data} />;
}
