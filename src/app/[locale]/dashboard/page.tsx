import { setRequestLocale } from "next-intl/server";
import DashboardActiveOrders from "@/components/dashboard/DashboardActiveOrders";
import DashboardRecentBids from "@/components/dashboard/DashboardRecentBids";
import DashboardStats from "@/components/dashboard/DashboardStats";
import DashboardMobileMenu from "@/components/dashboard/mobile/DashboardMobileMenu";
import WalletSection from "@/components/wallet/WalletSection";
import { getDevice } from "@/lib/device";

export default async function DashboardIndex({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ topup?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  // `?topup=1` (from the bid gate, the Premium modal and the old /dashboard/wallet
  // URL) opens the top-up drawer on arrival.
  const { topup } = await searchParams;
  const device = await getDevice();

  // On a phone this route is the account screen: a balance summary over a
  // grouped menu. The desktop tree below is reached through the sidebar, which
  // phones never see, so the two never have to agree on a layout.
  if (device === "mobile") {
    return <DashboardMobileMenu openTopUp={topup === "1"} />;
  }

  return (
    <>
      {/* Everything here is a client island: the balance is credited by hand
          after a bank transfer, bids settle and cars move between shipping
          stops while the page is open, so all of it is fetched rather than
          rendered into the server payload. */}
      <WalletSection openTopUp={topup === "1"} />

      <DashboardStats />

      <DashboardRecentBids />

      {/* Renders nothing when no car is in transit. */}
      <DashboardActiveOrders />
    </>
  );
}
