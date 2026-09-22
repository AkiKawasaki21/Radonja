import type { NextConfig } from "next";

// GitHub Pages serves static files from /<repo>, so that build exports plain HTML
// under a base path. Local dev and `next start` keep the default server build.
const isPagesBuild = process.env.GITHUB_PAGES === "true";
const pagesBasePath = process.env.PAGES_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  ...(isPagesBuild && {
    output: "export",
    basePath: pagesBasePath,
    trailingSlash: true,
  }),
  images: {
    // The static export has no image optimizer, so Pages serves the source files.
    unoptimized: isPagesBuild,
    formats: ["image/avif", "image/webp"],
    deviceSizes: [384, 640, 750, 828, 1080, 1200, 1600, 1920],
    qualities: [50, 65, 75],
  },
  poweredByHeader: false,
  devIndicators: false,
};

export default nextConfig;
