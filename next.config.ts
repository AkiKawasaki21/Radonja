import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [384, 640, 750, 828, 1080, 1200, 1600, 1920],
    qualities: [65, 75],
  },
  poweredByHeader: false,
  devIndicators: false,
};

export default nextConfig;
