import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";

/**
 * Turns every unmatched URL under a locale into a route, so that it renders
 * inside `[locale]/layout.tsx` and hits `[locale]/not-found.tsx`.
 *
 * Without this the page would never appear: Next sends a URL that matches no
 * route to the root-level `/_not-found` entry, which never enters the `[locale]`
 * segment, so a `not-found.tsx` in there would only ever cover explicit
 * `notFound()` calls from pages that *did* match.
 *
 * Must stay `[...rest]`, never `[[...rest]]` — an optional catch-all also
 * matches zero segments, which Next reads as the same specificity as
 * `/[locale]/dashboard` and refuses to build.
 */

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({
    locale: hasLocale(routing.locales, locale) ? locale : routing.defaultLocale,
    namespace: "notFound",
  });
  return { title: t("title") };
}

export default async function CatchAllNotFound({ params }: Props) {
  const { locale } = await params;
  // The not-found boundary renders without route params of its own, so pin the
  // locale here — otherwise its `getTranslations()` falls back to `mn` and an
  // English or Russian visitor gets a Mongolian 404.
  if (hasLocale(routing.locales, locale)) setRequestLocale(locale);

  notFound();
}
