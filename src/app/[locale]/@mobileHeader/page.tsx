import { setRequestLocale } from "next-intl/server";
import DefaultMobileHeader from "@/components/layout/mobile/DefaultMobileHeader";

type Props = {
  params: Promise<{ locale: string }>;
};

/**
 * The locale root (`/mn`). `[...rest]` needs at least one segment, so without
 * this file the home page is the one destination a soft navigation could still
 * reach with the previous route's header intact.
 */
export default async function MobileHeaderHome({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <DefaultMobileHeader />;
}
