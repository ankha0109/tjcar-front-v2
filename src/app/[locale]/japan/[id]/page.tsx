import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import CarDetail from "@/components/car-detail/CarDetail";
import { getAuction } from "@/services/auctions";
import { auctionLotToFixture, carTitle } from "@/lib/carFixtures";

type Props = {
  params: Promise<{ locale: string; id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const lot = await getAuction(id);
  if (!lot) return {};
  const fixture = auctionLotToFixture(lot);
  return { title: `${carTitle(fixture)} · ${fixture.YEAR}` };
}

export default async function AuctionDetailPage({ params }: Props) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const lot = await getAuction(id);
  if (!lot) notFound();
  return <CarDetail car={auctionLotToFixture(lot)} hidePrice />;
}
