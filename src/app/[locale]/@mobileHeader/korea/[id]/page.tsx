import { setRequestLocale } from "next-intl/server";
import MobileHeader from "@/components/layout/mobile/MobileHeader";
import { getDevice } from "@/lib/device";
import { getKoreaListing } from "@/services/korea";
import { koreaListingToFixture } from "@/lib/koreaAdapter";
import { carTitle } from "@/lib/carFixtures";

type Props = {
  params: Promise<{ locale: string; id: string }>;
};

export default async function MobileHeaderKoreaDetail({ params }: Props) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const device = await getDevice();
  if (device !== "mobile") return null;
  const listing = await getKoreaListing(id);
  // Trim rides as the header's second line, the same split the Japan lot page
  // uses — which is why the page body's title band is skipped on this shell.
  const car = listing ? koreaListingToFixture(listing) : null;
  return (
    <MobileHeader
      back={{ href: "/korea" }}
      title={car ? carTitle(car) : ""}
      subtitle={car?.GRADE || undefined}
    />
  );
}
