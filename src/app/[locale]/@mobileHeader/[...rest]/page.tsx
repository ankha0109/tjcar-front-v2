import { setRequestLocale } from "next-intl/server";
import DefaultMobileHeader from "@/components/layout/mobile/DefaultMobileHeader";

type Props = {
  params: Promise<{ locale: string }>;
};

/**
 * Every path under the locale that does not own a slot file.
 *
 * A static or dynamic segment beats a catch-all, so `japan/[id]`, `korea/[id]`,
 * `garage/[id]` and the `dashboard/*` files still win for their own routes.
 * This exists so that leaving one of them by a client-side navigation lands on
 * a slot that *matches*, instead of on nothing — which Next would answer by
 * keeping the page you just left. Note it must be `[...rest]`, not
 * `[[...rest]]`: an optional catch-all also matches zero segments, which Next
 * rejects as having the same specificity as the routes it sits beside.
 */
export default async function MobileHeaderCatchAll({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <DefaultMobileHeader />;
}
