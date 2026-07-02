import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import CarDetail from "@/components/car-detail/CarDetail";
import { getKoreaListing } from "@/services/korea";
import { koreaListingToFixture } from "@/lib/koreaAdapter";
import { carTitle } from "@/lib/carFixtures";

type Props = {
  params: Promise<{ locale: string; id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const listing = await getKoreaListing(id);
  if (!listing) return {};
  const fixture = koreaListingToFixture(listing);
  const title = carTitle(fixture);
  return { title: fixture.YEAR ? `${title} · ${fixture.YEAR}` : title };
}

export default async function KoreaDetailPage({ params }: Props) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const listing = await getKoreaListing(id);
  if (!listing) notFound();
  // Encar detail: price shows on the list card (MNT); the shared CarDetail
  // renders JPY pricing, so hide it here and disable the auction bid panel.
  return (
    <CarDetail
      car={koreaListingToFixture(listing)}
      hidePrice
      enableBid={false}
      priceMnt={listing.price_mnt ?? 0}
      enableCompare
    />
  );
}
