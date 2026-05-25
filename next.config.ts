import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  env: {
    CDN_URL: "https://storage.googleapis.com",
  },
  reactStrictMode: false,
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
