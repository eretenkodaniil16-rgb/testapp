import type { NextConfig } from "next";

const staticPreview = process.env.TESTAPP_STATIC_EXPORT === "1";
const basePath = staticPreview ? (process.env.NEXT_PUBLIC_BASE_PATH ?? "") : "";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  ...(staticPreview
    ? {
        output: "export" as const,
        trailingSlash: true,
        basePath,
        assetPrefix: basePath,
      }
    : {}),
};

export default nextConfig;
