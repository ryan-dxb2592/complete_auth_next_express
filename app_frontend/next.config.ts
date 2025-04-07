import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  headers: async () => [
    {
      source: "/:path*",
      headers: [
        {
          key: "Cross-Origin-Opener-Policy",
          value: "unsafe-none",
        },
        {
          key: "Cross-Origin-Embedder-Policy",
          value: "unsafe-none",
        },
      ],
    },
  ],
};

export default nextConfig;
