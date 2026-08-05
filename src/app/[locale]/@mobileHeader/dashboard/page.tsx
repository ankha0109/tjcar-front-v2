import { getTranslations, setRequestLocale } from "next-intl/server";
import MobileHeader from "@/components/layout/mobile/MobileHeader";
import { getDevice } from "@/lib/device";

type Props = {
  params: Promise<{ locale: string }>;
};

/**
 * `/dashboard` itself is the account screen: its own title and the hamburger,
 * nothing else. No back arrow — the bottom nav is the way out — and no logo,
 * which on this one screen would only compete with the title for the 56px bar.
 */
export default async function MobileHeaderDashboard({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const device = await getDevice();
  if (device !== "mobile") return null;

  const t = await getTranslations("dashboard");

  return (
    <MobileHeader title={t("mobile.title")} hideLogo right={null} menuButton />
  );
}
