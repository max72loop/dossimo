import "server-only";

import { unstable_cache } from "next/cache";

import {
  PROFILS_PUBLICS,
  type EstimationInput,
  type LigneEstimation,
  type ProfilPublic,
  type ResultatEstimation,
} from "@/lib/landing/estimation-refs";
import { fetchRegleActive } from "@/lib/rules/regles-metier";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Estimation PUBLIQUE du montant d'aide, pour la vitrine.
 *
 * Pourquoi cette surface existe : la landing affichait 49 / 149 / 249 € sans
 * jamais dire à quoi ces prix se comparent. Tant que l'artisan n'a pas en tête
 * la prime en jeu, le tarif est un coût sec ; une fois qu'il lit « 1 235 € de
 * prime, dossier à 49 € », l'objection tombe d'elle-même.
 *
 * Trois choix de conception, tous dictés par « ne jamais inventer un chiffre »
 * (DESIGN.md §6, AGENTS.md) :
 *
 * 1. **Le barème vient de `regles_metier`**, comme pour un vrai dossier. Aucun
 *    montant n'est écrit ici : la vitrine et le moteur lisent la même table, ils
 *    ne peuvent donc pas diverger (CLAUDE.md §8).
 * 2. **Lecture server-only via le client service-role.** `regles_metier` n'est
 *    pas exposée à `anon` (seule `pricing_tiers` l'est, migration 0015) et on
 *    n'ouvre pas une table de règles au public pour alimenter une brochure.
 *    Seuls des montants agrégés sortent d'ici.
 * 3. **Un couple sans barème ne produit pas d'estimation** mais un `null`, que
 *    l'appelant doit afficher comme tel. Plusieurs couples ne sont réellement
 *    pas seedés (murs en MPR, plancher bas en MPR, solaire en CEE) : mieux vaut
 *    « non estimable » qu'un montant faux.
 */

/** Forme du fragment `condition_json.prime` telle que la lit `appliquer`. */
type Bareme = {
  par_m2?: Record<string, number | undefined>;
  forfait?: Record<string, number | undefined>;
  plafond?: number | null;
};

/**
 * Barème d'un couple (dispositif, geste), mis en cache.
 *
 * Le simulateur est public et non authentifié : sans cache, chaque soumission
 * déclencherait une lecture service-role, et une page rechargée en boucle
 * deviendrait un robinet ouvert sur la base. Le barème ne bouge qu'à l'édition
 * d'une règle dans l'admin, une heure de fraîcheur est donc large.
 * `fetchRegleActive` reste la seule voie de lecture : aucune requête recopiée.
 */
const baremeCache = unstable_cache(
  async (dispositif: "cee" | "maprimerenov", geste: string): Promise<Bareme | null> => {
    const regle = await fetchRegleActive(createAdminClient(), dispositif, geste);
    // Seul le fragment utile traverse : rien d'autre de la règle n'a de raison
    // d'atteindre la vitrine.
    return (regle?.condition?.prime as Bareme | undefined) ?? null;
  },
  ["landing-bareme-prime"],
  { revalidate: 3600, tags: ["regles-metier"] },
);

/**
 * Applique un barème à un profil interne.
 *
 * Renvoie `null` dès qu'une donnée manque — surface absente, profil absent du
 * barème, aucun mode de calcul. Aucun repli codé en dur : c'est le point où un
 * `?? 0` bien intentionné transformerait « je ne sais pas » en « zéro euro ».
 */
function appliquer(
  prime: Bareme | undefined,
  profilInterne: string,
  surface: number | undefined,
): { montant: number; base: string } | null {
  if (!prime) return null;

  if (prime.forfait) {
    const f = prime.forfait[profilInterne];
    if (f == null) return null;
    return { montant: Math.round(f), base: "forfait selon le profil de revenus" };
  }

  const taux = prime.par_m2?.[profilInterne];
  if (taux == null || surface == null) return null;

  let montant = taux * surface;
  const plafonne = prime.plafond != null && montant > prime.plafond;
  if (plafonne && prime.plafond != null) montant = prime.plafond;

  return {
    montant: Math.round(montant),
    base: `${taux} €/m² × ${surface} m²${plafonne ? " (plafonné)" : ""}`,
  };
}

/**
 * Cœur de l'estimation, PUR et testable : deux barèmes déjà lus + un profil,
 * en entrée ; les lignes affichables, en sortie.
 *
 * Séparé de la lecture en base pour que les règles qui comptent — l'exclusion
 * du profil rose en MaPrimeRénov', le « non estimable » qui ne devient jamais
 * zéro — soient vérifiables sans base ni cache Next.
 */
export function composerEstimation(
  primeCee: Bareme | null,
  primeMpr: Bareme | null,
  profilPublic: ProfilPublic,
  surface: number | undefined,
): ResultatEstimation {
  const profil = PROFILS_PUBLICS[profilPublic];
  const cee = appliquer(primeCee ?? undefined, profil.interne, surface);

  // Le profil rose ne reçoit AUCUN montant MaPrimeRénov', même si le barème en
  // porte un pour `classique` : ce montant est celui du violet, et l'afficher
  // au rose reviendrait à annoncer une prime à un ménage non éligible.
  const mpr = profil.mprEligible
    ? appliquer(primeMpr ?? undefined, profil.interne, surface)
    : null;

  const lignes: LigneEstimation[] = [
    {
      dispositif: "cee",
      montant: cee?.montant ?? null,
      base: cee?.base ?? "Ce geste n'a pas de barème forfaitaire en CEE.",
    },
    {
      dispositif: "maprimerenov",
      montant: mpr?.montant ?? null,
      base: mpr
        ? mpr.base
        : profil.mprEligible
          ? "Ce geste n'ouvre pas droit à MaPrimeRénov' seul."
          : "Les revenus supérieurs n'ouvrent pas droit à MaPrimeRénov' sur un geste isolé.",
    },
  ];

  const connus = lignes.map((l) => l.montant).filter((m): m is number => m != null);

  return { lignes, total: connus.length > 0 ? connus.reduce((a, b) => a + b, 0) : null };
}

/**
 * Estime l'aide CEE et MaPrimeRénov' pour un geste et un profil.
 *
 * Les deux dispositifs sont interrogés séparément : ils ont leurs propres
 * barèmes, et l'un peut être estimable quand l'autre ne l'est pas.
 */
export async function estimerAidePublique(
  input: EstimationInput,
): Promise<ResultatEstimation> {
  const [primeCee, primeMpr] = await Promise.all([
    baremeCache("cee", input.geste),
    baremeCache("maprimerenov", input.geste),
  ]);

  return composerEstimation(primeCee, primeMpr, input.profil, input.surface);
}
