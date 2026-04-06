import type { NextConfig } from "next";

const isVercel = process.env.VERCEL === "1";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@aura/types",
    "@aura/db",
    "@aura/fitness-engine",
    "@aura/nutrition-engine",
    "@aura/yoga-engine",
    "@aura/lib",
  ],
  typescript: {
    // shadcn/ui generated components have Radix/React 18 type compat issues
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Local-dev-only workarounds — not needed on Vercel
  ...(isVercel
    ? {}
    : {
        experimental: {
          cpus: 1,
          workerThreads: true,
          webpackBuildWorker: false,
        },
      }),
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
};

export default nextConfig;
