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
  const title = lot ? carTitle(auctionLotToFixture(lot)) : "";
  return <MobileHeader back={{ href: "/japan" }} title={title} />;
}
