import type { Famille } from "@/lib/dossier/cee-isolation";

/** Normalise pour comparaison : minuscules, accents retirés. */
function norm(s: string): string {
  return s
    .normalize("NFD")
    .replace(/\p{Mn}/gu, "") // retire les accents décomposés (marques non espaçantes)
    .toLowerCase();
}

/**
 * Mots-clés du `domaine` RGE (valeurs réelles de l'annuaire ADEME) acceptés pour
 * chaque famille de geste. Le match est volontairement large : le contrôle vise
 * « une qualif du bon type existe », pas l'exactitude bureaucratique du libellé,
 * pour ne pas rejeter à tort une qualif nommée autrement.
 *
 * On évite les libellés d'ÉTUDE (« Etude bois énergie », « Etude enveloppe… »)
 * qui ne sont pas des qualifications de travaux.
 */
const MOTS_CLES: Record<Famille, string[]> = {
  isolation: ["isolation"],
  pac_air_eau: ["pompe a chaleur"],
  cet: ["chauffe-eau thermodynamique", "thermodynamique"],
  bois: ["chaudiere bois", "poele ou insert bois", "poele", "insert bois"],
  // Le domaine ADEME est « Chauffage et/ou eau chaude solaire » (QualiSol,
  // Qualibat 5131/5132/5143/5241). PAS de « solaire » nu : le domaine du
  // photovoltaïque s'appelle « Électricité solaire (photovoltaïque) », et un
  // artisan qualifié pour poser des panneaux électriques passerait alors le
  // contrôle sur un dossier de chauffe-eau solaire — qu'il n'a pas le droit
  // d'installer, ce qui vaut refus au contrôle CEE.
  solaire_thermique: ["eau chaude solaire", "chauffe-eau solaire", "qualisol"],
};

/** Le domaine RGE correspond-il à la famille de geste du dossier ? */
export function domaineCouvreGeste(domaine: string, famille: Famille): boolean {
  const d = norm(domaine);
  return MOTS_CLES[famille].some((k) => d.includes(norm(k)));
}

/** Libellé lisible du domaine attendu, pour les messages de contrôle. */
export const DOMAINE_ATTENDU_LABEL: Record<Famille, string> = {
  isolation: "isolation",
  pac_air_eau: "pompe à chaleur",
  cet: "chauffe-eau thermodynamique",
  bois: "chauffage au bois",
  solaire_thermique: "chauffage et/ou eau chaude solaire",
};
