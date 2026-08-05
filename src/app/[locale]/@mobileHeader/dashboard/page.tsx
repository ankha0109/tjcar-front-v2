import { getTranslations, setRequestLocale } from "next-intl/server";
import MobileHeader from "@/components/layout/mobile/MobileHeader";
import { getDevice } from "@/lib/device";

type Props = {
  params: Promise<{ locale: string }>;
};

/**
 * `/dashboard` itself is the account screen, so it keeps the logo and the
 * hamburger and takes no back arrow — the bottom nav is the way out.
 */
export default async function MobileHeaderDashboard({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const device = await getDevice();
  if (device !== "mobile") return null;

  const t = await getTranslations("dashboard");

  return <MobileHeader title={t("mobile.title")} right={null} menuButton />;
}
