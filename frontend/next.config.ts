import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [],
  trailingSlash: false,

  images: {
    unoptimized: true,
  },
};

export default nextConfig;