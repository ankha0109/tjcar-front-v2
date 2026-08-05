import { setRequestLocale } from "next-intl/server";
import DashboardMobileHeader from "@/components/dashboard/DashboardMobileHeader";

type Props = {
  params: Promise<{ locale: string; id: string }>;
};

export default async function MobileHeaderDashboardOrderDetail({ params }: Props) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  return <DashboardMobileHeader section="orders" id={id} />;
}
