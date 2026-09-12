/**
 * Gel SEO de six semaines (contrat : `seo/AGENTS.md`, état : `seo/hermes.md`).
 *
 * Le gabarit `guide-page.tsx` est partagé par tous les guides : une évolution
 * SEO du gabarit (maillage, bloc auteur, JSON-LD) toucherait donc aussi les
 * pages gelées, en pleine fenêtre de mesure. Ce module recopie les slugs gelés
 * pour que le gabarit puisse leur conserver leur rendu d'origine jusqu'à la
 * libération.
 *
 * Les guides sont rendus à la demande (route ƒ au build) : la date s'évalue à
 * chaque rendu, le gel se lève donc tout seul le 2026-10-02, sans
 * redéploiement. Ce fichier peut alors être supprimé avec ses points d'appel
 * (grep `estGeleSeo`).
 */

const FIN_DU_GEL = "2026-10-02";

/** Miroir du tableau « Gel SEO en cours » de `seo/hermes.md` (gelées le 21/08). */
const SLUGS_GELES = new Set([
  "deleguer-montage-dossier-cee",
  "alternative-mandataire-maprimerenov",
  "sous-traiter-dossier-maprimerenov",
  "temps-montage-dossier-cee",
  "cout-dossier-refuse",
  "checklist-avant-depot",
]);

/** Vrai si la page de ce slug ne doit recevoir aucune retouche SEO. */
export function estGeleSeo(slug: string, maintenant: Date = new Date()): boolean {
  return maintenant < new Date(`${FIN_DU_GEL}T00:00:00Z`) && SLUGS_GELES.has(slug);
}
