import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  output: "standalone",
  experimental: {
    // TEMPORARY trial of the new App Router scroll handler on a real device.
    // Desktop measurement on 16.2.6 says it does NOT fix the sticky-header
    // offset leak (same `topOfElementInViewport` bail-out as the old handler) —
    // if the phone agrees, drop this and re-enable <ScrollToTop /> in the
    // locale layout.
    appNewScrollHandler: true,
  },
  env: {
    CDN_URL: "https://storage.googleapis.com",
  },
  reactStrictMode: false,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
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
