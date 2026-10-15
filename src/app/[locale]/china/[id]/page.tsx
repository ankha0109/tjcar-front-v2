import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import ChinaDetail from "@/components/car-detail/ChinaDetail";
import { getChinaListing } from "@/services/china";
import { calculateVehicleCost } from "@/services/vehicleCost";
import { chinaListingToFixture } from "@/lib/chinaAdapter";
import { carTitle } from "@/lib/carFixtures";

type Props = {
  params: Promise<{ locale: string; id: string }>;
};

/**
 * Our fee on a Chinese import. As on `/korea/{id}`, the calculator adds
 * nothing it is not asked for, so the page asks: the API appends it as the
 * last row, under the taxes, and counts it into the total.
 */
const BROKERAGE_FEE_MNT = 2_000_000;

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
  const t = await getTranslations("carDetail.koreaLanded");

  // The server reads price, year, displacement and fuel type off its own
  // mirror, so naming the listing is the whole request — and the landed price
  // is in the first paint.
  const landedCost = await calculateVehicleCost({
    country: "CHINA",
    chinaListingId: listing.id,
    additionalCostsMNT: [
      {
        code: "BROKERAGE_FEE",
        name: t("brokerageFee"),
        amountMNT: BROKERAGE_FEE_MNT,
      },
    ],
  });

  return <ChinaDetail listing={listing} landedCost={landedCost} />;
}
