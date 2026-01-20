import type { Metadata } from "next";
import { Inter } from "next/font/google"; // Removed unused fonts if they were unused, or keep them. The viewing showed Geist imports but they were not used in the code shown (only Inter was used).
import "./globals.css";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import AntdProvider from "@/providers/AntdProvider";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>
        <AntdRegistry>
          <AntdProvider>
            <div className="flex min-h-screen flex-col">
              <Header />
              <main className="flex-1 w-full relative flex flex-col">
                {children}
              </main>
              <Footer />
            </div>
          </AntdProvider>
        </AntdRegistry>
      </body>
    </html>
  );
}
