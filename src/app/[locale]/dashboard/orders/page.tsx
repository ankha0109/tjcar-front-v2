import { getTranslations, setRequestLocale } from "next-intl/server";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import OrderList from "@/components/order/OrderList";

export default async function OrdersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("dashboard.orders");

  return (
    <>
      <DashboardHeader title={t("title")} />

      {/* Client component: a car's shipping location advances while the page
          is open, so the list refetches instead of rendering once. */}
      <OrderList />
    </>
  );
}
