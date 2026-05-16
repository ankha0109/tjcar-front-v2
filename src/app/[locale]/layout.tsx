import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { notFound } from "next/navigation";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import AntdProvider from "@/providers/AntdProvider";
import { auth } from "@/auth";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import MobileBottomNav from "@/components/layout/MobileBottomNav";
import { routing } from "@/i18n/routing";

const inter = Inter({ subsets: ["latin"] });

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
    return null;
  }
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  setRequestLocale(locale);

  const [session, messages] = await Promise.all([safeAuth(), getMessages()]);

  return (
    <html lang={locale}>
      <body className={`${inter.className} antialiased`}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <AntdRegistry>
            <AntdProvider session={session} locale={locale}>
              <div className="flex flex-col min-h-screen bg-white">
                <Header />
                <main className="flex-1 flex flex-col pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0">
                  {children}
                </main>
                <Footer />
                <MobileBottomNav />
              </div>
            </AntdProvider>
          </AntdRegistry>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
