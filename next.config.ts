import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ERP pages read live DB data on every request; use traditional dynamic
  // rendering rather than the new component cache.
  cacheComponents: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
