import { setRequestLocale } from "next-intl/server";
import MobileHeader from "@/components/layout/mobile/MobileHeader";
import { getDevice } from "@/lib/device";
import { getCar } from "@/services/cars";
import { carResourceToFixture, carTitle } from "@/lib/carFixtures";

type Props = {
  params: Promise<{ locale: string; id: string }>;
};

export default async function MobileHeaderGarageCarDetail({ params }: Props) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const device = await getDevice();
  if (device !== "mobile") return null;
  const car = await getCar(id);
  // Grade rides as the header's second line (the Japan lot page does the same),
  // which is why the page body leaves it out of the phone spec grid.
  const fixture = car ? carResourceToFixture(car) : null;
  return (
    <MobileHeader
      back={{ href: "/garage" }}
      title={fixture ? carTitle(fixture) : ""}
      subtitle={fixture?.GRADE || undefined}
    />
  );
}
