import { setRequestLocale } from "next-intl/server";
import MobileHeader from "@/components/layout/mobile/MobileHeader";
import { getDevice } from "@/lib/device";
import { getAuction } from "@/services/auctions";
import { auctionLotToFixture, carTitle } from "@/lib/carFixtures";

type Props = {
  params: Promise<{ locale: string; id: string }>;
};

export default async function MobileHeaderAuctionDetail({ params }: Props) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const device = await getDevice();
  if (device !== "mobile") return null;
  const lot = await getAuction(id);
  // Grade rides as the header's second line, which is why the page body leaves
  // it out of the phone quick-specs grid.
  const car = lot ? auctionLotToFixture(lot) : null;
  return (
    <MobileHeader
      back={{ href: "/japan" }}
      title={car ? carTitle(car) : ""}
      subtitle={car?.GRADE || undefined}
    />
  );
}
