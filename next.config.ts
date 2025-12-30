import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 禁用 Turbopack，使用 Webpack
  experimental: {
    webpackBuildWorker: true,
  },
};

export default nextConfig;
