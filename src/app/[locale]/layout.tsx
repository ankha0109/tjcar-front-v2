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
import { auth } from "@/auth";
import AppShell from "@/components/layout/AppShell";
import AiChatWidget from "@/components/ai-chat/AiChatWidget";
import ScrollState from "@/components/layout/ScrollState";
import ScrollToTop from "@/components/layout/ScrollToTop";
import { routing } from "@/i18n/routing";
import { THEME_COOKIE, type Theme } from "@/lib/theme";
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
  return {
    title: {
      default: t("title.default"),
      template: t("title.template"),
    },
    description: t("description"),
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

  const [session, messages, cookieStore] = await Promise.all([
    safeAuth(),
    getMessages(),
    cookies(),
  ]);

  const theme: Theme =
    cookieStore.get(THEME_COOKIE)?.value === "dark" ? "dark" : "light";
  return (
    <html lang={locale} data-theme={theme}>
      <body className={`${inter.className} antialiased`}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <ScrollToTopOnSamePage />
          <AntdRegistry>
            <AntdProvider session={session} locale={locale} theme={theme}>
              <AppShell theme={theme} mobileHeader={mobileHeader}>
                {children}
              </AppShell>
              <AiChatWidget />
              <ScrollState />
              <ScrollToTop />
            </AntdProvider>
          </AntdRegistry>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
