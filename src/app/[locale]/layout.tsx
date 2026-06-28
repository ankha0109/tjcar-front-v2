import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import AntdProvider from "@/providers/AntdProvider";
import { auth } from "@/auth";
import DesktopShell from "@/components/layout/desktop/DesktopShell";
import MobileShell from "@/components/layout/mobile/MobileShell";
import AiChatWidget from "@/components/ai-chat/AiChatWidget";
import { routing } from "@/i18n/routing";
import { THEME_COOKIE, type Theme } from "@/lib/theme";
import { getDevice } from "@/lib/device";

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

  const [session, messages, cookieStore, device] = await Promise.all([
    safeAuth(),
    getMessages(),
    cookies(),
    getDevice(),
  ]);

  const theme: Theme =
    cookieStore.get(THEME_COOKIE)?.value === "dark" ? "dark" : "light";

  return (
    <html lang={locale} data-theme={theme}>
      <body className={`${inter.className} antialiased`}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <AntdRegistry>
            <AntdProvider session={session} locale={locale} theme={theme}>
              {device === "mobile" ? (
                <MobileShell header={mobileHeader}>{children}</MobileShell>
              ) : (
                <DesktopShell theme={theme}>{children}</DesktopShell>
              )}
              <AiChatWidget />
            </AntdProvider>
          </AntdRegistry>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
