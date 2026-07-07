import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Pin the workspace root to this project. A stray lockfile exists in the
  // Windows home directory, which otherwise makes Turbopack infer the wrong root.
  turbopack: {
    root: path.resolve(__dirname),
  },
  // @react-pdf/renderer s'appuie sur des modules Node : le garder hors du bundle
  // serveur évite les erreurs de packaging.
  serverExternalPackages: ["@react-pdf/renderer"],
};

export default nextConfig;
