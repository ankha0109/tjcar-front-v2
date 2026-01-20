import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    API_URL: "https://api.example.mn",
    CDN_URL: "https://storage.googleapis.com",
  },
  reactStrictMode: false,
};

export default nextConfig;
