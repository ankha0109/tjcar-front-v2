import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import {
  getMessages,
  getTranslations,
  setRequestLocale,
} from "next-intl/server";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import AntdProvider from "@/providers/AntdProvider";
import RatesProvider from "@/providers/RatesProvider";
import { auth } from "@/auth";
import AppShell from "@/components/layout/AppShell";
import AiChatWidget from "@/components/ai-chat/AiChatWidget";
import GoogleAnalytics from "@/components/analytics/GoogleAnalytics";
import ScrollState from "@/components/layout/ScrollState";
import ScrollToTop from "@/components/layout/ScrollToTop";
import { routing } from "@/i18n/routing";
import { THEME_COOKIE, type Theme } from "@/lib/theme";
import { getDevice } from "@/lib/device";
import { OG_IMAGE, SITE_URL, ogSite } from "@/lib/site";
import { getConfig } from "@/services/config";
import ScrollToTopOnSamePage from "@/utils/useScrollToTop";

const inter = Inter({ subsets: ["latin", "cyrillic"] });

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata" });
  const title = {
    default: t("title.default"),
    template: t("title.template"),
  };
  const description = t("description");
  return {
    // Absolute base for every relative URL in this tree — without it the
    // relative `openGraph.images` on `/report` resolves against localhost.
    metadataBase: new URL(SITE_URL),
    title,
    description,
    // Inherited by every page that does not declare its own `openGraph`, so one
    // card covers the whole site. Deliberately no `title`/`description` here:
    // leaving them out lets Next fill `og:title` from each page's own resolved
    // title, template and all — set them and every subpage advertises the home
    // page's title instead. No `url` either: it would be the locale root on
    // every page, not the page itself.
    openGraph: {
      ...ogSite(locale),
      type: "website",
      images: [{ ...OG_IMAGE, alt: t("ogImageAlt") }],
    },
    twitter: { card: "summary_large_image" },
  };
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

async function safeAuth() {
  try {
    return await auth();
  } catch {
    // JWT decryption failed (stale cookie / rotated secret). Render as guest;
    // proxy middleware uses getToken() which silently returns null on bad JWTs
    // and already routes protected paths through /auth/login.
    return null;
  }
}

export default async function LocaleLayout({
  children,
  mobileHeader,
  params,
}: {
  children: React.ReactNode;
  mobileHeader: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  setRequestLocale(locale);

  const [session, messages, cookieStore, device, config] = await Promise.all([
    safeAuth(),
    getMessages(),
    cookies(),
    getDevice(),
    getConfig(),
  ]);

  const theme: Theme =
    cookieStore.get(THEME_COOKIE)?.value === "dark" ? "dark" : "light";

  return (
    <html
      lang={locale}
      data-theme={theme}
      // Single source of truth for the fixed header's height. Set here rather
      // than in CSS because the shell is picked from the device cookie, not a
      // media query — a `@media` rule would guess wrong for a phone in a wide
      // window and vice versa. `globals.css` carries the desktop value as a
      // fallback. Mobile is exactly `h-14`: that height sits on the bordered
      // element itself, so `border-box` folds the border into it. Desktop's
      // `h-16` is on an inner row, so the header's own border adds a pixel.
      style={
        {
          "--header-h": device === "mobile" ? "3.5rem" : "calc(4rem + 1px)",
        } as React.CSSProperties
      }
    >
      <body className={`${inter.className} antialiased`}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <ScrollToTopOnSamePage />
          <AntdRegistry>
            <AntdProvider session={session} locale={locale} theme={theme}>
              {/* The header, drawer and footer all print the rates, and they
                  sit in three different subtrees — hence a context rather than
                  props. `getConfig` is cached for an hour, so this costs the
                  page nothing on a warm cache. */}
              <RatesProvider
                rates={{ USD: config.USD, JPY: config.JPY, KRW: config.KRW }}
              >
                <AppShell theme={theme} mobileHeader={mobileHeader}>
                  {children}
                </AppShell>
              </RatesProvider>
              <AiChatWidget />
              <ScrollState />
              <ScrollToTop />
              <GoogleAnalytics />
            </AntdProvider>
          </AntdRegistry>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
