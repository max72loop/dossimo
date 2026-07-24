import type { DossierComplet } from "@/lib/dossier/get-dossier";
import { formatEuros } from "@/lib/format/montant";

/**
 * Estimation INDICATIVE du montant de prime, à partir du barème porté par la
 * règle métier (`condition_json.prime`, éditable dans l'admin — §7/§9.4). Le
 * barème change souvent : il n'est jamais codé en dur. Renvoie null si aucun
 * barème n'est défini pour le couple.
 *
 * Modèle v1 : montant = (€/m² selon la catégorie de revenus) × surface isolée,
 * éventuellement plafonné.
 */
export interface EstimationPrime {
  montant: number;
  base: string;
  dispositif: string;
}

export function estimerPrime(data: DossierComplet): EstimationPrime | null {
  const prime = data.regle?.condition?.prime;
  if (!prime) return null;
  const precarite = data.caracteristiques.beneficiaire.precarite;
  const dispositif =
    data.dossier.dispositif === "maprimerenov" ? "MaPrimeRénov'" : "CEE";

  // Forfait (montant fixe, ex. pompe à chaleur).
  if (prime.forfait) {
    const f = prime.forfait[precarite];
    if (f == null) return null;
    return { montant: Math.round(f), base: "forfait selon le profil de revenus", dispositif };
  }

  // Montant au m² (isolation).
  const parM2 = prime.par_m2;
  const surface = data.caracteristiques.travaux?.surface_isolee_m2;
  if (!parM2 || surface == null) return null;
  const taux = parM2[precarite];
  if (taux == null) return null;
  let montant = taux * surface;
  const plafonne = prime.plafond != null && montant > prime.plafond;
  if (plafonne && prime.plafond != null) montant = prime.plafond;

  return {
    montant: Math.round(montant),
    base: `${taux} €/m² × ${surface} m²${plafonne ? ` (plafonné à ${formatEuros(prime.plafond)})` : ""}`,
    dispositif,
  };
}

/**
 * Pourquoi `estimerPrime` renvoie null, quand c'est le cas. TROIS causes, à ne
 * surtout pas confondre — c'est la distinction qui empêche de perdre une vente en
 * silence :
 *
 *  - `"surface"` — RÉPARABLE par l'artisan : le barème existe pour son profil, seule
 *    la surface isolée manque à la saisie.
 *  - `"non_eligible"` — ATTENDU, pas un défaut : le ménage n'ouvre pas droit au
 *    dispositif (le rose `superieur` n'est pas éligible à MaPrimeRénov' par geste en
 *    2026). L'absence de barème est VOULUE ; le contrôle avis bloque déjà par
 *    ailleurs. Aucun signal à lever.
 *  - `"bareme_manquant"` — la FUITE : une règle active existe mais ne porte aucun
 *    barème pour un profil pourtant éligible. Un dossier PAYABLE se retrouve bloqué
 *    au checkout, sans que personne ne le sache. À corriger en admin (compléter
 *    `condition_json.prime`), et à crier côté serveur (cf. `ouvrirPaiementDossier`).
 *
 * Avant, les deux derniers cas étaient fondus dans un même « structurel » : un rose
 * légitime et un trou de barème réel étaient indiscernables, donc un trou passait
 * inaperçu. Les séparer, c'est rendre la fuite bruyante.
 *
 * Reflète exactement les branches `return null` d'`estimerPrime` : garder les deux
 * fonctions alignées si le barème évolue.
 */
export type RaisonNonEstimable = "surface" | "non_eligible" | "bareme_manquant";

export function raisonNonEstimable(
  data: DossierComplet,
): RaisonNonEstimable | null {
  const prime = data.regle?.condition?.prime;
  const precarite = data.caracteristiques.beneficiaire.precarite;

  // Repli commun à toutes les branches null : une absence de barème est ATTENDUE
  // pour le rose en MaPrimeRénov' (non éligible par geste), un TROU partout ailleurs.
  // Le CEE porte une clé `superieur`, donc le cas rose-CEE ne remonte jamais ici.
  const attendu: RaisonNonEstimable =
    data.dossier.dispositif === "maprimerenov" && precarite === "superieur"
      ? "non_eligible"
      : "bareme_manquant";

  if (!prime) return attendu;

  if (prime.forfait) {
    return prime.forfait[precarite] == null ? attendu : null;
  }

  const parM2 = prime.par_m2;
  if (!parM2) return attendu;
  if (parM2[precarite] == null) return attendu; // profil non représenté au barème
  // Barème au m² présent pour ce profil : seule la surface manque à la saisie.
  if (data.caracteristiques.travaux?.surface_isolee_m2 == null) return "surface";
  return null; // estimable
}
