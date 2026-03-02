import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import AntdProvider from "@/providers/AntdProvider";
import { auth } from "@/auth";
import Header from "@/components/layout/Header";

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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  return (
    <html lang="en">
      <body
        className={`${inter.className} antialiased`}
        // suppressHydrationWarning
      >
        <AntdRegistry>
          <AntdProvider session={session}>
            <div className="flex flex-col h-screen bg-white">
              <Header />
              <main className="flex-1 overflow-hidden">{children}</main>
            </div>
          </AntdProvider>
        </AntdRegistry>
      </body>
    </html>
  );
}
