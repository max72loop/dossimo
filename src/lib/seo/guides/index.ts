/**
 * Point d'entrée des guides SEO éditoriaux. Le chemin d'import public reste
 * `@/lib/seo/guides` : le découpage en un fichier par guide (2026-09-07) n'a
 * changé aucun appelant, aucune URL et aucun octet de contenu.
 *
 * ⚠ L'ORDRE DES CLÉS CI-DESSOUS EST SIGNIFIANT. `guideList` est un
 * `Object.values(guides)` : cet ordre pilote l'affichage du hub `/guides`, la
 * suite du sitemap et `generateStaticParams`. Ajouter un guide, c'est l'insérer
 * à sa place voulue, pas forcément à la fin.
 */
export { GUIDE_CATEGORIES } from "./types";
export type { GuideCategory, SeoGuide } from "./types";

import type { GuideCategory, SeoGuide } from "./types";
import { GUIDE_CATEGORIES } from "./types";

import { demarchage2026 } from "./actualites/demarchage-telephonique-11-aout-2026";
import { franceRenov2026 } from "./actualites/bascule-france-renov-17-aout-2026";
import { dossierCee } from "./monter-le-dossier/constituer-dossier-cee-conforme";
import { cumulMprCee } from "./monter-le-dossier/cumul-maprimerenov-cee";
import { maprimerenov } from "./devis-conformite/devis-maprimerenov-conforme";
import { cee } from "./devis-conformite/devis-cee-conforme";
import { modeleCee } from "./devis-conformite/modele-devis-cee";
import { prixCee } from "./devis-conformite/prix-devis-cee";
import { mentions } from "./devis-conformite/mentions-obligatoires-devis-rge";
import { refus } from "./refus-prevention/eviter-refus-maprimerenov";
import { rai } from "./refus-prevention/offre-cee-avant-le-devis";
import { rge } from "./refus-prevention/qualification-rge-valide-geste";
import { deleguerCee } from "./deleguer/deleguer-montage-dossier-cee";
import { alternativeMandataire } from "./deleguer/alternative-mandataire-maprimerenov";
import { sousTraiterMpr } from "./deleguer/sous-traiter-dossier-maprimerenov";
import { tempsMontageCee } from "./deleguer/temps-montage-dossier-cee";
import { coutDossierRefuse } from "./deleguer/cout-dossier-refuse";
import { checklistAvantDepot } from "./deleguer/checklist-avant-depot";

export const guides = {
  demarchage2026,
  franceRenov2026,
  dossierCee,
  cumulMprCee,
  maprimerenov,
  cee,
  modeleCee,
  prixCee,
  mentions,
  refus,
  rai,
  rge,
  deleguerCee,
  alternativeMandataire,
  sousTraiterMpr,
  tempsMontageCee,
  coutDossierRefuse,
  checklistAvantDepot,
} satisfies Record<string, SeoGuide>;


/**
 * Guides listés au hub, dans le sitemap et pré-rendus par `app/[slug]`. Les
 * actualités datées en sont exclues : elles vivent désormais en sections
 * ancrées de la page pilier permanente `/actualites-maprimerenov-cee`, et leurs
 * anciennes URL redirigent en 301 vers cette page (`next.config.ts`). Les objets
 * restent dans `guides` ci-dessus pour que la page pilier réutilise leur contenu
 * sans le dupliquer.
 */
export const guideList = Object.values(guides).filter((guide) => guide.category !== "Actualités");

/**
 * Actualités réglementaires, dans l'ordre chronologique de leur échéance. Seule
 * source de contenu pour `/actualites-maprimerenov-cee` : ajouter une actualité
 * ici l'ajoute à la page pilier sans jamais créer de nouvelle URL datée.
 */
export const actualites: SeoGuide[] = [guides.demarchage2026, guides.franceRenov2026];

/**
 * Index slug → guide, construit une seule fois. Sert à la route dynamique
 * `app/[slug]` : elle reçoit un slug d'URL et doit retrouver le guide en O(1),
 * sans réénumérer `guideList` à chaque requête.
 */
const guidesBySlug = new Map(guideList.map((guide) => [guide.slug, guide] as const));

/** Retrouve un guide par son slug d'URL, ou `undefined` s'il n'existe pas. */
export function guideBySlug(slug: string): SeoGuide | undefined {
  return guidesBySlug.get(slug);
}

/**
 * Guides regroupés par famille, dans l'ordre de `GUIDE_CATEGORIES`. Les catégories
 * vides ne sont pas rendues : le hub grandit tout seul quand on ajoute un guide.
 *
 * `extra` accueille les pages qui ne vivent pas dans `guides` parce qu'elles sont
 * dérivées de la base (cf. `gestes.ts`). Si la base est injoignable, l'appelant
 * passe une liste vide et le hub se contente de l'éditorial : une catégorie sans
 * page disparaît au lieu de s'afficher vide.
 */
export function guidesByCategory(
  extra: SeoGuide[] = [],
): Array<{ category: GuideCategory; guides: SeoGuide[] }> {
  const pages = [...guideList, ...extra];
  return GUIDE_CATEGORIES.map((category) => ({
    category,
    guides: pages.filter((guide) => guide.category === category),
  })).filter((group) => group.guides.length > 0);
}

/** Date ISO d'un guide → « 14 juillet 2026 » pour l'affichage. */
export function formatGuideDate(iso: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(`${iso}T00:00:00Z`));
}
