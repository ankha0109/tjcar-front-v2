import { redirect } from "@/i18n/navigation";

/**
 * The tracked-cars page was replaced by the public `/wishlist` page (no login
 * required). Keep this route as a locale-aware redirect so old links and the
 * dashboard nav still land somewhere sensible.
 */
export default async function TrackingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect({ href: "/wishlist", locale });
}
