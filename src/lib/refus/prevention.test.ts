import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { guidePreventionDuMotif } from "./prevention";

/*
 * Les slugs de motifs vivent dans `refus_motifs`, seedée par la migration 0054.
 * Le test lit la migration plutôt que de recopier les slugs : une clé de la
 * table qui ne correspond à aucun motif seedé (faute de frappe, motif retiré)
 * échoue ici au lieu de produire un bloc mort en silence.
 */
const SEED = readFileSync(
  join(__dirname, "../../../supabase/migrations/0054_seed_refus_motifs.sql"),
  "utf8",
);

const SLUGS_MOTIFS = [
  "offre-cee-posterieure-au-devis",
  "delai-sept-jours-francs-isolation",
  "travaux-demarres-avant-engagement",
  "devis-et-facture-divergents",
  "mention-obligatoire-absente",
  "qualification-rge-invalide-a-la-date",
  "rge-hors-domaine-ou-sous-traitance",
  "resistance-thermique-insuffisante",
  "performance-equipement-sous-le-seuil",
  "non-cumul-cee-entre-gestes",
  "visite-prealable-absente-ou-non-datee",
] as const;

describe("guidePreventionDuMotif", () => {
  it("couvre chaque motif du seed avec un guide résolu", () => {
    for (const slug of SLUGS_MOTIFS) {
      expect(SEED, `motif absent du seed : ${slug}`).toContain(`'${slug}'`);
      const guide = guidePreventionDuMotif(slug);
      expect(guide, `motif sans guide de prévention : ${slug}`).toBeDefined();
      expect(guide?.slug).toBeTruthy();
      expect(guide?.title).toBeTruthy();
    }
  });

  it("rend undefined pour un motif inconnu, sans jeter", () => {
    expect(guidePreventionDuMotif("motif-du-lot-2-pas-encore-mappe")).toBeUndefined();
  });
});
