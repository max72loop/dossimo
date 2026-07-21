import { z } from "zod";

import { FAMILLES, TYPES_ISOLATION } from "@/lib/dossier/cee-isolation";

/**
 * Référentiel PARTAGÉ du simulateur public : listes, schéma et types.
 *
 * Séparé de `estimation.ts` parce que ce dernier est `server-only` (il lit
 * `regles_metier` avec la clé service-role) et qu'un composant client ne peut
 * pas l'importer. Ce qui vit ici ne contient aucun secret et aucun montant :
 * que des libellés, une correspondance de profils et la validation de saisie.
 * Les barèmes, eux, ne quittent jamais le serveur.
 */

/**
 * Les QUATRE profils de revenus de l'Anah, exposés au public.
 *
 * Le modèle interne porte désormais les mêmes quatre bandes (`grande_precarite` /
 * `precaire` / `intermediaire` / `superieur`, voir `CategorieRevenus`) : `interne`
 * pointe donc directement la bande réelle, sans plus confondre le violet
 * (intermédiaire, éligible) et le rose (supérieur, non éligible aux gestes isolés).
 *
 * Le rose n'obtient jamais de montant MaPrimeRénov' (`mprEligible: false`) :
 * annoncer une prime à un ménage non éligible, ce serait fabriquer exactement le
 * motif de refus que Dossimo prétend éviter. Côté CEE, la distinction violet / rose
 * n'existe pas : le barème CEE porte la même valeur pour `intermediaire` et
 * `superieur` (migration 0046), donc le rose y est bien estimé.
 */
export const PROFILS_PUBLICS = {
  bleu: {
    label: "Très modeste",
    aide: "Profil « bleu » de l'Anah",
    interne: "grande_precarite",
    /** Éligible aux gestes isolés en MaPrimeRénov'. */
    mprEligible: true,
  },
  jaune: {
    label: "Modeste",
    aide: "Profil « jaune » de l'Anah",
    interne: "precaire",
    mprEligible: true,
  },
  violet: {
    label: "Intermédiaire",
    aide: "Profil « violet » de l'Anah",
    interne: "intermediaire",
    mprEligible: true,
  },
  rose: {
    label: "Supérieur",
    aide: "Profil « rose » de l'Anah",
    interne: "superieur",
    mprEligible: false,
  },
} as const;

export type ProfilPublic = keyof typeof PROFILS_PUBLICS;

export const PROFILS_ORDRE: ProfilPublic[] = ["bleu", "jaune", "violet", "rose"];

/**
 * Gestes proposés au simulateur, et si le montant dépend d'une surface.
 * `valeur` est la clé réelle de `regles_metier` : aucun alias, aucune traduction.
 */
export const GESTES_ESTIMABLES = [
  { valeur: "combles_perdus", label: TYPES_ISOLATION.combles_perdus.label, surface: true },
  { valeur: "rampants_toiture", label: TYPES_ISOLATION.rampants_toiture.label, surface: true },
  { valeur: "murs", label: TYPES_ISOLATION.murs.label, surface: true },
  { valeur: "plancher_bas", label: TYPES_ISOLATION.plancher_bas.label, surface: true },
  { valeur: "pac_air_eau", label: FAMILLES.pac_air_eau, surface: false },
  { valeur: "cet", label: FAMILLES.cet, surface: false },
  { valeur: "bois", label: FAMILLES.bois, surface: false },
  { valeur: "solaire_thermique", label: FAMILLES.solaire_thermique, surface: false },
] as const;

export type GesteEstimable = (typeof GESTES_ESTIMABLES)[number]["valeur"];

/** Vrai si le geste se calcule au m² (et exige donc une surface). */
export function gesteAuM2(valeur: string): boolean {
  return GESTES_ESTIMABLES.find((g) => g.valeur === valeur)?.surface ?? false;
}

const GESTES_VALIDES = GESTES_ESTIMABLES.map((g) => g.valeur);

export const estimationSchema = z
  .object({
    geste: z.enum(GESTES_VALIDES as unknown as [string, ...string[]], {
      error: "Choisissez un geste.",
    }),
    profil: z.enum(["bleu", "jaune", "violet", "rose"], {
      error: "Choisissez un profil de revenus.",
    }),
    /**
     * Surface isolée. Bornée haut : au-delà on n'est plus sur une maison
     * individuelle et le barème au m² ne veut plus rien dire.
     */
    surface: z.coerce
      .number()
      .positive("Indiquez une surface supérieure à 0.")
      .max(2000, "Surface trop grande pour une estimation en ligne.")
      .optional(),
  })
  // La surface n'est exigée QUE pour les gestes au m². Sans ce refinement, un
  // geste au forfait rejetait une saisie vide, et un geste au m² produisait
  // silencieusement « non estimable » au lieu de dire ce qui manque.
  .refine((v) => !gesteAuM2(v.geste) || v.surface != null, {
    error: "Indiquez la surface à isoler.",
    path: ["surface"],
  });

export type EstimationInput = z.infer<typeof estimationSchema>;

/** Montant estimé pour un dispositif, ou la raison de son absence. */
export interface LigneEstimation {
  dispositif: "cee" | "maprimerenov";
  /** `null` = non estimable. Jamais 0 par défaut. */
  montant: number | null;
  /** Formule lisible (« 11 €/m² × 95 m² »), ou l'explication de l'absence. */
  base: string;
}

export interface ResultatEstimation {
  lignes: LigneEstimation[];
  /** Somme des montants connus, `null` si aucun des deux n'est estimable. */
  total: number | null;
}
