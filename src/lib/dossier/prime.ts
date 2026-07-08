import type { DossierComplet } from "@/lib/dossier/get-dossier";

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
    base: `${taux} €/m² × ${surface} m²${plafonne ? ` (plafonné à ${prime.plafond} €)` : ""}`,
    dispositif,
  };
}
