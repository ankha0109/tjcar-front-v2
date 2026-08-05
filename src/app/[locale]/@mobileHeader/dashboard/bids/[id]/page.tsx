import { setRequestLocale } from "next-intl/server";
import DashboardMobileHeader from "@/components/dashboard/DashboardMobileHeader";

type Props = {
  params: Promise<{ locale: string; id: string }>;
};

export default async function MobileHeaderDashboardBidDetail({ params }: Props) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  return <DashboardMobileHeader section="bids" id={id} />;
}
