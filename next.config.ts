import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    CDN_URL: "https://storage.googleapis.com",
  },
  reactStrictMode: false,
  turbopack: {
    rules: {
      "*.svg": {
        loaders: ["@svgr/webpack"],
        as: "*.js",
      },
    },
  },
};

export default nextConfig;
