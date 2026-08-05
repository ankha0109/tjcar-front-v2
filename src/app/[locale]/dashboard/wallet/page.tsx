import { redirect } from "@/i18n/navigation";

/**
 * The wallet lives on the dashboard itself now (balance card + top-up drawer).
 * This route stays as a redirect because the URL is already out in the wild —
 * the Premium modal, the bid gate and anything a customer bookmarked point at
 * it — and `?topup=1` puts them exactly where the old page did.
 */
export default async function WalletRedirect({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect({ href: "/dashboard?topup=1", locale });
}
