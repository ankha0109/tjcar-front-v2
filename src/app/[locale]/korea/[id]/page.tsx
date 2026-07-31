import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import EncarDetail from "@/components/car-detail/EncarDetail";
import { getKoreaListing } from "@/services/korea";
import { calculateVehicleCost } from "@/services/vehicleCost";
import { koreaListingToFixture } from "@/lib/koreaAdapter";
import { resolvePowertrain } from "@/lib/powertrain";
import { carTitle } from "@/lib/carFixtures";
import type { VehicleCostResult } from "@/types/vehicleCost";

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

  // Encar's fuel type only pins the excise class for petrol and diesel. Price
  // those here so the total is in the first paint; a hybrid needs the buyer to
  // pick HEV/PHEV/MHEV first, and LPG/hydrogen/EV have no excise rule at all.
  const resolution = resolvePowertrain(listing.fuel_type);
  const initial: VehicleCostResult | null =
    resolution.kind === "resolved"
      ? await calculateVehicleCost({
          country: "KOREA",
          koreaListingId: Number(id),
          powertrain: resolution.powertrain,
        })
      : null;

  return (
    <EncarDetail
      car={koreaListingToFixture(listing)}
      priceMnt={listing.price_mnt ?? 0}
      enableCompare
      landedCost={{ listingId: Number(id), resolution, initial }}
      encar={{
        priceKrw: listing.price_krw ?? null,
        priceMnt: listing.price_mnt ?? null,
        newPriceKrw: listing.new_price_krw ?? null,
        officialUrl: listing.listing_url ?? null,
        fuelType: listing.fuel_type ?? null,
        seatCount: listing.seat_count ?? null,
        yearMonth: listing.year_month ?? null,
        options: listing.options,
        inspection: listing.inspection,
        insurance: listing.insurance,
      }}
    />
  );
}
