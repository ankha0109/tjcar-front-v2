import { setRequestLocale } from "next-intl/server";
import MobileHeader from "@/components/layout/mobile/MobileHeader";
import { getDevice } from "@/lib/device";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function MobileHeaderDefault({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const device = await getDevice();
  if (device !== "mobile") return null;
  return <MobileHeader menuButton />;
}
