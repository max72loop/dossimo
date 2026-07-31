import type { MetadataRoute } from "next";
import { getGesteGuides } from "@/lib/seo/gestes-loader";
import { guideList } from "@/lib/seo/guides";
import { getMotifsPublies } from "@/lib/refus/motifs-loader";
import { HUB, PAGES_CIBLEES } from "@/lib/refus/pages";
import { SITE_URL } from "@/lib/seo/site";

const LAST_SIGNIFICANT_UPDATE = new Date("2026-07-14T00:00:00.000Z");

/**
 * Pages PUBLIQUES uniquement. L'espace artisan (`/dossiers`, `/admin`) est derrière
 * authentification et n'a rien à faire dans un sitemap : `robots.ts` l'exclut aussi.
 *
 * Les pages « par geste » sont dérivées de `regles_metier` : si la base est
 * injoignable, `getGesteGuides()` renvoie une liste vide et le sitemap reste
 * valide avec les seules pages éditoriales. Les pages motif du cluster « refus »
 * suivent la même règle, et seuls les motifs `publie = true` en sortent.
 *
 * `/refus/merci` n'y figure pas, volontairement : elle est en `noindex` et n'a de
 * sens qu'après une soumission.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [gestes, motifs] = await Promise.all([getGesteGuides(), getMotifsPublies()]);

  return [
    { url: SITE_URL, lastModified: LAST_SIGNIFICANT_UPDATE },
    { url: `${SITE_URL}/demo`, lastModified: LAST_SIGNIFICANT_UPDATE },
    { url: `${SITE_URL}/visite`, lastModified: new Date("2026-07-29T00:00:00.000Z") },
    { url: `${SITE_URL}/exemple`, lastModified: LAST_SIGNIFICANT_UPDATE },
    { url: `${SITE_URL}/tarifs`, lastModified: new Date("2026-07-22T00:00:00.000Z") },
    { url: `${SITE_URL}/guides`, lastModified: new Date("2026-07-28T00:00:00.000Z") },
    { url: `${SITE_URL}/a-propos`, lastModified: new Date("2026-07-27T00:00:00.000Z") },
    { url: `${SITE_URL}/methode-editoriale`, lastModified: new Date("2026-07-27T00:00:00.000Z") },
    ...[...guideList, ...gestes].map((page) => ({
      url: `${SITE_URL}/${page.slug}`,
      lastModified: new Date(`${page.updated}T00:00:00.000Z`),
    })),
    { url: `${SITE_URL}${HUB.path}`, lastModified: new Date(`${HUB.updated}T00:00:00.000Z`) },
    {
      url: `${SITE_URL}/refus/particulier`,
      lastModified: new Date(`${HUB.updated}T00:00:00.000Z`),
    },
    ...PAGES_CIBLEES.map((page) => ({
      url: `${SITE_URL}${page.path}`,
      lastModified: new Date(`${page.updated}T00:00:00.000Z`),
    })),
    ...motifs.map((motif) => ({
      url: `${SITE_URL}/refus/motifs/${motif.slug}`,
      lastModified: new Date(`${motif.updated}T00:00:00.000Z`),
    })),
    { url: `${SITE_URL}/cgv`, lastModified: LAST_SIGNIFICANT_UPDATE },
    { url: `${SITE_URL}/mentions-legales`, lastModified: LAST_SIGNIFICANT_UPDATE },
    { url: `${SITE_URL}/confidentialite`, lastModified: LAST_SIGNIFICANT_UPDATE },
  ];
}
