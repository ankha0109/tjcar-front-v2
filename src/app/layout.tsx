import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import AntdProvider from "@/providers/AntdProvider";
import { auth } from "@/auth";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import MobileBottomNav from "@/components/layout/MobileBottomNav";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "Эхлэл",
    template: "%s | Next Starter",
  },
  description: "Next Starter - Human Resources Management System",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  // Also supported by less commonly used
  // interactiveWidget: 'resizes-visual',
};

async function safeAuth() {
  try {
    return await auth();
  } catch {
    // JWT decryption failed (stale cookie / rotated secret). Render as guest;
    // middleware uses getToken() which silently returns null on bad JWTs and
    // already routes protected paths through /auth/login.
    return null;
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await safeAuth();

  return (
    <html lang="en">
      <body
        className={`${inter.className} antialiased`}
        // suppressHydrationWarning
      >
        <AntdRegistry>
          <AntdProvider session={session}>
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
      </body>
    </html>
  );
}
