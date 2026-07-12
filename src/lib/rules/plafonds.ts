import type { PlafondRessources } from "@/lib/database.types";

/**
 * Barème des plafonds de ressources : ce qui permet de dire si le revenu fiscal de
 * référence lu sur l'avis correspond à la catégorie de revenus déclarée au dossier.
 *
 * Les plafonds sont révisés chaque année par arrêté. Ils vivent donc en base
 * (`plafonds_ressources`, migration 0017), éditable et versionnée — les coder en dur
 * reviendrait à fabriquer, dès la première révision, le refus qu'on prétend éviter
 * (CLAUDE.md §8).
 *
 * Ce module est PUR : il reçoit les lignes du barème, il ne les charge pas. C'est ce
 * qui le rend testable sans base.
 */

export type Zone = "idf" | "hors_idf";
export type CategorieRevenus = "grande_precarite" | "precaire" | "classique";

/** Départements d'Île-de-France : les plafonds y sont plus élevés. */
const DEPARTEMENTS_IDF = new Set([
  "75",
  "77",
  "78",
  "91",
  "92",
  "93",
  "94",
  "95",
]);

export function zoneDeCodePostal(codePostal: string): Zone {
  return DEPARTEMENTS_IDF.has(codePostal.trim().slice(0, 2)) ? "idf" : "hors_idf";
}

export interface Plafond {
  grande_precarite: number;
  precaire: number;
}

/**
 * Plafonds applicables à un foyer de `personnes` personnes.
 *
 * Le barème est tabulé de 1 à 5 personnes ; au-delà, il s'étend par un incrément par
 * personne supplémentaire, porté par la ligne `personnes = 0`. Renvoie null si le
 * barème ne couvre pas la zone (barème absent ou incomplet) : mieux vaut ne pas
 * conclure que conclure sur un plafond inventé.
 */
export function plafondPour(
  lignes: readonly PlafondRessources[],
  zone: Zone,
  personnes: number,
): Plafond | null {
  if (personnes < 1) return null;
  const zoneLignes = lignes.filter((l) => l.zone === zone);
  if (zoneLignes.length === 0) return null;

  const exacte = zoneLignes.find((l) => l.personnes === personnes);
  if (exacte) {
    return {
      grande_precarite: exacte.plafond_grande_precarite,
      precaire: exacte.plafond_precaire,
    };
  }

  const base = zoneLignes.find((l) => l.personnes === 5);
  const increment = zoneLignes.find((l) => l.personnes === 0);
  if (!base || !increment || personnes <= 5) return null;

  const sup = personnes - 5;
  return {
    grande_precarite:
      base.plafond_grande_precarite + sup * increment.plafond_grande_precarite,
    precaire: base.plafond_precaire + sup * increment.plafond_precaire,
  };
}

/** Catégorie de revenus qu'impose un RFR, au regard du plafond applicable. */
export function categoriePour(rfr: number, plafond: Plafond): CategorieRevenus {
  if (rfr <= plafond.grande_precarite) return "grande_precarite";
  if (rfr <= plafond.precaire) return "precaire";
  return "classique";
}
