import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { SeoGuidePage } from "@/components/seo/guide-page";
import { getGesteGuides } from "@/lib/seo/gestes-loader";
import { guideBySlug, guideList, type SeoGuide } from "@/lib/seo/guides";
import { publicMetadata } from "@/lib/seo/site";

/**
 * Route unique de tous les guides SEO. Ils vivent à la racine (`/mon-slug`) pour
 * préserver l'historique d'indexation : ce segment dynamique remplace les dix
 * `page.tsx` autrefois dupliqués, un par guide, sans changer une seule URL.
 *
 * Les slugs sont connus à la construction. `dynamicParams = false` fait donc
 * répondre 404 à tout chemin racine hors de cette liste, ce qui neutralise le
 * risque d'un segment dynamique racine « attrape-tout » : les routes statiques
 * voisines (`/tarifs`, `/demo`, `/guides`…) gardent la priorité, et un slug
 * inconnu ne rend jamais un guide vide.
 */
export const dynamicParams = false;

/**
 * Résout un slug vers sa page, qu'elle soit écrite à la main (`guides.ts`) ou
 * dérivée de `regles_metier` (`gestes.ts`). L'éditorial statique est consulté
 * en premier : il ne coûte aucune requête, et son slug prime en cas de
 * collision.
 */
async function resolvePage(slug: string): Promise<SeoGuide | undefined> {
  const guide = guideBySlug(slug);
  if (guide) return guide;
  const gestes = await getGesteGuides();
  return gestes.find((geste) => geste.slug === slug);
}

export async function generateStaticParams() {
  const gestes = await getGesteGuides();
  return [...guideList, ...gestes].map((page) => ({ slug: page.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const guide = await resolvePage(slug);
  if (!guide) return {};
  return publicMetadata({
    path: `/${guide.slug}`,
    title: guide.metaTitle,
    description: guide.description,
    type: "article",
  });
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const guide = await resolvePage(slug);
  if (!guide) notFound();
  return <SeoGuidePage guide={guide} />;
}
