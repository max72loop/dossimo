import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Les Server Actions reçoivent des justificatifs jusqu'à 15 Mo. La limite reste
  // volontairement proche de ce maximum afin de contenir l'impact d'une requête
  // abusive tout en laissant la marge du multipart.
  experimental: {
    serverActions: {
      bodySizeLimit: "16mb",
    },
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: "default-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; object-src 'none'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self' https://*.supabase.co https://api.stripe.com; font-src 'self' data:" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
        ],
      },
    ];
  },
  // Pin the workspace root to this project. A stray lockfile exists in the
  // Windows home directory, which otherwise makes Turbopack infer the wrong root.
  turbopack: {
    root: path.resolve(__dirname),
  },
  // @react-pdf/renderer s'appuie sur des modules Node : le garder hors du bundle
  // serveur évite les erreurs de packaging.
  serverExternalPackages: ["@react-pdf/renderer"],
  // La route Cerfa lit le PDF officiel dans public/cerfa via fs (chemin calculé,
  // non tracé automatiquement) : on l'inclut explicitement pour le serverless.
  outputFileTracingIncludes: {
    "/dossiers/[id]/cerfa.pdf": ["./public/cerfa/**"],
  },
};

export default nextConfig;
