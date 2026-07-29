import { getTranslations, setRequestLocale } from "next-intl/server";
import BidList from "@/components/bid/BidList";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import SectionMast from "@/components/dashboard/SectionMast";

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
      <DashboardHeader title={t("title")} description={t("description")} />

      <section className="space-y-4">
        <SectionMast title={t("listHeading")} />
        {/* Client component: bids settle Pending → Processing → Win/Lose while
            the page is open, so the list refetches instead of rendering once. */}
        <BidList />
      </section>
    </>
  );
}
