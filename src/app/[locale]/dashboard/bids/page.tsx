import { getTranslations, setRequestLocale } from "next-intl/server";
import BidList from "@/components/bid/BidList";
import DashboardHeader from "@/components/dashboard/DashboardHeader";

export default async function BidsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("dashboard.bids");

  return (
    <>
      <DashboardHeader title={t("title")} />

      {/* Client component: bids settle Pending → Processing → Win/Lose while
          the page is open, so the list refetches instead of rendering once. */}
      <BidList />
    </>
  );
}
