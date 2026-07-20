import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  async redirects() {
    return ["dossimo.pro", "www.dossimo.pro"].map((host) => ({
      source: "/:path*",
      has: [{ type: "host" as const, value: host }],
      destination: "https://dossimo.app/:path*",
      permanent: true,
    }));
  },
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
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
        ],
      },
      {
        // Le pack d'exemple est prévisualisé dans un `<object>` sur /exemple.
        // Le `X-Frame-Options: DENY` global bloque cet affichage, y compris en
        // même origine, sur les navigateurs qui traitent le PDF comme un
        // document embarqué. On desserre à SAMEORIGIN pour ce seul fichier :
        // il est public, fictif et sans donnée personnelle, donc rien à
        // protéger contre le clickjacking. Toutes les autres routes, dont les
        // PDF de dossiers réels, gardent DENY.
        source: "/exemple/pack.pdf",
        headers: [{ key: "X-Frame-Options", value: "SAMEORIGIN" }],
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
