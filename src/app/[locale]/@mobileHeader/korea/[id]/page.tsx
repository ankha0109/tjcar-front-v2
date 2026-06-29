import { setRequestLocale } from "next-intl/server";
import MobileHeader from "@/components/layout/mobile/MobileHeader";
import { getDevice } from "@/lib/device";
import { getCar } from "@/services/cars";
import { carResourceToFixture, carTitle } from "@/lib/carFixtures";

type Props = {
  params: Promise<{ locale: string; id: string }>;
};

export default async function MobileHeaderKoreaDetail({ params }: Props) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const device = await getDevice();
  if (device !== "mobile") return null;
  const car = await getCar(id);
  const title = car ? carTitle(carResourceToFixture(car)) : "";
  return <MobileHeader back={{ href: "/korea" }} title={title} />;
}
