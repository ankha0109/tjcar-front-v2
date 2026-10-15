import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import ChinaDetail from "@/components/car-detail/ChinaDetail";
import { getChinaListing } from "@/services/china";
import { calculateVehicleCost } from "@/services/vehicleCost";
import { chinaListingToFixture } from "@/lib/chinaAdapter";
import { carTitle } from "@/lib/carFixtures";

type Props = {
  params: Promise<{ locale: string; id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const listing = await getChinaListing(id);
  if (!listing) return {};
  const fixture = chinaListingToFixture(listing);
  const title = carTitle(fixture);
  return { title: fixture.YEAR ? `${title} · ${fixture.YEAR}` : title };
}

export default async function ChinaDetailPage({ params }: Props) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const listing = await getChinaListing(id);
  if (!listing) notFound();

  // The server reads price, year, displacement and fuel type off its own
  // mirror, so naming the listing is the whole request — and the landed price
  // is in the first paint.
  const landedCost = await calculateVehicleCost({
    country: "CHINA",
    chinaListingId: listing.id,
  });

  return <ChinaDetail listing={listing} landedCost={landedCost} />;
}
