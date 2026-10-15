import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Build the whole site into plain HTML files (the "out" folder) so GitHub Pages can host it for free.
  // The database is read while building; nothing needs a server afterwards.
  output: "export",
  // The site lives at https://ethankaufman.github.io/ManUtd-Site/, so every link needs that prefix.
  basePath: process.env.NEXT_PUBLIC_BASE_PATH ?? "",
  images: { unoptimized: true },
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
