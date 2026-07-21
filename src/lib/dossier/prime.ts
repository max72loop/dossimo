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
 * Pourquoi `estimerPrime` renvoie null, quand c'est le cas. Sert à distinguer un
 * dossier RÉPARABLE par l'artisan (il manque la surface isolée) d'un blocage
 * STRUCTUREL (aucun barème pour ce profil, ex. MaPrimeRénov' pour un ménage
 * `superieur` — le rose de l'Anah, non éligible par geste —, ou couple
 * geste/dispositif sans barème). Les deux mènent au même geste (déblocage manuel),
 * mais pas au même message.
 *
 * Reflète exactement les branches `return null` d'`estimerPrime` : garder les
 * deux fonctions alignées si le barème évolue.
 */
export function raisonNonEstimable(
  data: DossierComplet,
): "surface" | "structurel" | null {
  const prime = data.regle?.condition?.prime;
  if (!prime) return "structurel";
  const precarite = data.caracteristiques.beneficiaire.precarite;

  if (prime.forfait) {
    return prime.forfait[precarite] == null ? "structurel" : null;
  }

  const parM2 = prime.par_m2;
  if (!parM2) return "structurel";
  if (parM2[precarite] == null) return "structurel"; // profil non représenté au barème
  // Barème au m² présent pour ce profil : seule la surface manque à la saisie.
  if (data.caracteristiques.travaux?.surface_isolee_m2 == null) return "surface";
  return null; // estimable
}
