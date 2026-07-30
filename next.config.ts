import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  output: "standalone",
  env: {
    CDN_URL: "https://storage.googleapis.com",
  },
  reactStrictMode: false,
  images: {
    // Next-ийн image optimizer-ийг бүрэн унтраав: /_next/image дамжуулалт,
    // srcset үүсгэлт байхгүй — зургууд эх URL-аараа шууд ачаална.
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  // Бэлэн машины хуудсыг /cars → /garage болгож нэрлэсэн. V1-ийн тархсан
  // /cars/{id} линкүүд ажилласаар байхын тулд түр хугацааны redirect. Эдгээр нь
  // `proxy.ts` middleware-ээс ӨМНӨ ажилладаг тул locale prefix-гүй хувилбарыг
  // next-intl дараа нь /mn/... болгож нормчилно.
  async redirects() {
    return [
      {
        source: "/:locale(mn|en|ru)/cars/:path*",
        destination: "/:locale/garage/:path*",
        permanent: false,
      },
      {
        source: "/cars/:path*",
        destination: "/garage/:path*",
        permanent: false,
      },
    ];
  },
  turbopack: {
    rules: {
      "*.svg": {
        loaders: [
          {
            loader: "@svgr/webpack",
            options: { dimensions: false },
          },
        ],
        as: "*.js",
      },
    },
  },
};

export default withNextIntl(nextConfig);
