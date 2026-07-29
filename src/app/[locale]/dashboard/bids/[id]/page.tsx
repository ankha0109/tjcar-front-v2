import { getTranslations, setRequestLocale } from "next-intl/server";
import BidDetail from "@/components/bid/BidDetail";
import DashboardHeader from "@/components/dashboard/DashboardHeader";

export default async function BidDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("dashboard.bidDetail");

  return (
    <>
      <DashboardHeader title={t("title")} description={t("description")} />
      {/* Ownership is enforced by the API (another customer's id 404s), so the
          shell renders unconditionally and BidDetail handles the 404 state. */}
      <BidDetail id={id} />
    </>
  );
}
