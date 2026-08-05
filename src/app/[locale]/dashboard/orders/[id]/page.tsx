import { getTranslations, setRequestLocale } from "next-intl/server";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import OrderDetail from "@/components/order/OrderDetail";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("dashboard.orderDetail");

  return (
    <>
      <DashboardHeader title={t("title")} />
      {/* Ownership is enforced by the API (another customer's id 404s), so the
          shell renders unconditionally and OrderDetail handles the 404 state. */}
      <OrderDetail id={id} />
    </>
  );
}
