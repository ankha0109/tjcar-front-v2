import { setRequestLocale } from "next-intl/server";
import DashboardMobileHeader from "@/components/dashboard/DashboardMobileHeader";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function MobileHeaderDashboardBids({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <DashboardMobileHeader section="bids" />;
}
