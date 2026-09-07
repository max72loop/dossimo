import { guides, type SeoGuide } from "@/lib/seo/guides";

/**
 * Sens motif → guide du maillage croisé : pour chaque motif publié, le guide
 * qui apprend à l'éviter sur le prochain dossier. Complète les deux sens déjà
 * en place (aller par `voirAussi` des guides, retour par catégorie via
 * `guides-prevention.tsx`, cf. docs/cluster-refus.md § 3.5) : sans lui, une
 * page motif ne transmettait d'autorité qu'aux autres motifs.
 *
 * C'est un choix éditorial de maillage, pas une règle métier : il vit donc en
 * code, comme les `voirAussi`, et non dans `refus_motifs`. Les valeurs
 * référencent l'objet `guides` directement : un slug de guide qui disparaît
 * casse à la compilation, pas en production.
 *
 * Un motif absent de cette table (un futur motif du lot 2, par exemple) rend
 * sa page sans le bloc : l'oubli se voit, il ne casse rien.
 */
const GUIDE_PAR_MOTIF: Readonly<Record<string, SeoGuide>> = {
  "offre-cee-posterieure-au-devis": guides.rai,
  "delai-sept-jours-francs-isolation": guides.rai,
  "travaux-demarres-avant-engagement": guides.refus,
  "devis-et-facture-divergents": guides.refus,
  "mention-obligatoire-absente": guides.mentions,
  "qualification-rge-invalide-a-la-date": guides.rge,
  "rge-hors-domaine-ou-sous-traitance": guides.rge,
  "resistance-thermique-insuffisante": guides.cee,
  "performance-equipement-sous-le-seuil": guides.maprimerenov,
  "non-cumul-cee-entre-gestes": guides.cumulMprCee,
  "visite-prealable-absente-ou-non-datee": guides.dossierCee,
};

/** Le guide de prévention associé à un motif, ou `undefined` s'il n'en a pas. */
export function guidePreventionDuMotif(slugMotif: string): SeoGuide | undefined {
  return GUIDE_PAR_MOTIF[slugMotif];
}
