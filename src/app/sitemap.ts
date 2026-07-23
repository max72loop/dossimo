import type { MetadataRoute } from "next";
import { getGesteGuides } from "@/lib/seo/gestes-loader";
import { guideList } from "@/lib/seo/guides";
import { SITE_URL } from "@/lib/seo/site";

const LAST_SIGNIFICANT_UPDATE = new Date("2026-07-14T00:00:00.000Z");

/**
 * Pages PUBLIQUES uniquement. L'espace artisan (`/dossiers`, `/admin`) est derrière
 * authentification et n'a rien à faire dans un sitemap : `robots.ts` l'exclut aussi.
 *
 * Les pages « par geste » sont dérivées de `regles_metier` : si la base est
 * injoignable, `getGesteGuides()` renvoie une liste vide et le sitemap reste
 * valide avec les seules pages éditoriales.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const gestes = await getGesteGuides();

  return [
    { url: SITE_URL, lastModified: LAST_SIGNIFICANT_UPDATE },
    { url: `${SITE_URL}/demo`, lastModified: LAST_SIGNIFICANT_UPDATE },
    { url: `${SITE_URL}/exemple`, lastModified: LAST_SIGNIFICANT_UPDATE },
    { url: `${SITE_URL}/tarifs`, lastModified: new Date("2026-07-22T00:00:00.000Z") },
    { url: `${SITE_URL}/guides`, lastModified: LAST_SIGNIFICANT_UPDATE },
    ...[...guideList, ...gestes].map((page) => ({
      url: `${SITE_URL}/${page.slug}`,
      lastModified: new Date(`${page.updated}T00:00:00.000Z`),
    })),
    { url: `${SITE_URL}/cgv`, lastModified: LAST_SIGNIFICANT_UPDATE },
    { url: `${SITE_URL}/mentions-legales`, lastModified: LAST_SIGNIFICANT_UPDATE },
    { url: `${SITE_URL}/confidentialite`, lastModified: LAST_SIGNIFICANT_UPDATE },
  ];
}
