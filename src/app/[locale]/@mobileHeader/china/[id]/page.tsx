import { setRequestLocale } from "next-intl/server";
import MobileHeader from "@/components/layout/mobile/MobileHeader";
import { getDevice } from "@/lib/device";
import { getChinaListing } from "@/services/china";
import { chinaListingToFixture } from "@/lib/chinaAdapter";
import { carTitle } from "@/lib/carFixtures";

type Props = {
  params: Promise<{ locale: string; id: string }>;
};

export default async function MobileHeaderChinaDetail({ params }: Props) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const device = await getDevice();
  if (device !== "mobile") return null;
  const listing = await getChinaListing(id);
  // Grade rides as the header's second line, the same split the Korea and
  // Japan pages use — which is why the page body's title band is skipped on
  // this shell.
  const car = listing ? chinaListingToFixture(listing) : null;
  return (
    <MobileHeader
      back={{ href: "/china" }}
      title={car ? carTitle(car) : ""}
      subtitle={car?.GRADE || undefined}
    />
  );
}
