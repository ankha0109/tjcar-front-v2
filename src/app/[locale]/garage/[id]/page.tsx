import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import GarageCarDetail from "@/components/garage/GarageCarDetail";
import { carResourceToFixture, carTitle } from "@/lib/carFixtures";
import { getCar } from "@/services/cars";

type Props = {
  params: Promise<{ locale: string; id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const car = await getCar(id);
  if (!car) return {};
  const fixture = carResourceToFixture(car);
  const title = carTitle(fixture);
  const cover = car.images?.[0];
  return {
    title: fixture.YEAR ? `${title} · ${fixture.YEAR}` : title,
    openGraph: cover ? { title, images: [cover] } : undefined,
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
