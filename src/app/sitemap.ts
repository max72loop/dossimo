import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://dossimo.app";

/**
 * Pages PUBLIQUES uniquement. L'espace artisan (`/dossiers`, `/admin`) est derrière
 * authentification et n'a rien à faire dans un sitemap : `robots.ts` l'exclut aussi.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const maj = new Date();
  return [
    { url: SITE_URL, lastModified: maj, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/inscription`, lastModified: maj, priority: 0.8 },
    { url: `${SITE_URL}/connexion`, lastModified: maj, priority: 0.5 },
    { url: `${SITE_URL}/cgv`, lastModified: maj, priority: 0.3 },
    { url: `${SITE_URL}/mentions-legales`, lastModified: maj, priority: 0.3 },
    { url: `${SITE_URL}/confidentialite`, lastModified: maj, priority: 0.3 },
  ];
}
