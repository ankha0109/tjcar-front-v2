import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import EncarDetail from "@/components/car-detail/EncarDetail";
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
  return <EncarDetail car={carResourceToFixture(car)} />;
}
