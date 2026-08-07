import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import GarageCarDetail from "@/components/garage/GarageCarDetail";
import { carResourceToFixture, carTitle } from "@/lib/carFixtures";
import { ogSite } from "@/lib/site";
import { getCar } from "@/services/cars";

type Props = {
  params: Promise<{ locale: string; id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, id } = await params;
  const car = await getCar(id);
  if (!car) return {};
  const fixture = carResourceToFixture(car);
  const title = carTitle(fixture);
  const cover = car.images?.[0];
  return {
    title: fixture.YEAR ? `${title} · ${fixture.YEAR}` : title,
    // Spread rather than `openGraph: undefined`: Next walks the returned object's
    // own keys, so an explicit `undefined` here wipes the layout's card instead
    // of leaving it in place. A car with no photo falls back to the site image.
    ...(cover
      ? { openGraph: { ...ogSite(locale), title, images: [cover] } }
      : {}),
  };
}

export default async function GarageCarPage({ params }: Props) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const car = await getCar(id);
  // `GET /cars/{id}` also serves `inactive` rows (v1 parity). They aren't linked
  // from anywhere, so we render rather than gate them.
  if (!car) notFound();
  return <GarageCarDetail car={car} />;
}
