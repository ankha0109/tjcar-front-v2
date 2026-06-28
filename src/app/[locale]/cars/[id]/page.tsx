import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import CarDetail from "@/components/car-detail/CarDetail";
import { getCar } from "@/services/cars";
import { carResourceToFixture, carTitle } from "@/lib/carFixtures";

type Props = {
  params: Promise<{ locale: string; id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const car = await getCar(id);
  if (!car) return {};
  const fixture = carResourceToFixture(car);
  return { title: `${carTitle(fixture)} · ${fixture.YEAR}` };
}

export default async function CarDetailPage({ params }: Props) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const car = await getCar(id);
  if (!car) notFound();
  return <CarDetail car={carResourceToFixture(car)} />;
}
